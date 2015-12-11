#! /usr/local/bin/node

require("..")
    .setVerbose (true)
    //.clearCache ()
    .include ("output")
    .include ("t1")
    .include ("t2")
    .importUrl ("http://namespace-include.azurewebsites.net/package/abc.js", true)
    .import ("t3");

var main = function () {
    stdout.writeln ("Hello World");
}

main ();
