# SMClean

[![Dependency Status](https://david-dm.org/ItalyPaleAle/SMClean.svg?style=flat)](https://david-dm.org/ItalyPaleAle/SMClean)
[![devDependency Status](https://david-dm.org/ItalyPaleAle/SMClean/dev-status.svg?style=flat)](https://david-dm.org/ItalyPaleAle/SMClean#info=devDependencies)

String cleanup utilities and input sanitization

This module is written in TypeScript and transpiled to JavaScript. All typings are available alongside the code.

This code is licensed under the terms of the MIT license (see LICENSE.md).

## Full documentation

Full documentation is available on [GitHub pages](https://italypaleale.github.io/SMClean/).

## Add to your project

Install from NPM:

````sh
npm install --save smclean
````

## API Guide

Include the module with:

````js
const SMClean = require('smclean')
````

The `SMClean` object contains the following methods:

- **`bool(val)`**: Returns the boolean false if val is any false-y value, or the strings 'false', '0', 'no' and 'off' (case-insensitive). Returns the boolean true in all other cases.
- **`color(val)`**: Cleans a string representing an HTML color, accepting `#[A-Fa-f0-9]{6}` (format accepted by the HTML `input[type=color]` field, which is a subset of all the CSS colors). Returns null for invalid input.
- **`day(val)`**: Cleans a string representing a day in format YYYY(-)MM(-)DD, ensuring it's a valid day (e.g. accepts February 29 only on leap years, etc). Returns null for invalid input.
- **`email(val)`**: Cleans a string representing an email address. Returns null for invalid input.
- **`float(val)`**: Cleans a string representing a floating point number; invalid inputs are converted to 0.
- **`int(val)`**: Cleans a string representing an integer; invalid inputs are converted to 0.
- **`objectId(val)`**: Cleans a string representing a MongoDB ObjectId. Returns null for invalid input.
- **`password(val, options)`**: Cleans a password so it's a string, removing all Unicode ones (because of issues with encoding, homographs, etc), as well as ASCII control characters. Returns null for input that doesn't satisfy the requirements. The options parameter is an object with the following keys and default values:
  - `options.minLength = 0` When set to a positive integer, if the string is shorter than minLength it will be rejected and an empty string is returned by the method
  - `options.maxLength = 0` When set to a positive integer, if the string is longer than maxLength it will be rejected and an empty string is returned by the method
- **`string(val, options)`**: Cleans a string: normalizes Unicode characters (canonicalize to NFC), trims whitespaces from the beginning and end, strips ASCII control characters (optionally preserving newline characters), and encodes HTML special characters/tags. Returns an empty string if input is invalid. The options parameter is an object with the following keys and default values:
  - `options.keepHTML = false` If false, HTML special characters are converted to their entities, to protect against XSS attacks
  - `options.keepNewLines = false` If false, newline characters (\n and \r) are stripped from the string
  - `options.minLength = 0` When set to a positive integer, if the string is shorter than minLength it will be rejected and an empty string is returned by the method
  - `options.maxLength = 0` When set to a positive integer, if the string is longer than maxLength it will be rejected and an empty string is returned by the method
- **`time(val, timezone)`**: Cleans a time and date representation, either a UNIX timestamp or a ISO 8601 full date. Returns a JavaScript `Date` object, or null in case of error. The optional parameter timezone (which defaults to the system timezone) is used as fallback when passing a ISO 8601-formatted string that does not include a TZ specifier.
- **`timezone(val)`**: Cleans a string representing a timezone identifier, according to the "tz database". Returns null if the string is not a valid timezone identifier.
- **`url(val)`**: Cleans a string representing a valid HTTP or HTTPS URL. Returns null for invalid input.

### Example

Check the test suite for complete examples.

````js
// email
SMClean.email('someone@EXAMPLE.COM') // someone@example.com
SMClean.email('invalid.email') // null

// int
SMClean.int(' 60 years') // 60

// string
SMClean.string('<b>tag</b>') // &lt;b&gt;tag&lt;&#x2F;b&gt;
SMClean.string('<b>tag</b>', {keepHTML: true}) // <b>tag</b>
SMClean.string("\u0061\u0300") // \u00E0 (Unicode normalization)
````
