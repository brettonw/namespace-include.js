// ️Bretton Wade 2015.12.07
// Node.js has a module import system, but sometimes I just want to include another file
// at the global scope...
//
// Usage:
//   var include = require("./include");
//   include ("myfile.js");

var fs = require ("fs");
var vm = require ("vm");
var path = require ("path");

var include = function (name) {
    // internal function to search breadth first with recursion for this include, in
    // file sorted order so the first one found wins
    var search = function (where, target) {
        // search through the file list and queue up directories for later
        var files = fs.readdirSync (where).sort ();
        var directories = [];
        for (var i = 0, end = files.length; i < end; ++i) {
            var file = files[i];
            var filePath = path.join (where, file);
            var stats = fs.statSync (filePath);
            if (stats.isDirectory ()) {
                directories.push (filePath);
            } else if (file.toLowerCase () == target) {
                return filePath;
            }
        }

        // ok, so search through the directories
        for (var i = 0, end = directories.length; i < end; ++i) {
            var directory = directories[i];
            var filePath = search (directory, target);
            if (filePath != null) {
                return filePath;
            }
        }

        // just didn't find it
        return null;
    };

    // make sure we are searching for a js file, and the name is canonicalized
    var parse = path.parse (name);
    var found = search (".", parse.name.toLowerCase () + ".js");
    if (found != null) {
        // we found the target file, now run it in the global context
        //process.stderr.write ("Found '" + found + "' for '" + name + "'\n");
        vm.runInThisContext(fs.readFileSync(found));
    } else {
        process.stderr.write ("Failed to include '" + name + "'\n");
    }
};

module.exports = include;
