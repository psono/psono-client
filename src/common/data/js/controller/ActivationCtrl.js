(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ActivationCtrl
     * @requires $scope
     * @requires $route
     * @requires $routeParams
     * @requires $filter
     * @requires $location
     * @requires $timeout
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.helper
     *
     * @description
     * Controller for the activation view
     */
    angular.module('psonocli').controller('ActivationCtrl', ['$scope', '$route', '$routeParams', '$filter', '$location', '$timeout',
        'managerDatastoreUser', 'browserClient', 'helper',
        function ($scope, $route, $routeParams, $filter, $location, $timeout, managerDatastoreUser,
                  browserClient, helper) {


            $scope.select_server = select_server;
            $scope.changing = changing;
            $scope.activate_code = activate_code;

            activate();

            function activate() {

                var onSuccess = function(config) {

                    // TODO interpret "allow_custom_server"
                    // TODO check last visited server for "preselection"

                    /* Server selection with preselection */
                    $scope.servers = config['backend_servers'];
                    $scope.filtered_servers = $scope.servers;
                    $scope.selected_server = $scope.servers[0];
                    $scope.selected_server_title = $scope.selected_server.title;
                    $scope.selected_server_url = $scope.selected_server.url;
                    $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
                    if ($scope.selected_server.domain) {
                        $scope.selected_server_domain = $scope.selected_server.domain;
                    } else {
                        $scope.selected_server_domain = helper.get_domain($scope.selected_server.url);
                    }
                };

                var onError = function() {

                };

                browserClient.get_config().then(onSuccess, onError);

                browserClient.get_base_url().then(function(base_url){
                    $scope.base_url = base_url;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivationCtrl#select_server
             * @methodOf psonocli.controller:ActivationCtrl
             *
             * @description
             * Select a server from the offered choices
             *
             * @param {object} server The selected server
             */
            function select_server(server) {
                //triggered when selecting an server
                $scope.selected_server = server;
                $scope.selected_server_title = server.title;
                $scope.selected_server_url = server.url;
                if (server.domain) {
                    $scope.selected_server_domain = server.domain;
                } else {
                    $scope.selected_server_domain = helper.get_domain(server.url);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivationCtrl#changing
             * @methodOf psonocli.controller:ActivationCtrl
             *
             * @description
             * Triggered automatically once someone types something into the "Server" Field
             *
             * @param {url} url The typed url
             */
            function changing(url) {
                //triggered when typing an url
                $scope.selected_server = {title: url, url: url};
                $scope.selected_server_url = url;
                $scope.selected_server_domain = helper.get_domain(url);
                $scope.filtered_servers = $filter('filter')($scope.servers, {url: url});
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivationCtrl#activate_code
             * @methodOf psonocli.controller:ActivationCtrl
             *
             * @description
             * Triggered either automatically or by pressing the activate button
             *
             * @param {string} activation_code The activation code
             */
            function activate_code (activation_code) {

                function onError() {
                    alert("Error, should not happen.");
                }

                function onSuccess(data) {
                    $scope.errors = [];
                    $scope.msgs = [];
                    if (data.response === "success") {
                        $scope.msgs.push('Successful, please login.');
                        $scope.success = true;
                    } else {
                        if (data.error_data === null) {
                            $scope.errors.push('Server offline.');
                        } else {
                            for (var property in data.error_data) {
                                if (data.error_data.hasOwnProperty(property)) {
                                    for (var i = 0; i < data.error_data[property].length; i++) {
                                        $scope.errors.push(data.error_data[property][i]);
                                    }
                                }
                            }
                        }
                    }
                }

                if (activation_code !== undefined) {
                    managerDatastoreUser.activate_code(activation_code, angular.copy($scope.selected_server))
                        .then(onSuccess, onError);
                }
            }

            /* preselected values */
            $scope.$on('$routeChangeSuccess', function () {
                $scope.activationFormKey = $routeParams['activation_code'];
                if ($routeParams.hasOwnProperty('activation_code') && $routeParams['activation_code'].length > 0) {
                    $timeout(function(){
                        activate_code($routeParams['activation_code']);
                    },200);
                }
            });
        }]
    );
}(angular));