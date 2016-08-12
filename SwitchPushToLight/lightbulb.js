
module.exports = function( readyCallback, onchange ){
  var lightResource, device;
  onchange = onchange || function(){};

  device = require('iotivity-node')('server');

  device.device = Object.assign( device.device, {
    name: 'switch-push-to-light-light'
  });

  device.platform = Object.assign(device.platform, {
  	manufacturerName: "Intel",
  	manufactureDate: new Date( "Wed Sep 23 10:04:17 EEST 2015" ),
  	platformVersion: "1.1.1",
  	firmwareVersion: "0.0.1",
  	supportUrl: "http://example.com/"
  });

  device.register({
    id: { path: '/a/switch-push-to-light-light'},
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
      request.sendResponse( lightResource , handleError);
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
      onchange(lightResource.properties);
    });

    readyCallback();
  })

  function handleError( theError ) {
  	console.error( theError );
  	process.exit( 1 );
  }
}
