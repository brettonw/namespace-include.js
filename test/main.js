#! /usr/local/bin/node

require("..")
    .include ("output.js");

var main = function () {
    stdout.writeln ("Hello World");
}

main ();
