var express = require("express");
var app = express()
var server = require('http').Server(app);
var io = require('socket.io')(server)
var pm2 = require('pm2');
var device = require( 'iotivity-node' )('client');
var bodyParser = require("body-parser");
var Q = require('q');
var nodeUUID = require('node-uuid');

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

  var uuid = nodeUUID.v1();
  getProcess(uuid)
    .then(function(){
      res.status(200).json({ hash: uuid})
    })
    .catch(function(){
      pm2.start({
        script: __dirname+'/lightbulb_virtual_ocf.js',
        args:[
          '-c', '"'+req.body.color+'"',
          '-p', req.body.path,
          '-n', '"'+req.body.name+'"',
          '-h', uuid],
        name:uuid
      }, function(err,output){
        if(err){
          res.status(500).json({error:err})
          return
        }
        res.status(200).json({ hash: uuid })
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

app.get('/light/:uuid',function(req,res){

  getProcess( req.params.uuid )
    .then(function(process){

      res.render('light',{
        hash: req.params.uuid,
        name: process.pm2_env.args[2],
        path: process.pm2_env.args[1],
      });

      io.on('light:'+req.params.uuid,function(something){
          console.log('got light:'+req.params.uuid)
      })

    })
    .catch(function(){
      res.status(404).send('Process does not exist')
    })
});

server.listen( 8090, function(){
  console.log("Server running at http://127.0.0.1:8090/");
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


//Socket.io Server
io.on('connection',function(socket){
  console.log('Switch listener connected')
  //socket.emit('update', { state: state });
  socket.on('debug',function(){
    console.log('args',arguments)
  })
  socket.on('change',function(data){
    console.log(data)
    io.emit('light:'+data.hash, data)
  })

});
