/**
 * @fileoverview Shared functions for the itrans package.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/
 */

'use strict';

/* ========================================================================== */

/**
 * Escape for RegExp so that string is treated as a literal string.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
 * @param {string} string String to escape.
 */
function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means whole matched string
}

/* ========================================================================== */
/**
  * Unicode code point identifiers are U+ or u+ followed by 4 to 6 hex digits
  * 0 hex to 10FFFF hex are valid Unicode values, but we match all 6 hex digits below
  * to catch any misadvertently entered Unicode values.
  */
const UNICODE_CODE_POINT_RE = /([Uu]\+[0-9A-Fa-f]{4,6})/;
// if needed, exact RegExp for Unicode: /([Uu]\+(?:01|0[\dA-Fa-f])[\dA-Fa-f]{4}/;

/**
 * Convert any Unicode code point identifiers in the input string to Javascript
 * unicode characters.
 *
 * @param {string} string String to un-escape, i.e, convert all U+n codes to \u codes.
 */
function expandUnicodeIds(string) {
  const tokens = string.split(UNICODE_CODE_POINT_RE);
  const output = [];
  tokens.forEach( (token) => {
    let out = token;
    if (UNICODE_CODE_POINT_RE.test(token)) {
      const code = parseInt(token.substring(2), 16);
      const max = 0x10FFFF; // Any higher than this is not a Unicode code point
      if (code <= max) {
        out = String.fromCodePoint(code);
      }
    }
    output.push(out);
  });
  return output.join('');
}
/* ========================================================================== */

/**
 * Create regex such as ^(str1|str2|str3)suffix for all the strings in the input.
 * Strings are returned in sorted order, such that longest string comes
 * earlier in the RegExp, since the RegExp match functions return on first match.
 * The created RegExp exec() will return the whole match in [0] and the str1 etc at
 * the [1] index.
 *
 * @param {array} strings All the literal strings to add to the RegExp.
 * @param {string} suffix Add this non matching RE to end of string
 * @returns {string} Returns the regexp in the form ^(str1|str2|...)suffix
 */
function createLiteralsRegExp(strings, suffix = '') {

  // sort in descending order, so longer length strings come earlier
  let sorted = strings.sort((a, b) => b.length - a.length);

  sorted = sorted.map(escapeRegExp);

  return new RegExp('^(' + sorted.join('|') + ')' + suffix);
}

/* ========================================================================== */

/**
 * Convert string non-ASCII characters to Unicode &#xNNNN; or &#xNNNNNN; HTML codes.
 * Handles Javascript surrogate pairs by using codePointAt calls and correctly moving
 * 2 characters when needed.
 *
 * @param {string} input String to convert.
 * @returns {string} HTML-coded string
 */

function toHtmlCodes(input) {
  let output = '';
  let count = 1;
  for (let i = 0; i < input.length; i += count) {
    const u = input.codePointAt(i);
    count = 1; // default, one character consumed
    if (u < 127) {
      output += input.charAt(i);
    } else if (u < 65536) {
      // integer in base-16 encoding, padded to 4 hex digits
      const hex = ('0000' + u.toString(16)).slice(-4);
      output += '&#x' + hex.toUpperCase() + ';';
    } else {
      // Unicode surrogate pairs, uses 2 characters in the input.
      // Output a single &#x 6 digit hex code.
      const hex = ('00' + u.toString(16)).slice(-6);
      output += '&#x' + hex.toUpperCase() + ';';
      count = 2;
    }
  }
  return output;
}

/**
 * Convert string \uNNNN sequences to the corresponding Javascript characters.
 * Converts 4 hex digits, as well as 6 digit hex \u{nnnnnn} forms.
 * This function may not be needed, since Javascript automatically does
 * this when it executes statements such as: a = '\u09C5'.
 *
 * A JavaScript string is a sequence of UTF-16 code points.
 *
 * @param {string} input String to convert.
 * @returns {string} Javascript string, usually Unicode encoded as UCS-2
 */

const JS_UNICODE_RE = /(\\u[0-9A-Fa-f]{4}|\\u\{[0-9A-Fa-f]{5,6}\})/;

function toJSString(input) { 
  let tokens = input.split(JS_UNICODE_RE);
  let output = [];
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    let n;
    if (JS_UNICODE_RE.test(token)) {
      if (token[2] == '{') {
        n = token.substring(3, token.length - 1);
      } else {
        n = token.substring(2);
      }
      output.push(String.fromCodePoint(parseInt(n, 16)));
    } else {
      output.push(token);
    }
  }
  return output.join('');
}

/* ========================================================================== */

/**
 * Wrap and unwrap words around prefix and suffix brace characters.
 *
 * Example:
 * const braces = new Braces('{', '}');
 * const wrapped = braces.wrap('word');          result: '{word}'
 * const unwrapped = braces.unwrap('{word}');    result: 'word'
 */

class Braces {

  constructor(prefix, suffix) {
    this.prefix = prefix;
    this.suffix = suffix;
  }

  /**
   * Wrap braces around the word.
   * @returns {string} Wrapped word.
   */
  wrap(word) {
    return `${this.prefix}${word}${this.suffix}`;
  }

  /**
   * Unwrap braces from the word, assuming it has been wrapped in braces.
   * Returns undefined if the word is not correctly wrapped.
   * @returns {undefined or string} Unrapped word, if word was originally wrapped.
   */
  unwrap(word) {
    if (!word.startsWith(this.prefix) || !word.endsWith(this.suffix)) {
      return undefined;
    }
    const start = this.prefix.length;
    // end: don't use just -suffix.length, since that may be 0 and then slice will be wrong
    const end = word.length - this.suffix.length;
    return word.slice(start, end);
  }
}

/* ========================================================================== */
const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function toSafeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, (s) => {
    return HTML_ESCAPE_MAP[s];
  });
}

/* ========================================================================== */

// export { escapeRegExp, };
module.exports.escapeRegExp = escapeRegExp;
module.exports.createLiteralsRegExp = createLiteralsRegExp;
module.exports.toHtmlCodes = toHtmlCodes;
module.exports.toJSString = toJSString;
module.exports.Braces = Braces;
module.exports.expandUnicodeIds = expandUnicodeIds;
module.exports.toSafeHtml = toSafeHtml;
/* ========================================================================== */
