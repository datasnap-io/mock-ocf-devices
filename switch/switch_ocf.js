var io = require("socket.io-client");
var socket = io.connect('http://127.0.0.1:8070');
var Q = require('q');

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


var timeout = setInteval( findResources, 5000 )

var connected = Q.Promise(function(resolve,reject){
    socket.on('connect',function(){
      resolve()
    })
  });

connected
  .then(function(){
    socket.emit('debug', argv );
  })


var device = require( 'iotivity-node' )('client');

var resourceFinder = function( event ){
  var resource = event.resource;
  if( (resource.id.path === argv.path) && (resource.id.deviceId === argv.deviceid) ){

        clearInteval(timeout)
        device.removeEventListener('resourcefound',resourceFinder)

        socket.emit('debug','switch:'+argv.hash);
        socket.on('switch:'+argv.hash,function(newState){

          //Debug
          socket.emit('debug', {
            msg:'putting to',
            id:{
              hash: argv.hash,
              id: resource.id
            }
          });

          //Try to update device
          device.update({
            id: resource.id,
            properties: { state: newState }
          })
          .then(function(resp){
            socket.emit('debug','Successfully changed state')
          })
          .catch(function(error){
            socket.emit('debug',{'error':error})
            process.exit(1)
          });

        });
  }
}

device.addEventListener('resourcefound',resourceFinder)
findResources();

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
