/**
 * @fileoverview Shared constants and names of external Itrans table data.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/
 */

'use strict';

/*jshint esversion: 6 */
/*jshint node: true */
/*jshint loopfunc: true */

const {
  Braces,
} = require('./util');

/* ========================================================================== */
const TITLES_MAP = {
  input: 'INPUT', // itrans input code, column contents: a aa .h
  type: 'INPUT-TYPE', // Input type: consonant, vowel, command, etc.
  unicodeName: 'CODE-NAME', // Unicode character name, column contents:  A AA VIRAMA
};
/* ========================================================================== */

module.exports = Object.freeze({

  // RegExp for blank lines in the input that will be skipped
  BLANK_RE: /^\s*$/,

  // INPUT column can have multiple input codes, separated by ' | '
  SPLIT_INPUT_RE: / \| /,

  /*
   * Itrans input codes may include Unicode names such as {KA}{AA}, wrapped around Braces.
   * And when the Unicode names are output, we wrap them in these characters too.
   */
  BRACES: new Braces('{', '}'),

  /**
   * Reserved title row data in the input Itrans Table spreadsheet.
   * These are all required columns, in addition to any additional language columns
   * that use prefix LANGUAGE_PREFIX.
   * All other columns in the input will be skipped.
   */
  TITLES: TITLES_MAP,

  /**
   * The table title row contains all these columns at a minimum.
   */
  REQUIRED_TITLES: Object.values(TITLES_MAP),  // Note: .values is ES6 Experimental Keyword

  /** Each language name starts with this character */
  LANGUAGE_PREFIX: '#',

  /**
   * Both full vowels and dependent vowels use same input code (a, aa, etc).
   * But the Unicode output characters are different, so we need to distinguish dependent vowel
   * rows. To do that, each dependent vowel has same unicodeName as vowel prefixed with this:
   */
  DEPENDENT_VOWEL_PREFIX: 'dv-',

  /** Reserved words: Values used in the TITLES.type column data describing row data */
  ROW_TYPE: {
    consonant: 'consonant', // consecutive consonants have to be treated specially
    vowel: 'vowel', // vowel input code (a, aa, i)
    dependentVowel: 'dependent-vowel', // uses same input code as full vowels
    command: 'command', // for itrans commands such as _ {} #sankrit ## etc
    normal: '', // all other types, require no special processing
  },

  /**
    * Reserved words: Values used in the TITLES.unicodeName column. These rows are used
    * for special processing, such as handling C1 + C2 + C2 + V consonant ligature creation,
    * turning itrans on/off, etc.
    * Regarding END-WORD-VOWEL: The schwa (vowel A) is not deleted in languages such as Sanskrit.
    * In Hindi, pronouncation suppresses schwa at end of words. Words like "dil" in Hindi need
    * to written with a virama at the end in Sanskrit to match the Hindi pronunciation.
    * END-WORD-VOWEL is the row that is applied when a sequence of consonants is missing its
    * ending vowel (ending dependent-vowel). For Sanskrit, the table usually defines it as the
    * virama, for hindi it is defined as the schwa (dv-a).
    */
  RESERVED_NAMES: {
    consonantsJoiner: 'consonants-joiner',
    endWordVowel: 'end-word-vowel',
    noLigature: 'no-ligature',
    noOutput: 'no-output',
    itransToggle: 'itrans-toggle',
    nukta: 'nukta', // this is considered a consonant-modifier for the previous consonant
  },

  /** Supported output format types */
  OUTPUT_FORMAT: {
    utf8: 'UTF-8',
    unicodeNames: 'UNICODE-NAMES', // output as names, so k -> {KA}
    html7 : 'HTML7', // output as HTML code &#xNNNN; for non-ASCII Unicode code points
  },
});

/* ========================================================================== */
