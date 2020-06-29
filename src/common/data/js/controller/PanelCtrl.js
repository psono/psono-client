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
     * @requires psonocli.managerWidget
     * @requires psonocli.browserClient
     * @requires psonocli.offlineCache
     * @requires psonocli.helper
     * @requires $window
     * @requires $uibModal
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for the panel
     */
    angular.module('psonocli').controller('PanelCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'manager',
        'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'managerWidget', 'browserClient',
        'offlineCache', 'helper', '$window', '$uibModal', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, manager,
                  managerDatastorePassword, managerDatastoreUser, managerSecret, managerWidget, browserClient,
                  offlineCache, helper, $window, $uibModal, $route, $routeParams, $location) {

            var password_filter;

            $scope.open_tab = browserClient.open_tab;
            $scope.logout = managerDatastoreUser.logout;
            $scope.filterBySearch = filterBySearch;
            $scope.on_item_click = on_item_click;
            $scope.edit_item = edit_item;
            $scope.generate_password = generate_password;
            $scope.bookmark = bookmark;
            $scope.copy_username = managerSecret.copy_username;
            $scope.copy_password = managerSecret.copy_password;
            $scope.item_icon = managerWidget.item_icon;

            $scope.searchArray = [];
            $scope.datastore = {
                search: '',
                filteredSearcArray: []
            };

            activate();

            function activate() {

                show_setup_2fa_link();
                managerDatastoreUser.on('two_fa_activate', show_setup_2fa_link);

                manager.storage_on('datastore-password-leafs', 'update', function (ele) {
                    //console.log("main.js update");
                    //console.log(ele);
                });

                manager.storage_on('datastore-file-leafs', 'update', function (ele) {
                    //console.log("main.js update");
                    //console.log(ele);
                });


                manager.storage_on('datastore-password-leafs', 'insert', function (ele) {
                    //console.log("main.js insert");
                    $scope.searchArray.push(ele);
                });


                manager.storage_on('datastore-file-leafs', 'insert', function (ele) {
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


                manager.storage_on('datastore-file-leafs', 'delete', function (ele) {
                    //console.log("main.js update");
                    //console.log(ele);
                    for (var i = $scope.searchArray.length - 1; i >= 0; i--) {
                        if ($scope.searchArray[i].key === ele.key) {
                            $scope.searchArray.splice(i, 1);
                        }
                    }
                });

                if (offlineCache.is_active() && offlineCache.is_locked()) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal/unlock-offline-cache.html',
                        controller: 'ModalUnlockOfflineCacheCtrl',
                        backdrop: 'static',
                        resolve: {
                        }
                    });

                    modalInstance.result.then(function () {
                        // pass, will be catched later with the on_set_encryption_key event
                    }, function () {
                        $rootScope.$broadcast('force_logout', '');
                    });
                    offlineCache.on_set_encryption_key(function() {
                        managerDatastorePassword.get_password_datastore();
                        modalInstance.close();
                    })
                } else {
                    managerDatastorePassword.get_password_datastore();
                }

                var filterTimeout;
                $scope.$watch('datastore.search', function (value) {
                    if (filterTimeout) {
                        $timeout.cancel(filterTimeout);
                    }
                    filterTimeout = $timeout(function() {
                        password_filter = helper.get_password_filter(value);
                    }, 250); // delay 250 ms
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#show_setup_2fa_link
             * @methodOf psonocli.controller:PanelCtrl
             *
             * @description
             * Checks the 2fa status and shows the link to setup 2fa if needed.
             */
            function show_setup_2fa_link() {
                var is_logged_in = managerDatastoreUser.is_logged_in();
                var require_two_fa_setup = managerDatastoreUser.require_two_fa_setup();
                $scope.show_2fa_button = is_logged_in && require_two_fa_setup;
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
                var password = managerDatastorePassword.generate();
                browserClient.copy_to_clipboard(password);

                browserClient.emit_sec('save-password-active-tab', {'password': password});
                browserClient.emit_sec('fillpassword-active-tab', {'password': password});
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
             * @param {object} datastore_entry the datastore entry to test
             *
             * @returns {boolean} Whether the urlfilter or name match
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

            /**
             * @ngdoc
             * @name psonocli.controller:PanelCtrl#on_item_click
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * Triggered once someone clicks an item
             *
             * @param {object} item The item to open
             */
            function on_item_click(item) {
                managerSecret.on_item_click(item)
            }

        }]
    );
}(angular));