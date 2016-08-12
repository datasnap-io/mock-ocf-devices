angular.module('createApp',['ui.bootstrap','colorpicker.module'])

.service('BackendService',function($http){
  return {
    createLight:function(model){
      return $http({ method:'POST', url:'/create', data: model })
    }
  }
})
.controller('MainController',function($scope,$window, BackendService ){
  var vm = this;
  angular.extend( $scope,{

    //State
    model:{ },
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

    createLight: function(){
      BackendService.createLight( $scope.model )
        .then(
          function success(result){
            console.log('Successfully created light')
            console.log(result.data)
            window.open("/light/"+encodeURI(result.data.hash),'Light Bulb: '+result.data.hash,"height=400,width=400");
            activate()
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
