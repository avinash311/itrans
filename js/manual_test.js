'use strict';

// Application entry point, so for all the .js files used by this app, transpile.
// Remove this line once all key browsers handle ES6 (they already do?)
require('babel-polyfill');

/**
THIS IS for manual testing
run using
node manual.js     may need --harmony flag, but seems fine without it.
*/

// Load the itrans converter. This is loaded with the default itrans conversion tables.
const constants = require('./src/constants');
const Itrans = require('./src/Itrans');
const DEFAULT_TSV = require('./data/DEFAULT_TSV');
// Load the default itrans conversion table
const itrans = new Itrans();
itrans.load(DEFAULT_TSV);

let s, o;
s = 'k t{nukta}{}kma kha';
s = '#sanskrit k ## out#telugu_ma ## ee #sanskrit nga',
s = 'k cha` kh a ki tka tkaa OM || #sanskrit {ddha} ma {#telugu} ee k{}ga #grantha ka ## out ##t';
s = '{face-grin}';
s = 't{nukta}kma d_ha ';
s = '#tamils_kha';
s = 'Rri R^i';

o = itrans.convert(s, {language: '#sanskrit', outputFormat: 'UNICODE-NAMES'});
console.log('\n*** Converted Unicode! ' + s + ' = (' + o + ')');

o = itrans.convert(s, {language: '#sanskrit', outputFormat: 'HTML7'});
console.log('\n*** Converted HTML7! ' + s + ' = (' + o + ')');

// o = itrans.convert(s, {language: '#roman', outputFormat: 'HTML7'});
// console.log('\n*** Converted HTML7! ' + s + ' = (' + o + ')');
