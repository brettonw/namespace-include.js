// process.argv[0] = node
// process.argv[1] = scriptname.js

// process.argv[2] = url
// process.argv[3] = destination

var _fs = require ("fs");
var _http = require ("http");
var _url = require ("url");

var request = _http.get(process.argv[2], function(response) {
    var chunks = [];
    //response.setEncoding("binary");
    response.on("data", function (chunk) { chunks.push(chunk) });
    response.on("end", function() { _fs.writeFileSync(process.argv[3], Buffer.concat(chunks)); });
});
request.on("error", function(error) {
});
