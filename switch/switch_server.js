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
      describe: 'The OCF path for the light to be controlled',
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
        demand: true,
        describe: 'The OCF device id for the light to be controlled',
        type: 'string'
    })
    .argv

app.engine('html', require('ejs').renderFile );
app.set('views',__dirname);
app.set('view engine', 'html');
app.use(express.static( __dirname+'/static') );
app.use(bodyParser.json())

//OCF
var timeout;
var discoverDefer = Q.defer();
var discovered = discoverDefer.promise;

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
  if( (res.id.path === argv.path) && _.includes(res.resourceTypes,'core.light') ){
    console.log('found light')
    clearInterval(timeout);
    device.removeEventListener( 'resourcefound', resourceFinder)
    discoverDefer.resolve(res);
  }
}
device.addEventListener("resourcefound", resourceFinder )
findResources();

function handleError( theError ) {
  console.error( theError );
  process.exit( 1 );
}

//Routes
app.get('/',function(req,res){
  res.render('switch',{
    deviceId: argv.deviceid,
    path: argv.path
  });
})

io.on('connection',function(socket){
  socket.on('change',function(state){
    console.log('got the change',state)
    discovered
      .then(function(resource){
        console.log('Device has been discovered')
        //Try to update device
        device.update({
          id: resource.id,
          properties: state
        })
        .then(function(resp){
          socket.emit('debug','Successfully changed state')
        })
        .catch(function(error){
          socket.emit('debug',{'error':error})
          process.exit(1)
        });

      })
  })
  socket.on('discover',function(state){
    console.log('got discover')
  })
})

server.listen( argv.port, function(){
  console.log("Server running at http://127.0.0.1:"+argv.port);
});
