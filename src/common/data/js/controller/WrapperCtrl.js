(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:WrapperCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the wrapper
     */
    angular.module('psonocli').controller('WrapperCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'managerDatastoreUser', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, managerDatastoreUser, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location) {



            /* open_tab function to pass through */
            $scope.open_tab = browserClient.open_tab;

            /* test background page */
            //console.log(browserClient.test_background_page());

            /* snapper */
            snapRemote.getSnapper().then(function (snapper) {
                var scrollWidth = 266;
                var orientationEvent = "onorientationchange" in angular.element($window) ? "orientationchange" : "resize";
                var snappersettings = {
                    hyperextensible: false,
                    disable: 'right',
                    tapToClose: false
                };

                snapper.smallView = screen.width < 640;
                // Do something with snapper
                snapper.settings(snappersettings);
                function adjustWith(snapper, behave_inverse) {
                    //console.log('adjustWith');
                    var total_width = angular.element(document.querySelectorAll(".snap-content")[0])[0].clientWidth;
                    if ((snapper.state().state !== 'closed') !== behave_inverse) {
                        $scope.snap_content_with = (total_width - scrollWidth) + 'px';
                    } else {
                        $scope.snap_content_with = total_width + 'px';
                    }
                }

                snapper.on('start', function () {
                    console.log('start');
                });

                snapper.on('end', function () {
                    console.log('end');
                });

                snapper.on('open', function () {
                    adjustWith(snapper, true);
                });
                snapper.on('close', function () {
                    adjustWith(snapper, true);
                });

                snapper.open('left');
                adjustWith(snapper);

                $scope.$on("login", function () {
                    snapRemote.getSnapper().then(function (snapper) {
                        snapper.settings(snappersettings);
                        snapper.open('left');
                        adjustWith(snapper);
                    });
                });

                /* TODO enable snapper if the device is too small */
                snapper.disable();

                angular.element($window).bind(orientationEvent, function () {
                    snapRemote.getSnapper().then(function (snapper) {
                        adjustWith(snapper);
                    });
                    /*
                     var smallView = screen.width < 640;
                     var element = document.getElementById('content');
                     var minPosition = 266;
                     if (snapper.smallView != smallView) {
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
                     */
                });

            });

            if (managerDatastoreUser.is_logged_in()) {
                $scope.view = "logged_in";
                browserClient.resize(295);
            } else {
                $scope.view = "logged_out";
            }

            browserClient.on("login", function () {
                $timeout(function () {
                    $scope.view = "logged_in";
                });
            });

            browserClient.on("logout", function () {
                $timeout(function () {
                    $scope.view = "logged_out";
                    browserClient.resize(250);
                });
            });

        }]
    );
}(angular));