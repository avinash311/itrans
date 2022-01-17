/**
 * @fileoverview Browser code for itrans input and output.
 * @author Avinash Chopde <avinash@aczoom.com>
 * @version 0.6.0
 * @since 2021-02-20
 *
 * http://www.aczoom.com/itrans/online/
 */

'use strict';

// Application entry point, so for all the .js files used by this app, transpile.
// Coded using JavaScript ES6

// Load the itrans converter. This is loaded with the default itrans conversion tables.
const constants = require('./src/constants');
// import { constants } from "./src/constants.js";
const Itrans = require('./src/Itrans');
//import { Itrans } from "./src/Itrans.js";
const DEFAULT_TSV = require('./data/DEFAULT_TSV');
const ISO_TSV = require('./data/iso_tsv');

const OUTPUT_FORMAT = constants.OUTPUT_FORMAT; // html7, unicodeNames, or utf8

// Web page uses these id/class names
const INPUT_FORM_ID = 'i-input-form'; // id of form containing textarea and buttons for itrans input
const INPUT_ID = 'i-input-text'; // id of text area for entering itrans input
const INPUT_FILE_ID = 'i-input-file'; // id of button to load file into input textarea
const INPUT_CLEAR_ID = 'i-input-clear'; // id of button to clear input textarea
const OUTPUT_CLASS = 'c-output'; // class containing select and  textarea to show output
const COPY_BUTTON_CLASS = 'copy-button'; // child of c-output used for copy to clipboard
const MAX_OUTPUT_CLASS = 3; // by default (without s= scripts) show these many outputs

// Tab-Separated-Value spreadsheet contains the itrans tables 
// Web form for loading custom spreadsheet data from user's local filesystem
const TSV_FORM_ID = 'i-data'; // form containing the load spreadsheet input
const TSV_INPUT_ID = 'i-data-input'; // load new spreadsheet TSV from this file name
const TSV_INPUT_DEFAULT_ID = 'i-data-input-default'; // load default spreadsheet TSV
const TSV_INPUT_ISO_ID = 'i-data-input-iso'; // load iso based input spreadsheet TSV
const TSV_INPUT_MESSAGE_ID = 'i-data-msg'; // error or success messages on loading data
// maximum size of TSV spreadsheet data to be loaded
const MAX_TSV_SIZE = 100 * 1000; // in bytes. DEFAULT tsv data is under 20k.

// scripts URL param can be used to load specific languages in output textareas
// More names here than actual output textareas on web page will be ignored.
// Names are same as itrans spreadsheet column names, without the # leading character.
// Example: aczoom.com/itrans/online/?s=hindi,bengali,unicode-names
const URL_PARAM_SCRIPTS = 's';

// tsv= URL param can be used to load itrans conversion spreadsheet in TSV tab-separated format.
// Example for the default spreadsheet:
// tsv=https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/export?format=tsv&gid=0
// fully URL encoded: https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo%2Fexport%3Fformat%3Dtsv%26gid%3D0
// URL encoded minimal: tsv=https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/export?format%3Dtsv%26gid%3D0
const URL_PARAM_TSV = 'tsv';

// Web page elements and data used by all the functions and callbacks.

/**
 * @typedef {Object} OutputDiv
 * @property {HTMLSelectElement} selectElem - dropdown with all the script names
 * @property {HTMLTextAreaElement} textElem - displays itrans converted output
 */
function OutputDiv(selectElem, textElem) {
  this.selectElem = selectElem;
  this.textElem = textElem;
}

/**
 * Store all the web page input and output elements along with objects to be
 * used for loading itrans TSV spreadsheet data and converting itrans input
 * to Indic script output.
 * Fields are setup when DOM has been loaded and then listener callbacks
 * read and update these fields.
 *
 * @typedef {Object} Page
 * @property {HTMLTextAreaElement} inputTextElem - INPUT_ID for itrans input
 * @property {HTMLElement} tsvLoadedMessage - for TSV load status messages
 * @property {OutputDiv[]} outputDivs - for itrans converted output
 *     Each output section has two controls: one where user selects a default
 *     language, and another where the converted itrans text is output.
 *     The control elements are collected in this array.
 * @property {Itrans} itrans - for storing itrans spreadsheet TSV tables and
 *     will be used to convert itrans encoded text to Indic script output
 */
/** @type {Page} */
const page = {
  inputTextElem: null,  // getElementById(INPUT_ID)
  tsvLoadedMessage: null, // getElementById(TSV_INPUT_MESSAGE_ID)

  outputDivs: [], // getElementsByClassName(OUTPUT_CLASS) child elements
  itrans: null,
};

// select element drop-down elements are synced with the spreadsheet languages
// and some custom names and additions made
const UNICODE_NAMES_OPTION = {text: 'Unicode names', value: 'unicode-names'};
// TODO match spreadsheet const UNICODE_NAMES_OPTION = {text: 'CODE-NAME', value: 'UNICODE-NAMES'};
// and match OUTPUT_FORMAT.unicodeNames or use text and value fields like options?


/**
 * Runs itrans to convert input text into one output script.
 *
 * @param {string} inputText - itrans input text to convert.
 * @param {OutputDiv} outputDiv - specifies language and output textarea
 *     to display the output.
 */
function runItrans(inputText, outputDiv) {
  const options = {
    // defaults
    language: '#sanskrit',
    outputFormat: 'HTML7'
  };
  const outputScript = outputDiv.selectElem.value; // TODO rename to script or say it matches options.language AND use outputDiv.selectElem.value instead
  if (outputScript === UNICODE_NAMES_OPTION.value) { // 'unicode-names' TODO cap it and remove?
    options.outputFormat = OUTPUT_FORMAT.unicodeNames; // 'UNICODE-NAMES'
  } else {
    options.language = outputScript;
  }
  // console.log('runItrans', outputDiv.selectElem.value);
  outputDiv.textElem.innerHTML = page.itrans.convert(inputText, options);
}

/**
 * Runs itrans to convert input text into all output textareas.
 * Uses outputDivs array from outer scope.
 */
function runAllItrans () {
  page.outputDivs.forEach((outputDiv) => {
    runItrans(page.inputTextElem.value, outputDiv);
  });
}

/**
 * Load itrans input text into page.inputTextElem from a file.
 * After it is loaded runs itrans conversions to update all page.outputDivs.
 *
 * @param {object} fileId - <input type="file"> element which contains local
 *     file data loaded from user's browser.
 * @param {object} formId - web form that includes the fileId element.
 */
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
    page.inputTextElem.value = data;
    // Code modified page.inputTextElem does not fire on the events, so
    // have to do it here.
    runAllItrans();
  });
}

/**
 * Setup the select dropdown options list with all the language script names
 * available for itrans conversion output.
 *
 * @param {HTMLSelectElement} selectElem - dropdown list to fill in.
 * @param {string[]} languages - array of language script names, usually comes
 *     from currently loaded page.itrans.itransTable.languages value.
 */
function setupLanguagesList(selectElem, languages) {
  const selected = selectElem.value;

  // Remove all existing options
  selectElem.length = 0;

  // Add all currently loaded languages
  languages.forEach((language) => {
    const isSelected = selected == language;
    const option = new Option(language, language, isSelected, isSelected);
    selectElem.add(option);
  });

  // Add in Unicode names language option
  const option = new Option(UNICODE_NAMES_OPTION.text, UNICODE_NAMES_OPTION.value);
  option.selected = selected === UNICODE_NAMES_OPTION.value;
  selectElem.add(option);
}

/**
 * Setup all output web elements and collect OutputDiv object data.
 * Fills in the outer scope page.outputDivs array.
 * Uses itrans object which has the itrans spreadsheet data loaded in.
 *
 * Sets the web select element options with list of script names using
 * {@link setupLanguagesList}.
 * URL parameters (if any) used to setup the default language script names.
 * Sets up listeners to update the output textarea and the copy button.
 *
 */
function setupOutputDivs() {
  /** @type {HTMLCollection} */
  const outputs = document.getElementsByClassName(OUTPUT_CLASS);
  if (!outputs || !outputs.length) {
    alert('Page invalid: required output elements missing: class: ' + OUTPUT_CLASS);
    return;
  }
  if (!page.itrans) {
    // Probably an internal error since default tables should always load.
    alert('Failed to load itrans conversion tables');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const scriptsIn = urlParams.get(URL_PARAM_SCRIPTS);
  let scripts = scriptsIn ? scriptsIn.split(',') : [];
  // Script name args omit # character constants.LANGUAGE_PREFIX, add it back.
  scripts = scripts.map((s) => {
    if (s !== UNICODE_NAMES_OPTION.value) {
      s = constants.LANGUAGE_PREFIX + s;
    }
    return s;
  });

  // Remove invalid script names.
  scripts = scripts.filter((script) => {
    const table = page.itrans.itransTable;
    const help = 'Valid names are in default page dropdown list. ' +
      'Omit any first # character.\n' +
      '"unicode-names" is also a valid name.';
    const pass = table.isLanguage(script) ||
      script === UNICODE_NAMES_OPTION.value;
    if (!pass) {
      const msg = 'Invalid language script name in URL "' + script + '"\n\n' + help;
      alert(msg);
      console.warn(false, msg);
    }
    return pass;
  });

  // number of output textareas sections to use
  let useCount = outputs.length; // index.html defined c-output div count
  if (scriptsIn) {
    useCount = Math.min(useCount, scripts.length);
  } else {
    useCount = Math.min(useCount, MAX_OUTPUT_CLASS);
  }
  console.log('URL scripts', scripts, ',useCount', useCount,
    ', outputs.length', outputs.length);
  // remove any extra output sections on the web page
  if (outputs.length > useCount) {
    // HTMLCollection length cannot be reset, so have to loop and remove.
    const originalLength = outputs.length;
    for (let i = useCount; i < originalLength; ++i) {
      outputs[useCount].remove(); // each remove changes HTMLCollection length.
    }
  }

  for (let i = 0; i < useCount; i++) {
    const output = outputs[i];
    const select = output.getElementsByTagName('select')[0]; // only 1 descendant of this type expected
    const outputText = output.getElementsByTagName('textarea')[0];

    // Adds all the languages available in the spreadsheet.
    setupLanguagesList(select, page.itrans.itransTable.languages);
    const selectValue = scripts[i] || select.value;
    select.value = selectValue; // update selected item

    const outputDiv = new OutputDiv(select, outputText);
    page.outputDivs.push(outputDiv);

    // For each selector, run the conversion when new language is chosen.
    select.addEventListener('change', () => {
      runAllItrans();
    });

    // Add copy to clipboard button for this output textarea
    output.querySelector('.' + COPY_BUTTON_CLASS).
      addEventListener('click', () => {
        outputText.select();
        document.execCommand("copy");
      }, false);
  }
}

/**
 * Display a message in the output text element TSV_INPUT_MESSAGE_ID
 * stored in page.tsvLoadedMessage.
 * Provides status regarding the loading of itrans tsv data file.
 *
 * @param {string} message - show this string.
 * @param {Itrans} [tempItrans] - used to print more stats about loaded table.
 */
function showTsvLoadedMessage(message, tempItrans) {
  // itrans spreadsheet loaded file status messages shown in this web element
  page.tsvLoadedMessage = document.getElementById(TSV_INPUT_MESSAGE_ID);

  if (!page.tsvLoadedMessage) {
    console.warn('Missing output message element', TSV_INPUT_MESSAGE_ID);
    return;
  }
  const out = message + '<br>';
  let langs = 0;
  let rows = 0;
  if (tempItrans) {
    const table = tempItrans.itransTable;
    langs = table.languages.length;
    rows = table.itransRows.length;
  }
  page.tsvLoadedMessage.innerHTML =
    out + langs + ' languages/scripts, ' + rows + ' rows.';
}

/**
 * Load the tab-separated-values spreadsheet string itrans data.
 * Then, update all required output web elements such as new dropdown select
 * element with the new script names.
 * Assigns to page.itrans object on success otherwise it is left unchanged.
 *
 * @param {string} tsvString - Tab-Separated-Values representing the table.
 * @param {string} name - file name or tag used to print success/fail messages.
 * @param {object} [formId] - web form that includes the fileId element.
 *     If an error occurs, reset() will be called on it.
 */
function loadItransTsvTable(tsvString, name, formId) {
  // Create a temp itrans object and if it loads correctly, start using it.
  const tempItrans = new Itrans();
  try {
    tempItrans.load(tsvString);
    page.itrans = tempItrans;
    showTsvLoadedMessage('Loaded: ' + name, page.itrans);
  } catch(err) {
    const message = 'Error: ' + name + ' has invalid itrans data: ' + err;
    if (formId) {
      formId.reset();
    }
    showTsvLoadedMessage(message, undefined);
    alert(message);
  }
}

/**
 * Load the tab-separated-values spreadsheet string itrans data.
 * Then, update all required output web elements such as new dropdown select
 * element with the new script names.
 *
 * @see {@link loadItransTsvTable}
 * @see {@link setupOutputDivs}
 * @param {string} tsvString - Tab-Separated-Values representing the table.
 * @param {string} name - file name or tag used to print success/fail messages.
 * @param {object} [formId] - web form that includes the fileId element.
 *     If an error occurs, reset() will be called on it.
 */
function loadTableAndSetupOutputDivs(tsvString, name, formId) {
  loadItransTsvTable(tsvString, name, formId);
  console.log('Loaded from: ', name);
  // All data now available, including ItransTable
  // Prepare the language output script textareas
  // Also fill the select scripts dropdown with the supported script names
  setupOutputDivs();
}

/**
 * Load custom itrans tables from a tab-separated-values local data file.
 * Then setup the page.outputDivs with new languages and rerun itrans on
 * input text.
 *
 * @see {@link loadTableAndSetupOutputDivs} is called after TSV loaded.
 * @param {object} fileId - <input type="file"> element which contains local
 *     file with TSV itrans spreadsheet data, loaded from user's browser.
 * @param {object} formId - web form that includes the fileId element.
 */
function loadCustomTsvFile(fileId, formId) {
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
    loadTableAndSetupOutputDivs(data, name, formId);
  });
}

/**
 * Handle tsv= UTL fetch and return text on success or throw error.
 */
function handleFetch(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response.text();
}

/**
 * Load custom itrans tables from a URL parameter pointing to a TSV file.
 * Then setup the page.outputDivs with new languages and rerun itrans on
 * input text.
 * Keywords DEFAULT and iso will load the built-in tables.
 *
 * @see {@link loadTableAndSetupOutputDivs} is called after TSV loaded.
 */
function loadUrlTsv(urlTsv) {
  const mode = {
    mode: 'cors',
    // cache: 'no-cache',
    headers: {
      // 'Content-Type': 'text/plain'
      'Content-Type': 'text/tab-separated-values'
    },
  };
  if (urlTsv === 'DEFAULT') {
    loadTableAndSetupOutputDivs(DEFAULT_TSV, 'Default', null);
    return;
  } else if (urlTsv === 'iso') {
    loadTableAndSetupOutputDivs(ISO_TSV, 'ISO based', null);
    return;
  }

  fetch(urlTsv, mode)
    .then(response => handleFetch(response))
    .then(tsvString => loadTableAndSetupOutputDivs(
      tsvString, urlTsv, null))
    .catch(error => {
      const msg = urlTsv + ' load failed: ' + error;
      showTsvLoadedMessage(msg);
      alert(msg);
    });
}

/**
 * Setup the input text area web element.
 * Listeners on events invoke itrans conversion on input in the text area.
 * Sets up the buttons to load from a file and clear the input text area.
 *
 * Sets the page.inputTextElem variable.
 * Should be called only after page.itrans object has spreadsheet data loaded.
 *
 * @see {@link runAllItrans} is called to convert input text to Indic scripts.
 * @see {@link loadInputFile} is called to load input file and run itrans.
 *
 */
function setupInputText() {
  // itrans input text is entered here by the user
  page.inputTextElem = document.getElementById(INPUT_ID);

  if (!page.inputTextElem) {
    alert('Page invalid: required input element missing: id: ' + INPUT_ID);
    return;
  }

  // This script waits for pauses between user keypresses,
  // and converts itrans text during the pause after this timer fires.
  const doneTypingInterval = 1000; // time in ms
  let typingTimer; // timer identifier, common to all events
  page.inputTextElem.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      // console.log('timer inputTextElem ' + page.inputTextElem);
      runAllItrans();
    }, doneTypingInterval);
  });

  const inputForm = document.getElementById(INPUT_FORM_ID);
  const clearButton = document.getElementById(INPUT_CLEAR_ID);
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (inputForm) {
        inputForm.reset();
      }
      page.inputTextElem.value = '';
      console.log('clear button inputTextElem ' + page.inputTextElem);
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
      console.log('load input file inputTextElem ' + page.inputTextElem);
      loadInputFile(fileInput, inputForm);
    }, false);
  }
}

/**
 * Setup the entire web page interaction.
 * This function runs when the DOM is ready.
 * It loads itrans tsv data and sets up the input and output web page elements.
 */
function setupWebPage() {

  setupInputText();

  // Setup listener to load custom spreadsheet TSV text data file
  const dataFileInput = document.getElementById(TSV_INPUT_ID);
  if (dataFileInput) {
    // dataFileForm is form with input field to load custom data file
    const dataFileForm = document.getElementById(TSV_FORM_ID);
    if (!dataFileForm) {
      alert('Page invalid: required form missing : id: ' + TSV_FORM_ID);
      return;
    }

    dataFileInput.addEventListener('change', () => {
      loadCustomTsvFile(dataFileInput, dataFileForm);
    }, false);

  }

  // Setup listener for reset button to reload default itrans TSV data.
  const dataFileDefault = document.getElementById(TSV_INPUT_DEFAULT_ID);
  if (dataFileDefault) {
    dataFileDefault.addEventListener('click', () => {
      loadTableAndSetupOutputDivs(DEFAULT_TSV, 'Default', null);
    }, false);
  }
  const dataFileIso = document.getElementById(TSV_INPUT_ISO_ID);
  if (dataFileIso) {
    dataFileIso.addEventListener('click', () => {
      loadTableAndSetupOutputDivs(ISO_TSV, 'ISO based', null);
    }, false);
  }

  // If provided, start with the table provided in tsv= url file.
  const urlParams = new URLSearchParams(window.location.search);
  const urlTsv = urlParams.get(URL_PARAM_TSV);
  if (urlTsv) {
    loadUrlTsv(urlTsv);
  } else {
    // Load the built-in default itrans conversion table data.
    loadTableAndSetupOutputDivs(DEFAULT_TSV, 'Default', null);
  }

  console.log('Ready for interactive itrans use.');
}

// Run the function to setup the web interaction.
document.addEventListener('DOMContentLoaded', setupWebPage);

// Nothing to export here, browserify this browser.js file, and just load it in the web page.
