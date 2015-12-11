stdout.writeln ("bbb");

var spew = function (obj) {
    for (var key in obj) {
        stdout.writeln (key);
    }
}
