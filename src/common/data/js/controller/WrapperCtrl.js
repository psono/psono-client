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

            var snapper;
            var snapper_active = false;
            var scrollWidth = 266;
            var small_screen_limit = 768;
            var orientationEvent = "onorientationchange" in angular.element($window) ? "orientationchange" : "resize";

            var snappersettings = {
                hyperextensible: false,
                disable: 'right',
                tapToClose: false
            };

            $scope.open_tab = browserClient.open_tab;
            $scope.isNavCollapsed = true;
            $scope.snap = {
                snap_content_with: ''
            };

            activate();

            function activate() {

                snapRemote.getSnapper().then(initialize_snapper);


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
            }

            function initialize_snapper(snap) {
                snapper = snap;
                snapper.settings(snappersettings);
                snapper.open('left');

                snapper_enable_dynamic();

                angular.element($window).bind(orientationEvent, function(e){
                    snapper_enable_dynamic(e);
                });
            }

            function enable_snapper(e) {
                snapper_active = false;
                snapper.enable();
                $scope.snap.snap_content_with = get_snap_content_swidth() + 'px';
                if (typeof(e) !== 'undefined') {
                    // we have an resize event, where apply is not automatically called, so lets call it
                    $scope.$apply();
                }
            }

            function get_snap_content_swidth() {
                return angular.element(document.querySelectorAll(".snap-content")[0])[0].clientWidth;
            }

            function disable_snapper(e) {
                snapper_active = false;
                snapper.disable();
                $scope.snap.snap_content_with = (get_snap_content_swidth() - scrollWidth) + 'px';
                if (typeof(e) !== 'undefined') {
                    // we have an resize event, where apply is not automatically called, so lets call it
                    $scope.$apply();
                }
            }

            function snapper_enable_dynamic(e) {
                if ($window.innerWidth < small_screen_limit) {
                    enable_snapper(e);
                } else {
                    disable_snapper(e);
                }
            }
        }]
    );
}(angular));