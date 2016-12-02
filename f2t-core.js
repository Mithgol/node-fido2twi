/* jshint -W052 */ // work around https://github.com/jshint/jshint/issues/3067

var fs = require('fs');
var path = require('path');
var async = require('async');
var cl = require('ciel');
var fidoconfig = require('fidoconfig');
var FidoMail2IPFS = require('fidomail2ipfs');
var fiunis = require('fiunis');
var IPFSAPI = require('ipfs-api');
var JAM = require('fidonet-jam');
var simteconf = require('simteconf');
var twitter = require('twitter');
var UUE2IPFS = require('uue2ipfs');

var maxExports = 20;
var twiDelay = 1000 * 60 * 2; // 2 min
var csspxAvatarWidth = 140;

var MSGID4URL = someMSGID => someMSGID.split(
   /([A-Za-z01-9:/]+)/   // ← these characters are already fine
).map((nextChunk, IDX) => {
   if( IDX % 2 === 0 ) return encodeURIComponent(nextChunk);
   return nextChunk; // captured by the regular expression → is fine “as is”
}).join('').replace( /%20/g, '+' );

var generateMessageFGHIURL = (areatag, MSGID, origTime) => {
   var URLFilters = '';

   if( typeof MSGID !== 'undefined' ){
      URLFilters = [
         '?msgid=', MSGID4URL(MSGID),
         '&time=', origTime[0] // just the year
      ].join('');
   } else URLFilters = [
      '?time=',
      origTime[0],
      '-',
      origTime[1],
      '-',
      origTime[2],
      'T',
      origTime[3],
      ':',
      origTime[4],
      ':',
      origTime[5]
   ].join('');

   return 'area://' + areatag + URLFilters;
};

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

var putLastReadToFile = (filename, arrLastRead) => fs.writeFileSync(
   filename,
   JSON.stringify(arrLastRead, null, 3),
   {encoding: 'utf8'}
);

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

   async.waterfall([
      // read the path of the given echomail area
      callback => areas.area(sourceArea, (err, areaData) => {
         if( err ) return quitOnAreaError(err, sourceArea);
         return callback(null, areaData.path);
      }),
      (areaPath, callback) => { // initialize the echobase, read its index
         var echobase = JAM(areaPath);
         echobase.readJDX( err => callback(err, echobase) );
      },
      (echobase, callback) => { // get the username in Twitter
         twi.get(
            'account/verify_credentials',
            {
               include_entities: false,
               skip_status: true,
               include_email: false
            },
            (err, credentials) => {
               if( err ) return callback(err);
               if(
                  typeof credentials.screen_name !== 'string' ||
                  credentials.screen_name.length < 1
               ) return callback(
                  new Error('Invalid `screen_name` credentials.')
               );

               cl.ok(`Successfully verified credentials of @${
               credentials.screen_name}.`);
               return callback(null, {
                  twiUsername: credentials.screen_name,
                  echobase: echobase
               });
            }
         );
      },
      (wrappedData, callback) => { // get the configuration of Twitter
         twi.get(
            'help/configuration',
            (err, twiConfig) => {
               if( err ) return callback(err);
               if(
                  typeof twiConfig.short_url_length_https !== 'number' ||
                  twiConfig.short_url_length_https < 2
               ) return callback(new Error(
                  "Abnormal Twitter's `short_url_length_https` configuration."
               ));

               cl.ok(`Read Twitter's configuration. HTTPS short URLs are ${
               twiConfig.short_url_length_https} characters long.`);
               wrappedData.textLimit = 139 - twiConfig.short_url_length_https;
               return callback(null, wrappedData);
            }
         );
      },
      (wrappedData, callback) => {//generate an array of tweet texts
         var echobase = wrappedData.echobase;
         var echosize = echobase.size();
         if( echosize < 1 ) return callback(null, []);

         var msgExports = [];
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

                  var itemFGHIURL = generateMessageFGHIURL(
                     sourceArea, decoded.msgid, decoded.origTime
                  );

                  // header and URL are enough to decide if an export happens

                  if( arrLastRead.includes(itemFGHIURL) ){
                     lastReadEncountered = true;
                     return exportDone(null); // do not export previously read
                  } else newLastRead.push(itemFGHIURL);

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

                  // now it's decided that an export should happen

                  var tweetText = '\u{1f4be} ' + sourceArea.replace(
                    /\./g, '\u{1f538}'
                  ) + ' → ';
                  // now `tweetText` ends with a space
                  if( decoded.subj ){
                     tweetText += fiunis.decode( decoded.subj );
                  } else tweetText += '(Fidonet message without a subject)';
                  // now `tweetText` does not end with a space
                  if( tweetText.length > wrappedData.textLimit ){
                     tweetText = tweetText.slice(
                        0, wrappedData.textLimit - 1
                     ) + '…';
                  }

                  async.waterfall([
                     // message's text decoding:
                     callback => echobase.decodeMessage(header, callback),
                     // search for the message's original address and avatar:
                     (messageText, callback) => echobase.getOrigAddr(
                        header,
                        (origErr, origAddr) => {
                           if( origErr ) return callback(origErr);

                           var avatarsList = echobase.getAvatarsForHeader(
                              header, ['https', 'http'], {
                                 size: csspxAvatarWidth * 2, //retina pixels
                                 origAddr: origAddr
                           });
                           if( avatarsList.length < 1 ) avatarsList = [
                              'https://secure.gravatar.com/avatar/?f=y&d=mm' +
                              '&s=' + ( csspxAvatarWidth * 2 ) //retina pixels
                           ];

                           return callback(null, {
                              messageText: messageText,
                              origAddr: origAddr,
                              avatarURL: avatarsList[0]
                           });
                        }
                     ),
                     // got `messageText` and `origAddr` and avatar; storing…
                     (wrapped, callback) => UUE2IPFS.UUE2IPFS(
                        wrapped.messageText,
                        (fileData, fileDone) => fileDone(null,
                           [
                              '![(',
                              fileData.name.replace(/]/g, '\\]'),
                              ')](fs:/ipfs/', fileData.hash, ')'
                           ].join('')
                        ),
                        {
                           API: IPFSAPI(hostIPFS, portIPFS),
                           filterMIME: UUE2IPFS.imgMIME()
                        },
                        (err, convertedText) => {
                           if( err ) return callback(err);

                           FidoMail2IPFS(
                              {
                                 server: hostIPFS,
                                 port: portIPFS,
                                 messageText: convertedText,
                                 avatarWidth: csspxAvatarWidth,
                                 avatarURL: wrapped.avatarURL,
                                 from: decoded.from || '',
                                 origAddr: wrapped.origAddr,
                                 to: decoded.to || '',
                                 origTime: decoded.origTime,
                                 procTime: decoded.procTime,
                                 subj: decoded.subj ?
                                    fiunis.decode( decoded.subj ) : '',
                                 URL: itemFGHIURL,
                                 twitterUser: wrappedData.twiUsername
                              },
                              (err, IPFSURL) => {
                                 if( err ) return callback(err);
                                 msgExports.push( tweetText + ' ' + IPFSURL );
                                 return callback(null);
                              }
                           );
                        }
                     )
                  ], exportDone); // `exportDone` receives an error or null
               });
            },
            // `true` if should stop exporting:
            () => lastReadEncountered ||
               nextMessageNum < 1 ||
               msgExports.length >= maxExports,
            err => callback(err, msgExports, newLastRead)
         );
      },
      (msgExports, newLastRead, finishedExportToTwitter) => {
         var lastIDX = msgExports.length - 1;
         async.eachOfSeries(
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
                  Array.isArray(newLastRead) && newLastRead.length > 0
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