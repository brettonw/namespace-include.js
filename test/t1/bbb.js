stdout.writeln ("bbb");

let spew = function (obj) {
    for (let key in obj) {
        stdout.writeln (key);
    }
}
