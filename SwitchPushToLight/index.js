var spawn = require('child_process').spawn;

function printer(process,type,data){
  if(typeof data === "object"){
    console.log( process+'->'+type+':', data.toString('utf-8'))
  } else {
    console.log( process+'->'+type+':', data)
  }
}

function createChildProcess(command,args){
  var proc = spawn.apply( this, [ command ].concat([args]) );
  var commandLogger= printer.bind(null,args[0]);
  proc.stdout.on('data', commandLogger.bind(null,'Out'));
  proc.stderr.on('data',commandLogger.bind(null,'Error'));
  proc.on('close', commandLogger.bind(null,'Closed'));
}

// var lightbulb = createChildProcess('node', [__dirname+'/lightbulb.js']);
// var switchProc;
// setTimeout(function(){
//   switchProck = createChildProcess('node',[__dirname+'/switch.js'])
// },2000)
//



require('./lightbulb')( function(){

});
