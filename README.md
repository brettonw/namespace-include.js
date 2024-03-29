# namespace-include.js for Node.js
Because sometimes you just want to include another Javascript file in the global namespace...

## Hey Rick
I had a friend, a guy I would call up and talk about all manner of technical BS with. His name was Rick, and I knew him for 25 years. He was the smartest person I ever met, and I've been in the room with some of the world's brightest minds so that's no small compliment. Rick passed in June of 2015. This package is dedicated to him, because when I first encountered the way Node.js loads packages, I really wanted to get on the phone and talk it over with him.

## Why do I want to "include" files in my Javascript?
In Javascript, it's very common to use a prototype-based object-oriented programming paradigm. In object-oriented development, it's good practice to split class definitions into separate files. Some languages (such as Java) enforce this split, up to and including the names of the files and directory structure used in the package (I hate that, as a rich class hierarchy is a hornet's nest of directories).

Some of the reasons to encourage splitting code into separate files are to:
- isolate the code and variables that go together,
- keep code file sizes manageable,
- promote code re-use through well abstracted interfaces, and
- hoist commonly used functionality into a single point of entry (thereby minimizing opportunities for errors in replication and reducing effort when updating algorithms).

## Node.js uses "modules"
To facilitate loading of separate class definition files, Node.js drew on the syntax of the perl and python module loading mechanisms. To bring extra code in, you say something like:

    let myModule = require ("importModuleName.js");
    let myResult = myModule.doSomethingInteresting (withInteresting params);

In the module, you say something like:

    let exportThis = function () {
        ...
    }
    module.exports = exportThis;

The mechanism runs your imported module in a separate VM context and returns `module.exports`. The exported object is available through the variable you assigned it to (in this case, `myModule`). Depending on the usage, the net effect is usually similar to a singleton with static methods on it. Think of it like `Math`, where you say something like:

    let y = Math.sin(x);

The primary benefit of this approach is that you avoid polluting the script's global namespace with values from the imported modules.

A very rich ecosystem of modules has been built around the `require` mechanism using a package definition and the `npm` (node package manager), a stand along program that connects to an [online registry at npmjs.com](npmjs.com). Ironically the registry namespace has been flooded with more than 200,000 modules battling over appropriate titles. Every single 2 or 3 letter name you can imagine is taken, and most sensible names have been used for *something*, indicating a need for a better solution.

## What's the problem?
So `require ("xxx")` works, but to put a fine point on it, the paradigm as implemented is pedantic overkill. My criticisms in no particular order are:

- Javascript already supports the desired behavior. It is the exact same thing as writing a function defining an object with an appropriate public interface and then returning that object to the caller.

- Javascript users are not typically that concerned with the dogmatic procedures of software development, rigid typing, concrete data structures, and working in teams. The power of this language lies in its ability to bring up functionality without all that rigor. As a result, building a mechanism that treats scripters as engineers in a defensive programming environment stands out as awkward. This shining example of industry best practice is just a hurdle to normal usage.

- In the years since I first wrote this module full-scale applications have emerged with additional layers of complexity like build systems and automated testing. This would seem to run counter to my second point, but the issue is that objects *are* classes *and* namespaces, the language didn't need a forced format that differed from that. All it actually needed is a simple "include" statement. Note: I have a very similar criticism of Python's import mechanisms. 

- When I include a module, I shouldn't have to define additional variables in my namespace to access them. Most times, these names pollute my namespace anyway. How often do you look at sample code and see something like:

        let path = require ("path"):

    Now you have a global variable called "path". Brilliant. I work around this by using a prefixed underscore (_) naming convention on imports, but you can choose any name you like:

        let _path = require ("path"):

- I shouldn't have to know about what is inside the module in order to bring its parts into my namespace. This thing:

        let myExtra = require ("modulename").extraThing;

- I should be able to make my own decisions about how I use the global namespace in my program. Given the flexibility to define values in the global scope, I could just as easily decide to build objects to manage the namespaces myself, or export as many objects as I want. The counter-argument is that I can still do that with something like:

        let globalObj = ThatModule.thingThatShouldBeGlobal;

  ...so the designer has to modularize code that they wanted to be global in the first place, and then hoist it to the global namespace. This approach requires extra code, which is not the right way to encourage good design.

- Requiring each module to operate in isolation and allowing export of a single object makes building rich class hierarchies difficult. Now I have to keep track of what classes depend on what other classes in my hierarchy and build each one of them with its own set of `require ("xxx")` statements. You might argue this is a good thing, and I'm all for managing dependencies intelligently, but in truth this is extra code that is simply unnecessary (and an extra set of opportunities for error), and now I also have to worry about circular dependencies. This is Javascript, not C++!

- The code I write for a module is not portable (enough), it's specific to Node.js or to my browser without additional build system support. I shouldn't have to use this stilted coding style that introduces the `module` variable into my global context. This kind of defeats the entire point of being able leverage Javascript development skills across the front and back-end. Now I have to do extra work if I want to re-use that code somewhere else. Browsers have added support for modules over the years, though I have not found this to present a seamless transition between Node and Browser platforms. 

- That [rich module ecosystem](npmjs.com) is a ridiculously polluted namespace itself. I really wanted to call this module "include", or "include.js". Truth be told, I looked for something that provided this type of functionality before I wrote it, but what I found was too complex or was riddled with other dependencies (including some requiring compilation).

- `npm` is a standalone tool, so if I forget to run `npm install myPackage` then my program fails.

- `npm` is not universal, so if you want to use that [rich module ecosystem](npmjs.com), but you're on an unsupported platform, then you have to do extra work. In order to use `npm` to publish this module, I am currently using a workflow that bounces between my cygwin environment and a Mac or Linux VM, through GitHub. If you are trying to follow my changelogs, I'm sorry.

- While I'm at it, who at npm decided cygwin is evil? I've been using this toolset for more than 25 years to give me unix-like shell (and portable shell scripts) on Windows systems, and I resent that npm and its legacy eschew it in favor of... I can't think what it's in favor of. It's just...

## The solution
The solution is to expose a simple mechanism for including another Javascript file into the global context. Now you can do all the engineering you want, with re-usable code, and it's *just* Javascript. For this, two basic methods are provided:

### includeFile

    require ("namespace-include")
        .includeFile (<name>);

The method `includeFile` will directly include the javascript file specified in `<name>` into your global context. It doesn't do any kind of search, or validation that the requested file actually exists.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .includeFile ("abc.js")
        .includeFile ("xyz.js");

### includePackage

    require ("namespace-include")
        .includePackage (<path>);

The method `includePackage` will run `includeFile` on the javascript files found in the directory `<path>` (relative to the CWD). It doesn't do any kind of search, but does validate the presence of the path.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .includePackage ("packages/abc")
        .includeFile ("xyz.js");

## But wait, there's more!
Actually, this module does quite a bit more than *just* include files or packages. It allows you to specify search paths, define packages as more than just a directory, and even import files and packages from the web dynamically.

## Searching
### include

    require ("namespace-include")
        .include(<name>);

The method `include` is a helper function for `includeFile` and `includePackage`. It provides search capability in search paths (that you specify through `setPath` or `addPath` - the default is the main program starting directory), and automatically determines whether `<name>` is a file or a package (so you can leave off the ".js" on your file names, because it just looks cleaner to me).

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .include ("abc")
        .include ("def")
        .includeFile ("xyz.js");

### setPath

    require ("namespace-include")
        .setPath(<path>);

The method `setPath` sets the search path for `include` to be *just* <path>.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .setPath ("./mySearchPath")
        .include ("abc");

### addPath

    require ("namespace-include")
        .addPath(<path>);

The method `addPath` appends <path> as an additional search path to the list of search paths for `include`.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .addPath ("/ourCommonSearchPaths")
        .include ("abc");

## All about "packages"
In normal parlance for the module `namespace-include`, a package is just a directory with Javascript files inside it, and the Javascript files are treated in alphabetical order. Subdirectories are not treated.

Sometimes, however, you might want to be a bit more precise. Maybe you are trying to use a git repository as a package, and there are a bunch of files in it that aren't part of the external package you want to present. Maybe you want to control the include order of the files. Maybe you have organized your package into subdirectories.

You can tell `namespace-include` what files to include and in what order by creating a file called `namespace-package.json` inside your package directory. Right now, the package file supports a single entry called `files`, and it should contain an array of filenames, like so:

    { "files" : [ "abc.js", "def.js", "xyz.js" ] }

The `namespace-package.json` file is intended to support future enhancements, so we anticipate various options such as dependency chain management.

## Remote packages

Packages don't need to be resident on the local machine to load them. `namespace-include` provides a set of routines that work with packages found on the web, or at a blessed host location. For now, the blessed location is [namespace-include](namespace-include.azurewebsites.net/package?).

### importUrl

    require ("namespace-include")
        .importUrl(<url>, <force>);

The method `importUrl` fetches <url> and saves the target package to the application root folder `namespace-cache`. The target file must be either a Javascript file (with a ".js" extension), or a gzipped tarball (with a ".tgz" extension).

In the case of a Javascript file, the method creates a package named as the file, and saves the the file into it. In the case of a compressed tarball, the method unpacks the archive into the `namespace-cache` directory. The method then invoked `includePackage` on the target.

This method caches the web resources, so that if the requested file is already present it will not request it again. You can set the optional parameter <force> to `true` in order to force the update to happen. In the future, we may implement an age-out approach.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .importUrl ("http://www.somesite.net/myPackages/abc.js")
        .importUrl ("http://www.somesite.net/myPackages/xyz.tgz")
        .include ("somethingElse");

### import

    require ("namespace-include")
        .import(<name>, <force>);

The method `import` constructs a URL from the blessed host and the target <name>, and invokes `importUrl`. <force> is an optional parameter, and it is passed through to `importUrl`.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .import ("remotePackage")
        .include ("abc");

### setHost

    require ("namespace-include")
        .setHost(<host>);

The method `setHost` designates the blessed host, and root part of the request URL, as <host>.

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .setHost ("http://query.mypackages.com/package?")
        .import ("remotePackageA")
        .import ("remotePackageB");

### clearCache

    require ("namespace-include")
        .clearCache();

The method `clearCache` removes all packages cached by the import process.

### publish

    require ("namespace-include")
        .publish(...);

The method `publish` is still in the design phase, pending a back-end support architecture. We anticipate this will be an important component of a standalone module tool.

(docs in progress)

## Building
