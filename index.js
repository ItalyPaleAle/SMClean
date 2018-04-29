'use strict'

const validator = require('validator')
const moment = require('moment-timezone')
const SMHelper = require('smhelper')

/**
 * Input cleanup utilities
 */
let SMClean = {
    /**
     * Clean a boolean.
     * The strings 'false', '0', 'no' and 'off' (case insensitive) cast to false.
     * 
     * @param {*} val - Value to clean
     * @returns {boolean} Value converted to boolean
     */
    bool: (val) => {
        // Check for the strings 'false', '0', 'no' and 'off' (case insensitive), which cast to false
        if(typeof val === 'string') {
            val = val.toLowerCase()
            val = val.trim()
            if(val == 'false' || val == '0' || val == 'no' || val == 'off') {
                val = false
            }
        }
        
        // Cast all values to boolean
        return !!val
    },

    /**
     * Clean a string representing a HTML color.
     * Accept only colors that can be used in HTML input[type=color] fields: #[A-Fa-f0-9]{6} (a subset of valid CSS colors)
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Cleaned color or `null` 
     */
    color: (val) => {
        val = SMClean.string(val, {keepHTML: true}) || null
        if(val && !val.match(/^#[A-Fa-f0-9]{6}$/)) {
            val = null
        }

        return val
    },

    /**
     * Clean a string representing a day in format YYYY(-)MM(-)DD.
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Valid day in the YYYY-MM-DD format (dashes added if absent) or `null` 
     */
    day: (val) => {
        val = SMClean.string(val, {keepHTML: true, minLength: 4})
        if(!val) {
            return null
        }
        let match = val.match(/^(\d{4})\-?(\d{2})\-?(\d{2})$/)
        if(!match) {
            return null
        }
        
        // Ensure the proper format
        val = [match[1], match[2], match[3]].join('-')
        
        // Check for valid (non overflowing) date
        if( !(moment(val).isValid()) ) {
            return null
        }
        
        return val
    },

    /**
     * Clean a string representing an email address.
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Cleaned email address or `null` 
     */
    email: (val) => {
        val = SMClean.string(val, {keepHTML: false, keepNewLines: false})
        if(!val) {
            return null
        }
        
        // Check if it's a valid email address
        if(!validator.isEmail(val)) {
            return null
        }
        
        // Lowercase the domain
        let parts = val.split('@', 2)
        parts[1] = parts[1].toLowerCase()
        
        return parts.join('@') || null
    },

    /**
     * Clean a string representing a floating point number.
     * Invalid values are converted to 0.
     * 
     * @param {*} val - Value to clean
     * @returns {number} Floating point number
     */
    float: (val) => {
        val = val || 0 // Ensure val is not undefined or null
        let num = parseFloat(val) || 0
        if (!isFinite(num)) {
            num = 0
        }
        return num
    },

    /**
     * Clean a string representing an integer.
     * Invalid values are converted to 0.
     * 
     * @param {*} val - Value to clean
     * @returns {number} Integer number
     */
    int: (val) => {
        val = val || 0 // Ensure val is not undefined or null
        return parseInt(val, 10) || 0
    },

    /**
     * Clean a string representing a MongoDB ObjectId.
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Valid MongoDB ObjectId or `null`
     */
    objectId: (val) => {
        val = SMClean.string(val, {keepHTML: true}) || null
        if(val && !validator.isMongoId(val)) {
            val = null
        }

        return val
    },

    /**
     * Clean a password so it matches requirements.
     * 
     * Unicode characters in passwords are not allowed, as there could be problems with homographs, different encodings, etc.
     * Some ideas around this decision can be read here: http://unicode.org/pipermail/unicode/2015-October/002883.html
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Cleaned, valid password or `null`
     */
    password: (val) => {
        if(!val) {
            return null
        }

        // Ensure it's a string
        val = SMHelper.toStringSafe(val)
        
        // Allow only ASCII characters between 0x21 and 0x7E, excluding control characters
        val = val.normalize('NFD') // Normalize to NFD before removing Unicode characters
        val = validator.whitelist(val, '\x21-\x7E')
        
        // Require 8 characters or longer, up to 30
        if(val.length < 8 || val.length > 30) {
            return null
        }
        
        return val || null
    },

    /**
     * Clean a string:
     * 1. Normalizes Unicode characters
     * 2. Trims whitespaces
     * 3. Strips control characters (optionally strips newline characters)
     * 4. Encodes HTML special characters (but does not strip tags)
     * 
     * @param {*} val - Value to clean
     * @param {Object} [options] - Dictionary with options
     * @param {boolean} [options.keepHTML=false] - If false (default), HTML special characters are encoded
     * @param {boolean} [options.keepNewLines=false] - If false (default), newline characters are removed
     * @param {number} [options.minLength=0] - If set to a positive integer, rejects strings shorter than this
     * @param {number} [options.maxLength=0] - If set to a positive integer, rejects strings longer than this
     * @returns {string} Cleaned string
     */
    string: (val, options) => {
        // Ensure options is a valid object
        if(!options || typeof options != 'object') {
            options = {}
        }

        // Ensure it's a string
        val = SMHelper.toStringSafe(val)

        // If string casts to false, return an empty string
        if(!val) {
            return ''
        }
        
        // Normalize the string
        val = val.normalize('NFC')
        if(!val) {
            return ''
        }
        
        // Trim whitespaces
        val = val.trim()
        if(!val) {
            return ''
        }
        
        // Strip control characters
        val = validator.stripLow(val, options.keepNewLines)
        
        // Encode HTML special chars unless we need them
        if(!options.keepHTML) {
            val = validator.escape(val)
        }

        // Force minimum and maximum length
        if(options.minLength && options.minLength > 0 && val && val.length < options.minLength) {
            val = ''
        }
        if(options.maxLength && options.maxLength > 0 && val && val.length > options.maxLength) {
            val = ''
        }
        
        return val || ''
    },

    /**
     * Clean a time and date representation, either a UNIX timestamp or a ISO 8601 full date.
     * The optional parameter timezone is used as default value when passing a ISO 8601-formatted string that does not include a TZ specifier.
     * 
     * @param {*} val - Value to clean, either a UNIX timestamp or a ISO 8601 full date
     * @param {string} [timezone="UTC"] - Optional timezone for ISO 8601-formatted strings that don't include a TZ specifier; default to UTC.
     * @returns {Date|null} Valid Date object or `null`
     */
    time: (val, timezone) => {
        // Ensure val is a clean string
        val = SMClean.string(val)
        if(!val) {
            return null
        }

        // Source: https://github.com/moment/moment/blob/981647d43df8a1e6cfe04b661e5c62be3eebbdae/moment.js#L72
        let isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/

        // First, check if we have a ISO 8601-formatted date string
        if(val.match(isoRegex)) {
            return moment.tz(val, timezone || 'UTC').toDate()
        }
        // Else, let's assume we have a UNIX timestamp
        else {
            let timestamp = SMClean.int(val)
            if(timestamp > 100000) {
                return new Date(timestamp * 1000)
            }
        }

        return null
    },

    /**
     * Clean a string representing a timezone identifier, according to the "tz database".
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Valid string representing a timezone identifier or `null`
     */
    timezone: (val) => {
        // Do not clean HTML because otherwise the / character is encoded.
        // Eventually, since we run the values against a list, it's safe.
        val = SMClean.string(val, {keepHTML: true}) || null

        // Check if the timezone is valid
        if(val && moment.tz.names().indexOf(val) < 0) {
            val = null
        }

        return val
    },

    /**
     * Clean a string representing a valid HTTP or HTTPS URL.
     * 
     * @param {*} val - Value to clean
     * @returns {string|null} Valid string representing a HTTP/S URL or `null`
     */
    url: (val) => {
        // Do not clean HTML here
        val = SMClean.string(val, {keepHTML: true}) || null
        if(val && !validator.isURL(val, {protocols: ['http', 'https'], require_protocol: true})) {
            val = null
        }

        return val
    }
}

module.exports = SMClean
