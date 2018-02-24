(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:MainCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires psonocli.account
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerSecret
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     *
     * @description
     * Controller for main view
     */
    angular.module('psonocli').controller('MainCtrl', ['$scope', '$rootScope', '$filter', '$timeout', 'account',
        'managerDatastorePassword', 'managerDatastoreUser', 'managerDatastore', 'managerSecret', 'browserClient',
        'storage', 'snapRemote', '$window', '$route', '$routeParams', '$location', '$uibModal',
        function ($scope, $rootScope, $filter, $timeout, account,
                  managerDatastorePassword, managerDatastoreUser, managerDatastore, managerSecret, browserClient,
                  storage, snapRemote, $window, $route, $routeParams, $location, $uibModal) {


            $scope.open_tab = browserClient.open_tab;
            $scope.create_new_datastore = create_new_datastore;
            $scope.get_link_state = get_link_state;
            $scope.logout = managerDatastoreUser.logout;
            $scope.on_item_click = managerSecret.on_item_click;
            $scope.on_datastore_switch_click = on_datastore_switch_click;

            $scope.user_username = account.get_account_detail('user_username');
            $scope.messages = [];
            $scope.data_stores=[];

            /* test background page */
            //console.log(browserClient.test_background_page());

            activate();

            function activate() {
                browserClient.load_version().then(function(version) {
                    $scope.version = version;
                });
                managerDatastore.register('on_datastore_overview_update', refresh_datastore_dropdown);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherDatastoreCtrl#create_new_datastore
             * @methodOf psonocli.controller:OtherDatastoreCtrl
             *
             * @description
             * Creates a new datastore
             */
            function create_new_datastore() {


                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-create-datastore.html',
                    controller: 'ModalCreateDatastoreCtrl',
                    resolve: {}
                });

                modalInstance.result.then(function (form) {

                    var onError = function(result) {
                        // pass
                    };

                    var onSuccess = function(result) {
                        refresh_datastore_dropdown();
                    };

                    return managerDatastore.create_datastore('password', form['description'], form['is_default'])
                        .then(onSuccess, onError);

                }, function () {
                    // cancel triggered
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherDatastoreCtrl#refresh_datastore_dropdown
             * @methodOf psonocli.controller:OtherDatastoreCtrl
             *
             * @description
             * Loads the datastore dropdown menu and is triggered whenever a new datastore_overview is available.
             */
            function refresh_datastore_dropdown() {
                managerDatastore.get_datastore_overview().then(function (overview) {
                    $scope.data_stores=[];
                    for (var i = 0; i < overview.data.datastores.length; i++) {
                        if (overview.data.datastores[i]['type'] === 'password') {
                            $scope.data_stores.push(overview.data.datastores[i]);
                        }
                    }
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:OtherDatastoreCtrl#on_datastore_switch_click
             * @methodOf psonocli.controller:OtherDatastoreCtrl
             *
             * @description
             * Triggered if someone clicks on one of the elements of the datastore dropdown menu and promotes (maybe) a
             * new datastore to be default.
             *
             * @param {object} datastore The datastore
             */
            function on_datastore_switch_click(datastore) {
                managerDatastore.save_datastore_meta(datastore.id, datastore.description, true);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:MainCtrl#get_link_state
             * @methodOf psonocli.controller:MainCtrl
             *
             * @description
             * Returns the link state ('active' or '')
             * for navigation, can maybe moved to another controller
             *
             * @param {string} path The current path
             */
            function get_link_state(path) {
                if (path === '/' && $location.path().length === 1) {
                    return 'active';
                } else if (path !== '/' && $location.path().substr(0, path.length) === path) {
                    return 'active';
                } else {
                    return '';
                }
            }
        }]
    );
}(angular));