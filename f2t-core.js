var path = require('path');
var simteconf = require('simteconf');

module.exports = () => {
   var confF2T = simteconf(
      path.resolve(__dirname, 'fido2twi.config'),
      { skipNames: ['//', '#'] }
   );
   // Read HPT areas:
   var encodingHPT = confF2T.last('EncodingHPT') || 'utf8';
   var areasHPT = simteconf(confF2T.last('AreasHPT'), {
      encoding: encodingHPT,
      skipNames: ['#'],
      lowercase: false,
      prefixGroups: [
         'NetmailArea',
         'BadArea',
         'DupeArea',
         'LocalArea',
         'EchoArea'
      ]
   });
};