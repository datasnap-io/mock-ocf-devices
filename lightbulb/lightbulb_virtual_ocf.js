var io = require("socket.io-client");
var socket = io.connect('http://127.0.0.1:8090');
var argv = require('yargs')
    .option('h', {
        alias: 'hash',
        demand: true,
        describe: 'The OCF path for the light to be controlled',
        type: 'string'
    })
    .option('p', {
        alias: 'path',
        demand: true,
        default: '/a/light/'+Date.now(),
        describe: 'The OCF path for the light to be controlled',
        type: 'string'
    })
    .option('n',{
        alias:'name',
        demand:'true',
        default:''
    })
    .option('c', {
        alias: 'color',
        demand: true,
        default: "yellow",
        describe: 'The OCF device id for the light to be controlled',
        type: 'string'
    })
    .argv

socket.on('connect',function(){
  socket.emit('debug', argv )
})

  var lightResource, device;

  device = require('iotivity-node')('server');

  device.device = Object.assign( device.device, {
    name: argv.name
  });

  device.platform = Object.assign(device.platform, {
  	manufacturerName: "Intel",
  	manufactureDate: new Date( "Wed Sep 23 10:04:17 EEST 2015" ),
  	platformVersion: "1.1.1",
  	firmwareVersion: "0.0.1",
  	supportUrl: "http://example.com/"
  });

  device.register({
    id: {
      path: argv.path},
    resourceTypes:['core.light'],
    interfaces: ['oic.if.baseline'],
    discoverable: true,
    observable: true,
    properties: {
      state:false
    }
  })
  .then(function(resource){

    lightResource = resource;

    //Pub Sub
    device.addEventListener( 'observerequest' ,function(request){
      console.log('Observer received')
      request.sendResponse( null , handleError);
    });

    device.addEventListener( 'unobserverequest' ,function(request){
      console.log('unobserved received')
      request.sendResponse( null , handleError );
    });

    //CRUD
    device.addEventListener( 'retrieverequest' ,function(request){
      console.log('retrieve received')
      request.sendResponse( lightResource, handleError );
    });

    device.addEventListener( 'updaterequest' ,function(request){
      console.log('update received')
      lightResource.properties = Object.assign( lightResource.properties, request.res );
      device.notify(lightResource).catch(function(err){
        console.log('notify error',err)
      });
      request.sendResponse( lightResource, handleError);
      //socket.emit( 'debug', argv)
      socket.emit( 'change', {
        hash: argv.hash,
        state:lightResource.properties.state,
        color: argv.color })
    });
  })

  function handleError( theError ) {
  	console.error( theError );
  	process.exit( 1 );
  }
