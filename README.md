[![(a histogram of downloads)](https://nodei.co/npm-dl/fido2twi.png?height=3)](https://npmjs.org/package/fido2twi)

This application (`fido2twi`) posts headings (“subjects”) of Fidonet messages to Twitter. (Its name is derived from loosely abbreviated words “Fido to Twitter”. It does not imply any endorsement, sponsorship, or association with Twitter.)

In the text of the posted tweet (i.e. of the microblog entry) the Fidonet message's subject is followed by a (space-separated) URL, creating a hyperlink to that message. However, unfortunately, Twitter does not understand the schemes of [FGHI URL](https://github.com/Mithgol/FGHI-URL/) format for Fidonet URLs. Therefore an intermediate web page (containing the necessary FGHI URL and the whole Fidonet message) is automatically generated, and stored in [IPFS](https://ipfs.io/) (the InterPlanetary File System), and then hyperlinked from the tweet.

Currently this application is not designed to send the “extended” version of tweets that has been introduced by Twitter in the announcements “[Coming soon: express even more in 140 characters](https://blog.twitter.com/express-even-more-in-140-characters)” and “[Doing more with 140 characters](https://blog.twitter.com/2016/doing-more-with-140-characters)” in 2016. However, it would not make any difference because IPFS URLs are not eligible to appear in the endings of “extended” tweets anyway.

Currently this application is not designed to send the longer version of tweets that has been introduced by Twitter in the announcement “[Giving you more characters to express yourself](https://blog.twitter.com/official/en_us/topics/product/2017/Giving-you-more-characters-to-express-yourself.html)” in 2017 because that version is still being tested by Twitter (and therefore most microbloggers don't even have any access to it).

## Requirements

* This application (`fido2twi`) is written in JavaScript and requires [Node.js](http://nodejs.org/) to run. Some ECMAScript 2016 features are used, and thus a relatively recent Node.js (version 6.0.0 or newer) is required. The application is tested on the most recent stable version of Node.js v6.

* Сurrently `fido2twi` requires a properly configured (and running) [IPFS](https://ipfs.io/) daemon (such as [`go-ipfs`](https://github.com/ipfs/go-ipfs/) for example) because `fido2twi` uses IPFS as a permanent storage of generated web pages.

* Сurrently `fido2twi` supports only the JAM [(Joaquim-Andrew-Mats)](https://github.com/Mithgol/node-fidonet-jam/blob/master/JAM.txt) type of Fidonet message bases.

* Сurrently `fido2twi` uses [HPT](http://husky.sourceforge.net/hpt.html)'s area configuration file as the description of echomail areas.

* Сurrently `fido2twi` does not create any lock files, it also does not lock the files that it uses. Users themselves have to prevent their echoprocessors (tossers) or mail editors from running when `fido2twi` is active.

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

### An optional dependency

After the installation you may receive an npm warning saying that `node-webcrypto-ossl` (an optional dependency of [JavaScript IPFS API](https://github.com/ipfs/js-ipfs-api)) could not be installed. It happens if you do not have [C++ build tools for Windows](https://github.com/felixrieseberg/windows-build-tools) (or their Linux or macOS counterparts) required to build that dependency on your system, or if such tools are incomplete or outdated.

Ignore the warning. The dependency is optional and IPFS API is able to work without it.

## Configuration steps

It is necessary to configure `fido2twi` before you run it. (For example, you cannot use [`npx`](https://github.com/zkat/npx) to run `npx fido2twi` without having to install `fido2twi` permanently.) You can configure `fido2twi` by performing the following simple steps:

1. Visit https://apps.twitter.com/ and register an application. You may use “fido2twi” as the application's name and https://github.com/Mithgol/node-fido2twi/ as its site. The application must have the default “Read and Write” permissions (“Read only” won't suffice) because it posts messages to Twitter.

2. Create an access token.

3. Copy `example.config` to `fido2twi.config`. Edit `fido2twi.config` to configure `fido2twi`: each line of the configuration contains a name and a (space-separated) value of some configuration option. In the first four lines instead of `XXXXX...` placeholders you should paste the values of `ConsumerKey`, `ConsumerSecret`, `AccessTokenKey`, `AccessTokenSecret` that were assigned by Twitter to your application and token.

4. The `AreasHPT` line should contain the path to your area configuration file of HPT. This setting is necessary for `fido2twi` to know where the echomail resides.
   * The configuration lines for echomail are expected to start with `EchoArea` (literally; not case-sensitive), then a whitespace-separated echotag (such as `Ru.FTN.Develop` for example), then a whitespace-separated full path (without the extensions) to the echomail files of the area, in that order. (A sequence of several whitespaces is also a supported separator.) The rest of the configuration line is also whitespace-separated from the path.
   * Only JAM echomail areas are supported. Names of echo base files are generated by appending lowercase extensions (`.jhr`, `.jdt`, `.jdx`, `.jlr`) to the given path.
   * Examples of the area configuration file of HPT (if you need them) are available in its own CVS repository on SourceForge [in English](http://husky.cvs.sf.net/viewvc/husky/hpt/config/areas) and [in Russian](http://husky.cvs.sf.net/viewvc/husky/hpt/config/areas.ru). Text lines of these examples are commented out (by `#` characters in the lines' beginnings) but your real configuration lines must be uncommented.

5. The `EncodingHPT` line should contain the encoding of non-ASCII characters in the HPT areafile. By default, `utf8` is used. You may use any encoding provided by the [`iconv-lite`](https://github.com/ashtuchkin/iconv-lite) module.

6. The line `IPFS localhost:5001` must contain an address (such as `localhost`) and a port (such as `5001`) of an IPFS daemon's HTTP API. That IPFS daemon is used to publish intermediate webpages that become hyperlinked from Twitter and contain hyperlinks that lead to Fidonet. The default value (`localhost:5001`) implies that the daemon runs locally and uses the default port settings of [`go-ipfs`](https://github.com/ipfs/go-ipfs/).

7. One or several optional `SkipBySubj` lines (such as `SkipBySubj *** Rules` in `example.config`) allow Fidonet messages to be skipped (not posted to Twitter) if their subject line (such as `*** Rules` in this example) matches one of the given `SkipBySubj` settings. (The idea behind the given example is that regularly posted rules of an echomail area are probably not interesting enough to appear in Twitter.) These matches are case-sensitive, but both leading and trailing spaces are stripped from both `SkipBySubj` and the subject before they are compared.
   * The message is also skipped (not posted to Twitter) if it contains a kludge `sourcesite: twitter` (not case-sensitive). Such messages are generated from Twitter timelines and it's not wise to repost them back to Twitter.
   * The message is also skipped (not posted to Twitter) if its sender name (“From:” value) starts with the `@` character. Such senders are likely to be Twitter usernames and it's not wise to repost their messages back to Twitter.

## Using fido2twi

### Posting recent messages from an echomail area

You may run the installed application by typing in the command line:

`fido2twi sourceArea`

It uses the following parameter:

* `sourceArea` — the name (echotag) of an echomail area.

Recent messages are found in that area and then a heading of each message is separately posted as a tweet (a microblog entry) in Twitter.

### Posting an individual message

You may post one individual message by the following command:

`fidotwi sourceArea --msg=filename`

where `sourceArea` is the name (echotag) of an echomail area and `filename` is the full path to a file containing a message from that area. That message becomes posted as a tweet (a microblog entry) in Twitter.

* `SkipBySubj` configuration lines are ignored in this mode and reposts of messages generated from Twitter are also allowed.

* This parameter's format is designed for `fido2twi` to be called (by users) as an external tool from Fidonet editors that can export a message (which is currently being read by an editor's user) and call a tool to process that message (passing the echotag and the message's path in the command line). An example of one such configuration (for the editor family of GoldED and GoldED+ and GoldED-NSF) is given below (in the next subsection).

* Some compatibility of fido2twi with many possible export formats is ensured because fido2twi does not read the Fidonet message from the file (given in `--msg=filename`) before tweeting. Only the message's MSGID is read from that file and subsequently used by fido2twi to look for the original Fidonet message in a JAM message base. Therefore the original message is used and the format of the exported message does not matter as long as it keeps MSGID intact (i.e. does not violate the [FTS-0009.001](http://ftsc.org/docs/fts-0009.001) standard).

#### Launching fido2twi from GoldED

You can configure fido2twi to be used as a poster of Fidonet messages to Twitter that is launched (by a hotkey) from any version of GoldED (for example, from GoldED+ or from GoldED-NSF).

Two lines have to be added to configuration files of GoldED to enable launching of fido2twi.

The first additional line has to be added in the main GoldED's configuration file (usually called `golded.cfg` or `gedcyg.cfg`); this line defines a new external utility (18th in this example).

To launch a global installation of fido2twi, use the following line:

    ExternUtil 18 -Cls -Cursor -Pause fido2twi "@cecho" "--msg=@file"

To launch a local installation of fido2twi, use the following line:

    ExternUtil 18 -Cls -Cursor -Pause node \path\to\fido2twi\fido2twi "@cecho" "--msg=@file"

* Substitute `\path\to\fido2twi` with the real path that leads to fido2twi on your system.

* If not on Windows, `/` instead of `\` is likely to be used in your paths.

* ExternUtil parameter `-Cls` clears the screen, `-Cursor` shows the cursor, `-Pause` waits for a keyboard input before returning to GoldED (and thus fido2twi errors can be read, if any).

The second additional line has to be added in the GoldED's hotkey configuration file (usually `goldkeys.cfg`); this line defines a hotkey for the utility (`Shift+F12` in this example):

    #F12  ExternUtil18

Afterwards press Shift+F12 to launch fido2twi from GoldED. If the message that you view in GoldED has a MSGID (it usually has; see [FTS-0009.001](http://ftsc.org/docs/fts-0009.001) for details), fido2twi posts that message to Twitter; otherwise an error is displayed.

## Contents (and lengths) of tweets

The text of each tweet (each microblog entry) posted by `fido2twi` contains the following elements (in order of appearance):

* **Diskette icon.** Always the character “💾” (Unicode U+1F4BE) followed by a whitespace, 2 characters total.

* **Date.** Always has the form `YYYY-MM-DD` (for example, `2017-07-27`), 10 characters total. **Optional** (see below).

* **Rightwards arrow.** Always the character “➡” (Unicode U+27A1) surrounded by whitespaces, 3 characters total. **Optional** (see below).

* **Areatag of the echomail area.** Its length is not limited. Mid-2017 echolists contain several echomail areas with areatags 23 characters long (for example, `Ru.Pictures.Psevdo.Graf` or `SU.Hardw.PC.Motherboard`). All dots (“.” characters) are replaced by small orange diamonds (“🔸”, Unicode U+1F538) because Twitter understands dot-separated words as domain names.

* **Rightwards arrow.** Always the character “➡” (Unicode U+27A1) surrounded by whitespaces, 3 characters total.

* **Echomail message's title,** also known as **subject.** According to [FTS-0001.016](http://ftsc.org/docs/fts-0001.016) standard of packed messages, the subject's length is never larger than 71 characters (to fit in 72 bytes of a null-terminated string). [Fidonet Unicode substrings](https://github.com/Mithgol/fiunis) are supported (i.e. decoded) in the subject (for example, [emoji](https://en.wikipedia.org/wiki/Emoji) from echomail titles would appear in Twitter). It is possible to use Twitter-specific markup elements ([#keyword hashtags](https://support.twitter.com/articles/49309), [@username mentions](https://support.twitter.com/articles/14023), [$company cashtags](https://support.twitter.com/articles/166337), etc.) in echomail messages' titles, they'll appear in resulting tweets.

* **A whitespace,** 1 character.

* **IPFS URL** of the message. Twitter performs URL shortening of it, mid-2017 shortened URLs are 23 characters long (longer URLs may be generated in the future for the future tweets).

The typical resulting length is 2 + 10 + 3 + 23 + 3 + 71 + 1 + 23 = 136, and thus barely fits in the Twitter's famous limit (140 characters).

If the resulting length exceeds the limit, the text is regenerated without the optional elements (without the date and without the following rightwards arrow), allowing 13 more characters in other elements (larger URLs in the future or larger areatags).

If the regenerated text is still longer than 140 characters, the message's title is cropped until everything fits (including the character “…” that is added after the crop).

This precaution allows echomail areatags to grow significantly larger than 23 characters (for example, in mail lists originating from the Internet though a Fidonet-based gate system) without breaking anything. One such example is an echotag `RU.LIST.CITYCAT.CULTURE.MUSIC.ANNOUNCE.FANTASYNEWS`, 50 characters long, that has been observed in mid-2002; it represented a mail list which (since then) migrated from CityCat to https://subscribe.ru/catalog/culture.music.announce.fantasynews and is said to be closed in 2009.

## Testing fido2twi

[![(build testing status)](https://img.shields.io/travis/Mithgol/node-fido2twi/master.svg?style=plastic)](https://travis-ci.org/Mithgol/node-fido2twi)

It is necessary to install [JSHint](http://jshint.com/) for testing.

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of fido2twi).

After that you may run `npm test` (in the directory of fido2twi). Only the JS code errors are caught; the code's behaviour is not tested.

## See also

The package [`twi2fido`](https://github.com/Mithgol/node-twi2fido) aggregates microblog entries from Twitter and prepares them for being posted to Fidonet. It's a useful counterpart to `fido2twi`.

## License

MIT license (see the `LICENSE` file).
