var http = require('http');
var fs = require('fs');

var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  fs.readFile( __dirname + '/index.html', function( err, data){
    response.end(data.toString('utf-8'));
  });

});
server.listen(8070);

console.log("Server running at http://127.0.0.1:8070/");
