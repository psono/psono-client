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
        'managerDatastorePassword', 'managerDatastoreUser', 'managerSecret', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location',
        function ($scope, $rootScope, $filter, $timeout, account,
                  managerDatastorePassword, managerDatastoreUser, managerSecret, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location ) {


            $scope.open_tab = browserClient.open_tab;
            $scope.get_link_state = get_link_state;
            $scope.logout = managerDatastoreUser.logout;
            $scope.on_item_click = managerSecret.on_item_click;

            $scope.user_username = account.get_account_detail('user_username');
            $scope.messages = [];

            /* test background page */
            //console.log(browserClient.test_background_page());

            activate();

            function activate() {
                browserClient.load_version().then(function(version) {
                    $scope.version = version;
                });
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
                if (path === '/' && $location.path().length === 0) {
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