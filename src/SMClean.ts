import moment from 'moment-timezone'
import SMHelper from 'smhelper'
import validator from 'validator'

/**
 * Input cleanup utilities
 */
namespace SMClean {
    /**
     * Cleans a boolean.
     * The strings 'false', '0', 'no' and 'off' (case insensitive) cast to false.
     *
     * @param val - Value to clean
     * @returns Value converted to boolean
     */
    export function bool(val: any): boolean {
        // Check for the strings 'false', '0', 'no' and 'off' (case insensitive), which cast to false
        if (typeof val === 'string') {
            val = val.toLowerCase()
            val = val.trim()
            if (val == 'false' || val == '0' || val == 'no' || val == 'off') {
                val = false
            }
        }

        // Cast all values to boolean
        return !!val
    }

    /**
     * Cleans a string representing a HTML color.
     * Accept only colors that can be used in HTML `input[type=color]` fields: `#[A-Fa-f0-9]{6}` (a subset of valid CSS colors)
     *
     * @param val - Value to clean
     * @returns Cleaned color or `null`
     */
    export function color(val: any): string|null {
        val = SMClean.string(val, {keepHTML: true}) || null
        if (val && !val.match(/^#[A-Fa-f0-9]{6}$/)) {
            val = null
        }

        return val
    }

    /**
     * Cleans a string representing a day in format `YYYY(-)MM(-)DD`.
     *
     * @param val - Value to clean
     * @returns Valid day in the `YYYY-MM-DD` format (dashes added if absent) or `null`
     */
    export function day(val: any): string|null {
        val = SMClean.string(val, {keepHTML: true, minLength: 4})
        if (!val) {
            return null
        }
        const match = val.match(/^(\d{4})\-?(\d{2})\-?(\d{2})$/)
        if (!match) {
            return null
        }

        // Ensure the proper format
        val = [match[1], match[2], match[3]].join('-')

        // Check for valid (non overflowing) date
        if (!(moment(val).isValid())) {
            return null
        }

        return val
    }

    /**
     * Cleans a string representing an email address.
     *
     * @param val - Value to clean
     * @returns Cleaned email address or `null`
     */
    export function email(val: any): string|null {
        val = SMClean.string(val, {keepHTML: false, keepNewLines: false})
        if (!val) {
            return null
        }

        // Check if it's a valid email address
        if (!validator.isEmail(val)) {
            return null
        }

        // Lowercase the domain
        const parts = val.split('@', 2)
        parts[1] = parts[1].toLowerCase()

        return parts.join('@')
    }

    /**
     * Cleans a string representing a floating point number.
     * Invalid values are converted to 0.
     *
     * @param val - Value to clean
     * @returns Floating point number
     */
    export function float(val: any): number {
        val = val || 0 // Ensure val is not undefined or null
        let num = parseFloat(val) || 0
        if (!isFinite(num)) {
            num = 0
        }
        return num
    }

    /**
     * Cleans a string representing an integer.
     * Invalid values are converted to 0.
     *
     * @param val - Value to clean
     * @returns Integer number
     */
    export function int(val: any): number {
        val = val || 0 // Ensure val is not undefined or null
        return parseInt(val, 10) || 0
    }

    /**
     * Cleans a string representing a MongoDB ObjectId.
     *
     * @param val - Value to clean
     * @returns Valid MongoDB ObjectId or `null`
     */
    export function objectId(val: any): string|null {
        val = SMClean.string(val, {keepHTML: true}) || null
        if (val && !validator.isMongoId(val)) {
            val = null
        }

        return val
    }

    /**
     * Options dictionary for `SMClean.password`
     */
    export interface PasswordCleanOptions {
        /** If set to a positive integer, rejects strings shorter than this (default: 0, which disables this) */
        minLength?: number

        /** If set to a positive integer, rejects strings longer than this (default: 0, which disables this) */
        maxLength?: number
    }

    /**
     * Cleans a password so it matches requirements.
     *
     * Unicode characters in passwords are not allowed, as there could be problems with homographs, different encodings, etc; a discussion on why can be read here: http://unicode.org/pipermail/unicode/2015-October/002883.html
     *
     * @param val - Value to clean
     * @returns Cleaned, valid password or `null`
     */
    export function password(val: any, options?: PasswordCleanOptions): string|null {
        // Ensure options is a valid object
        if (!options || typeof options != 'object') {
            options = {}
        }

        // If we have minLength and maxLength, ensure that min <= max
        if (options.minLength && options.minLength > 0 &&
            options.maxLength && options.maxLength > 0 &&
            options.minLength > options.maxLength) {
            throw Error('options.minLength must be <= options.maxLength')
        }

        // Reject empty values
        if (!val) {
            return null
        }

        // Ensure it's a string
        val = SMHelper.toStringSafe(val)

        // Allow only ASCII characters between 0x21 and 0x7E, excluding control characters
        val = val.normalize('NFD') // Normalize to NFD before removing Unicode characters
        val = validator.whitelist(val, '\x21-\x7E')

        // Force minimum and maximum length
        if (options.minLength && options.minLength > 0 && val && (val as string).length < options.minLength) {
            val = ''
        }
        if (options.maxLength && options.maxLength > 0 && val && (val as string).length > options.maxLength) {
            val = ''
        }

        return val || null
    }

    /**
     * Options dictionary for `SMClean.string`
     */
    export interface StringCleanOptions {
        /** If false (default), HTML special characters are encoded */
        keepHTML?: boolean

        /** If false (default), newline characters are removed (\n and \r) */
        keepNewLines?: boolean

        /** If set to a positive integer, rejects strings shorter than this (default: 0, which disables this) */
        minLength?: number

        /** If set to a positive integer, rejects strings longer than this (default: 0, which disables this) */
        maxLength?: number
    }

    /**
     * Cleans a string:
     * 1. Normalizes Unicode characters
     * 2. Trims whitespaces
     * 3. Strips control characters (optionally strips newline characters)
     * 4. (Optionally) Encodes HTML special characters, but does not strip tags
     *
     * @param val - Value to clean
     * @param options - Dictionary with options
     * @returns Cleaned string
     */
    export function string(val: any, options?: StringCleanOptions): string {
        // Ensure options is a valid object
        if (!options || typeof options != 'object') {
            options = {}
        }

        // If we have minLength and maxLength, ensure that min <= max
        if (options.minLength > options.maxLength) {
            throw Error('options.minLength must be <= options.maxLength')
        }

        // Ensure it's a string
        val = SMHelper.toStringSafe(val)

        // If string casts to false, return an empty string
        if (!val) {
            return ''
        }

        // Normalize the string, then trim whitespaces
        val = (val as string).normalize('NFC').trim()
        if (!val) {
            return ''
        }

        // Strip control characters
        val = validator.stripLow(val, options.keepNewLines)

        // Encode HTML special chars unless we need them
        if (!options.keepHTML) {
            val = validator.escape(val as string)
        }

        // Force minimum and maximum length
        if (options.minLength && options.minLength > 0 && val && (val as string).length < options.minLength) {
            val = ''
        }
        if (options.maxLength && options.maxLength > 0 && val && (val as string).length > options.maxLength) {
            val = ''
        }

        return (val || '') as string
    }

    /**
     * Cleans a time and date representation, either a UNIX timestamp or a ISO 8601 full date.
     *
     * The optional parameter timezone is used as default value when passing a ISO 8601-formatted string that does not include a TZ specifier. If not specified, it will default to the system's timezone
     *
     * @param val - Value to clean, either a UNIX timestamp or a ISO 8601 full date
     * @param tz - Optional timezone for ISO 8601-formatted strings that don't include a TZ specifier; if empty, uses system default.
     * @returns Valid Date object or `null`
     */
    export function time(val: any, tz?: string): Date|null {
        // Ensure val is a clean string
        val = SMClean.string(val)
        if (!val) {
            return null
        }

        // Source: https://github.com/moment/moment/blob/981647d43df8a1e6cfe04b661e5c62be3eebbdae/moment.js#L72
        const isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/

        // First, check if we have a ISO 8601-formatted date string
        if ((val as string).match(isoRegex)) {
            return moment.tz(val, tz || undefined).toDate()
        }
        // Else, let's assume we have a UNIX timestamp
        else {
            const timestamp = SMClean.int(val)
            if (timestamp > 100000) {
                return new Date(timestamp * 1000)
            }
        }

        return null
    }

    /**
     * Cleans a string representing a timezone identifier, according to the "tz database".
     *
     * @param val - Value to clean
     * @returns Valid string representing a timezone identifier or `null`
     */
    export function timezone(val: any): string|null {
        // Do not clean HTML because otherwise the / character is encoded.
        // Eventually, since we run the values against a list, it's safe.
        val = SMClean.string(val, {keepHTML: true}) || null

        // Check if the timezone is valid
        if (val && moment.tz.names().indexOf(val as string) < 0) {
            val = null
        }

        return val
    }

    /**
     * Clean a string representing a valid HTTP or HTTPS URL.
     *
     * @param val - Value to clean
     * @returns Valid string representing a HTTP/S URL or `null`
     */
    export function url(val: any): string|null {
        // Do not clean HTML here
        val = SMClean.string(val, {keepHTML: true}) || null
        if (val && !validator.isURL(val, {protocols: ['http', 'https'], require_protocol: true})) {
            val = null
        }

        return val
    }
}
module.exports = SMClean
export default SMClean
