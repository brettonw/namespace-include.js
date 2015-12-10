#! /usr/local/bin/node

require("..")
    .setVerbose (true)
    .include ("output")
    .include ("t1")
    .include ("t2")
    .import ("http://namespace-include.azurewebsites.net/abc.js")
    .import ("http://namespace-include.azurewebsites.net/t3.tgz");

var main = function () {
    stdout.writeln ("Hello World");
}

main ();
