/**
 * @fileoverview Export the spreadsheet data as a string.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * http://www.aczoom.com/itrans/
 *
 * This module is loaded by the main online itrans program, to get the
 * spreadsheet data that defines the itrans mappings.
 * The file it uses (DEFAULT.tsv) contains the spreadsheet data, and the
 * browserify static asset inliner is used to package this up in a bundle
 * for use in web scripts.
 */

'use strict';

const fs = require('fs');

module.exports = fs.readFileSync(__dirname + '/DEFAULT.tsv', 'utf8');
