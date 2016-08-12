angular.module('createApp',['ui.bootstrap'])
.service('BackendService',function($http,$q){

  return {
    discoverResources:function(){
      return $http({ method:'GET',url:'/discover'});
    },
    createSwitch:function(id){
      return $http({ method:'POST', url:'/create/switch', data: id })
    }
  }
})
.controller('MainController',function($scope, $timeout, BackendService ){
  var vm = this;
  angular.extend( $scope,{

    //State
    doingDiscovery:false,
    selected:null,
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
    createSwitch: function(){
      BackendService.createSwitch( $scope.selected )
        .then(
          function success(result){
            console.log('Successfully created switch')
            console.log(result.data)

            $timeout(function(){
              window.open("http://127.0.0.1:"+result.data.port+"/?cb="+Date.now(),Date.now(), "height=400,width=400");
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
