module.exports = function(){
  console.log('attaching device handler')

  var device = require( 'iotivity-node' )('client');

  device.addEventListener("resourcefound",function(event){
    //These are all the lights
    var resource = event.resource;
    console.log('Resource found', resource)
    //Find one particular light
    if( resource.id.path === '/a/switch-push-to-light-light' ){

      resource.addEventListener('change',function(resourceUpdate){
        console.log('change detected!', resourceUpdate);
      });

      var desiredState = true;
      device.update({
        id: resource.id,
        properties: { state: desiredState }
      })
      .then(function(resp){
        console.log('Initial set response',resp)

        setInterval(function(){
          desiredState = !desiredState;
          device.update({
            id:resource.id,
            properties: Object.assign({}, resource.properties, { state: !desiredState })
          })
          .then(function(resp){
            //console.log('response',resp)
          })
        }, 2000)

      })
      .catch(function(error){
        console.log('error setting initial state',error)
      })
    }
  });

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
