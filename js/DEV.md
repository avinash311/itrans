# For developers

How to build this package.

# Pre-requisites

## node and npm

While there are many ways to build and update these Javascript sources, here is what was used to build this package.

This package has been tested with [Node.js](https://nodejs.org/en) v6.9.1 release, any later version will most likely work.
If that package is locally installed, say in a folder called `node-v6.9.1-linux-x64`, then some of the command line programs will be available in there:

`node-v6.9.1-linux-x64/bin/node` - may need to copy or link this to /usr/bin or such so it is in some $PATH folder.

`node-v6.9.1-linux-x64/bin/npm`

On some Linux distributions, an old version of Node.js may be installed. If so, that may need to be uinstalled, otherwise, it may result in strange output from npm invocations.

Assumes at least these versions:

```
    npm --version
    3.10.3

    node --version
    v6.6.0
```

## node modules

In the directory that contains package.json (itrans/js/package.json)
run:

    `npm install`

This will install all the dev dependencies.
Dependencies are listed in the package.json file.

This will also install command line versions of some programs which can be used if needed:

`./node_modules/.bin/browserify`
`./node_modules/.bin/uglifyjs`

Normally, the above programs are run automatically using the `scripts` section of `package.json` by using `npm run browserify` for example.

# Bundle all the code into dist/itrans_bundle.js

The bundled Javascript is what is loaded by the web page.

`npm run browserify`

creates the bundle file and that runs this command:
`browserify browser -t brfs -t babelify --presets es2015 | uglifyjs -v > dist/itrans_bundle.js`

Currently, the main application entry point `browser.js` uses transpiling and loads `babel-polyfill` to handle some of the ES6 constructs used in the Javascript files.
That is why the browserify command uses the babel-preset-es2015 for the conversion to non-ES6 Javascript code.
This does make the bundle size quite large, around 300k.

If the `browser.js` file is edited and this line removed:
`require('babel-polyfill');`
then the same browserify command results in a file size of around 40K.
Eventually, once ES6 is widely available, that can be done and no transpiling would be necessary.

# Updating spreadsheet for customized Javascript package

`data/DEFAULT_TSV.js` is loaded by the Itrans package, and it reads in the spreadsheet from `DEFAULT.tsv` from the same directory.

The `DEFAULT.tsv` can be updated if needed, for local customizations, for example.

Then the Javascript bundle can be created again, and that will include the current contents of `DEFAULT.tsv`.

If needed, the default spreadsheet can be restored by downloading the TSV file.
Default spreadsheet in [TSV format](https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/pub?gid=0&single=true&output=tsv)
and as a [normal spreadsheet](https://docs.google.com/spreadsheets/d/14wZl8zCa4khZV3El2VGoqurKBLGx21mbS-yORi4w7Qo/edit?usp=sharing).

`npm run data`
will update `DEFAULT.tsv` using the default itrans spreadheet at the URL above.

You can create a custom TSV if needed, for loading in your customized Itrans Javascript package. The node script `data/makeData.js` can be used to do that.

```
node makeData.js CUSTOM <your-TSV-file-url  or  local TSV file>
node makeData.js CUSTOM http://....
node makeData.js CUSTOM local_file.tsv.txt

All these commands will create CUSTOM.tsv file, which can be read and loaded into ItransTable.
The files DEFAULT_TSV.js and browser.js show how that is done.
```

# Edit index.html and/or browser.js

`index.html` is an example of how to use the Itrans package. This can be customized as needed.
Depending on what changes are made to this file, the Javascript `browser.js` may also need changes, so look at that file too.

On the web page, one of the common changes would be to change, delete, or add the text boxes for input and output.

The default language, which is used when the input text does not start with a language name (which is the column name in the spreadsheet such as `#sanskrit`), is selected using a drop-down list of languages, and that too can be modifed as needed.
For example, for your custom web page you may wish to restrict to a specific langauge, or even delete the language selector entirely and use some other way to select the default language.

If the text in the input box starts with a language name (such as `#sanskrit`), there is no need to have a default language selector at all, since it will not do anything.

## Edit browser.js

This is the Javascript that is loaded by `index.html`.
Edit this as needed to support your customized version of `index.html` and to load your customized version of the spreadsheet (if you are not using the default).

After any change to the Javascript file, run `npm run browserify` to recreate the `dist/itrans_bundle.js` which is the script loaded in `index.html`.

# Additional external dependencies

ChangeLog is present here: [CHANGES.md](CHANGES.md).

# Additional external dependencies

CSS files used from: [Skeleton](http://getskeleton.com/)

Grantha font file: `Sampradaya.ttf` Possibly from: [Sampradaya](https://github.com/triton/triton/blob/master/pkgs/data/fonts/sampradaya/default.nix)

Modi (Marathi variation) font file: `MarathiCursiveG.ttf` Possibly from: [MarathiCursive](https://github.com/MihailJP/MarathiCursive)
