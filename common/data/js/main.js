(function(angular){
    'use strict';

    var app = angular.module('passwordManagerApp', ['ng']);

    app.controller('MainCtrl', ['$scope', 'apiClient', function($scope, apiClient){
        $scope.loggedin = false;

        $scope.loginFormEmail = "test@saschapfeiffer.com";
        $scope.loginFormPassword = "myPassword";

        $scope.login = function (email, password) {


            function onError(data) {
                alert("Error, should not happen.");
            }

            function onRequestReturn(data) {
                // TODO bring message to the user
                console.log(data);
                if (data.response === "success") {
                    $scope.errors = [];
                    $scope.loggedin = true;
                } else {
                    $scope.errors = data.error_data.non_field_errors;
                }
            }
            if (email !== undefined && password !== undefined) {
                apiClient.login(email, password).then(onRequestReturn, onError);
            }
        };

    }]);


})(angular);