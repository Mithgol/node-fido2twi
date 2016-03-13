#!/usr/bin/env node

var fido2twi = require('./f2t-core.js');

var params = [].concat(process.argv);
params.shift(); // 'node'
params.shift(); // 'twi2fido'

console.log( fido2twi() );
