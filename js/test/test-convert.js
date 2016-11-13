
/**
 * Itrans tests
 *
 * Node v6.6.0: .\node_modules\.bin\mocha --reporter spec --no-colors is sufficient,
 * don't need --require babel-polyfill (itrans.js has require) or compilers babel-register.
 *
 * TODO: split into smaller strings for input: and expect: and load static TEST_TSV.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const constants = require('../src/constants');
const Itrans = require('../src/Itrans');
const TEST_TSV = require('./TEST_TSV');

const itrans = new Itrans();

// For now, using the same table for all tests. This data never changes between tests.
itrans.load(TEST_TSV);

const OUTPUT_FORMAT = constants.OUTPUT_FORMAT;
/* ======================================================================== */

describe('Itrans', () => {
  before(() => {
  });

  /* ================================================================ */
  describe('Unicode Names', () => {
    const lang = {language: '#sanskrit', outputFormat: OUTPUT_FORMAT.unicodeNames};
    // Vector of input and expect 
    const tests = [
      // input         output
      ['kha', '{kha}{dv-a}'],
      ['k t{nukta}{}kma', '{ka}{end-word-vowel} {ta}{nukta}{no-ligature}{ka}{consonants-joiner}{ma}{dv-a}'],
      ['kSha k{}Sha', '{ka}{consonants-joiner}{ssa}{dv-a} {ka}{no-ligature}{ssa}{dv-a}'],
      ['OM || #sanskrit {ddha} ## out', '{om} {double-danda} {#sanskrit} {ddha}{end-word-vowel} {itrans-toggle} out'],
      // Tricky test - this may change in future. Since we always insert consonant-joiner
      // between consonants, this tests a way to suppress that and create unicode output
      // sequences based just on the input.
      [ 't{nukta}{dv-a}{virama}{zwj}ma', '{ta}{nukta}{dv-a}{virama}{zwj}{ma}{dv-a}'],
    ];

    // Run each test as different it call:
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      it('Unicode name test ' + i, () => {
        const out = itrans.convert(test[0], lang);
        assert.equal(test[1], out, test[0]);
      });
    }
  });

  /* ================================================================ */
  describe('Sanskrit/Telugu HTML7', () => {
    const lang = {language: '#sanskrit', outputFormat: OUTPUT_FORMAT.html7};
    const tests = [
      // input         output
      ['kha', '&#x0916;'],
      ['k t{nukta}{}kma', '&#x0915;&#x094D;&#x200C; &#x0924;&#x093C;&#x094D;&#x200D;&#x0915;&#x094D;&#x092E;'],
      ['kSha k{}Sha', '&#x0915;&#x094D;&#x0937; &#x0915;&#x094D;&#x200D;&#x0937;'],
      ['OM || #sanskrit {ddha} ## out', '&#x0950; &#x0965;  &#x0922;&#x094D;&#x200C;  out'],
      // Tricky test - this may change in future. Since we always insert consonant-joiner
      // between consonants, this tests a way to suppress that and create unicode output
      // sequences based just on the input.
      ['t{nukta}{dv-a}{virama}{zwj}ma', '&#x0924;&#x093C;&#x094D;&#x200D;&#x092E;'],
    ];

    // Run each test as different it call:
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      it('Test ' + i, () => {
        const out = itrans.convert(test[0], lang);
        assert.equal(test[1], out, test[0]);
      });
    }
  });

  /* ================================================================ */
});
