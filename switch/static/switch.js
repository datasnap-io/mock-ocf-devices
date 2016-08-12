angular.module('switchApp',['ui.bootstrap'])
  .service('BackendService',function($http){
    var socket = io();

    return {
      registerOnFound : function(fn){

      },
      setState:function(state){
        socket.emit('change',{ state:state })
      }
    }
  })
  .controller('MainController',function($scope, $interval, BackendService){
    var vm = this;

    angular.extend($scope,{
      state:false,
      onChange:function(){
        BackendService.setState( $scope.state )
      }
    })

    function activate(){

    }

    activate();

  })
