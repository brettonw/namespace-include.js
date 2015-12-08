#! /usr/local/bin/node

// I run this on a mac with Node installed via HomeBrew
var include = require("..");
include ("output.js");

var main = function () {
    stdout.writeln ("Hello World");
}

main ();
