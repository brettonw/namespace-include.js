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
var _getSync = require ("get-sync");
var _cp = require ("child_process");

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
        if ((leaf != ".") && (leaf != "..")) {
            if (leaf.toLowerCase () == target) {
                found = leafPath;
            } else if (_fs.statSync (leafPath).isDirectory ()) {
                directories.push (leafPath);
            }
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

// ensureDirectory - internal helper function because I always have to do the same operation
var ensureDirectory = function (path) {
    if (! fileExists (path)) { _fs.mkdirSync(path); }
}

// removeDirectory - internal helper to recursively remove a folder
var removeDirectory = function (path) {
    var list = _fs.readdirSync (path);
    for (var i = 0, end = list.length; i < end; i++) {
        var leaf = list[i];
        if ((leaf != ".") && (leaf != "..")) {
        var leafPath = _path.join (path, leaf);
            if (_fs.statSync(leafPath).isDirectory()) {
                removeDirectory(leafPath);
            } else {
                _fs.unlinkSync(leafPath);
            }
        }
    }
    _fs.rmdirSync(path);
};

// fetchIf - an internal helper function to synchronously fetch a file from <url> and
// save it to <path>, if it's not already there
var fetchIf = function (url, path) {
    // if it's not already cached, try to fetch it - I launch this as a child process
    // (sync) to ensure sequential operation without forcing the end user to respond
    // to my callback, and without adding ridiculous dependencies. Ah, the joys of
    // API design.
    if (! fileExists (path)) {  _getSync (url, path); }
}

// define the Namespace object
var Namespace = function () {
    var $ = Object.create (null);

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
        if (fileExists (path)) {
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
        } else {
            process.stderr.write ("includePackage '" + path + "' does not exist\n");
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
        var found = searchPaths (this.paths, name);
        var parse = _path.parse (name);
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

    // importUrl - download a package from <url> and unpack it into the namespace-cache
    $.importUrl = function (url) {
        if (this.verbose) { process.stderr.write ("importUrl: " + url + "\n"); }

        // take apart the url to get the target name, and the end package name. regardless
        // of whether the import target is a raw file or a compressed package, we import
        // it as a package folder
        var parse = _url.parse (url);
        var name = parse.pathname.split ("/").pop ();
        var ext = _path.extname (name).toLowerCase ();
        var path = _path.join (this.cacheFolderName, name);
        var package = path.substr (0, path.length - ext.length);

        // depending on the url target, we have to configure the result differently
        switch (ext) {
            case ".js": {
                ensureDirectory (package);
                path = _path.join (package, name);
                fetchIf (url, path);
                break;
            }
            case ".tgz": {
                fetchIf (url, path);
                if (! fileExists (package)) {
                    var cwd = process.cwd ();
                    process.chdir(this.cacheFolderName);
                    _cp.spawnSync("tar", ["xzvf", path]);
                    process.chdir(cwd);
                }
                break;
            }
            default: {
                process.stderr.write ("Bogus extension = " + path + " (" + _path.extname (path) + ")");
                break;
            }
        }

        // and finally, if we have everything we need, include it like normal
        this.includePackage (package);
        return this;
    };


    // setHost - use <host> as the default download site for importing packages
    $.setHost = function (host) {
        if (this.verbose) { process.stderr.write ("setHost: " + host + "\n"); }
        this.host = host;
        return this;
    }

    // import - this is a convenience method to make import calls look cleaner. it will
    //      download <name> from the host and unpack it as a normal URL import. packages
    //      from the host must be .tgz files
    $.import = function (name) {
        if (this.verbose) { process.stderr.write ("import: " + name + "\n"); }

        // use the name to make the url and target path
        name = name.toLowerCase ();
        var parse = _path.parse (name);
        name = (parse.ext == ".tgz") ? name.substr (0, name.length - parse.ext.length) : name;
        var url = this.host + name + ".tgz";

        // try to import the url
        return this.importUrl (url);
    };

    // publish - hoist a package to the archive
    $.publish = function () {
        // take a target - directory or js file, tar and gzip it, push it to the host
    };

    // clearCache - empty out the cached imports
    $.clearCache = function () {
        if (this.verbose) { process.stderr.write ("clearCache\n"); }
        removeDirectory (this.cacheFolderName);
        ensureDirectory (this.cacheFolderName);
        return this;
    };

    // new - a helper function. you probably don't need this.
    $.new = function () {
        // check for the cache folder
        this.cacheFolderName = _path.join (parsePath (require.main.filename), "namespace-cache");
        ensureDirectory (this.cacheFolderName);

        return Object.create (Namespace)
            .setVerbose (false)
            .setPath (require.main.filename)
            .setHost ("http://namespace-include.azurewebsites.net/package/");
    };

    return $;
} ();

// and export a usable namespace
module.exports = Namespace.new ();
