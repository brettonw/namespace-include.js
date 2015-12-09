// ️Bretton Wade 2015.12.07
// brettonw/include.js
// Node.js has a module import system, but sometimes I just want to include another file
// at the global scope...
//
// Usage:
//   var include = require("namespace-include");
//   include ("myfile");
//   include ("myfile.js");

var _fs = require ("fs");
var _vm = require ("vm");
var _path = require ("path");

var Namespace = function () {
    var $ = Object.create (null);

    var parsePath = function (path) {
        return (_fs.statSync (path).isDirectory ()) ? path : _path.parse (path).dir;
    };

    $.setPath = function (path) {
        this.paths = [ parsePath (path) ];
        return this;
    };

    $.addPath = function (path) {
        this.paths.push (parsePath (path));
        return this;
    };

    $.include = function (name) {
        // internal function to search breadth first with recursion for this name, in
        // file sorted order so the first one found wins
        var searchPath = function (where, target) {
            var found = null;

            // search through the file list and queue up directories for later
            var files = _fs.readdirSync (where).sort ();
            var directories = [];
            files.some (function (file) {
                var filePath = _path.join (where, file);
                if (file.toLowerCase () == target) {
                    found = filePath;
                } else if (_fs.statSync (filePath).isDirectory ()) {
                    directories.push (filePath);
                }
                return (found);
            });

            // if we didn't find it, search through the directories
            if (! found) {
                directories.some (function (filePath) {
                    found = searchPath (filePath, target);
                    return (found != null);
                });
            }

            // return what we got
            return found;
        };

        // internal function to search all of the paths in an array
        var searchPaths = function (paths, target) {
            var found = null;

            // walk over all of the paths
            paths.some (function (path) {
                found = searchPath (path, target);
                return (found != null);
            });

            return found;
        };

        // make sure we are searching for a js file, and the name is canonicalized
        var parse = _path.parse (name);
        var found = searchPaths (this.paths, parse.name.toLowerCase () + ".js");
        if (found) {
            // we found the target file, now run it in the global context
            //process.stderr.write ("Found '" + found + "' for '" + name + "'\n");
            _vm.runInThisContext(_fs.readFileSync(found));
        } else {
            process.stderr.write ("Failed to include '" + name + "'\n");
        }
        return this;
    };

    $.new = function () {
        return Object.create (Namespace).setPath (require.main.filename);
    }

    return $;
} ();


module.exports = Namespace.new ();
