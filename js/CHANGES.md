# ChangeLog

<<<<<<< HEAD
## Version 0.6.8
  * 2026-08-29
  * \.  and   \..   alternatives for |  and  ||   danda and double-danda
  * A few missing unicode characters for ISO signs added, copying over from itrans-5.3
  * Removed column tamils-unused from itrans-5.3

=======
>>>>>>> 44fb78f7a0baaea37751a02b7d1f87c503328f61
## Version 0.6.7
  * 2026-08-07
  * svarita and double-svarita now also support the left/right smart quotes HTML chars
  * AUM|OUM and OM updates
  * anusvara, anudatta, siddham, grave-accent, acute-accent updates

## Version 0.6.6
  * 2026-07-04
  * Renamed IAST and IPA to iast and ipa. All names are lower-case now.
  * #iso, #iast, #ipas were missing dependent-vowel data. Now filled in.
  * index.html updated to mention that #roman is no longer supported and to use #iso (or #iast or #ipa instead).

## Version 0.6.5
  * 2026-07-01
  * OM output for some languages was incorrect (double characters output), now fixed.
  * #roman removed. Use one of the #IAST or #IPA or #iso codes instead.
  * A bunch of internal-only changes for spreadsheet devanagari reference column.

## Version 0.6.4
  * 2026-06-25
  * Updates from https://github.com/avinash311/itrans/issues/12 report
  *   Many thanks to nsesha92 for these updates.
  *   With these changes, 5.3 and ISO are the same, except for ^e/e/E, ^o/o/O.
  * ISO link aczoom.com/itrans/online/?tsv=iso uses a bunch of ISO updates
  * ISO updates removed extra codes: ng ny nj nx gn gy .ss .an .cbv .N.h .ds
  * ISO updates added/renamed columns, scripts now available: #IAST #IPA
  *   All scripts: #sanskrit	#hindi	#marathi	#modi	#bengali	#gurmukhi	#gujarati	#oriya	#tamil	#telugu	#kannada	#malayalam	#grantha	#IAST	#iso	#IPA
  * Itrans 5.3 updates
  *   Old copy of 0.6.3 spreadsheet saved locally, if needed

## Version 0.6.3
  * 2026-06-07
  * Some more minor updates from updated comments in thread
  *   https://github.com/avinash311/itrans/issues/11
  * ISO file updated: Some #tamil chars added, updated some input codes: H, ~H, Q, \m, |, ||.
  * Itrans 5.3: nx added.

  * 2026-05-31
  * Many vedic tones added. examples.html updated with vedic tone codes.

  * Updated coding for 5.3 and ISO15919: https://github.com/avinash311/itrans/issues/11
  * itrans-iso15919-unicode-mapping shared file updated
  * Some "itrans may 2026 updates" file changes manually copied over, others unchanged
  *   Added: Zh (zha), Q (nukta), .ga, .aa, \', \_,  many vedic codes.

  * 2025-12-29
  * Added vedic tone signs to the iso based transliteration table.
    Downloaded updated itrans-iso15919-unicode-mapping shared file https://docs.google.com/spreadsheets/d/1PHC3EJ69PZ4U39LSWtjMJhOL7aVE5qdW8qANaPTKDW8/edit?usp=sharing
    as posted in https://github.com/avinash311/itrans/issues/10

## Version 0.6.1
  * 2023-01-20
  * Updated the iso based transliteration table as one of the defaults.
    Issues: https://github.com/avinash311/itrans/issues/7 and issues/6.

## Version 0.6.0
  * 2022-02-01
  * Added the iso based transliteration table as one of the defaults.
    Both default (old) and iso-based input encoding now included by default.
  * Added Load ISO button to load the iso-based table.
  * Added tsv=iso to be used in URL to start with the ISO table.
  * Added tsv=DEFAULT to be used in URL to start with the default table.
  * Added examples.html showing all the itrans 5.3 and iso input codes.
  * Fix DEFAULT.tsv SRI (input type should be empty, not consonant)
  * Added 2 more output boxes so URL s= can use upto 5 scripts.
  * Better error messages on tsv= invalid URL or URL with non-table data.
  * Updated normalize.css to 8.0.1
  * Fixed bug where invalid commands like #hindix would be treated as #hindi and then x printed.
  * For historical record: roman vs roman-south: short-e, e, ee, ai and short-o, o, oo and au, since their handling is different for north-indian and south-indian scripts within ITRANS.
    Added #iso column, which should in general match #roman.

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
