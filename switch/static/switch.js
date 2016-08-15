angular.module('switchApp',['ui.bootstrap'])
  .service('BackendService',function($http){
    var socket = io();

    return {
      registerOnFound : function(fn){
        socket.on('found',fn);
      },
      setState:function(state){
        socket.emit('change',{ state:state })
      }
    }

  })
  .controller('MainController',function($scope, $interval, BackendService){
    var vm = this;

    angular.extend($scope,{
      deviceId:0,
      state:false,
      onChange:function(){
        BackendService.setState( $scope.state )
      }
    });

    BackendService.registerOnFound(function(resource){
      console.log(resource);
      $scope.deviceId = resource.id.deviceId;
      $scope.$apply();
    });

    function activate(){

    }

    activate();

  })
