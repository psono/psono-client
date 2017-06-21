(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:AccountCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $location
     * @requires psonocli.account
     *
     * @description
     * Controller for the Account view
     */
    angular.module('psonocli').controller('AccountCtrl', ['$scope', '$routeParams', '$location', 'account',
        function ($scope, $routeParams, $location, account) {


            $scope.account = account.get_account();
            $scope.tabs = account.get_tabs();
            $scope.save = save;

            $scope.open_tab = open_tab;

            activate();
            function activate() {
                open_linked_tab()
            }

            /**
             * @ngdoc
             * @name psonocli.controller:AccountCtrl#open_linked_tab
             * @methodOf psonocli.controller:AccountCtrl
             *
             * @description
             * Triggered once someone selects a different tab with the slug of the new selected tab.
             * Will update the history of the browser.
             *
             * @param {string} slug The slug of the tab that was opened
             */
            function open_tab(slug) {
                if(typeof($routeParams.tab_slug) === 'undefined') {
                    $location.path('/account/' + account.get_default_tab()).replace();
                } else {
                    $location.path('/account/' + slug);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:AccountCtrl#open_linked_tab
             * @methodOf psonocli.controller:AccountCtrl
             *
             * @description
             * Called during the activation of the tab. Selects the correct tab according to the provided slug.
             */
            function open_linked_tab() {
                if(typeof($routeParams.tab_slug) === 'undefined') {
                    return;
                }
                for (var i = 0; i < $scope.tabs.length; i++) {
                    if ($scope.tabs[i]['key'] !== $routeParams.tab_slug) {
                        continue;
                    }
                    $scope.active_tab = i;
                    break
                }
            }



            /**
             * @ngdoc
             * @name psonocli.controller:AccountCtrl#save
             * @methodOf psonocli.controller:AccountCtrl
             *
             * @description
             * Triggered once someone clicks the save button
             */
            function save () {

                var onSuccess = function (data) {
                    $scope.msgs = data.msgs;
                    $scope.errors = [];
                };
                var onError = function (data) {
                    $scope.msgs = [];
                    $scope.errors = data.errors;
                };

                account.save().then(onSuccess, onError)
            }
        }]
    );
}(angular));