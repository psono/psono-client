(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:AccountCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.account
     *
     * @description
     * Controller for the Account view
     */
    angular.module('psonocli').controller('AccountCtrl', ['$scope', '$routeParams', 'account',
        function ($scope, $routeParams, account) {


            $scope.account = account.get_account();
            $scope.tabs = account.get_tabs();
            $scope.save = save;

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