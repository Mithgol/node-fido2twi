#!/usr/bin/env node

var cl = require('ciel');
var clog = console.log;

var params = [].concat(process.argv);
params.shift(); // 'node'
params.shift(); // 'twi2fido'

var msgFilePath = null;
params = params.filter(nextParam => {
   if( nextParam.startsWith('--msg=') ){
      msgFilePath = nextParam.slice('--msg='.length);
      if( msgFilePath === '' ){
         cl.fail(`A file's path is not given after "--msg=".`);
         process.exit(1);
      }
      return false;
   }

   return true;
});

if( params.length < 1 ){
   clog('Usage:');
   clog('   fido2twi sourceArea');
   clog('');
   clog('Parameter:');
   clog('');
   clog('sourceArea  -- areatag of an echomail area in Fidonet');
   clog('');
   clog('An optional "--msg=filename" parameter (before or after the above)');
   clog('means that an individual message (contained in the given file)');
   clog('becomes tweeted from the given echomail area.');
   process.exit(1);
}

const sourceArea = params[0];

if( msgFilePath !== null ){
   cl.status(`Posting an individual message from ${sourceArea}...`);
} else cl.status(`Looking in ${sourceArea} for tweets...`);

require('./f2t-core.js')(sourceArea, { msgFilePath: msgFilePath });
