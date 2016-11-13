# itrans
itrans - Convert encoded text to Unicode output - for Indic or other scripts

## Web site

The Javascript code in the `js` folder here is used to run the [Online Itrans web page](http://www.aczoom/itrans/online/).

For users who wish to build customized web pages or text to Unicode conversion, see the documentation for developers in [js/DEV.md](js/DEV.md).

## Unicode tables

All Indic scripts with their Unicode names have been collected in a spreadsheet and the data in that spreadsheet drives the Online Itrans web site.

[itrans-unicode-mapping tables](https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/edit?usp=sharing) is the default table.
That table can be copied and the data modified to support different input (or even output) codes, and the modified table can be loaded at the Online Itrans web site.

Or, users can use the Javascript code and tools provided here to build their own versions of the web page or conversion mappings.

Some more information on spreadsheet and how to upload locally customized versions of the spreadsheet is available at 
the [Online Itrans web page](http://www.aczoom/itrans/online/)
page.

# No support

Please note that there is no technical help available for this code. This is useful only for developers already familiar with Javascript, Node.js, Browserify, HTML, CSS, Web fonts, and related tools.
