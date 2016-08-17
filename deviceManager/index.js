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
var fs = require('fs');
var ip = require('ip');


if(process.argv[2] === 'init'){
  process.exit(0);
}
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

app.get('/logs/:id',function(req,res){
  pm2.connect(function(err){
    pm2.list(function(err,list){
      if( err ){
        res.status( 500 ).send( err );
      }
      var foundProc = list.find(function(proc){
        console.log(proc)
        console.log(req.params.id)
        return proc.pm_id === parseInt(req.params.id)
      })

      if(foundProc){

        var regularLogs = Q.promise(function(resolve,reject){

        })

        var regularLogs = Q.promise(function( resolve, reject){
            fs.readFile(foundProc.pm2_env.pm_out_log_path,function(err,data){
              if(err){
                reject(err)
              }else {
                resolve(data.toString('utf-8'))
              }
            })
        });

        regularLogs
          .then(function(logfile){
            res.render('logTemplate',{ content: logfile})

          })
          .catch(function(err){
            console.log("Error gettings logs")
            console.log(err)
            res.status( 500 ).send( err );
          })


      } else {
        res.status(404).send('Process not found')
      }

    })
  })

})

app.get('/restart/:id',function(req,res){
  getProcessById(req.params.id)
    .then(function(process){
      pm2.restart( process, function(err){
        if(err){
          res.status(500).json(err)
        } else {
          res.status(200).send({success:true})
        }
      });
    })
    .catch(function(err){
      res.status(500).json(err)
    })

})

app.get('/kill/:id',function(req,res){

  getProcessById(req.params.id)
    .then(function(proc){
      pm2.delete(proc.pm_id,function(err){
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
    console.log(resourceList)
    res.status(200).json(resourceList);
  }, 3000)

});


server.listen( 8090, function(){
  console.log("Device Manager Server running at:");
  console.log("http://"+ip.address()+":8090");
  console.log('or if running locally:')
  console.log('http://127.0.0.1:8090')
})

function getProcessById( id ){
  return findProcess(function(process){
    return process.pm_id === parseInt(id);
  })
}

function findProcess(findFn,input){
  findFn = findFn || function(){ return true; }
  return Q.Promise(function(resolve,reject){
    pm2.connect(function(err){
      pm2.list(function(err,list){
        var process;
        if(err){
          console.log('err', err)
          reject(err)
        }

        process = list.find(findFn);

        if( process ){
            resolve(process)
        }else{
            reject({error: "Could not find the process"})
        }
      })
    })
  })
}
