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
     * @requires psonocli.helper
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the panel
     */
    angular.module('psonocli').controller('PanelCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'manager',
        'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient', 'passwordGenerator',
        'helper', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, manager,
                  managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient, passwordGenerator,
                  helper, $window, $route, $routeParams, $location) {

            var password_filter;

            $scope.open_tab = browserClient.open_tab;
            $scope.logout = managerDatastoreUser.logout;
            $scope.filterBySearch = filterBySearch;
            $scope.on_item_click = managerSecret.on_item_click;
            $scope.edit_item = edit_item;
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
                    password_filter = helper.get_password_filter(value);
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#generate_password
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * Generates a passwords for the active tab and stores it in the datastore
             */
            function generate_password() {
                var password = passwordGenerator.generate();
                helper.copy_to_clipboard(password);

                browserClient.emit_sec('save-password-active-tab', {'password': password});
                browserClient.close_popup();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#bookmark
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * Bookmarks the active tab in the datastore
             */
            function bookmark() {
                browserClient.emit_sec('bookmark-active-tab', {});
                browserClient.close_popup();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#edit_item
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * Triggered once someone click the edit item in the panel
             *
             * @param {object} item The item one has clicked on
             */
            function edit_item(item) {
                browserClient.open_tab('index.html#!/datastore/edit/'+item.type+'/'+item.secret_id);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#filterBySearch
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * Filterfunction that filters search_entry object and tests if either the urlfilter or the name match our search
             *
             * @param datastore_entry the datastore entry to test
             *
             * @returns {boolean}
             */
            function filterBySearch(datastore_entry) {
                if (!$scope.datastore.search) {
                    // Hide all entries if we have not typed anything into the "search datastore..." field
                    return false;
                }
                // check if either the name or the urlfilter of our entry match our search input of the
                // "search datastore..." field
                return password_filter(datastore_entry);
            }

        }]
    );
}(angular));