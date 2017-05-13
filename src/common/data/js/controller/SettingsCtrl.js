(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:SettingsCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires psonocli.settings
     * @requires psonocli.managerDatastoreSetting
     *
     * @description
     * Controller for the Settings view
     */
    angular.module('psonocli').controller('SettingsCtrl', ['$scope', '$routeParams', 'settings', 'managerDatastoreSetting',
        function ($scope, $routeParams, settings, managerDatastoreSetting) {

            $scope.save = save;
            $scope.tabs = settings.get_tabs();

            activate();

            function activate() {
                var onSuccess = function () {
                    $scope.settings = settings.get_settings();
                };

                var onError = function () {
                    alert("Error, should not happen.");
                };

                managerDatastoreSetting.get_settings_datastore().then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:SettingsCtrl#save
             * @methodOf psonocli.controller:SettingsCtrl
             *
             * @description
             * Triggered once someone clicks the save button
             */
            function save() {

                var onSuccess = function (data) {
                    $scope.msgs = data.msgs;
                    $scope.errors = [];
                };
                var onError = function (data) {
                    $scope.msgs = [];
                    $scope.errors = data.errors;
                };

                settings.save().then(onSuccess, onError)
            }
        }]
    );
}(angular));