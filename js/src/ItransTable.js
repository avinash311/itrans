/**
 * @fileoverview Load the tables that map itrans input to Unicode output.
 *     The tables are loaded from a .tsv spreadsheet Unicode text file.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/
 */

'use strict';

/*jshint esversion: 6 */
/*jshint node: true */
/*jshint loopfunc: true */

/* ========================================================================== */

const {
  Braces,
  createLiteralsRegExp,
  expandUnicodeIds,
  toJSString,
} = require('./util');

const constants = require('./constants');

// RegExp for blank lines in the input that will be skipped
const BLANK_RE = constants.BLANK_RE;

// INPUT column can have multiple input codes, separated by ' | '
const SPLIT_INPUT_RE = constants.SPLIT_INPUT_RE;

/*
 * Itrans input codes may include Unicode names such as {KA}{AA}, wrapped around Braces.
 */
const BRACES = constants.BRACES;

/**
 * Reserved title row data in the input Itrans Table spreadsheet.
 * These are all required columns, in addition to any additional language columns
 * that use prefix LANGUAGE_PREFIX.
 * All other columns in the input will be skipped.
 */
const TITLES = constants.TITLES;

/**
 * The table title row contains all these columns at a minimum.
 */
const REQUIRED_TITLES = constants.REQUIRED_TITLES;

/** Each language name starts with this character */
const LANGUAGE_PREFIX = constants.LANGUAGE_PREFIX;

/**
 * Both full vowels and dependent vowels use same input code (a, aa, etc).
 * But the Unicode output characters are different, so we need to distinguish dependent vowel
 * rows. To do that, each dependent vowel has same unicodeName as vowel prefixed with this:
 */
const DEPENDENT_VOWEL_PREFIX = constants.DEPENDENT_VOWEL_PREFIX;

/** Reserved words: Values used in the TITLES.type column data describing row data */
const ROW_TYPE = constants.ROW_TYPE;

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
 * ItransTable: The itrans processor. Convert input text to Unicode output.
 */

class ItransTable {
  constructor() {
    /**
     * Array of rows containing itrans to Unicode mapping. Each row
     * is a array of items that drive the input to output conversion.
     */
    this.itransRows = [];

    /** all the column titles representing languages */
    this.languages = [];

    /** [column title] -> index of column, to access items in each itransRows[i] array */
    this.columnIndex = {};

    /** columnIndex frequently accessed items stored individually: */
    this.inputColumnIndex = -1 ; // columnIndex of column TITLES.input
    this.typeColumnIndex = -1 ; // columnIndex of column TITLES.type
    this.nameColumnIndex = -1 ; // columnIndex of column TITLES.unicodeName

    /** RegExp(): all the itrans input codes - k ka etc including languages, unicode names */
    this.itransRe = undefined;

    /** RegExp(): all the itrans language on/off codes #sanskrit ## etc */
    this.languagesRe = undefined;

    /** RegExp(): all the itrans input codes that are Unicode names  {DDHA} etc */
    this.namesRe = undefined;

    /**
     * Dictionary to map all input codes to table row index.
     * Uses Map() derived class to only allow unique keys - provides a setIfUnset() call
     * which only allows a single .set() operation per key, will throw Error otherwise.
     * The input codes here include all non-empty TITLES.input column entries (k kh etc),
     * and the BRACES wrapped TITLES.name column entries ({DDHA}, {NUKTA}, etc).
     */
    // this.allInputRowIndex = new UniqueKeyMap();
    this.allInputRowIndex = new Map();
  }

  /**
   * Functions to provide access to individual columns for a given row of itrans data,
   * each itransRow[i] entry which is an array.
   */
  rowInput(row) {
    return row[this.inputColumnIndex];
  }
  rowType(row) {
    return row[this.typeColumnIndex];
  }
  rowName(row) {
    return row[this.nameColumnIndex];
  }
  rowLanguage(row, name) {
    return row[this.columnIndex[name]];
  }

  isLanguage(language) {
    return language && this.languages.indexOf(language) >= 0;
  }

  /**
   * Returns the row that corresponds to the given unicode name.
   * @param {string} name Unicode name
   * @returns {array} The row that matches this name if present.
   */
  getRowForName(name) {
    const wrappedName = BRACES.wrap(name);
    const rowIndex = this.allInputRowIndex.get(wrappedName);
    const row = rowIndex >= 0 && this.itransRows[rowIndex];
    return row;
  }

  /**
   * Returns the dependent vowel version of the given unicode vowel name.
   * Example: ('II') -> 'DV-II'
   * @param {string} name Unicode name (a vowel) to be converted.
   * @returns {string} The dependent vowel variation of the vowel name.
   */
  getDependentVowelName(name) {
    const dvCodeName = DEPENDENT_VOWEL_PREFIX + name;
    return dvCodeName;
  }

  /**
   * Prepares and loads required tables for the conversion to be done.
   * @param {string} tsvString Tab-Separated-Values representing the table.
   *   Table size is usually small: 300 rows (== each itrans code),
   *   and 10 columns (== each language), but larger tables with 1000+ rows
   *   should not be a problem even for interative web browser execution.
   */
  load(tsvString) {
    const rows = tsvString.split(/\r?\n/);
    const rowsLen = rows.length;
    let columnNames;
    let columnNamesLength = 0;
    let columnIndex;

    this.languages = [];

    for (let i = 0; i < rowsLen; i++) {
      let rowString = rows[i];

      // skip empty rows
      if (BLANK_RE.test(rowString)) {
        continue;
      }

      const columns = rowString.split('\t');

      // Keep looping until we see title row, skipping rows until then
      if (!columnIndex) {
        columnIndex = getTitleColumns(columns);
        if (columnIndex) {
          columnNames= Object.keys(columnIndex);
          columnNamesLength = columnNames.length;
          columnNames.forEach(name => {
            if (isLanguageWord(name)) {
              this.languages.push(name);
            }
          });
        }
      } else {
        // We have seen header row, all subsequent rows are itrans data we need to collect
        const row = [];
        columnNames.forEach(name => {
          const index = columnIndex[name];
          let item = (index !== undefined) && columns[index];
          if (index === undefined) {
            throw Error('Internal error undefined column ' + name);
          }
          if (item === undefined) {
            let rowNum = i + 1;
            const msg = 'Warning: Row ' + rowNum + ' Column ' + rowString + ' missing name ' + name
              + ' at column number ' + index;
            console.log(msg);
            item = '';
          }
          row[index] = item.trim(); // spaces not allowed in itrans spreadsheet
        });
        this.itransRows.push(row);
      }
    }

    this.columnIndex = columnIndex;

    if (!this.itransRows.length) {
      throw Error('No data in spreadsheet, found 0 itrans rows.');
    }

    console.log('Loaded table rows, count: ', this.itransRows.length);
    //console.log('Loaded table[0] ', this.itransRows[0]);
    console.log('Loaded table[62] ', this.itransRows[62]);
    //console.log('Loaded table[122] ', this.itransRows[122]);

    // Prepare all data structures necessary for mapping input to Unicode.
    setupTablesAndMaps.call(this);
    expandLanguageData.call(this);

    //console.log('itransRe ', this.itransRe);
    return this;
  }

  /**
   * Match the next word in the input to the input itrans codes, and return the matched
   * characters and ItransTable row index.
   *
   * @param {string} current This is a line or word or syllable to match.
   * @param {RegExp} inputRe Use this RegExp to match the start of the current string.
   * @returns {object} {matched: string matched, row: itrans row data }
   *     matched: is in the portion of the current string matched.
   *     row: is the row at itransRows[index]
   */
  matchRe(current, inputRe) {
    let row;
    let index = -1;

    let matched = inputRe.exec(current);
    if (matched) {
      const name = matched[1]; // first group that matched, which is the itrans code
      matched = matched[0]; // whole pattern matched, this may have trailing spaces matched
      index = this.allInputRowIndex.get(name);
      row = this.itransRows[index];

      console.assert(index >= 0, 'Found a itrans code match, but it is missing from map', matched);
    }
    return {matched, row};
  }
}

/* ========================================================================== */

/**
 * Given all columns from a titles row, returns map of items to index of all itrans headers.
 * If the row is the title row, it should contain at least the minimum required
 * title names.
 *
 * @param {array} columns Each index contains a column entry.
 * @returns {null or object} Each key is a column entry, value is array index.
 */
function getTitleColumns(columns) {
  // Check if this is title row
  for (let i = 0; i < REQUIRED_TITLES.length; i++) {
    if (columns.indexOf(REQUIRED_TITLES[i]) < 0) {
      return null;
    }
  }

  // Now we know it is a title row.
  // Make a map of the columns, and ignore the columns that are not related to itrans.
  const columnIndex = {};
  for (let i = 0; i < columns.length; i++) {
    const item = columns[i].trim();
    if (item.startsWith(LANGUAGE_PREFIX) || REQUIRED_TITLES.indexOf(item) >= 0) {
      if (columnIndex.hasOwnProperty(item)) {
        throw new Error('Duplicate header title error: ' + item);
      }

      columnIndex[item] = i;
    }
  }
  console.log('Loaded table title row: ', columnIndex);
  return columnIndex;
}

/**
 * Check if the given word is one of the user-defined language names.
 * @param {string} word to check
 * @returns {boolean} True if the word is a user-defined language names.
 */
function isLanguageWord(word) {
  return word.startsWith(LANGUAGE_PREFIX);
}

/**
 * Wrap around the Map() class set() function to throw error if a duplicate key is entered
 * in the Map.
 * Duplicate entries are considered errors and will throw an error so only a single
 * setIfUnset() call is allowed.
 * Example usage:   setIfUnset.call(a-Map()-object, key, value);
 *
 * @param {object} key The key in the map.
 * @param {object} value The value of the key in the map.
 */
function setIfUnset(key, value) {
  if (this.has(key) && this.get(key) !== value) {
    throw new Error('Duplicate item error: ' + key + ' value: ' + value);
  }
  this.set(key, value);
  return this;
}

/* ========================================================================== */

/**
 * After loading the spreadsheet tables, setup mapping tables.
 * Private function.
 * Call after binding this to a ItransTable object.
 */
function setupTablesAndMaps() {

  console.log('Itrans table languages: ', this.languages);
  if (!this.languages.length) {
    throw Error('Invalid spreadsheet data: 0 languages found.');
  }

  // Save off some individual column index entries for easier access in other functions.
  this.inputColumnIndex = this.columnIndex[TITLES.input];
  this.typeColumnIndex = this.columnIndex[TITLES.type];
  this.nameColumnIndex = this.columnIndex[TITLES.unicodeName];

  // All the language codes are in the header title row. Copy the same names
  // to the itransRows since all input codes need to be in the rows to match
  // a row when scanning user input text.
  for (let i = 0 ; i < this.languages.length; i++) {
    let columns = []; // will have holes: undefined for unused indices
    columns[this.inputColumnIndex] = this.languages[i];
    columns[this.nameColumnIndex] = this.languages[i];
    columns[this.typeColumnIndex] = ROW_TYPE.command;

    this.itransRows.push(columns);
  }

  // We now have all itransRows setup correctly and all columnIndex data is setup up,
  // so rowInput(row) etc can now work.

  // Fill in the input code to row index mappings

  const allInputRowIndex = this.allInputRowIndex;

  const rowsLen = this.itransRows.length;
  for (let i = 0; i < rowsLen; i++) {
    const row = this.itransRows[i];
    const name = this.rowName(row);

    if (!name) {
      throw Error('Spreadsheet data error: empty code names are not allowed:' + row);
    }

    const nameWrapped = BRACES.wrap(name);
    const inputAll = this.rowInput(row); // this may be multiple codes, using SPLIT_INPUT_RE

    // All rows are collected in a single map. Input may be '' here, but usually not.
    // These are all the input codes that we need to convert to Unicode, or itrans commands
    // to guide the conversion.
    setIfUnset.call(allInputRowIndex, nameWrapped, i);

    // Collect all the input codes, there may be multiple separated by SPLIT_INPUT_RE
    const inputWords = inputAll.split(SPLIT_INPUT_RE);
    inputWords.forEach(input => {
      if (input !== '') {
        setIfUnset.call(allInputRowIndex, input, i);
      }
    });
  }
  console.log('Count of all input codes: ', allInputRowIndex.size);

  // Create the regexs that find the next match in the input
  const languagesCodes = []; // #sanskrit ## etc
  const namesCodes = []; // {DDHA} {I} etc
  const itransCodes = []; // k kh {DDHA} #sanskrit - all input codes
  for (let key of allInputRowIndex.keys()) {
    if (isLanguageWord(key)) {
      languagesCodes.push(key);
    } else if (BRACES.unwrap(key) !== undefined) {
      namesCodes.push(key);
    }
    itransCodes.push(key); // all input codes
  }
  this.itransRe = createLiteralsRegExp(itransCodes);
  this.languagesRe = createLiteralsRegExp(languagesCodes);
  this.namesRe = createLiteralsRegExp(namesCodes);

  // Validate data
  for (let i = 0; i < rowsLen; i++) {
    const row = this.itransRows[i];
    const name = this.rowName(row);
    if (this.rowType(row) == ROW_TYPE.vowel) {
      const dvName = DEPENDENT_VOWEL_PREFIX + name;
      const codeName = BRACES.wrap(name);
      const dvCodeName = BRACES.wrap(dvName);

      // All vowels should be also present in dependent vowels map, but ok if missing
      // since not all full vowels may be needed as dependent vowels.
      if (!allInputRowIndex.has(dvCodeName)) {
        console.log('Note: Vowel', name, 'has no dependent-vowel', dvName);
      }
      if (!allInputRowIndex.has(codeName)) {
        throw Error('Missing/incorrect dependent vowel or vowel rows ' + dvCodeName);
      }
    }
  }
}

/*
 * After loading the spreadsheet tables and itransRows all filled in, convert all
 * the language data from escaped strings ('u+09C5' or {VIRAMA}{ZWJ}) to Unicode strings.
 * Private function.
 * Call after binding this to a ItransTable object.
 */
function expandLanguageData() {
  const languagesIndices = this.languages.map(name => this.columnIndex[name]);
  this.itransRows.forEach(inputRow => {
    languagesIndices.forEach(k => {
      const input = inputRow[k];
      if (input && !BLANK_RE.test(input)) {
        let output = '';

        // first, expand all {name} Unicode Name codes to their data values
        output = expandNamesInData.call(this, input, k);
        if (input !== output) {
          // console.log('expand data {name} replacement: %s -> %s', inputRow[k], output);
        }

        // Now that we have the string without any {name} codes, convert to Unicode characters.
        // This may not be necessary since Javascript will convert all a = '\u09C5' 
        // automatically.
        output = toJSString(output);

        // Input columns may use U+nnnn or U+nnnnnn codes, convert those to Unicode
        output = expandUnicodeIds(output);

        inputRow[k] = output;
      }
    });
  });
}

/*
 * Replacement string that may contain Unicode name codes such as {VIRAMA}{ZWJ} will
 * be replaced with their actual text. {VIRAMA} replaced with the VIRAMA text for the
 * languauge, and same for ZWJ.
 * Private function.
 * Call after binding this to a ItransTable object.
 */
function expandNamesInData(input, languageIndex) {
  function expandOnce(string) {
    // expand all {name} Unicode Name codes to their data values
    let output = '';
    let matched, index, row;
    const length = string.length;
    for (let start = 0, consumed = 0; start < length; start += consumed) {
      const current = string.slice(start);
      ({matched, row} = this.matchRe(current, this.namesRe));
      if (matched && matched.length) {
        consumed = matched.length;
        const replacement = row[languageIndex]; // {name} replaced with this string
        output += replacement;
      } else {
        consumed = 1;
        output += current.charAt(0);
      }
    }
    return output;
  }

  // To handle nested references, keep looking until we get to an output without
  // any references to expand. Since the input may contain a circular reference
  // which is an data error. Don't look more than a fixed number of times.
  let output = input ;
  let nextInput = '';
  for (let i = 0; i < 5; i++) {
    nextInput = output;
    output = expandOnce.call(this, nextInput);
    if (output === nextInput) {
      // no change from input to output, so we are done expanding
      break;
    }
  }
  if (output !== nextInput) {
    throw Error('Data error: circular reference expanding input table entry: ' + nextInput);
  }
  return output;
}

/* ========================================================================== */

module.exports = ItransTable;
