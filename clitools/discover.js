var device = require( 'iotivity-node' )('client');

function findResources(){
  console.log('searching for devices..');
  device.findResources()
    .catch(function(error){
        console.log('an error');
        console.error( error.stack ? error.stack : ( error.message ? error.message : error ) );
        process.exit( 1 );
    });
}

var resourceFinder = function(event){
  var res = event.resource;
  console.log(res);
};

device.addEventListener("resourcefound", resourceFinder );

findResources();

setTimeout(function(){
  process.exit(0);
},4000);
