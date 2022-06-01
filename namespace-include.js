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
let _fs = require ("fs");
let _vm = require ("vm");
let _path = require ("path");
let _url = require ("url");
let _http = require ("http");
let _getSync = require ("get-sync");
let _cp = require ("child_process");

// INTERNAL FUNCTIONS

// searchPath - internal function to search for <target> within <path>, using breadth
//      first recursion, in file sorted order so the first one found wins
let searchPath = function (path, target) {
    let found = null;

    // search through the file list and queue up directories for later
    let directories = [];
    _fs.readdirSync (path).sort ().some (function (leaf) {
        let leafPath = _path.join (path, leaf);
        if (leaf.toLowerCase () === target) {
            found = leafPath;
        } else if (_fs.statSync (leafPath).isDirectory ()) {
            directories.push (leafPath);
        }
        return (found);
    });

    // if we didn't find it, search through the directories
    if ((! found) && (directories.length > 0)) {
        found = searchPaths (directories, target);
    }

    // return what we got
    return found;
};

// searchPaths - internal function to search all the <paths> for <target>
let searchPaths = function (paths, target) {
    let found = null;

    // walk over all the paths
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
let fileExists = function (path) {
    try {
        _fs.statSync (path);
        return true;
    }
    catch (exc) {
    }
    return false;
};

// ensureDirectory - internal helper function because I always have to do the same operation
let ensureDirectory = function (path) {
    if (! fileExists (path)) { _fs.mkdirSync(path); }
}

// removeDirectory - internal helper to recursively remove a folder
let removeDirectory = function (path) {
    _fs.readdirSync (path).sort ().forEach (function (leaf) {
        let leafPath = _path.join (path, leaf);
        if (_fs.statSync(leafPath).isDirectory()) {
            removeDirectory(leafPath);
        } else {
            _fs.unlinkSync(leafPath);
        }
    });
    _fs.rmdirSync(path);
};

// fetchIf - an internal helper function to synchronously fetch a file from <url> and
// save it to <path>, if it's not already there (or <force> is true)
let fetchIf = function (url, path, force) {
    // if it's not already cached, try to fetch it - I launch this as a child process
    // (sync) to ensure sequential operation without forcing the end user to respond
    // to my callback, and without adding ridiculous dependencies. Ah, the joys of
    // API design.
    if (force && fileExists (path)) {
        _fs.unlinkSync(path);
    }
    if (! fileExists (path)) {
        _getSync (url, path);
    }
}

// NAMESPACE

// define the Namespace object
let Namespace = function () {
    let $ = Object.create (null);

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
        this.paths = [ path ];
        return this;
    };

    // addPath - append <path> to the list of search paths
    $.addPath = function (path) {
        if (this.verbose) { process.stderr.write ("addPath: " + path + "\n"); }
        this.paths.push (path);
        return this;
    };

    // includeFile - directly run the <name> in the global namespace
    $.includeFile = function (name) {
        if (this.verbose) { process.stderr.write ("includeFile: " + name + "\n"); }
        _vm.runInThisContext(_fs.readFileSync(name, {encoding: "utf-8"}));
        return this;
    };

    // includePackage - open a "package" (a directory) at <path> and include the
    //      files within. If there is a namespace-package.json file, it is parsed and
    //      honored, otherwise all .js files at the top level of the package directory
    //      are included
    $.includePackage = function (path) {
        if (this.verbose) { process.stderr.write ("includePackage: " + path + "\n"); }
        if (fileExists (path)) {
            let scope = this;
            let packageFile = _path.join (path, "namespace-package.json");
            if (fileExists (packageFile)) {
                try {
                    let packageObject = JSON.parse(_fs.readFileSync(packageFile, "utf8"));
                    if ((packageObject != null) && (packageObject.hasOwnProperty ("files"))) {
                        for (let leaf of packageObject.files) {
                            this.includeFile (_path.join (path, leaf));
                        }
                    }
                } catch (exc) { }
            } else {
                // the javascript files are treated in sorted order
                _fs.readdirSync (path).sort ().forEach (leaf => {
                    if (_path.extname (leaf) === ".js") {
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

        // first, find the target using <name> as given. if that fails (and <name> wasn't
        // already a .js file), try looking for <name>.js
        name = name.toLowerCase ();
        let found = searchPaths (this.paths, name);
        let parse = _path.parse (name);
        if ((! found) && (parse.ext !== ".js")) {
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
    //      downloads are skipped if the package is already present in the cache, unless
    //      the optional parameter <force> is true
    $.importUrl = function (url, force) {
        if (force === undefined) { force = false; }
        if (this.verbose) { process.stderr.write ("importUrl: " + url + ", force: " + (force ? "true" : "false") + "\n"); }

        ensureDirectory (this.cacheFolderName);

        // take apart the url to get the target name, and the end package name. regardless
        // of whether the import target is a raw file or a compressed package, we import
        // it as a package folder
        let parse = new URL (url);// _url.parse (url);
        let name = parse.pathname.split ("/").pop ();
        let ext = _path.extname (name).toLowerCase ();
        let path = _path.join (this.cacheFolderName, name);
        let packageFolder = path.substring (0, path.length - ext.length);

        // depending on the url target, we have to configure the result differently
        switch (ext) {
            case ".js": {
                ensureDirectory (packageFolder);
                path = _path.join (packageFolder, name);
                fetchIf (url, path, force);
                break;
            }
            case ".tgz": {
                fetchIf (url, path, force);
                if (force && fileExists (packageFolder)) {
                    removeDirectory (packageFolder);
                }
                if (! fileExists (packageFolder)) {
                    let cwd = process.cwd ();
                    process.chdir(this.cacheFolderName);
                    let options = this.verbose ? { stdio: ["ignore", 1, 2] } : null;
                    _cp.spawnSync("tar", ["xvf", path], options);
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
        this.includePackage (packageFolder);
        return this;
    };


    // setHost - use <host> as the default download site for importing packages
    $.setHost = function (host) {
        if (this.verbose) { process.stderr.write ("setHost: " + host + "\n"); }
        this.host = host;
        return this;
    }

    // import - this is a convenience method to make import calls look cleaner. it will
    //      download <name> from the host and unpack it as a normal URL import. download
    //      will be skipped if the package is already present, unless <force> is true.
    //      packages from the host must be .tgz files
    $.import = function (name, force) {
        if (force === undefined) { force = false; }
        if (this.verbose) { process.stderr.write ("import: " + name + "\n"); }

        // use the name to make the url and target path
        name = name.toLowerCase ();
        let parse = _path.parse (name);
        name = (parse.ext === ".tgz") ? name.substring (0, name.length - parse.ext.length) : name;
        let url = this.host + name + ".tgz";

        // try to import the url
        return this.importUrl (url, force);
    };

    // clearCache - empty out the cached imports
    $.clearCache = function () {
        if (this.verbose) { process.stderr.write ("clearCache\n"); }
        removeDirectory (this.cacheFolderName);
        ensureDirectory (this.cacheFolderName);
        return this;
    };

    // publish - hoist a package to the archive
    $.publish = function () {
        // take a target - directory or js file, tar and gzip it, push it to the host
    };

    // new - a helper function. you probably don't need this.
    $.new = function () {
        // create the cache folder name
        this.cacheFolderName = _path.join (_path.parse (require.main.filename).dir, "namespace-cache");

        // create the namespace and set the defaults
        return Object.create (Namespace)
            .setVerbose (false)
            .setPath (_path.parse (require.main.filename).dir)
            .setHost ("https://namespace-include.azurewebsites.net/package/");
    };

    return $;
} ();

// and export a usable namespace
module.exports = Namespace.new ();

// in order to let "included" files use the "require" mechanism, I have to hoist the name
// into the global space. this doesn't seem to cause any problems in my testing so far
global.require = module.require;
