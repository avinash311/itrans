# ChangeLog

## Version 0.5.0
  * 2022-01-09
  * tsv= URL parameter added to load custom tab-separated itrans table
    on startup. Example:
    https://www.aczoom.com/itrans/online/?s=hindi&tsv=https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/export?format%3Dtsv%26gid%3D0
  * Updated DEFAULT.tsv to include expansions for SRI

## Version 0.4.0
  * 2021-02-20
  * Added Copy to clipboard button.
  * Added URL parameter ?s= to start with specific language scripts output.
    Example: aczoom.com/itrans/online/?s=hindi
    Example: aczoom.com/itrans/online/?s=marathi,unicode-names
  * Refactor of browser.js, added more comments.

## Version 0.3.2
  * 2021-01-13
  * Updated to newer package.json devDependencies
  * Use terser instead of uglifyjs
  * Use node-fetch for makedata.js instead of request to download spreadsheet
  * JavaScript ES6 required: Remove browserify -t babelify --presets es2015

## Version 0.3.1
  * 2021-01-12
  * Updated DEFAULT.tsv to include avagraha

## Version 0.3.1
  * 2021-01-12
  * Updated DEFAULT.tsv to include avagraha
  * Removed browser.js transpiling load of `babel-polyfill`, no need to
    handle some of the ES6 constructs used in the Javascript files since ES6
    is widely available,and no transpiling is now necessary.

## Version 0.3.0
  * Added load button to load local file into itrans input area

## Version 0.2.2
  * Improved the look and working of the Load spreadsheet button.
    Load Default now loads the default data file.
  * Added a clear button for the input text area.

## Version 0.2.1
  * The web page Default Output languages list is now auto-populated based on
    the actual languages in the loaded spreadsheet. The HTML page can indicate
    the selected language, and that indicator will be maintained (as long as
    that language is present in the loaded spreadsheet).

## Version 0.2.0
  * First version that was uploaded to GitHub
  * Includes Javascript code, Node.js package.json, CSS files, HTML pages.
