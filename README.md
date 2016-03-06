[![(a histogram of downloads)](https://nodei.co/npm-dl/fido2twi.png?height=3)](https://npmjs.org/package/fido2twi)

This application (`fido2twi`) post Fidonet messages to Twitter. (Its name is derived from loosely abbreviated words “Fido to Twitter”.)

This application is written in JavaScript and requires [Node.js](http://nodejs.org/) to run. Because it uses ECMAScript 2015 features, a relatively recent Node.js (version 4.2.2 or newer) is required.

This application is currently in an early phase of its development and thus does not have the desired level of feature completeness.

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

## License

MIT license (see the `LICENSE` file).
