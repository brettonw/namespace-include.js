#! /usr/local/bin/node

// exercise the include code
require("..").bootstrap ();
_namespace.setVerbose (true);
//_namespace..clearCache ();
_include ("output");
_include ("t1");
_include ("t2");
_namespace.importUrl ("http://namespace-include.azurewebsites.net/package/abc.js", true);
_import ("t3");

// test out a few things, like whether or not names defined in the included files correctly
// remained in our context, and whether included files were able to "require" modules
var _path = require ("path");
var path = _path.join (_path.parse (require.main.filename).dir, "t2");
stdout.writeln ("LIST FILES 2");
fs.readdirSync (path).sort ().forEach (function (leaf) {
    stdout.writeln (leaf);
});

// a little black raincloud of course
stdout.writeln ("Hello World");
