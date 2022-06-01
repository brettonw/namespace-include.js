#! /usr/local/bin/node

// exercise the include code
require("..")
    .setVerbose (true)
    //.clearCache ()
    .include ("output")
    .include ("t1")
    .include ("t2")
    .importUrl ("http://namespace-include.azurewebsites.net/package/abc.js", true)
    .import ("t3");

// test out a few things, like whether or not names defined in the included files correctly
// remained in our context, and whether included files were able to "require" modules
let _path = require ("path");
let path = _path.join (_path.parse (require.main.filename).dir, "t2");
stdout.writeln ("LIST FILES 2");
fs.readdirSync (path).sort ().forEach (function (leaf) {
    stdout.writeln (leaf);
});

// a little black raincloud of course
stdout.writeln ("Hello World");
