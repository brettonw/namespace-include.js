stdout.writeln ("ccc");

spew (global);

stdout.writeln ("LIST FILES");
var fs = require ("fs");
fs.readdirSync (".").sort ().forEach (function (leaf) {
    stdout.writeln (leaf);
});
