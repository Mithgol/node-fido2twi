var fs = require('fs');
var path = require('path');
var async = require('async');
var cl = require('ciel');
var fidoconfig = require('fidoconfig');
var JAM = require('fidonet-jam');
var simteconf = require('simteconf');

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
      callback => {
         areas.area(sourceArea, (err, areaData) => {
            if( err ) return quitOnAreaError(err, sourceArea);
            return callback(null, areaData.path);
         });
      },
      (areaPath, callback) => {
         var echobase = JAM(areaPath);
         echobase.readJDX(err => {
            if( err ) return callback(err);
            return callback(null, echobase);
         });
      },
      (echobase, callback) => {
         
      }
   ], function waterfallFinished(err){
      if( err ) throw err;
   });
};