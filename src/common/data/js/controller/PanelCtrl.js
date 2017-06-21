(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:PanelCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.manager
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerSecret
     * @requires psonocli.browserClient
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the panel
     */
    angular.module('psonocli').controller('PanelCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'manager',
        'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, manager,
                  managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient,
                  snapRemote, $window, $route, $routeParams, $location) {

            var regex;

            $scope.open_tab = browserClient.open_tab;
            $scope.logout = managerDatastoreUser.logout;
            $scope.filterBySearch = filterBySearch;
            $scope.on_item_click = managerSecret.on_item_click;
            $scope.generate_password = generate_password;
            $scope.bookmark = bookmark;
            $scope.copy_username = managerSecret.copy_username;
            $scope.copy_password = managerSecret.copy_password;

            $scope.searchArray = [];
            $scope.datastore = {
                search: '',
                filteredSearcArray: []
            };

            activate();

            function activate() {

                manager.storage_on('datastore-password-leafs', 'update', function (ele) {
                    //console.log("main.js update");
                    //console.log(ele);
                });


                manager.storage_on('datastore-password-leafs', 'insert', function (ele) {
                    //console.log("main.js insert");
                    $scope.searchArray.push(ele);
                });


                manager.storage_on('datastore-password-leafs', 'delete', function (ele) {
                    //console.log("main.js update");
                    //console.log(ele);
                    for (var i = $scope.searchArray.length - 1; i >= 0; i--) {
                        if ($scope.searchArray[i].key === ele.key) {
                            $scope.searchArray.splice(i, 1);
                        }
                    }
                });

                managerDatastorePassword.get_password_datastore();

                $scope.$watch('datastore.search', function (value) {
                    regex = new RegExp(value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'i');

                    $timeout(function () {
                        if (!managerDatastoreUser.is_logged_in()) {
                            browserClient.resize(250);
                        } else if ($scope.datastore.search === '' && managerDatastoreUser.is_logged_in()) {
                            browserClient.resize(295);
                        } else {
                            /*
                             3 = 295*
                             2 = 252
                             1 = 209*
                             0 = 166
                             */
                            browserClient.resize(166 + Math.max($scope.datastore.filteredSearcArray.length, 1) * 43);
                        }
                    });
                });
            }

            function generate_password() {
                managerDatastorePassword.generate_password_active_tab().then(function() {
                    browserClient.close_popup();
                });
            }

            function bookmark() {
                managerDatastorePassword.bookmark_active_tab().then(function() {
                    browserClient.close_popup();
                });
            }

            /**
             * filters search_entry object and tests if either the urlfilter or the name match our search
             *
             * @param datastore_entry the datastore entry to test
             * @returns {boolean}
             */
            function filterBySearch(datastore_entry) {
                var match;
                if (!$scope.datastore.search) {
                    // Hide all entries if we have not typed anything into the "search datastore..." field
                    match = false;
                } else {
                    // check if either the name or the urlfilter of our entry match our search input of the
                    // "search datastore..." field
                    match = regex.test(datastore_entry.name) || regex.test(datastore_entry.urlfilter);
                }
                return match;
            }

        }]
    );
}(angular));