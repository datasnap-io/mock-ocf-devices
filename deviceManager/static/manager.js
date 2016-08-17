angular.module('deviceManager',['ui.bootstrap','colorpicker.module'])
  .service( 'UtilsService', function( $location ){

    var self =  {

      getPort( process ){
        var index = process.pm2_env.args.indexOf('-p');
        if(index<0){
          return
        }
        return process.pm2_env.args[ index+1 ];
      },

      getBaseUrl:function(){
        var host= $location.host()
        var base = 'http://'+ host.split(':')[0];
        return base;
      },

      getProcessPath:function( process ){
        var base = self.getBaseUrl();
        var port = self.getPort( process );
        if( !port){
          return base+':8080'
        }else{
          return base+':'+port;
        }
      }
    };
    return self;

  })
  .service('BackendService',function($http){

    return {
      //TODO: Abstract these out so different resource types can be used
      createLight:function(model){
        return $http({ method:'POST', url:'/create/light', data: model })
      },
      createSwitch:function(id){
        return $http({ method:'POST', url:'/create/switch', data: id })
      },
      //End todo

      discoverResources:function(){
        return $http({ method:'GET', url:'/discover'});
      },

      killProcess:function(id){
        return $http({ method:'GET', url:'/kill/'+id });
      },

      clearProcesses:function(){
        return $http({ method:'GET', url:'/clear' });
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
  .controller( 'CreateLightCtrl' , function( $scope, $window, $timeout, $uibModalInstance, UtilsService, BackendService ){
    var vm = this;

    angular.extend( $scope,{

      //State
      model:{ },
      creating: false,
      colorStyle:{
        width:'100%',
        height:'40px',
        backgroundColor:'',
        borderRadius:"12px"
      },

      //Methods
      isFormValid:function(){
        console.log($scope.model)
        return ( $scope.model.color && $scope.model.name && $scope.model.path)
      },

      cancel:function(){
        $uibModalInstance.dismiss('cancel');
      },
      createLight: function(){
        $scope.creating = true;
        BackendService.createLight( $scope.model )
          .then(
            function success(result){
              console.log('Successfully created light')
              console.log(result.data)

              $timeout(function(){
                window.open( UtilsService.getBaseUrl()+':'+result.data.port+"/?cb="+Date.now(),Date.now(), "height=290,width=300,location=false,scroll=false,resizable=false");
                $uibModalInstance.close( result.data );
              }, 4000)

              //window.location.href="/light/"+result.data.hash
            },
            function error(result){
              console.log('Error creating switch')
              console.log(result)
            });
      }
    })

    $scope.$watch('model.color',function(newVal){
      $scope.colorStyle.backgroundColor = newVal;
    });
    $scope.$watch('model.name',function(newVal){
      $scope.model.path = '/a/bulb/'+newVal;
    });

    function activate(){
      $scope.model= {
        color:'rgb(255,255,0)',
        name:'yellow',
        path:'/a/bulb/'
      };
    }

    activate();
  })
  .controller( 'CreateSwitchCtrl' , function( $scope, $timeout, $uibModalInstance, UtilsService, BackendService ){
    var vm = this;
    angular.extend( $scope,{

      //State
      doingDiscovery:false,
      selected:null,
      creating:false,
      resources:[],

      //Methods
      isSelectionValid:function(){return !!$scope.selected},
      isSelected:function(resource){
        return $scope.selected &&
              resource.id.deviceId === $scope.selected.deviceId &&
              resource.id.path === $scope.selected.path
      },
      selectItem(resource){
        $scope.selected = resource.id;
      },
      discoverResources: function(){
        $scope.doingDiscovery = true;
        BackendService.discoverResources()
          .then(
            function success(result){
              $scope.doingDiscovery = false;
              $scope.resources = result.data;
            },
            function error(error){
              $scope.doingDiscovery = false;
              console.log(result)
            })
      },
      cancel:function(){
        $uibModalInstance.dismiss('cancel');
      },
      createSwitch: function(){
        $scope.creating = true;
        BackendService.createSwitch( $scope.selected )
          .then(
            function success(result){
              console.log('Successfully created switch')
              console.log(result.data)

              $timeout(function(){
                window.open(UtilsService.getBaseUrl()+':'+result.data.port+"/?cb="+Date.now(),Date.now(), "height=250,width=300");
                $uibModalInstance.close( result.data );
              },4000)

            },
            function error(result){
              console.log('Error creating switch')
              console.log(result)
            });
      }
    })

    function activate(){
      $scope.discoverResources();
    }

    activate();
  })
  .controller( 'MainController' , function( $scope, $location, $timeout, $uibModal, UtilsService, BackendService ){

    angular.extend($scope,{
      processes:[],
      restarting:[],
      killing:[],

      getProcessPath: UtilsService.getProcessPath,

      openBrowserWindow:function(process){
        window.open( $scope.getProcessPath(process), Date.now(), "height=250,width=300");
      },

      refreshList:function(){
        loadActiveProcesses();
      },
      createLight:function(){
        var instance = $uibModal.open({
          animation:true,
          templateUrl: 'createLightModal.html',
          controller: 'CreateLightCtrl',
          size:'md'
        });

        instance.result.then(
          function( newLight ){
            console.log('process successfully created');
            loadActiveProcesses();
          },
          function ( ){
            console.log('process cancelled')
          }
        );

      },
      createSwitch:function(){

        var instance = $uibModal.open({
          animation:true,
          templateUrl: 'createSwitchModal.html',
          controller: 'CreateSwitchCtrl',
          size:'md'
        });

        instance.result.then(
          function( newSwitch ){
            console.log('process successfully created');
            loadActiveProcesses();
          },
          function ( ){
            console.log('process cancelled')
          }
        );
      },

      actions:{
          clearProcesses:function(){
            BackendService.clearProcesses().then(
              function(){
                $timeout(loadActiveProcesses,1000);
              },
              function( err ){
                $timeout(loadActiveProcesses,1000);
                loadActiveProcesses();
                console.log('error clearing processes', err);
              }
            )
          },
          restartProcess: function(process){
            BackendService.restartProcess( process.pm_id )
              .then(
                function(){
                    console.log('successfully reloaded ', process.pm_id)
                    loadActiveProcesses();
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
                    loadActiveProcesses();
                },
                function(){
                    console.log('error removing ', process.pm_id)
                })
          }
      }

    })

    function activate(){
      loadActiveProcesses();
    }

    function loadActiveProcesses(){
      BackendService.getProcesses()
        .then(function(processes){
          $scope.processes = processes;
        })
    }
    activate()
  })
