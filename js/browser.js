/**
 * @fileoverview Browser code for itrans input and output.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/online/
 */

'use strict';

// Application entry point, so for all the .js files used by this app, transpile.
// Coded using JavaScript ES6 

// Load the itrans converter. This is loaded with the default itrans conversion tables.
const constants = require('./src/constants');
const Itrans = require('./src/Itrans');
const DEFAULT_TSV = require('./data/DEFAULT_TSV');

// Web page must use these id/class names
const INPUT_FORM_ID = 'i-input-form'; // id of form containing textarea and buttons for itrans input
const INPUT_ID = 'i-input-text'; // id of text area for entering itrans input
const INPUT_FILE_ID = 'i-input-file'; // id of button to load file into input textarea
const INPUT_CLEAR_ID = 'i-input-clear'; // id of button to clear input textarea
const OUTPUT_CLASS = 'i-output'; // class containing select and  textarea to show output

const TSV_FORM_ID = 'i-data'; // form containing the load spreadsheet input
const TSV_INPUT_ID = 'i-data-input'; // load new spreadsheet TSV from this file name
const TSV_INPUT_RESET_ID = 'i-data-input-reset'; // load default spreadsheet TSV
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
let dataFileReset;              // load default data spreadsheet

// Each output section has two controls: one where user selects a default language,
// and another where the converted itrans text is output.
// The controls have distinct elements, and are collected in this array.
// language: the select object where language.value is the selected element
// output: the output text area
// { language: null; output = null; }
let outputLanguages = [];

// select element drop-down elements are synced with the spreadsheet languages
// and some custom names and additions made
const UNICODE_NAMES_OPTION = {text: 'Unicode names', value: 'unicode-names'};
// Suppress #tamils from output. There is no font that correctly supports it,
// no font puts the superscript characters after the vowel sign, for example.
const SELECT_SKIP_NAMES = ['#tamils']; // suppress these names from the dropdown list

// Load the default itrans conversion table
const itransDefault = new Itrans();
let itrans = itransDefault;

function runItrans(inputText, outputScript, outputDiv) {
  const options = {
    language: '#sanskrit',
    outputFormat: 'HTML7'
  };
  if (outputScript === UNICODE_NAMES_OPTION.value) {
    options.outputFormat = OUTPUT_FORMAT.unicodeNames;
  } else {
    options.language = outputScript;
  }
  outputDiv.innerHTML = itrans.convert(inputText, options);
}

// user is 'finished typing,' do something
function runAllItrans () {
  outputLanguages.forEach(({language, output}) => {
    runItrans(inputTextArea.value, language.value, output);
  });
}

// Load in the itrans input file
function loadInputFile(fileId, formId) {
  if (!fileId || !fileId.files) {
    return;
  }

  if (!(window && window.File && window.FileReader && window.FileList && window.Blob)) {
    formId.reset();
    alert('Error: This browser does not support file loading (old browser?).');
    return;
  }

  const file = fileId.files[0];
  const {name, type, size} = file || {};
  console.log('Got loadInput file', name, type, size);
  if (type && !type.startsWith('text')) {
    // Sometimes type is undefined, so skip this check in that case.
    formId.reset();
    alert('Error: File "' + name + '" is not a text file.');
    return;
  }
  if (size > MAX_TSV_SIZE) {
    formId.reset();
    alert('Error: File "' + name + '" is too large. Over ' + MAX_TSV_SIZE/1000 + 'k.');
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = ( (event) => {
    const data = event.target.result;
    inputTextArea.value = data;
    runAllItrans();
  });
}

// Load in the spreadsheet tsv file
function loadDataFile(fileId, formId) {
  if (!fileId || !fileId.files) {
    return;
  }

  if (!(window && window.File && window.FileReader && window.FileList && window.Blob)) {
    formId.reset();
    alert('Error: This browser does not support file loading (old browser?).');
    return;
  }

  const file = fileId.files[0];
  const {name, type, size} = file || {};
  console.log('Got loadData file', name, type, size);
  if (type && !type.startsWith('text')) {
    // Sometimes type is undefined, so skip this check in that case.
    formId.reset();
    alert('Error: File "' + name + '" is not a text file.');
    return;
  }
  if (size > MAX_TSV_SIZE) {
    formId.reset();
    alert('Error: File "' + name + '" is too large. Over ' + MAX_TSV_SIZE/1000 + 'k.');
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = ( (event) => {
    const data = event.target.result;
    loadItransData(data, name, formId);
  });
}

// Load the spreadsheet string (data) and display message about
// loading it from source name. Update all web elements that need updating on newly
// loaded spreadsheet data.
function loadItransData(data, name, formId) {
  // There is no clear function available for itrans data, so create a new object
  // with the new itrans table data.
  const tempItrans = new Itrans();
  try {
    tempItrans.load(data);
    itrans = tempItrans;
    updateDataFileMessage('Loaded: ' + name, itrans);
  } catch(err) {
    const msg = 'Error: ' + name + ' has invalid itrans data: ' + err;
    if (formId) {
      formId.reset();
    }
    updateDataFileMessage(msg, undefined);
    alert(msg);
  }
  // Update web elements that depend on the itrans object data.
  updateAllWebElements();

  // Update all the output text boxes using the new spreadsheet data.
  runAllItrans();
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

// Update the select drop-down list based on data on the current "itrans" object.
// Sync the languages in this element with the actually loaded languages.
// Keep track of currently selected language, so it can be selected (if the language is present).
function updateSelectList(selectElement) {
  if (!selectElement) {
    return;
  }
  // Save the currently selected element, so if this
  const selected = selectElement.value;

  // Remove all existing items
  while (selectElement.options.length) {
    selectElement.remove(0);
  }
  // Add all currently loaded languages
  const table = itrans.itransTable;
  const langs = table.languages;
  table.languages.forEach((language) => {
    // Only add option if it is not in the skip options list
    if (SELECT_SKIP_NAMES.indexOf(language) < 0) {
      const isSelected = selected == language;
      const option = new Option(language, language, isSelected, isSelected);
      selectElement.add(option);
    }
  });

  // Add in Unicode names language option
  const option = new Option(UNICODE_NAMES_OPTION.text, UNICODE_NAMES_OPTION.value);
  option.selected = selected === UNICODE_NAMES_OPTION.value;
  selectElement.add(option);
}

// Update all the elements of the web page that need updating
// based on the data in the spreadsheet such as the languages supported.
function updateAllWebElements() {
  outputLanguages.forEach(({language}) => {
    // Update web page elements that depend on list of loaded languages.
    // For each select element, update its option items to match loaded languages.
    // Adds all the languages available in the spreadsheet.
    updateSelectList(language);
  });
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

    const inputForm = document.getElementById(INPUT_FORM_ID);
    const clearButton = document.getElementById(INPUT_CLEAR_ID);
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (inputForm) {
          inputForm.reset();
        }
        inputTextArea.value = '';
        runAllItrans();
     });
    }
    // Load file into itrans input area
    const fileInput = document.getElementById(INPUT_FILE_ID);
    if (fileInput) {
      if (!inputForm) {
        alert('Page invalid: required form missing : id: ' + INPUT_FORM_ID);
        return;
      }

      fileInput.addEventListener('change', () => {
        loadInputFile(fileInput, inputForm);      
      }, false);
    }

    // All the output controls.
    const outputs = document.getElementsByClassName(OUTPUT_CLASS);
    if (!outputs || !outputs.length) {
      alert('Page invalid: required output elements missing: class: ' + OUTPUT_CLASS);
      return;
    }
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const select = output.getElementsByTagName("select")[0]; // only 1 descendant of this type expected
      const outputText = output.getElementsByTagName("textarea");
      outputLanguages.push({
        language: select,
        output: outputText[0]
      });
    }

    // For each language selector, run the conversion when selection is made.
    outputLanguages.forEach(({language}) => {
      language.addEventListener('change', () => runAllItrans());
    });

    // Read spreadsheet TSV text data file 
    const dataFileInput = document.getElementById(TSV_INPUT_ID);
    if (dataFileInput) {
      dataFileForm = document.getElementById(TSV_FORM_ID);
      if (!dataFileForm) {
        alert('Page invalid: required form missing : id: ' + TSV_FORM_ID);
        return;
      }

      dataFileInput.addEventListener('change', () => {
        loadDataFile(dataFileInput, dataFileForm);      
      }, false);

    }

    dataFileMessage = document.getElementById(TSV_INPUT_MESSAGE_ID);

    // Reset spreadsheet TSV data to default
    dataFileReset = document.getElementById(TSV_INPUT_RESET_ID);
    if (dataFileReset) {
      dataFileReset.addEventListener('click', () => {
        loadItransData(DEFAULT_TSV, 'Default', null);      
      }, false);
    }

    // Web page setup done, now load the itrans tables.
    loadItransData(DEFAULT_TSV, 'Default', null);      

    console.log('Ready for interactive itrans use.');
  });
}

// Run the function to setup the web interaction.
itransSetup();

// Nothing to export here, browserify this browser.js file, and just load it in the web page.
