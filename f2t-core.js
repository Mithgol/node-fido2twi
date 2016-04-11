var fs = require('fs');
var path = require('path');
var fidoconfig = require('fidoconfig');
var simteconf = require('simteconf');

var getLastReadFromFile = filename => {
   try {
      var readData = fs.readFileSync(filename, {encoding: 'utf8'});
      if( /^\s*$/.test(readData) ) return null;
      return JSON.parse(readData);
   } catch(e) {
      return null;
   }
};

module.exports = () => {
   var confF2T = simteconf(
      path.resolve(__dirname, 'fido2twi.config'),
      { skipNames: ['//', '#'] }
   );
   // Read HPT areas:
   var areas = fidoconfig.areas(confF2T.last('AreasHPT'), {
      encoding: confF2T.last('EncodingHPT') || 'utf8'
   });
};