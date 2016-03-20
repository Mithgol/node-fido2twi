[![(a histogram of downloads)](https://nodei.co/npm-dl/fido2twi.png?height=3)](https://npmjs.org/package/fido2twi)

This application (`fido2twi`) posts Fidonet messages to Twitter. (Its name is derived from loosely abbreviated words “Fido to Twitter”. It does not imply any endorsement, sponsorship, or association with Twitter.)

This application is currently in an early phase of its development and thus does not have the desired level of feature completeness.

## Requirements

* This application (`fido2twi`) is written in JavaScript and requires [Node.js](http://nodejs.org/) to run. Because it uses ECMAScript 2015 features, a relatively recent Node.js (version 4.2.2 or newer) is required. The application is tested on the most recent stable version of Node.js.

* Сurrently `fido2twi` supports only the JAM [(Joaquim-Andrew-Mats)](https://github.com/Mithgol/node-fidonet-jam/blob/master/JAM.txt) type of Fidonet message bases.

* Сurrently `fido2twi` uses [HPT](http://husky.sourceforge.net/hpt.html)'s area configuration file as the description of echomail areas.

* Сurrently `fido2twi` does not create any lock files, not does it lock files in use. Users themselves have to prevent their echoprocessors (tossers) or mail editors from running when `fido2twi` is active.

## Installing fido2twi

[![(npm package version)](https://nodei.co/npm/fido2twi.png?downloads=true&downloadRank=true)](https://npmjs.org/package/fido2twi)

### Installing as a global application

* Latest packaged version: `npm install -g fido2twi`

* Latest githubbed version: `npm install -g https://github.com/Mithgol/node-fido2twi/tarball/master`

The application becomes installed globally and appears in the `PATH`. Then use `fido2twi` command to run the application.

### Installing as a portable application

Instead of the above, download the [ZIP-packed](https://github.com/Mithgol/node-fido2twi/archive/master.zip) source code of the application and unpack it to some directory. Then run `npm install --production` in that directory.

You may now move that directory (for example, on a flash drive) across systems as long as they have the required version of Node.js installed.

Unlike the above (`npm -g`), the application does not appear in the `PATH`, and thus you'll have to run it directly from the application's directory. You'll also have to run `node fido2twi [parameters]` instead of `fido2twi [parameters]`.

## Configuration steps

1. Visit https://apps.twitter.com/ and register an application. You may use “fido2twi” as the application's name and https://github.com/Mithgol/node-fido2twi/ as its site. The application must have the default “Read and Write” permissons (“Read only” won't suffice) because it posts messages to Twitter.

2. Create an access token.

3. Copy `example.config` to `fido2twi.config`. Edit `fido2twi.config` to configure `fido2twi`: each line of the configuration contains a name and a (space-separated) value of some configuration option. In the first four lines instead of `XXXXX...` placeholders you should paste the values of `ConsumerKey`, `ConsumerSecret`, `AccessTokenKey`, `AccessTokenSecret` that were assigned by Twitter to your application and token.

4. The `AreasHPT` line should contain the path to your area configuration file of HPT. This setting is necessary for `fido2twi` to know where the echomail resides.
   * The configuration lines for echomail are expected to start with `EchoArea` (literally; not case-sensitive), then a whitespace-separated echotag (such as `Ru.FTN.Develop` for example), then a whitespace-separated full path (without the extensions) to the echomail files of the area, in that order. (A sequence of several whitespaces is also a supported separator.) The rest of the configuration line is also whitespace-separated from the path.
   * Only JAM echomail areas are supported. Names of echo base files are generated by appending lowercase extensions (`.jhr`, `.jdt`, `.jdx`, `.jlr`) to the given path.
   * Examples of the area configuration file of HPT (if you need them) are available in its own CVS repository on SourceForge [in English](http://husky.cvs.sf.net/viewvc/husky/hpt/config/areas) and [in Russian](http://husky.cvs.sf.net/viewvc/husky/hpt/config/areas.ru). Text lines of these examples are commented out (by `#` characters in the lines' beginnings) but your real configuration lines must be uncommented.

5. The `AreasHPT` line should contain the encoding of non-ASCII characters in the HPT areafile. By default, `utf8` is used. You may use any encoding provided by the [`iconv-lite`](https://github.com/ashtuchkin/iconv-lite) module.

## Testing fido2twi

[![(build testing status)](https://img.shields.io/travis/Mithgol/node-fido2twi/master.svg?style=plastic)](https://travis-ci.org/Mithgol/node-fido2twi)

It is necessary to install [JSHint](http://jshint.com/) for testing.

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of fido2twi).

After that you may run `npm test` (in the directory of fido2twi). Only the JS code errors are caught; the code's behaviour is not tested.

## License

MIT license (see the `LICENSE` file).
