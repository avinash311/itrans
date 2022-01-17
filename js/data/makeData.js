'use strict';

// JavaScript ES6 required.

const fetch = require('node-fetch');
const fs = require('fs');
const ItransTable = require('../src/ItransTable');

/* ========================================================================== */

/**
 * Command line tool to download a TSV tab-separated Itrans Table Spreadsheet and
 * store it as a text file. Does some rudimentary check on the data to make sure it
 * will at least load correctly in ItransTable.
 * NOTE: If using Google Docs Spreadsheets URL, then it has a delay in providing
 * latest version of the spreadsheet to the output=tsv URL, so may need to check
 * the data manually. Or, just use the Google Docs manual Download As command on
 * the spreadsheet, and save the file locally and pass that file name to this
 * program.
 *
 * node makedata  save-name  [optional URL of TSV data|optional local file name]
 * example:   node makeData DEFAULT
 * will create a file named DEFAULT.tsv with the downloaded data.
 * By default, the URL fetches from URL_DEFAULT (link in the code below).
 * 
 * See ../DEV.md for using node, npm, etc to update DEFAULT.tsv.
 */

const USAGE = `
Usage:
node makeData DEFAULT
  will download tsv data from default URL and create DEFAULT.tsv
node makeData iso
  will download tsv data from ISO URL and create iso.tsv
node makeData CUSTOM url
  will download tsv data from url and create CUSTOM.tsv
node makeData
  this help message`;

/**
 * The default table is this spreadsheet which contains all the Indic itrans coversions.
 * /pub? link is copied after using Share -> Publish to web at Google Docs site to make
 * this table available in TSV format at this URL. See full comment above.
 * /export? link does not need to be used on published doc, but doc should be viewable by all.
 */
// const URL_DEFAULT = 'https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/pub?gid=0&single=true&output=tsv';
const URL_DEFAULT = 'https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/export?format=tsv&gid=0';
// const URL_ISO = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRgOzOmB8IB7POPc51goOhcE7ei07ZzRmHd6taHURNCZ90-BA99khJqGoWDHF9aGY65Be1O4gi3y1lF/pub?gid=2092594052&single=true&output=tsv';
const URL_ISO = 'https://docs.google.com/spreadsheets/d/1PHC3EJ69PZ4U39LSWtjMJhOL7aVE5qdW8qANaPTKDW8/export?format=tsv&gid=2092594052';

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
  console.log('...Load and Save Done.');
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

    function doFetch(tsvBody) {
      console.log('...Download done.');
      loadAndSave(saveName, tsvBody);
    }

    fetch(url)
      .then(res => res.text()) // returns response as text
      .then(doFetch) // doFetch(tsvBody)
      .catch(result => console.log('Failed URL download', result));

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
const url = (saveName === 'DEFAULT') ? URL_DEFAULT : (saveName === 'iso') ? URL_ISO : process.argv[3];

if (url && saveName) {
  makeData(saveName, url);
} else {
  console.log(USAGE);
}
/* ========================================================================== */
