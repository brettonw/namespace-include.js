// ️Bretton Wade 2015.12.07
// brettonw/include.js
// Node.js has a module import system, but sometimes I just want to include another file
// at the global scope...
//
// Usage:
//   require("namespace-include");
//     .addPath ("/usr/local/js")
//     .include ("myfile");

// all of my dependencies, these SHOULD all be built-ins. note that I use the _xxx naming
// convention to avoid polluting my script namespace with these basic words.
var _fs = require ("fs");
var _vm = require ("vm");
var _path = require ("path");
var _url = require ("url");
var _http = require ("http");

// define the Namespace object
var Namespace = function () {
    var $ = Object.create (null);

    // parsePath - internal function to return the leaf directory of <path>
    var parsePath = function (path) {
        return (_fs.statSync (path).isDirectory ()) ? path : _path.parse (path).dir;
    };

    // searchPath - internal function to search for <target> within <path>, using breadth
    //      first recursion, in file sorted order so the first one found wins
    var searchPath = function (path, target) {
        var found = null;

        // search through the file list and queue up directories for later
        var directories = [];
        _fs.readdirSync (path).sort ().some (function (leaf) {
            var leafPath = _path.join (path, leaf);
            if (leaf.toLowerCase () == target) {
                found = leafPath;
            } else if (_fs.statSync (leafPath).isDirectory ()) {
                directories.push (leafPath);
            }
            return (found);
        });

        // if we didn't find it, search through the directories
        if (! found) {
            found = searchPaths (directories, target);
        }

        // return what we got
        return found;
    };

    // searchPaths - internal function to search all the <paths> for <target>
    var searchPaths = function (paths, target) {
        var found = null;

        // walk over all of the paths
        paths.some (function (path) {
            found = searchPath (path, target);
            return (found != null);
        });

        return found;
    };

    // fileExists - internal helper function because the Node.js "fs" package has
    // deprecated the "exists" method, and the "approved" async way of getting stat throws
    // an exception if the file doesn't exist (who is responsible for the API design here?
    // amateur much?)
    var fileExists = function (path) {
        try {
            var stats = _fs.statSync (path);
            return true;
        }
        catch (exc) {
        }
        return false;
    };

    // setVerbose - turn debugging output (to stderr) on or off
    $.setVerbose = function (verbose) {
        if (this.verbose) { process.stderr.write ("setVerbose: " + (verbose ? "true" : "false") + "\n"); }
        this.verbose = verbose;
        if (this.verbose) { process.stderr.write ("setVerbose: " + (verbose ? "true" : "false") + "\n"); }
        return this;
    };

    // setPath - reset the list of search paths to just <path>
    $.setPath = function (path) {
        if (this.verbose) { process.stderr.write ("setPath: " + path + "\n"); }
        this.paths = [ parsePath (path) ];
        return this;
    };

    // addPath - append <path> to the list of search paths
    $.addPath = function (path) {
        if (this.verbose) { process.stderr.write ("addPath: " + path + "\n"); }
        this.paths.push (parsePath (path));
        return this;
    };

    // includeFile - directly run the <name> in the global namespace
    $.includeFile = function (name) {
        if (this.verbose) { process.stderr.write ("includeFile: " + name + "\n"); }
        _vm.runInThisContext(_fs.readFileSync(name));
        return this;
    };

    // includePackage - open a "package" (a directory) at <path> and include the
    //      files within. If there is a namespace-package.json file, it is parsed and
    //      honored, otherwise all .js files at the top level of the package directory
    //      are included
    $.includePackage = function (path) {
        if (this.verbose) { process.stderr.write ("includePackage: " + path + "\n"); }
        var scope = this;
        var package = _path.join (path, "namespace-package.json");
        if (fileExists (package)) {
            try {
                package = JSON.parse(_fs.readFileSync(package, "utf8"));
                if ((package != null) && (package.hasOwnProperty ("files"))) {
                    package.files.forEach (function (leaf) {
                        scope.includeFile (_path.join (path, leaf));
                    });
                }
            } catch (exc) { }
        } else {
            _fs.readdirSync (path).sort ().forEach (function (leaf) {
                if (_path.extname (leaf) == ".js") {
                    scope.includeFile (_path.join (path, leaf));
                }
            });
        }
        return this;
    };

    // include - find <name> within the search paths and include it. if the found entity
    //      is a directory, it is loaded as a package. if no result is found, then <name>
    //      is decorated as a .js file, and the search is repeated
    $.include = function (name) {
        if (this.verbose) { process.stderr.write ("include: " + name + "\n"); }
        // first, find the target using <name> as give. if that fails (and <name> wasn't
        // already a .js file), try looking for <name>.js
        name = name.toLowerCase ();
        var parse = _path.parse (name);
        var found = searchPaths (this.paths, name);
        if ((! found) && (parse.ext != ".js")) {
            found = searchPaths (this.paths, parse.name + ".js");
        }

        // if we found it, include it
        if (found) {
            if (_fs.statSync (found).isDirectory ()) {
                this.includePackage (found);
            } else {
                this.includeFile (found);
            }
        } else {
            process.stderr.write ("Failed to include '" + name + "'\n");
        }
        return this;
    };

    // import - download <url>, and unpack it into the 'namespace-cache' folder at the
    //      root of the execution hierarchy. raw .js files are saved directly, archives
    //      are treated as a package.
    $.import = function (url) {
        if (this.verbose) { process.stderr.write ("import: " + url + "\n"); }

        // check for the cache folder
        var cacheFolderName = _path.join (parsePath (require.main.filename), "namespace-cache");
        if (! fileExists (cacheFolderName)) {
            _fs.mkdirSync(cacheFolderName);
        }

        // take apart the url to get the target name
        var parse = _url.parse (url);
        var name = parse.pathname.split ("/").pop ();
        var path = _path.join (cacheFolderName, name);

        // reassemble the url, using hosts from the lookup list if it's not provided

        // if it's not already cached, try to fetch it (with a busy wait)
        if (! fileExists (path)) {
            require("child_process").spawnSync("node", ["./fetch.js", url, path]);
        }

        // if we got it, include it
        if (fileExists (path)) {
            switch (_path.extname (path)) {
                case ".js" :
                    this.includeFile (path);
                    break;
                case ".tgz" :
                    var cwd = process.cwd ();
                    process.chdir(cacheFolderName);
                    require("child_process").spawnSync("tar", ["xzvf", path]);
                    process.chdir(cwd);
                    path = path.substr (0, path.length - 4);
                    break;
                default:
                    process.stderr.write ("Bogus extname = " + path + " (" + _path.extname (path) + ")");
                    break;
            }

            if (_fs.statSync (path).isDirectory ()) {
                this.includePackage (path);
            } else {
                this.includeFile (path);
            }
        }
        return this;
    };

    // publish - hoist a package to the archive
    $.publish = function () {
    };

    // new - a helper function. you probably don't need this.
    $.new = function () {
        return Object.create (Namespace).setVerbose (false).setPath (require.main.filename);
    };

    return $;
} ();

// and export a usable namespace
module.exports = Namespace.new ();
