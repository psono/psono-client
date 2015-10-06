(function(angular){
    'use strict';

    var app = angular.module('passwordManagerApp', ['ng', 'ui.bootstrap', 'snap']);

    /*
    app.config(function(snapRemoteProvider) {
         var minPosition = 266;
         snapRemoteProvider.globalOptions.disable = 'right';
         snapRemoteProvider.globalOptions.hyperextensible = false;
         snapRemoteProvider.globalOptions.disable = disable;
         snapRemoteProvider.globalOptions.minPosition = -minPosition;
         snapper.smallView = smallView;

         var supportsOrientationChange = "onorientationchange" in window,
         orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

         window.addEventListener(orientationEvent, function() {
         var smallView = screen.width < 640;
         var element = document.getElementById('content');
         var minPosition = 266;
         if (user.isWaiter() && snapper.smallView != smallView) {
         if(smallView) {
         disable = 'none';
         } else if(!smallView) {
         disable = 'right';
         element.style.width = ((window.innerWidth || document.documentElement.clientWidth)-minPosition)+'px';
         }
         snapper.settings({
         element: element,
         hyperextensible: false,
         disable: disable,
         minPosition: -minPosition
         });
         snapper.smallView = smallView;
         }
         }, false);
    });
     */

    app.controller('MainCtrl', ['$scope', 'apiClient', 'browserClient', 'snapRemote', function($scope, apiClient, browserClient, snapRemote){


        $scope.loggedin = false;

        $scope.loginFormEmail = "test@saschapfeiffer.com";
        $scope.loginFormPassword = "myPassword";

        snapRemote.open('left');

        snapRemote.smallView = screen.width < 640;

        snapRemote.getSnapper().then(function(snapper) {
            // Do something with snapper
            snapper.settings({
                hyperextensible: false,
                disable: 'right',
                tapToClose: false
            });
        });

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
                    browserClient.resize(300);
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
                browserClient.resize(200);

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