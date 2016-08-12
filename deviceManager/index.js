var express = require("express");
var app = express()
var server = require('http').Server(app);
var io = require('socket.io')(server)
var pm2 = require('pm2');
var device = require( 'iotivity-node' )('client');
var bodyParser = require("body-parser");
var Q = require('q');
var nodeUUID = require('node-uuid');
var fp = require('find-free-port');

//Configure
app.engine('html', require('ejs').renderFile );
app.set('views',__dirname);
app.set('view engine', 'html');
app.use(express.static(__dirname+'/static'));
app.use(bodyParser.json())

//Routes
app.get('/',function(req,res){
  res.render('index',
    { title:'hey hey',
      text:'sumfin here'
    });
})
app.get('/light',function( req, res){
  res.render('createLight',
    { title:'hey hey',
      text:'sumfin here'
    });
})
app.get('/switch',function( req, res){
  res.render('createSwitch',
    { title:'hey hey',
      text:'sumfin here'
    });
})

app.post('/create/light', function(req,res){

  fp( 8070,9000,'127.0.0.1', function(err,openPort){
    if(err){
      res.status(500).json({error:err})
      return
    }

    pm2.connect(function(err){
      console.log(err)
        pm2.start({
          script: __dirname+'/../lightbulb/light_server.js',
          args:[
            '-c', '"'+req.body.color+'"',
            '-r', req.body.path,
            '-p', openPort,
            '-n', '"'+req.body.name+'"'
          ],
          name: [req.body.path,req.body.name,openPort].join('.')
        }, function(err,output){
          if(err){
            res.status(500).json({error:err})
            return
          }
          res.status(200).json({ port: openPort })

        })
    });

  });

})

app.post('/create/switch',function(req,res){

  fp( 8070,9000,'127.0.0.1', function(err,openPort){
    if(err){
      res.status(500).json({error:err})
      return
    }
    pm2.connect(function(err){
      console.log(err)
      pm2.start({
        script: __dirname+'/../switch/switch_server.js',
        args:[
          '-r', req.body.path,
          '-p', openPort,
          '-d', req.body.deviceId
        ],
        name: [req.body.path,req.body.name,openPort].join('.')
      }, function(err,output){
        if(err){
          res.status(500).json({error:err})
          return
        }
        res.status(200).json({ port: openPort })
      })
    })

  });

})

app.get('/kill/:uuid',function(req,res){

  getProcess(req.params.uuid)
    .then(function(proc){
      pm2.delete(req.params.uuid,function(err){
        if(err){
          console.log(err)
          res.status(500).send({error:err})
          return
        }
        res.status(200).send()
      })
    })
    .catch(function(error){
      res.status(404).send({error:err})
    })
})

app.get('/list',function(req,res){
  pm2.connect(function(err){
    pm2.list(function(err,list){
      if(err){
        console.log('err', err)
        res.status(500).json({error:err})
      }
      console.log(list);
      res.status(200).json(list)
    })
  })
})

app.get('/clear',function(req,res){
  pm2.connect(function(err){
    pm2.list(function(err,list){
      if(err){
        console.log('err', err)
        res.status(500).json({error:err})
      }
      console.log(list);
      list.forEach(function(process){
        pm2.delete(process.name,function(err){
          if(err){
            console.log(err)
            res.status(500).send({error:err})
            return
          }
          res.status(200).send()
        })
      })
      res.status(200).json(list)
    })
  })
})

app.get('/discover',function(req,res){
  var resourceList = [];
  var resourceUpdate = function(resource){
    resourceList.push(resource.resource);
  }

  device.addEventListener("resourcefound", resourceUpdate )

  console.log('searching for lights..')
  device.findResources({
    resourceType:'core.light'
  })
  .catch(function(error){
      console.log('an error')
      console.error( error.stack ? error.stack : ( error.message ? error.message : error ) );
      res.status(500).json(error);
  });

  setTimeout(function(){
    device.removeEventListener("resourcefound", resourceUpdate);
    res.status(200).json(resourceList);
  }, 3000)

});



server.listen( 8090, function(){
  console.log("Device Manager Server running at:");
  console.log("http://127.0.0.1:8090/");
})

function getProcess( uuid ){
  return Q.Promise(function(resolve,reject){
    pm2.connect(function(err){
      pm2.list(function(err,list){
        if(err){
          console.log('err', err)
          res.status(500).json({error:err})
        }

        var process = list.find(function(item){
          return item.name === uuid;
        })

        if( process ){
            resolve(process)
        }else{
          reject()
        }
      })
    })
  })
}
