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

        $scope.logout = function () {


            function onError(data) {
                alert("Error, should not happen.");
            }
            function onRequestReturn(data) {
                console.log(data);
                $scope.loggedin = false;

            }

            apiClient.logout().then(onRequestReturn, onError);

        };

        $scope.searchArray = [
            "google.com email",
            "gmx.de email",
            "test.de kA",
            "lolig.com test",
            "amazon.com",
            "ebay.com",
            "Spotify",
            "Bank Onlinebanking"
        ];

        $scope.datastore = { search: '' };

        var regex;

        $scope.$watch('datastore.search', function (value) {
            regex = new RegExp(value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'i');
        });

        $scope.filterBySearch = function(searchEntry) {
            if (!$scope.datastore.search) return false;
            return regex.test(searchEntry);
        };

    }]);


})(angular);