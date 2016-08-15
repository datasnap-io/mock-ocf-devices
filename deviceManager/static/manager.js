angular.module('deviceManager',['ui.bootstrap'])
  .service('BackendService',function($http){

    return {
      killProcess:function(id){
        return $http({ method:'GET', url:'/kill/'+id })
      },

      restartProcess:function(id){
        return $http({ method: 'GET', url: '/restart/'+id })
      },

      getProcesses:function(){
        return $http({ method:'GET', url:'/list'})
          .then(
            function(result){
              return result.data;
            },
            function(){
              console.log('error getting list of running processes')
              return
            }
          );
      }
    }

  })
  .controller('MainController',function( $scope, BackendService ){

    angular.extend($scope,{
      processes:[],

      getProcessPath:function( process ){
        var base = 'http://127.0.0.1:';
        var index = process.pm2_env.args.indexOf('-p');
        if(index<0){
          return base+'8080'
        }else{
          return base+process.pm2_env.args[ index+1 ];
        }
      },
      openBrowserWindow:function(process){
        window.open( $scope.getProcessPath(process), Date.now(), "height=400,width=400");
      },

      actions:{
          restartProcess: function(process){
            BackendService.restartProcess( process.pm_id )
              .then(
                function(){
                    console.log('successfully reloaded ', process.pm_id)
                },
                function(){
                    console.log('error reloading ', process.pm_id)
                })
          },
          killProcess: function(process){
            BackendService.killProcess( process.pm_id )
              .then(
                function(){
                    console.log('successfully removed ', process.pm_id)
                },
                function(){
                    console.log('error removing ', process.pm_id)
                })
          }
      }

    })

    function activate(){
      BackendService.getProcesses()
        .then(function(processes){
          $scope.processes = processes;
        })
    }
    activate()
  })
