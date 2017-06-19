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
    angular.module('psonocli').controller('SettingsCtrl', ['$scope', '$routeParams', '$location', 'settings', 'managerDatastoreSetting',
        function ($scope, $routeParams, $location, settings, managerDatastoreSetting) {

            $scope.tabs = settings.get_tabs();
            $scope.save = save;

            $scope.open_tab = open_tab;

            activate();

            function activate() {
                var onSuccess = function () {
                    $scope.settings = settings.get_settings();
                };

                var onError = function () {
                    alert("Error, should not happen.");
                };

                managerDatastoreSetting.get_settings_datastore().then(onSuccess, onError);
                open_linked_tab()
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

            /**
             * @ngdoc
             * @name psonocli.controller:SettingsCtrl#open_linked_tab
             * @methodOf psonocli.controller:SettingsCtrl
             *
             * @description
             * Triggered once someone selects a different tab with the slug of the new selected tab.
             * Will update the history of the browser.
             *
             * @param {string} slug The slug of the tab that was opened
             */
            function open_tab(slug) {
                if(typeof($routeParams.tab_slug) === 'undefined') {
                    $location.path('/settings/' + settings.get_default_tab()).replace();
                } else {
                    $location.path('/settings/' + slug);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:SettingsCtrl#open_linked_tab
             * @methodOf psonocli.controller:SettingsCtrl
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
        }]
    );
}(angular));