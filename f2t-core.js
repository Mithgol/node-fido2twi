var fs = require('fs');
var path = require('path');
var async = require('async');
var cl = require('ciel');
var escape = require('lodash.escape');
var IPFSAPI = require('ipfs-api');
var fidoconfig = require('fidoconfig');
var JAM = require('fidonet-jam');
var simteconf = require('simteconf');
var twitter = require('twitter');

var maxExports = 20;
var twiDelay = 1000 * 60 * 2; // 2 min

var FGHIURL2IPFSURL = (FGHIURL, hostIPFS, portIPFS, callback) => {
   var escapedURL = escape(FGHIURL);

   var bufFGHIHTML = Buffer(`<html><head><meta charset="utf-8">${ ''
      }<title>FGHI URL</title></head><body>FGHI URL: <a href="${
      escapedURL}">${escapedURL}</a></body></html>`);

   IPFSAPI(hostIPFS, portIPFS).add(bufFGHIHTML, (err, resultIPFS) => {
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

var putLastReadToFile = (filename, arrLastRead) => {
   fs.writeFileSync(
      filename,
      JSON.stringify(arrLastRead, null, 3),
      {encoding: 'utf8'}
   );
};

module.exports = sourceArea => {
   var confF2T = simteconf(
      path.resolve(__dirname, 'fido2twi.config'),
      { skipNames: ['//', '#'] }
   );
   // Read skipped lines:
   var SkipBySubj = confF2T.all('SkipBySubj');
   if( SkipBySubj === null ) SkipBySubj = [];
   SkipBySubj = SkipBySubj.map( nextSubj => nextSubj.trim() );
   // Read HPT areas:
   var areas = fidoconfig.areas(confF2T.last('AreasHPT'), {
      encoding: confF2T.last('EncodingHPT') || 'utf8'
   });
   // Read IPFS configuration:
   var hostportIPFS = confF2T.last('IPFS');
   if( hostportIPFS === null ){
      cl.fail('IPFS settings are not found in fido2twi.config.');
      process.exit(1);
   }
   var [hostIPFS, portIPFS] = hostportIPFS.split(':');
   if( typeof portIPFS === 'undefined' ){
      portIPFS = 5001;
      cl.status(
         'IPFS port is not given in fido2twi.config; assuming port 5001.'
      );
   }

   // read an array of FGHI URLs of last read messages:
   var arrLastRead = getLastReadFromFile(
      path.resolve(__dirname, sourceArea + '.lastread.json')
   );

   var twi = new twitter({
      consumer_key:        confF2T.last('ConsumerKey'),
      consumer_secret:     confF2T.last('ConsumerSecret'),
      access_token_key:    confF2T.last('AccessTokenKey'),
      access_token_secret: confF2T.last('AccessTokenSecret')
   });

   cl.status(`Looking in ${sourceArea} for tweets...`);

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
         var lastReadEncountered = false;
         var newLastRead = [];

         // `msgExports` is filled in reverse chronological order
         // `msgExports` would contain (string) message texts for Twitter
         async.doUntil(
            exportDone => {
               echobase.readHeader(nextMessageNum, (err, header) => {
                  if( err ) return exportDone(err);
                  nextMessageNum--;

                  var decoded = echobase.decodeHeader(header);

                  var itemURL = 'area://' + sourceArea;
                  var itemURLFilters = '';

                  if( typeof decoded.msgid !== 'undefined' ){
                     itemURLFilters = [
                        '?msgid=', MSGID2URL(decoded.msgid),
                        '&time=', decoded.origTime[0]
                     ].join('');
                  } else {
                     itemURLFilters = [
                        '?time=',
                        decoded.origTime[0],
                        '-',
                        decoded.origTime[1],
                        '-',
                        decoded.origTime[2],
                        'T',
                        decoded.origTime[3],
                        ':',
                        decoded.origTime[4],
                        ':',
                        decoded.origTime[5]
                     ].join('');
                  }
                  itemURL += itemURLFilters;

                  if( arrLastRead.includes(itemURL) ){
                     lastReadEncountered = true;
                     return exportDone(null); // do not export previously read
                  } else newLastRead.push(itemURL);

                  if(
                     typeof decoded.from === 'string' &&
                     decoded.from.startsWith('@') // probably a Twitter handle
                  ) return exportDone(null); // do not re-export to Twitter

                  if(
                     typeof decoded.subj === 'string' &&
                     SkipBySubj.includes( decoded.subj.trim() )
                  ) return exportDone(null); // skip → do not post to Twitter

                  if(
                     Array.isArray(decoded.kludges) &&
                     decoded.kludges.some(aKludge =>
                        aKludge.toLowerCase() === 'sourcesite: twitter'
                     )
                  ) return exportDone(null); // do not re-export to Twitter

                  var nextText;
                  if( decoded.subj ){
                     nextText = decoded.subj + ' ';
                  } else {
                     nextText = '(without subject) ';
                  }
                  FGHIURL2IPFSURL(
                     itemURL,
                     hostIPFS,
                     portIPFS,
                     (err, IPFSURL) => {
                        if( err ) return exportDone(err);
                        msgExports.push( nextText + IPFSURL );
                        return exportDone(null);
                     }
                  );
               });
            },
            // `true` if should stop exporting:
            () => lastReadEncountered ||
               nextMessageNum < 1 ||
               msgExports.length >= maxExports,
            err => {
               if( err ) return callback(err);
               return callback(null, msgExports, newLastRead);
            }
         );
      },
      (msgExports, newLastRead, finishedExportToTwitter) => {
         var lastIDX = msgExports.length - 1;
         async.forEachOfSeries(
            msgExports.reverse(), // restore chronological order
            (nextMessage, messageIDX, sentToTwitter) => {
               twi.post(
                  'statuses/update',
                  {
                     status: nextMessage
                  },
                  (err /* , tweet, response */) => {
                     if( err ) return sentToTwitter(err);

                     cl.ok(nextMessage);
                     if( messageIDX < lastIDX ){
                        setTimeout(() => {
                           return sentToTwitter(null);
                        }, twiDelay);
                     } else return sentToTwitter(null);
                  }
               );
            },
            err => {
               if( err ) return finishedExportToTwitter(err);

               if(
                  Array.isArray(newLastRead) && newLastRead.length > 1
               ) putLastReadToFile(
                  path.resolve(__dirname, sourceArea + '.lastread.json'),
                  newLastRead
               );

               var numTweets = msgExports.length;
               if( numTweets > 0 ){
                  cl.status(`${numTweets} tweets posted from ${sourceArea}.`);
               } else cl.skip(`No new tweets posted from ${sourceArea}.`);

               return finishedExportToTwitter(null);
            }
         );
      }
   ], err => { // waterfall finished
      if( err ) throw err;
   });
};