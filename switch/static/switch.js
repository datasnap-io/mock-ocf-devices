angular.module('switchApp',['ui.bootstrap'])
  .service('BackendService',function($http){
    var socket = io();

    return {
      registerOnDiscovery : function(fn){
        socket.on('discovery',fn);
      },
      doDiscovery:function(){
        return $http({method:'GET', url:'/discover'})
      },
      setState:function(state){
        socket.emit('change',{ state:state })
      }
    }

  })
  .directive('splashScreen',function(){
    return {
      restrict:'E',
      transclude: true,
      scope:{
        showDiscovery:"=",
        onDiscovery:"="
      },
      template:"<span ng-transclude></span>",
      link:function(){

      }
    }
  })
  .controller('MainController',function($scope, $interval, BackendService){
    var vm = this;

    angular.extend($scope,{
      found:false,
      discovering: true,
      deviceId:0,
      state:false,
      tryDiscover:function(){
        $scope.discovering = true,
        BackendService.doDiscovery();
      },
      onChange:function(){
        BackendService.setState( $scope.state )
      }
    });

    BackendService.registerOnDiscovery(function(found){
      console.log('got discovery, found:', found);
      $scope.discovering = false;
      $scope.found = found;
      $scope.$apply();
    });

    function activate(){

    }

    activate();

  })
