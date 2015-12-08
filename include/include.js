// ️Bretton Wade 2015.12.07
// Node.js has a module import system, but sometimes I just want to include another file
// at the global scope...
//
// Usage:
//   var include = require("./include");
//   include ("myfile.js");

var fs = require("fs");
var vm = require('vm');

var include = function (filename) {
    // search an include path starting with the current directory and descending
    vm.runInThisContext(fs.readFileSync(filename));
};

module.exports = include;
