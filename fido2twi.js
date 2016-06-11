#!/usr/bin/env node

var cl = require('ciel');
var fido2twi = require('./f2t-core.js');
var clog = console.log;

var params = [].concat(process.argv);
params.shift(); // 'node'
params.shift(); // 'twi2fido'

if( params.length < 1 ){
   clog('Usage:');
   clog('   fido2twi sourceArea');
   clog('');
   clog('Parameter:');
   clog('');
   clog('sourceArea  -- areatag of an echomail area in Fidonet');
   process.exit(1);
}

const sourceArea = params[0];

cl.status(`Looking in ${sourceArea} for tweets...`);

fido2twi(sourceArea);
