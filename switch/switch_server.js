var express = require("express");
var app = express()
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Q = require('q');
var bodyParser = require("body-parser");
var _ = require("lodash");
var device = require( 'iotivity-node' )('client');
var argv = require('yargs')
    .option('p',{
      alias: 'port',
      demand: true,
      describe: 'Port to run this server on',
      type: 'string'
    })
    .option('r', {
        alias: 'path',
        demand: true,
        default: '/a/light',
        describe: 'The OCF path for the light to be controlled',
        type: 'string'
    })
    .option('d', {
        alias: 'deviceid',
        describe: 'The OCF device id for the light to be controlled',
        type: 'string'
    })
    .argv

app.engine('html', require('ejs').renderFile );
app.set('views',__dirname);
app.set('view engine', 'html');
app.use(express.static( __dirname+'/static') );
app.use(bodyParser.json())

//Routes
app.get('/',function(req,res){
  res.render('switch',{
    path: argv.path
  });
})

var discoverDefer = Q.defer();
var discovered = discoverDefer.promise;

/***

  Interesting Stuff Starts here

***/

function findResources(){
  console.log('searching for lights..')
  device.findResources({
    resourceType:'core.light'
  })
  .catch(function(error){
      console.log('an error')
      console.error( error.stack ? error.stack : ( error.message ? error.message : error ) );
      process.exit( 1 );
  });
}

var resourceFinder = function(event){
  var res = event.resource;
  if( res.id.path === argv.path ){
    console.log('found light')
    device.removeEventListener( 'resourcefound', resourceFinder)
    discoverDefer.resolve(res);
  }
}

device.addEventListener("resourcefound", resourceFinder )

findResources();

io.on('connection',function(socket){

  //Notify when we have discovered the device
  discovered.then(function(resource){
      socket.emit('found',resource)
  });

  socket.on('change',function(state){
    console.log('Server received change request');
    discovered
      .then(function(resource){
        console.log('Updating OCF device:')
        //Try to update device
        device.update({
          id: resource.id,
          properties: state
        })
        .then(function(resp){
          console.log('Succussfully updated', resource, resp)
          socket.emit('debug','Successfully changed state')
        })
        .catch(function(error){
          console.log('error updating')
          console.log(error)
          socket.emit('debug',{'error':error})
        });
      })
  })

})

server.listen( argv.port, function(){
  console.log("Server running at http://127.0.0.1:"+argv.port);
});


function handleError( theError ) {
  console.error( theError );
  process.exit( 1 );
}
