'use strict';

// Since this is the application main entry point, need to invoke transpile.
// Needed for things like constants.js use of Object.values
require('babel-polyfill');

const request = require('request');
const fs = require('fs');
const ItransTable = require('../src/ItransTable');

/* ========================================================================== */

/**
 * Command line tool to download a TSV tab-separated Itrans Table Spreadsheet and
 * store it as a text file. Does some rudimentary check on the data to make sure it
 * will at least load correctly in ItransTable.
 * NOTE: If using Google Docs Spreadsheets URL, then it have a delay in providing
 * latest version of the spreadsheet to the output=tsv URL, so may need to check
 * the data manually. Or, just use the Google Docs manual Download As command on
 * the spreadsheet, and save the file locally and pass that file name to this
 * program.
 *
 * node makedata  save-name  [optional URL of TSV data]
 * example:   node makedata DEFAULT
 * will create a file named DEFAULT.tsv with the downloaded data.
 * By default, the URL fetches from URL_DEFAULT (link in the code below).
 */

const USAGE = `
Usage:
node makeData DEFAULT
  will download tsv data from default URL and create DEFAULT.tsv
node makeData CUSTOM url
  will download tsv data from url and create CUSTOM.tsv`;

/**
 * The default table is this spreadsheet which contains all the Indic itrans coversions.
 * It has been published to the web in TSV format at this URL.
 */
const URL_DEFAULT = 'https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/pub?gid=0&single=true&output=tsv';

// All input arguments save-name words are suffixed with this to create the full file name.
const FILE_SUFFIX = '.tsv';
/* ========================================================================== */

/**
 * Load the string to verify it is valid spreadsheet data for itrans.
 *
 * @param {string} tsvBody string that is the tsv data
 * @returns {string} Returns the string suitable to use in ` ` quotes.
 */
function load(tsvBody) {
  // Load the TSV data into itransTable, this is to validate the data.
  // This will thow an error if the data is bad.
  const itransTable = new ItransTable();
  // Note that this is unparsed string, so the \u1234 hex character codes
  // will not be converted to the actual character. But that is fine for the
  // purposes of checking the validity of the data - column headers and such.
  // This will throw and exit on a serious error.
  itransTable.load(tsvBody); // throws error on failure
}

/**
 * Save the TSV spreadsheet data to given file.
 *
 * @param {string} saveName Creates this file name, adding a .tsv suffix.
 * @param {string} saveString This the data to put in a template string in the .js file.
 */
function save(saveName, saveString) {
  const filename = saveName + FILE_SUFFIX;
  console.log('...Writing to file', filename);
  fs.writeFileSync(filename, saveString, {encoding: 'utf8'});
}

/**
 * Call load and save on the string that contains tab-separated values.
 *
 * @param {string} saveName Creates this file name, with .tsv suffix.
 * @param {string} tsvBody Writes this string to .js file, exported as a ` ` string.
 */
function loadAndSave(saveName, tsvBody) {
  load(tsvBody); // validate tsvBody string, throws on failure
  save(saveName, tsvBody);
}

/**
 * The main function. Downloads a TSV file from the url and saves it to saveName.
 *
 * @param {string} saveName Creates this file name, with .tsv suffix.
 * @param {string} url Download TSV data from this URL.
 */
function makeData(saveName, url) {

  if (/https?:/.test(url)) {
    console.log('...Downloading file at', url);

    request.get(url, {timeout: 5000}, ((error, response, tsvBody) => {
      if (error || response.statusCode !== 200) {
        console.error('Failed to download file. Error', error, response);
        return;
      }

      loadAndSave(saveName, tsvBody);
    }));
  } else {
    // This is likely not useful - since it will just rename an existing disk file.
    // But it is partly helpful - to validate the spreadsheet data.
    console.log('...Reading local file at', url);
    const tsvBody = fs.readFileSync(url, 'utf8');
    loadAndSave(saveName, tsvBody);
  }
}

// argv[1] is node, argv[2] is this script name, and rest are my args
const saveName = process.argv[2]; // name the file ${saveName}.tsv 
const url = process.argv[3] || URL_DEFAULT;

if (url && saveName) {
  makeData(saveName, url);
  console.log('All done');
} else {
  console.log(USAGE);
}
/* ========================================================================== */
