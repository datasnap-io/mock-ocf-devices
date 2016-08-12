var express = require("express");
var app = express()
var server = require('http').Server(app);
var io = require('socket.io')(server)
var pm2 = require('pm2');
var device = require( 'iotivity-node' )('client');
var bodyParser = require("body-parser");
var Q = require('q');
var nodeUUID = require('node-uuid');
var _ = require('lodash');

//Configure
app.engine('html', require('ejs').renderFile );
app.set('views',__dirname);
app.set('view engine', 'html');
app.use(express.static(__dirname+'/static'));
app.use(bodyParser.json())
//Routes
app.get('/',function(req,res){
  res.render('create',
    { title:'hey hey',
      text:'sumfin here'
    });
})


app.post('/create',function(req,res){
  console.log(req.body)

  //var id = new Buffer(req.body.deviceId+':'+req.body.path).toString('base64')

  var name = JSON.stringify({ deviceId:req.body.deviceId, path:req.body.path });
  var uuid = nodeUUID.v1();

  getProcess(uuid)
    .then(function(){

      res.status(200).json({ hash: uuid})

    })
    .catch(function(){
      pm2.start({
        script: __dirname+'/switch_ocf.js',
        args:['-d',req.body.deviceId,'-p',req.body.path,'-h', uuid ],
        name: uuid
      },function(err,output){
        if(err){
          res.status(500).json({error:err})
          return
        }
        //console.log('output was', output)
        res.status(200).json({ hash: uuid })
      })

    });

})

app.get('/kill/:uuid',function(req,res){
  console.log(req.params.uuid)

  getProcess( req.params.uuid )
    .then(function(proc){

      pm2.delete( proc.name,function(err){
        if(err){
          console.log(err)
          res.status(500).send({error:err})
          return
        }
        console.log('found for delete')
        res.status(200).send(proc)
      })

    })
    .catch(function(err){
      console.log('not found for delete')
      res.status(500).json({error: error })
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
        pm2.delete(process.pid,function(err){
          if(err){
            console.log(err)
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
  var resourceHash = {};

  var resourceUpdate = function(resource){
    console.log(resource)
    var key = resource.resource.id.path + resource.resource.id.deviceId;
    resourceHash[key] = resource.resource;
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
    res.status(200).json( _.values(resourceHash) );
  }, 3000)

});

app.get('/switch/:uuid',function(req,res){

  getProcess( req.params.uuid )
    .then(function(process){
      var id = rebuildFromArgs( process.pm2_env.args );
      res.render('switch',{
        hash: req.params.uuid,
        deviceId:id.deviceId,
        path: id.path
      });
    })
    .catch(function(){
      res.status(404).send('Process does not exist')
    })
});

function rebuildFromArgs(args){
  return {
    deviceId: args[1],
    path: args[3]
  }
}

app.put('/switch/:uuid',function(req,res){

  getProcess(req.params.uuid)
    .then(function(process){

      console.log('switch:'+req.params.uuid)
      io.emit('switch:'+req.params.uuid, req.body.state);

      res.status(200).json({
        status:'success'
      })

    })
    .catch(function(){
      res.status(404).send('Process does not exist')
    })
})

server.listen( 8070, function(){
  console.log("Server running at http://127.0.0.1:8070/");
})



function getProcess( uuid ){
  return Q.Promise(function(resolve,reject){
    pm2.connect(function(err){
      pm2.list(function(err,list){
        if(err){
          console.log('err', err)
          res.status(500).json({error:err})
        }

        var process = list.find(function(proc){
          return proc.name === uuid;
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

//Socket.io Server
io.on('connection',function(socket){
  console.log('Switch listener connected')
  //socket.emit('update', { state: state });
  socket.on('debug',function(data){
    console.log(JSON.stringify(data,null,4) )
  })
});
