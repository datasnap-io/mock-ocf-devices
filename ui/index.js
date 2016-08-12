var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
var ocfServer = require('./ocf_server');

var state = 'off';

var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/html"});
  fs.readFile( __dirname + '/index.html', function( err, data){
    response.end(data.toString('utf-8'));
  });
});
var io = socketio(server);
server.listen(8090);

console.log("Server running at http://127.0.0.1:8090/");

var devices = {};

ocfServer.onResource(function( event ){
  var resource = event.resource;
  if( !(resource.id.deviceId in devices) ){
      devices[resource.id.deviceId] = {
        resources:{}
      }
  }
  devices[ resource.id.deviceId ].resources[ resource.id.path ] = resource;
  io.emit('resource', resource);
  console.log(event);
});
ocfServer.discover();

io.on('connection',function(socket){
  console.log('Lightbulb listener connected')
  socket.emit( 'devices', devices)
});
