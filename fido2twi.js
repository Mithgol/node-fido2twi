#!/usr/bin/env node

var fido2twi = require('./f2t-core.js');
var clog = console.log;

var params = [].concat(process.argv);
params.shift(); // 'node'
params.shift(); // 'twi2fido'

if( params.length < 2 ){
   clog('Usage:');
   clog('   fido2twi loginName sourceArea');
   clog('');
   clog('Parameters:');
   clog('');
   clog('loginName   -- login name (screen name) of a microblog in Twitter');
   clog('');
   clog('sourceArea  -- areatag of an echomail area in Fidonet');
   process.exit(1);
}

const loginName  = params[0];
const sourceArea = params[1];

console.log( fido2twi(loginName, sourceArea) );
