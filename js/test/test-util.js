
/**
 * Itrans tests - util
 *
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const constants = require('../src/constants');
const util = require('../src/util');

/* ======================================================================== */

describe('util', () => {
  before(() => {
  });

  /* ================================================================ */
  describe('Expand Unicode Ids', () => {
    const tests = [
      // input,        expected-output
      ['{face-grin}', '{face-grin}'], 
      ['0U+0066', '0f'], 
      ['U+110000', 'U+110000'],  // over max unicode char, should remain unchanged
      ['U+0FFFFF', '\uDBBF\uDFFF'],
      ['0U+103456UUU', '0\uDBCD\uDC56UUU'],  // surrogate pairs
      ['U+01F600', '\uD83D\uDE00'], // face-grin emoji, surrogate pairs
    ];

    // Run each test as different it call:
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      it('Unicode id test ' + i, () => {
        const out = util.expandUnicodeIds(test[0]);
        // console.log('test unicode ids', test[0], out.charCodeAt(0).toString(16), out.charCodeAt(1).toString(16));
        assert.equal(test[1], out, test[0]);
      });
    }
  });

  /* ================================================================ */
  describe('To HTML Codes', () => {
    const tests = [
      // input,        expected-output
      ['abc', 'abc'], 
      ['a\uD83D\uDE00', 'a&#x01F600;'],  // surrogate pairs combined
      ['\u09CA\u0ACF', '&#x09CA;&#x0ACF;'],  // no surrogate pairs
    ];

    // Run each test as different it call:
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      it('To HTML Codes Test ' + i, () => {
        const out = util.toHtmlCodes(test[0]);
        assert.equal(test[1], out, test[0]);
      });
    }
  });

  /* ================================================================ */
  describe('To Javascript Characters', () => {
    const tests = [
      // input,        expected-output
      ['abc', 'abc'], 
      ['a\\uD83D\\uDE00', 'a\uD83D\uDE00'],
      ['\\u{1F600}', '\uD83D\uDE00'], // surrogate pair
      ['\\u09CA\\u0ACF', '\u09CA\u0ACF'],
    ];

    // Run each test as different it call:
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      it('From \\u codes to Javascript strings Test ' + i, () => {
        const out = util.toJSString(test[0]);
        assert.equal(test[1], out, test[0]);
      });
    }
  });

  /* ================================================================ */
  describe('Escape To Safe HTML', () => {
    const tests = [
      // input,        expected-output
      ['<abc\'>', '&lt;abc&#x27;&gt;'], 
      ['<a=c>', '&lt;a&#x3D;c&gt;'], 
      ['a bc', 'a bc'], 
    ];

    // Run each test as different it call:
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      it('Escape HTML ' + i, () => {
        const out = util.toSafeHtml(test[0]);
        assert.equal(test[1], out, test[0]);
      });
    }
  });

  /* ================================================================ */
});
