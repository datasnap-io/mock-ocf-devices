angular.module('createApp',['ui.bootstrap'])
.service('BackendService',function($http){

  return {
    discoverResources:function(){
      return $http({ method:'GET',url:'/discover'});
    },
    createSwitch:function(id){
      return $http({ method:'POST', url:'/create', data: id })
    }
  }
})
.controller('MainController',function($scope, BackendService ){
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
            window.open("/switch/"+encodeURI(result.data.hash),'Switch Bulb: '+result.data.hash,"height=400,width=400");
            //window.location.href = "/";
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
