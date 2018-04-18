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
     * @requires psonocli.offlineCache
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the wrapper
     */
    angular.module('psonocli').controller('WrapperCtrl', ['$scope', '$rootScope', '$filter', '$timeout',
        'managerDatastoreUser', 'browserClient', 'storage', 'offlineCache',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout,
                  managerDatastoreUser, browserClient, storage, offlineCache,
                  snapRemote, $window, $route, $routeParams, $location) {

            var snapper;
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

                initialize_snapper();

                $scope.offline = offlineCache.is_active();
                $rootScope.$on('offline_mode_enabled', function() {
                    $scope.offline = true;
                });

                $rootScope.$on('offline_mode_disabled', function() {
                    $scope.offline = false;
                });

                var is_logged_in = managerDatastoreUser.is_logged_in();

                if (is_logged_in) {
                    $scope.view = "logged_in";
                } else {
                    $scope.view = "logged_out";
                }

                browserClient.on("login", function () {
                    $timeout(function () {
                        $scope.view = "logged_in";
                        initialize_snapper();
                    });
                });

                browserClient.on("logout", function () {
                    $timeout(function () {
                        $scope.view = "logged_out";
                    });
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:WrapperCtrl#initialize_snapper
             * @methodOf psonocli.controller:WrapperCtrl
             *
             * @description
             * Responsible to intialize the snapper
             */
            function initialize_snapper() {
                snapRemote.getSnapper().then(function(snap) {
                    snapper = snap;
                    snapper.settings(snappersettings);
                    snapper.open('left');

                    snapper_enable_dynamic();

                    angular.element($window).bind(orientationEvent, function(e){
                        snapper_enable_dynamic(e);
                    });
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:WrapperCtrl#enable_snapper
             * @methodOf psonocli.controller:WrapperCtrl
             *
             * @description
             * Will enable the snapper and adjust the width of the snap content
             *
             * @param {object | undefined} event The event triggering this
             */
            function enable_snapper(event) {
                snapper.enable();
                $scope.snap.snap_content_with = get_snap_content_width() + 'px';
                if (typeof(event) !== 'undefined') {
                    // we have an resize event, where apply is not automatically called, so lets call it
                    $scope.$apply();
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:WrapperCtrl#get_snap_content_width
             * @methodOf psonocli.controller:WrapperCtrl
             *
             * @description
             * Returns the current width of the snap content
             *
             * @returns {number} The width of the content
             */
            function get_snap_content_width() {
                var all_snapper = document.querySelectorAll(".snap-content");
                if (all_snapper.length < 1) {
                    return 0;
                }
                return angular.element(all_snapper[0])[0].clientWidth;
            }

            /**
             * @ngdoc
             * @name psonocli.controller:WrapperCtrl#disable_snapper
             * @methodOf psonocli.controller:WrapperCtrl
             *
             * @description
             * Will disable the snapper and adjust the width of the snap content.
             * Before disabling it, it will check if its closed or opened, and open it if its not open.
             *
             * @param {object | undefined} event The event triggering this
             */
            function disable_snapper(event) {
                if(snapper.state().state === 'closed'){
                    snapRemote.toggle('left');
                }
                snapper.disable();
                $scope.snap.snap_content_with = (get_snap_content_width() - scrollWidth) + 'px';
                if (typeof(event) !== 'undefined') {
                    // we have an resize event, where apply is not automatically called, so lets call it
                    $scope.$apply();
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:WrapperCtrl#snapper_enable_dynamic
             * @methodOf psonocli.controller:WrapperCtrl
             *
             * @description
             * Checks the width of the current window. If its below small_screen_limit (currently 768px) it will enable
             * the snapper, otherwise disable the snapper
             *
             * @param {object | undefined} event The event triggering this
             */
            function snapper_enable_dynamic(event) {
                if ($window.innerWidth < small_screen_limit) {
                    enable_snapper(event);
                } else {
                    disable_snapper(event);
                }
            }
        }]
    );
}(angular));