(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:Enforce2FaCtrl
     * @requires $scope
     * @requires psonocli.account
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for the registration view
     */
    angular.module('psonocli').controller('Enforce2FaCtrl', ['$scope', '$window', 'account', 'managerDatastoreUser', 'helper',
        function ($scope, $window, account, managerDatastoreUser, helper) {

            $scope.account = {};
            $scope.fields = [];
            $scope.logout = logout;

            activate();

            function activate() {

                handle_two_fa_set();
                managerDatastoreUser.on('two_fa_activate', handle_two_fa_set);

                $scope.account = account.get_account();
                var fields = $scope.account.fields;
                helper.remove_from_array(fields, 'multifactor-authentication', function(field, b){
                    return field['tab'] !== b;
                });
                $scope.fields = fields;
            }

            /**
             * @ngdoc
             * @name psonocli.controller:Enforce2FaCtrl#handle_two_fa_set
             * @methodOf psonocli.controller:Enforce2FaCtrl
             *
             * @description
             * Will redirect the user to index.html if a two factor is already set
             */
            function handle_two_fa_set() {
                var require_two_fa_setup = managerDatastoreUser.require_two_fa_setup();
                if (!require_two_fa_setup) {
                    $window.location.href = 'index.html';
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:Enforce2FaCtrl#logout
             * @methodOf psonocli.controller:Enforce2FaCtrl
             *
             * @description
             * Triggered once the user clicks the logout button
             */
            function logout() {
                managerDatastoreUser.logout();
                $window.location.href = 'index.html';
            }


        }]
    );
}(angular));