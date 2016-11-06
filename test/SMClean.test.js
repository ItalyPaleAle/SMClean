'use strict';

const should = require('should')
const assert = require('assert')
const SMClean = require('../index')
const moment = require('moment-timezone')

describe('SMClean.js', () => {

    it('SMClean should export an object with correct methods', () => {
        SMClean.should.be.type('object')

        let functionList = [
            'bool',
            'color',
            'day',
            'email',
            'float',
            'int',
            'objectId',
            'password',
            'string',
            'time',
            'timezone',
            'url'
        ]
        
        assert.equal(Object.keys(SMClean).length, functionList.length)
        for(let func of functionList) {
            SMClean[func].should.be.type('function')
        }
    })

    it('Method: `bool`', () => {
        should(SMClean.bool('')).be.not.ok
        should(SMClean.bool('false')).be.not.ok // strings 'false', '0' and 'no' cast to false
        should(SMClean.bool('FALse')).be.not.ok
        should(SMClean.bool('0')).be.not.ok
        should(SMClean.bool('NO')).be.not.ok
        should(SMClean.bool('no')).be.not.ok
        should(SMClean.bool("  no\n")).be.not.ok
        should(SMClean.bool('OFF ')).be.not.ok
        should(SMClean.bool(undefined)).be.not.ok
        should(SMClean.bool(null)).be.not.ok
        should(SMClean.bool('1')).be.ok
        should(SMClean.bool('true')).be.ok
        should(SMClean.bool('si')).be.ok
    })
    
    it('Method: `color`', () => {
        // # + 6 hex digits
        should(SMClean.color('')).be.equal(null)
        should(SMClean.color('000')).be.equal(null)
        should(SMClean.color('red')).be.equal(null)
        should(SMClean.color('ffffff')).be.equal(null)
        should(SMClean.color('#3456gh')).be.equal(null)
        should(SMClean.color('#abcdefg')).be.equal(null)
        should(SMClean.color('#000000')).be.equal('#000000')
        should(SMClean.color('#012345')).be.equal('#012345')
        should(SMClean.color('#ABCdef')).be.equal('#ABCdef')
    })

    it('Method: `day`', () => {
        should(SMClean.day('2014-02-01')).be.equal('2014-02-01')
        should(SMClean.day('20140301')).be.equal('2014-03-01')
        should(SMClean.day('2014-0201')).be.equal('2014-02-01')
        should(SMClean.day('2014-22-41')).be.equal(null) // Reject invalid dates
        should(SMClean.day('2014-02-1')).be.equal(null)
        should(SMClean.day('2016-02-29')).be.equal('2016-02-29') // Leap year
        should(SMClean.day('2015-02-29')).be.equal(null) // No leap year
        should(SMClean.day('')).be.equal(null)
        should(SMClean.day(undefined)).be.equal(null)
    })

    it('Method: `email`', () => {
        should(SMClean.email('')).be.equal(null)
        should(SMClean.email('me@test.com')).be.equal('me@test.com')
        should(SMClean.email('invalid.email')).be.equal(null)
        should(SMClean.email('valid@example.com')).be.equal('valid@example.com')
        should(SMClean.email('no@tld')).be.equal(null)
        should(SMClean.email("a\u0061\u0300@example.com")).be.equal("a\u00E0@example.com") // Normalization
        should(SMClean.email('someone@EXAMPLE.COM')).be.equal('someone@example.com')
    })

    it('Method: `float`', () => {
        should(SMClean.float('')).be.equal(0)
        should(SMClean.float(undefined)).be.equal(0)
        should(SMClean.float('0')).be.equal(0)
        should(SMClean.float('100')).be.equal(100)
        should(SMClean.float(' 60 ')).be.equal(60)
        should(SMClean.float(' 60 years')).be.equal(60)
        should(SMClean.float('number: 60 ')).be.equal(0)
        should(SMClean.float('3.14')).be.equal(3.14)
        should(SMClean.float('314e-2')).be.equal(3.14)
        should(SMClean.float('0.0314E+2')).be.equal(3.14)
        should(SMClean.float('-314e-2')).be.equal(-3.14)
        should(SMClean.float('Infinity')).be.equal(0)
        should(SMClean.float(Infinity)).be.equal(0)
    })

    it('Method: `int`', () => {
        should(SMClean.int('')).be.equal(0)
        should(SMClean.int(undefined)).be.equal(0)
        should(SMClean.int('0')).be.equal(0)
        should(SMClean.int('100')).be.equal(100)
        should(SMClean.int(' 60 ')).be.equal(60)
        should(SMClean.int('-60 ')).be.equal(-60)
        should(SMClean.int(' 60 years')).be.equal(60)
        should(SMClean.int('number: 60 ')).be.equal(0)
        should(SMClean.int('3.14')).be.equal(3)
        should(SMClean.int('314e-2')).be.equal(314)
        should(SMClean.int('Infinity')).be.equal(0)
        should(SMClean.int(Infinity)).be.equal(0)
    })

    it('Method: `objectid`', () => {
        should(SMClean.objectId('')).be.equal(null)
        should(SMClean.objectId(100)).be.equal(null)
        should(SMClean.objectId('not.a.mongoid')).be.equal(null)
        should(SMClean.objectId('123456789012345678901234')).be.equal('123456789012345678901234')
    })

    it('Method: `password`', () => {
        should(SMClean.password('')).be.equal(null)
        should(SMClean.password('short')).be.equal(null)
        should(SMClean.password('longEnough1')).be.equal('longEnough1')
        should(SMClean.password('tooLong123456789012345678901234567890')).be.equal(null)
        should(SMClean.password('validPassword1')).be.equal('validPassword1')
        should(SMClean.password('validPassword1!')).be.equal('validPassword1!')
        should(SMClean.password("\x10unicodePass2:\u0061\u0300\u00E8")).be.equal("unicodePass2:ae") // Remove Unicode and control characters
    })

    it('Method: `string`', () => {
        should(SMClean.string('')).be.equal('')
        should(SMClean.string('abc')).be.equal('abc')
        should(SMClean.string('a', {minLength: 2})).be.equal('')
        should(SMClean.string('aa', {minLength: 2})).be.equal('aa')
        should(SMClean.string('aaaa', { maxLength: 3})).be.equal('')
        should(SMClean.string('aaaa', { maxLength: 5})).be.equal('aaaa')
        should(SMClean.string('aaaa', {minLength: 2, maxLength: 5})).be.equal('aaaa')
        should(SMClean.string('aaaa', {minLength: 2, maxLength: 3})).be.equal('')
        should(SMClean.string('aaaa', {minLength: 5, maxLength: 6})).be.equal('')
        should(SMClean.string("a\x10\x0Aa")).be.equal("aa")
        should(SMClean.string("a\x10\x0Aa", {keepNewLines: true})).be.equal("a\na")
        should(SMClean.string("a\x10\x0Aa", {keepHTML: true, keepNewLines: true})).be.equal("a\na")
        should(SMClean.string('<b>tag</b>')).be.equal("&lt;b&gt;tag&lt;&#x2F;b&gt;")
        should(SMClean.string('<b>tag</b>', {keepHTML: true})).be.equal('<b>tag</b>')
        should(SMClean.string('<b>tag</b>', {keepHTML: true, keepNewLines: true})).be.equal('<b>tag</b>')
        should(SMClean.string(undefined)).be.equal('')
        should(SMClean.string(null)).be.equal('')
        should(SMClean.string(10)).be.equal('10')
        should(SMClean.string(0)).be.equal('0')
        should(SMClean.string(NaN)).be.equal('')
        should(SMClean.string("\u0061\u0300")).be.equal("\u00E0") // Unicode normalization
    })

    it('Method: `time`', () => {
        let dateToTime = (date) => {
            if (typeof date === 'object') {
                return parseInt(date.getTime() / 1000)
            }
            else {
                return parseInt(date / 1000)
            }
        }
        let now = new Date()
        let s, t // Test variables

        should(SMClean.time('')).be.not.ok
        should(SMClean.time(0)).be.not.ok
        should(SMClean.time('1234567')).be.an.instanceOf(Date)
        should(SMClean.time(1234567)).be.an.instanceOf(Date)

        t = SMClean.time(dateToTime(now))
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(dateToTime(now))

        t = SMClean.time(now.toISOString())
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(dateToTime(now))

        s = moment.tz('2014-11-18T11:55:00', 'America/Toronto').unix()
        t = SMClean.time(s)
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(1416329700)

        t = SMClean.time('2014-11-18T11:55:00-05:00')
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(1416329700)

        t = SMClean.time('2014-11-18T11:55:00+00:00')
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(1416311700)

        t = SMClean.time('2014-11-18T11:55:00') // Should assume UTC
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(1416311700)

        t = SMClean.time('2014-11-18T11:55:00', 'America/Toronto') // Passing default timezone
        should(t).be.an.instanceOf(Date)
        should(dateToTime(t)).be.equal(1416329700)
    })

    it('Method: `timezone`', () => {
        should(SMClean.timezone('')).be.equal(null)
        should(SMClean.timezone('Somewhere/Some')).be.equal(null)
        should(SMClean.timezone('America/Toronto')).be.equal('America/Toronto')
        should(SMClean.timezone('America/New_York')).be.equal('America/New_York')
        should(SMClean.timezone('UTC')).be.equal('UTC')
    })

    it('Method: `url`', () => {
        should(SMClean.url('')).be.equal(null)
        should(SMClean.url(true)).be.equal(null)
        should(SMClean.url(100)).be.equal(null)
        should(SMClean.url('foo')).be.equal(null)
        should(SMClean.url('www.foo.com')).be.equal(null) // Missing protocol
        should(SMClean.url('ftp://www.foo.com')).be.equal(null) // only http and https
        should(SMClean.url('blah://www.foo.com')).be.equal(null)
        should(SMClean.url('http://www.foo.com')).be.equal('http://www.foo.com')
        should(SMClean.url('https://www.foo.com/bar')).be.equal('https://www.foo.com/bar')
    })

})
