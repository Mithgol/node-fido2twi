var fs = require('fs');
var path = require('path');
var async = require('async');
var cl = require('ciel');
var fidoconfig = require('fidoconfig');
var JAM = require('fidonet-jam');
var simteconf = require('simteconf');

var maxExports = 20;

var FGHIURL2IPFSURL = (FGHIURL, optsIPFS, optsIPFSURL, callback) => {
   if( optsIPFS === null ) return callback(null, FGHIURL);
   if(! optsIPFSURL ) return callback(null, FGHIURL);

   var escapedURL = escape(FGHIURL);

   var bufFGHIHTML = Buffer(`<html><head><meta charset="utf-8">${ ''
      }<title>FGHI URL</title></head><body>FGHI URL: <a href="${
      escapedURL}">${escapedURL}</a></body></html>`);

   IPFSAPI(
      optsIPFS.host, optsIPFS.port
   ).add(bufFGHIHTML, (err, resultIPFS) => {
      if( err ) return callback(err);
      if( !resultIPFS ) return callback(new Error(
         'Error putting a FGHI URL to IPFS.'
      ));
      if(!( Array.isArray(resultIPFS) )) return callback(new Error(
         'Not an Array received while putting a FGHI URL to IPFS.'
      ));
      if( resultIPFS.length !== 1 ) return callback(new Error(
         'Weird array received while putting a FGHI URL to IPFS.'
      ));
      var hashIPFS = resultIPFS[0].Hash;
      callback(null, `https://ipfs.io/ipfs/${hashIPFS}`);
   });
};

var MSGID2URL = someMSGID => someMSGID.split(
   /([A-Za-z01-9:/]+)/
).map((nextChunk, IDX) => {
   if( IDX % 2 === 0 ) return encodeURIComponent(nextChunk);
   return nextChunk; // captured by the regular expression
}).join('').replace( /%20/g, '+' );

var quitOnAreaError = (err, areaTag) => {
   if( err.notFound ){
      cl.fail(`The area ${areaTag} is not found.`);
   } else if( err.passthrough ){
      cl.fail(`The area ${areaTag} is a passthrough area.`);
   } else cl.fail(`Unknown error reading area ${areaTag}.`);
   process.exit(1);
};

var getLastReadFromFile = filename => {
   try {
      var readData = fs.readFileSync(filename, {encoding: 'utf8'});
      if( /^\s*$/.test(readData) ) return null;
      var parsedData = JSON.parse(readData);
      if(!( Array.isArray(parsedData) )) parsedData = [];
      return parsedData;
   } catch(e) {
      return [];
   }
};

module.exports = (loginName, sourceArea) => {
   var confF2T = simteconf(
      path.resolve(__dirname, 'fido2twi.config'),
      { skipNames: ['//', '#'] }
   );
   // Read HPT areas:
   var areas = fidoconfig.areas(confF2T.last('AreasHPT'), {
      encoding: confF2T.last('EncodingHPT') || 'utf8'
   });

   var lastRead = getLastReadFromFile(
      path.resolve(__dirname, sourceArea + '.lastread.json')
   );

   async.waterfall([
      callback => { // read the path of the given echomail area
         areas.area(sourceArea, (err, areaData) => {
            if( err ) return quitOnAreaError(err, sourceArea);
            return callback(null, areaData.path);
         });
      },
      (areaPath, callback) => { // initialize the echobase, read its index
         var echobase = JAM(areaPath);
         echobase.readJDX(err => {
            if( err ) return callback(err);
            return callback(null, echobase);
         });
      },
      (echobase, callback) => {
         var echosize = echobase.size();
         var msgExports = [];
         if( echosize < 1 ) return callback(null, []);
         var nextMessageNum = echosize;

         async.doUntil(
            exportDone => {
               echobase.readHeader(nextMessageNum, (err, header) => {
                  if( err ) return exportDone(err);
                  nextMessageNum--;

                  var decodedHeader = echobase.decodeHeader(header);
                  if( decodedHeader.kludges.some(
                    aKludge => aKludge.toLowerCase() === 'sourcesite: twitter'
                  ) ) return exportDone(null); // do not re-export to Twitter

                  
               });
            },
            // `true` if should stop exporting:
            () => nextMessageNum < 1 || msgExports.length > maxExports,
            err => {
               if( err ) return callback(err);
               return callback(null, msgExports);
            }
         );
      },
      (msgExports, callback) => { // export to Twitter
      }
   ], err => { // waterfall finished
      if( err ) throw err;
   });
};