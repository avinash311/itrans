/**
 * @fileoverview Browser code for itrans input and output.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/
 */

'use strict';

// Application entry point, so for all the .js files used by this app, transpile.
// Remove this line once all key browsers handle ES6 (they already do?)
require('babel-polyfill');

// Load the itrans converter. This is loaded with the default itrans conversion tables.
const constants = require('./src/constants');
const Itrans = require('./src/Itrans');
const DEFAULT_TSV = require('./data/DEFAULT_TSV');

// Web page must use these id/class names
const INPUT_ID = 'i-input'; // id of text area for entering itrans input
const OUTPUT_CLASS = 'i-output'; // class containing select and  textarea to show output

const TSV_FORM_ID = 'i-data'; // form containing the load spreadsheet input
const TSV_INPUT_ID = 'i-data-input'; // load new spreadsheet TSV from this file name
const TSV_INPUT_MESSAGE_ID = 'i-data-msg'; // error or success messages on loading data

const OUTPUT_FORMAT = constants.OUTPUT_FORMAT; // utf8, html7, or unicodeNames

// maximum size of TSV spreadsheet data to be loaded
const MAX_TSV_SIZE = 100 * 1000; // in bytes. DEFAULT tsv data is under 20k.

// This script waits for pauses between user keypresses,
// and converts itrans text during the pause.
let typingTimer;                // timer identifier
let doneTypingInterval = 1000;  // time in ms, after this expires, run itrans.convert
let inputTextArea;              // itrans input text is entered here
let dataFileMessage;            // loaded data file status/error messages
let dataFileForm;               // form with input field to load data file

// Each output section has two controls: one where user selects a default language,
// and another where the converted itrans text is output.
// The controls have distinct Ids, and are collected in this array.
// { language: null; output = null; }
let inputLanguages = [];

// Load the default itrans conversion table
const itransDefault = new Itrans();
itransDefault.load(DEFAULT_TSV);
let itrans = itransDefault;

function runItrans(inputText, outputScript, outputDiv) {
  const options = {
    language: '#sanskrit',
    outputFormat: 'HTML7'
  };
  if (outputScript == 'unicode-names') {
    options.outputFormat = OUTPUT_FORMAT.unicodeNames;
  } else {
    options.language = outputScript;
  }
  outputDiv.innerHTML = itrans.convert(inputText, options);
}

// user is 'finished typing,' do something
function runAllItrans () {
  inputLanguages.forEach(({language, output}) => {
    runItrans(inputTextArea.value, language.value, output);
  });
}

// Read in the spreadsheet tsv file
function readDataFile(fileId) {
  if (!fileId || !fileId.files) {
    return;
  }

  if (!(window && window.File && window.FileReader && window.FileList && window.Blob)) {
    dataFileForm.reset();
    alert('Error: This browser does not support file loading (old browser?).');
    return;
  }

  const file = fileId.files[0];
  const {name, type, size} = file || {};
  console.log('Got readData file', name, type, size);
  if (type && !type.startsWith('text')) {
    // Sometimes type is undefined, so skip this check in that case.
    dataFileForm.reset();
    alert('Error: File "' + name + '" is not a text file.');
    return;
  }
  if (size > MAX_TSV_SIZE) {
    dataFileForm.reset();
    alert('Error: File "' + name + '" is too large. Over ' + MAX_TSV_SIZE/1000 + 'k.');
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = ( (event) => {
    const data = event.target.result;
    const tempItrans = new Itrans();
    try {
      tempItrans.load(data);
      itrans = tempItrans;
      updateDataFileMessage('Loaded ' + name, itrans);
    } catch(err) {
      const msg = 'Error: ' + name + ' has invalid itrans data: ' + err;
      if (dataFileForm) {
        dataFileForm.reset();
      }
      updateDataFileMessage(msg, undefined);
      alert(msg);
    }
  });
}

function updateDataFileMessage(msg, tempItrans) {
  if (!dataFileMessage) {
    console.log('Warning: no dataFileMessage');
    return;
  }
  let out = msg + '<br>';
  let langs = 0;
  let rows = 0;
  if (tempItrans) {
    const table = tempItrans.itransTable;
    langs = table.languages.length;
    rows = table.itransRows.length;
  }
  dataFileMessage.innerHTML = out + langs + ' languages/scripts, ' + rows + ' rows.';
}

function itransSetup() {
  document.addEventListener('DOMContentLoaded', function() {
    // this function runs when the DOM is ready, i.e. when the document has been parsed
    inputTextArea = document.getElementById(INPUT_ID);
    const events = ['input', 'propertychange', 'paste'];

    if (!inputTextArea) {
      alert('Page invalid: required input element missing: id: ' + INPUT_ID);
      return;
    }
    events.forEach(function (event) {
      inputTextArea.addEventListener(event, function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(runAllItrans, doneTypingInterval);      
      });
    });

    // All the output controls.
    const outputs = document.getElementsByClassName(OUTPUT_CLASS);
    if (!outputs || !outputs.length) {
      alert('Page invalid: required output elements missing: class: ' + OUTPUT_CLASS);
      return;
    }
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const select = output.getElementsByTagName("select");
      const outputText = output.getElementsByTagName("textarea");
      inputLanguages.push({
        language: select[0], // only 1 descendant of this type expected
        output: outputText[0]
      });
    }

    // For each language selector, run the conversion when selection is made.
    inputLanguages.forEach(({language}) => {
      language.addEventListener('change', () => runAllItrans());
    });

    // Read spreadsheet TSV text data file 
    const dataFileInput = document.getElementById(TSV_INPUT_ID);
    if (dataFileInput) {
      dataFileInput.addEventListener('change', () => {
        readDataFile(dataFileInput);      
      }, false);

      dataFileForm = document.getElementById(TSV_FORM_ID);
      if (!dataFileForm) {
        alert('Page invalid: required form missing : id: ' + TSV_FORM_ID);
        return;
      }
    }
    dataFileMessage = document.getElementById(TSV_INPUT_MESSAGE_ID);

    updateDataFileMessage('Default data loaded', itrans);
    console.log('Ready for interactive itrans use.');
  });
}

// Run the function to setup the web interaction.
itransSetup();

// Nothing to export here, browserify this file, and just load it in the web page.
