/**
 * @fileoverview Convert input text tokens into Unicode output using a table driven
 *     conversion. The tables are loaded from a .tsv spreadsheet text file.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/
 */

'use strict';

/*jshint esversion: 6 */
/*jshint node: true */
/*jshint loopfunc: true */

/**
 * Load and operate on the tables that map itrans input to Unicode output.
 *
 * The tables are loaded from a .tsv spreadsheet text file, that may contain Unicode
 * characters.
 *
 * http://www.aczoom.com/itrans/
 */

/* ========================================================================== */

const {
  toSafeHtml,
  toHtmlCodes,
  Braces,
} = require('./util');

const constants = require('./constants');
const ItransTable = require('./ItransTable');

/*
 * When the Unicode names are output, we wrap them in these characters.
 */
const BRACES = constants.BRACES;

/** Reserved words: Values used in the TITLES.type column data describing row data */
const ROW_TYPE = constants.ROW_TYPE;

/** Supported output format types */
const OUTPUT_FORMAT = constants.OUTPUT_FORMAT;

/**
  * Reserved words: Values used in the TITLES.unicodeName column. These rows are used
  * for special processing, such as handling C1 + C2 + C2 + V consonant ligature creation,
  * turning itrans on/off, etc.
  * Regarding END-WORD-VOWEL: The schwa (vowel A) is not deleted in languages such as Sanskrit.
  * In Hindi, there is schwa deletion. Words like "dil" in Hindi need to written with a virama
  * at the end in Sanskrit to match the Hindi pronunciation.
  * END-WORD-VOWEL is the row that is applied when a sequence of consonants is missing its
  * ending vowel (ending dependent-vowel). For Sanskrit, the table usually defines it as the
  * virama, for hindi it is defined as the schwa (DV-A).
  */
const RESERVED_NAMES = constants.RESERVED_NAMES;

/* ========================================================================== */

/**
 * Itrans: The itrans processor. Convert input text to Unicode output.
 */

class Itrans {
  constructor() {
    /**
     * This table stores all the data that drives the input to output conversion.
     */
    this.itransTable = new ItransTable();

    this.currentLanguage = '';
  }

  /**
   * Prepares and loads required tables for the conversion to be done.
   * @param {string} tsvString Tab-Separated-Values representing the table.
   *   Table size is usually small: 300 rows (== each itrans code),
   *   and 10 columns (== each language), but larger tables with 1000+ rows
   *   should not be a problem even for interative web browser execution.
   */
  load(tsvString) {
    this.itransTable.load(tsvString);
    return this;
  }

  /* ======================================================================== */

  /**
   * Convert the input string to Unicode. Multiple output formats supported,
   * UTF-8, HTML7, or even just the Unicode names corresponding to each input itrans code.
   *
   * @param {string} input String with itrans code tokens to convert.
   * @param {string} language If a valid langauge, start of string is assumed to be
   *     itrans encoded text for that language. Otherwise, a language marker is necessary to
   *     indicate itrans encoded text, such as #sanskrit ka kha ...
   * @returns {string} Returns converted text.
   */

  convert(input, {language, outputFormat = OUTPUT_FORMAT.unicodeNames} = {}) {
    const table = this.itransTable;
    const output = []; // collect each converted letters here
    let length = input.length;

    // If language is a valid language, start off in itrans mode for that language
    let prevLanguage = table.isLanguage(language) && language;
    let inItrans = Boolean(prevLanguage);
    let inConsonants = false; // track whether we are in the middle or end of consonants
    let prevRow;
    let prevName;
    let prevType;

    /**
     * This function matches the next token (itrans code) in the input to a ItransTable row.
     * The row provides the replacement text for that input token.
     *
     * If there were no consonants in the table, then this function simply needs to:
     * 1: output the replacement text for each itrans codeword.  If not in itrans text
     * section, then output the input text unchanged.
     *
     * Any row that has ROW_TYPE of consonants requires special processing, and depending
     * on the previous and subsequent characters in the input, it may have to:
     * 2: Output the default ending vowel for consonants, in the END-WORD-VOWEL row, and then
     * do #1 above.
     * 3: Output the CONSONANTS-JOINER or NO-LIGATURE, and then do #1 above.
     *
     * Option 2 kicks in if previous character was a consonant and the next one is not
     * a dependent-vowel. Each consonant must end in a vowel, so if one is not present in
     * the input, have to output the END-WORD-VOWEL.
     *
     * Option 3 kicks in if previous and next characters are consonants, so we are in the
     * middle of two consonants. [NUKTA is special - it modifies previous consonant, but
     * we still stay in the state of being in midst of a consonants sequence.]
     * When in the middle of two consonants, we have to output the CONSONANTS-JOINER
     * (unless the previous character was NO-LIGATURE), and then do #1 above too.
     *
     * Additionally, certain tokens in the input will be skipped and don't produce any
     * output on their own.
     * _ (NO-OUTPUT), ## (ITRANS-TOGGLE), #language markers, etc.
     *
     */

    let consumed;

    // Loop for one more than string length, to handle any END-WORD-VOWEL processing
    for (let start = 0; start <= length; start += consumed) {

      // Since we loop for one extra time, start may be == length,  current will be ''
      const current = input.slice(start);

      // Match next itrans token in the input
      const {matched, row: nextRow} = this.match(current, {inItrans, inConsonants});

      const nextName = nextRow && table.rowName(nextRow);
      const nextType = nextRow && table.rowType(nextRow);

      // These input codes do not affect the value of inConsonants for next loop around
      // and they do not need any special processing even if we are inConsonants sequence
      const consonantModifiers = (nextName === RESERVED_NAMES.noOutput
        || nextName === RESERVED_NAMES.nukta // nukta is just a consonant modifier
        || nextName === RESERVED_NAMES.consonantsJoiner // input has explicit consonant-joiner
        || nextName === RESERVED_NAMES.noLigature); // input has explicit no-ligature

      // Check if Option 2 or 3 applies: whether we need END-WORD-VOWEL or CONSONANT-JOINER
      if (inConsonants) {
        let name; // extra character to output, based on where we are in the consonants sequence
        if (consonantModifiers || nextType === ROW_TYPE.dependentVowel) {
          // input has explicit modifier, or an explicit consonant vowel
          // nothing extra to do, just output nextRow normally in Option 1 steps
        } else if (nextType === ROW_TYPE.consonant) {
          // Option 3 applies: we need CONSONANTS-JOINER unless prevRow was NO-LIGATURE
          if (prevName !== RESERVED_NAMES.noLigature
            && (prevName === RESERVED_NAMES.nukta // nukta is just a consonant modifier
              || prevName === RESERVED_NAMES.noOutput // noOutput is just a consonant modifier
              || prevType === ROW_TYPE.consonant)) {
            name = RESERVED_NAMES.consonantsJoiner;
          }
        } else {
          // Option 2: Missing dependent vowel on the previous consonant(s).
          // Need to output the END-WORD-VOWEL defined in the table.
          name = RESERVED_NAMES.endWordVowel;
        }
        if (name) {
          // Need to output this extra character before outputting nextName
          const row = table.getRowForName(name);
          const replacement = table.rowLanguage(row, prevLanguage);
          output.push(outputRow(name, replacement, outputFormat));
        }
      }

      // Option 1: Normal processing: Output the next itrans code replacement text
      if (nextRow) {
        console.assert(matched, 'Internal error: got row, but nothing matched', nextRow);
        consumed = matched.length;
        const nameN = table.rowName(nextRow); // CODE_NAMEs
        const replacement = table.rowLanguage(nextRow, prevLanguage);
        output.push(outputRow(nameN, replacement, outputFormat));
      } else {
        // Echo one character, not an itrans code
        // Note that current may be '', but we still increment by 1 to allow loop to terminate.
        consumed = 1;
        output.push(current.charAt(0));
      }

      console.assert(consumed > 0, 'Infinite loop: moved 0 characters');

      // Replacement for the next character has been output.
      // Update all state variables for next time around the loop.

      if (nextName === RESERVED_NAMES.itransToggle) {
        inItrans = !inItrans;
      }

      if (nextType === ROW_TYPE.command && table.isLanguage(nextName)) {
        // Switch to new language
        prevLanguage = nextName;
        inItrans = true;
      }

      // Update inConsonants to true if we are starting or still in sequence of consonants
      if (nextType === ROW_TYPE.consonant || (inConsonants && consonantModifiers)) {
        inConsonants = true;
      } else {
        inConsonants = false;
      }

      prevRow = nextRow;
      prevName = nextName;
      prevType = nextType;
    }

    return output.join('');
  }

  /* ======================================================================== */


  /**
   * Match the next word in the input to the input itrans codes, and return the matched
   * characters and ItransTable row index.
   *
   * Handles dependent vowels specially, since those are only to be matched
   * when input contains a sequence of consonants such as C1 + C2 + ... + DEPENDENT-VOWEL
   * example: ki or tkii etc use i and ii dependent vowels while kai tkaii have full vowels
   * i and ii and dependent vowel a.
   *
   * @param {string} current This is a line or word or syllable to match.
   * @param {boolean} inConsonants Set this to true if input has seen C1C2... sequence
   *     of consonants, which means if the next match is a VOWEL, return a DEPENDENT-VOWEL
   *     instead.
   * @param {boolean} inItrans Set this to true if input should match all itrans codes,
   *     otherwise, only looks for language markers and
   * @returns {object} {matched: string matched, row: array}
   *     matched: is in the portion of the current string matched.
   *     row: is the row at itransRows[index]
   */
  match(current, {inItrans, inConsonants}) {

    const table = this.itransTable;
    // In itrans encoded text, look for any itrans code using itransRe
    // Outside itrans encoded text, look for any language marker using languagesRe
    const inputRe = inItrans ? table.itransRe: table.languagesRe ;

    let {matched, row} = table.matchRe(current, inputRe);

    if (matched) {
      const isVowel = table.rowType(row) === ROW_TYPE.vowel;
      if (inConsonants && isVowel) {
        // This signifies end of the C1 + C2 + C3 ... V consonant sequence.
        // The dependent vowel itrans input codes are usually blank, which means we have
        // to find the dependent vowel row with the same name as the vowel.
        const dvCodeName = table.getDependentVowelName(table.rowName(row));
        row = table.getRowForName(dvCodeName);

        console.assert(table.rowType(row) == ROW_TYPE.dependentVowel,
          'Internal error: DV named row has a non-dependent-vowel type', row);
      }
    }

    return {matched, row};
  }

}

/* ========================================================================== */

function outputRow(name, replacement, outputFormat) {
  // Javascript strings are UTF-16 code-points, need to convert them for output.

  // console.log('   outputRow: got replacement ', replacement, name);
  let output;
  if (outputFormat === OUTPUT_FORMAT.unicodeNames) {
    output = BRACES.wrap(name); // For Unicode output, use the name in braces
  } else if (outputFormat === OUTPUT_FORMAT.html7) {
    // Spreadsheet may be missing some columns - especially for rows added programatically.
    // Return '' when replacement is not a string. This won't handle String() objects, but
    // that is not necessary here.
    output = typeof replacement === 'string' ? replacement : '';
  } else {
    // TODO: Utf8 is not yet supported
    // May need something like: return unescape(encodeURIComponent(output));
    throw Error('UTF-8 output not yet supported');
  }

  // TODO: assuming HTML output, may need to create another mode for command line
  // execution that does not convert to safe HTML output.
  return toHtmlCodes(toSafeHtml(output));
}

module.exports = Itrans;
