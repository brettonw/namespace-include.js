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
To facilitate loading of separate class definition files, Node.js copied the syntax of the perl module loading mechanism (but not the behavior). To bring extra code in, you say something like:

    var myModule = require ("importModuleName.js");
    var myResult = myModule.doSomethingInteresting (withInteresting params);

In the module, you say something like:

    var exportThis = function () {
        ...
    }
    module.exports = exportThis;

The mechanism runs your imported module in a separate VM context and returns `module.exports`. The exported object is available through the variable you assigned it to (in this case, `myModule`). Depending on the usage, the net effect is usually similar to a singleton with static methods on it (think of it like `Math`, where you say something like:

    var y = Math.sin(x);

The primary benefit of this approach is that you avoid polluting the script's global namespace with values from the imported modules. 

A very rich ecosystem of modules has been built around the `require` mechanism using a package definition and the `npm` (node package manager), a stand along program that connects to an [online registry at npmjs.com](npmjs.com). Ironically the registry namespace has been flooded with more than 200,000 modules battling over appropriate titles. Every single 2 or 3 letter name you can imagine is taken, and most sensible names have been used for *something*, indicating a need for a better solution.

## What's the problem?
So `require ("xxx")` works, but to put a fine point on it, the paradigm as implemented is pedantic overkill in an environment that otherwise just doesn't have that much rigor (or need for it). My criticisms in no particular order are:

- Javascript users are not typically that concerned with the dogmatic procedures of software development in teams, so building a mechanism that treats scripters as engineers in a defensive programming environment stands out as awkward. This shining example of industry best practice is just a hurdle to normal usage.

- When I include a module, I shouldn't have to define additional variables in my namespace to access them. Most times, these names pollute my namespace anyway. How often do you look at sample code and see something like:

        var path = require ("path"):
        
    Now you have a global variable called "path". Brilliant. I work around this by using a prefixed underscore (_) naming convention on imports, but you can choose any name you like:
    
        var _path = require ("path"):

- I shouldn't have to know about what is inside the module in order to bring its parts into my namespace. This thing:

        var myExtra = require ("modulename").extraThing;
    
- I should be able to make my own decisions about how I use the global namespace in my program. Given the flexibility to define values in the global scope, I could just as easily decide to build objects to manage the namespaces myself, or export as many objects as I want.

- Requiring each module to operate in isolation and allowing export of a single object makes building rich class hierarchies difficult. Now I have to keep track of what classes depend on what other classes in my hierarchy and build each one of them with its own set of `require ("xxx")` statements. You might argue this is a good thing, and I'm all for managing dependencies intelligently, but in truth this is extra code that is simply unnecessary (and an extra set of opportunities for error), and now I also have to worry about circular dependencies. This is Javascript, not C++!

- The code I write for a module is not portable, it's specific to Node.js. I shouldn't have to use this stilted coding style that introduces the `module` variable into my global context. This kind of defeats the entire point of being able leverage Javascript development skills across the front and back-end. Now I have to do extra work if I want to re-use that code somewhere else.

- That [rich module ecosystem](npmjs.com) is a ridiculously polluted namespace itself. I really wanted to call this module "include", or "include.js". Truth be told, I looked for something that provided this type of functionality before I wrote it, but what I found was too complex or was riddled with other dependencies (including some requiring compilation).

- `npm` is a standalone tool, so if I forget to run `npm install myPackage` then my program fails. 

- `npm` is not universal, so if you want to use that [rich module ecosystem](npmjs.com), but you're on an unsupported platform, then you have to do extra work. In order to use `npm` to publish this module, I am currently using a workflow that bounces between my cygwin environment and a Mac or Linux VM, through GitHub. If you are trying to follow my changelogs, I'm sorry.

- While I'm at it, who at npm decided cygwin is evil? I've been using this toolset for more than 20 years to give me unix-like shell (and portable shell scripts) on Windows systems, and I resent that npm and its legacy eschew it in favor of... I can't think what it's in favor of. It's just... 

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

The method `include` is a helper function for `includeFile` and `includePackage`. It provides search capability in search paths (that you specify through `setPath` or `addPath` - the default is the main program starting directory), automatically determines whether `<name>` is a file or a package, so you can leave off the ".js" on your file names (because it just looks cleaner to me).

It _returns_ the `Namespace` object, so you can chain calls:

    require ("namespace-include")
        .include ("abc")
        .include ("def")
        .includeFile ("xyz.js");

### setPath

### addPath

## All about "packages"

## Importing from a URL

### importUrl
### import
### setHost
### clearCache
### publish

(docs in progress)
