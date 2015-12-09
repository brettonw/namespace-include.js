#! /usr/local/bin/node

require("..")
    .setVerbose (true)
    .include ("output")
    .include ("t1")
    .include ("t2");

var main = function () {
    stdout.writeln ("Hello World");
}

main ();
