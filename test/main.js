#! /usr/local/bin/node

require("..")
    .setVerbose (true)
    .include ("output")
    .include ("t1")
    .include ("t2")
    .import ("http://namespace-include.azurewebsites.net/package/abc.js")
    .import ("http://namespace-include.azurewebsites.net/package/t3.tgz");

var main = function () {
    stdout.writeln ("Hello World");
}

main ();
