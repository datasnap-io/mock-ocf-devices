var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
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

io.on('connection',function(socket){
  console.log('Lightbulb listener connected')
  socket.emit('update',{state:state})
})

function updateUI(state){
  io.emit('update',{
    state: state
  });
}


setInterval(function(){
  if(state === "off"){
    state = 'on'
  } else {
    state = 'off'
  }
  updateUI(state)
},5000)
