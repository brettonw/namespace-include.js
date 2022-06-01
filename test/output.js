// a simple output class definition and two global instances to demonstrate "include.js"
let Output = function () {
    let $ = Object.create (null);

    $.write = function (output) {
        this.channel.write (output);
        return this;
    };

    $.newln = function () {
        this.channel.write ("\n");
        return this;
    };

    $.writeln = function (output) {
        this.channel.write (output);
        this.newln ();
        return this;
    };

    $.init = function (channel) {
        this.channel = process[channel];
        return this;
    };

    $.new = function (channel) {
        return Object.create (Output).init (channel);
    }

    return $;
} ();

let stdout = Output.new ("stdout");
let stderr = Output.new ("stderr");
