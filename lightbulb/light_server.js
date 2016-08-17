var express = require("express");
var app = express()
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Q = require('q');
var bodyParser = require("body-parser");
var nodeUUID = require('node-uuid');

var lightResource, device;
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

app.engine('html', require('ejs').renderFile );
app.set('views',__dirname);
app.set('view engine', 'html');
app.use(express.static( __dirname+'/static') );
app.use(bodyParser.json())

/***

  Interesting Stuff Starts here

***/

device = require('iotivity-node')('server');
var client = require('iotivity-node')('client');

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

var registered = device.register({
  id: {
    path: argv.path
  },
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

    device.notify(lightResource);

    console.log('Sending response')
    request.sendResponse( lightResource, handleError);

    console.log('updating ui', lightResource)
    io.emit( 'update', lightResource.properties );

  });

  return resource;
})

registered.catch(function(e){
  console.error('error creating device')
  console.log(e)

})

function handleError( theError ) {
  console.error( theError );
  process.exit( 1 );
}

//Routes
app.get('/',function(req,res){

  registered
    .then(function(resource){
      console.log(resource)
      res.render('light_2',{
        color: argv.color.replace(/["]/g,""),
        deviceId: resource.id.deviceId,
        path: resource.id.path,
      });

    })
    .catch(function(e){

      res.status(500).json({
        msg:'Could not create light',
        args: argv,
        error:e
      })
      console.log(e)
    })

})

io.on('connection',function(socket){

  registered.then(function(){
    socket.emit('initialized', lightResource);
    socket.emit('update',lightResource.properties );
  })

})

server.listen( argv.port, function(){
  console.log("Server running at http://127.0.0.1:"+argv.port);
});
