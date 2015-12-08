# include.js for Node.js
Because sometimes you just want to execute another Javascript file in the global namespace...

## Hey Rick
I had a friend, a guy I would call up and talk about all manner of technical BS with. His name was Rick, and I knew him for 25 years. He was the smartest person I ever met, and I've been in the room with some of the world's brightest minds so that's no small compliment. Rick passed in June of 2015. This package is dedicated to him, because when I first encountered the way Node.js loads packages, I really wanted to get on the phone and bemoan the folly of system engineers making dogmatic choices.

## What's the problem?
In Javascript, it's very common to use a prototype-based object-oriented programming paradigm. In general software development, it's common to split class definitions into separate files. Some languages (such as Java) enforce this split, up to and including the names of the files and directory structure used in the package.

Some of the reasons to encourage splitting classes into separate files are to:
- isolate the code and variables that go together, 
- keep code file sizes manageable,
- promote code re-use through well abstracted interfaces, and
- hoist commonly used functionality into a single point of entry (thereby minimizing opportunities for errors in replication and reducing effort when updating algorithms).

To facilitate loading of separate class definition files, Node.js copied the perl module loading mechanism. Using the `var myModule = require ('modulename.js');` syntax, the mechanism runs your imported module in a separate VM context and returns the objects or functions you assign to the `exports` or `module.exports` object. The exported names are available to the importing module through the variable you assigned it to (in this case, `myModule`).

The primary benefit of this approach is that you avoid polluting the global namespace. However, the `require` paradigm as implemented is overkill. 

As an engineer, I should be able to make my own decisions about how I use the global namespace, and not have dogmatic ideology enforced on me. Given that flexibility, I could just as easily decide to build objects to manage the namespaces myself. Aside from being pedantic, the `require` idiom imposes an undesirable coding style that results in Node.js specific module declarations.

So... enter "include.js", when you just want to execute another Javascript file in the global context.
