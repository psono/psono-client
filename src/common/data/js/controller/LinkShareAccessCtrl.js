(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:LinkShareAccessCtrl
     * @requires $scope
     * @requires $routeParams
     * @requires $filter
     * @requires psonocli.itemBlueprint
     * @requires psonocli.browserClient
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     *
     * @description
     * Controller for download-file.html
     */
    angular.module('psonocli').controller('LinkShareAccessCtrl', ['$scope', '$q', '$routeParams', '$filter', 'managerLinkShare',
        'managerFileTransfer', 'itemBlueprint', 'browserClient', 'managerDatastoreUser', 'managerHost', 'helper', 'converter',
        function ($scope, $q, $routeParams, $filter, managerLinkShare,
                  managerFileTransfer, itemBlueprint, browserClient, managerDatastoreUser, managerHost , helper, converter) {

            $scope.state = {
                passphrase_required: false,
                passphrase: null,
                open_requests: 0,
                closed_request: 0,
                percentage_complete: 0,
                next_step: '',
                processing: false
            };
            $scope.errors = [];
            $scope.view = 'default';

            $scope.initiate_link_share_access = initiate_link_share_access;
            $scope.select_server = select_server;
            $scope.changing = changing;

            activate();


            var server_selected = $q.defer();

            function activate(){

                var onSuccess = function(config) {
                    var persistent_server = managerDatastoreUser.get_default('server');

                    $scope.allow_custom_server = !config.hasOwnProperty('allow_custom_server') || (config.hasOwnProperty('allow_custom_server') && config['allow_custom_server']);

                    /* Server selection with preselection */
                    $scope.servers = config['backend_servers'];
                    $scope.filtered_servers = $scope.servers;
                    if (persistent_server) {
                        select_server(persistent_server);
                    } else {
                        select_server($scope.servers[0]);
                    }
                    server_selected.resolve();
                };

                var onError = function(data) {
                    console.log(data);
                };

                browserClient.get_config().then(onSuccess, onError);

                managerFileTransfer.register('download_started', function(max){
                    $scope.state.processing = true;
                    $scope.state.open_requests = max + 1;
                });

                managerFileTransfer.register('download_step_complete', function(next_step){
                    $scope.state.closed_request = $scope.state.closed_request + 1;
                    $scope.state.percentage_complete = Math.round($scope.state.closed_request / $scope.state.open_requests * 1000) / 10;
                    $scope.state.next_step = next_step;
                });

                managerFileTransfer.register('download_complete', function() {
                    $scope.state.closed_request = $scope.state.closed_request + 1;
                    $scope.state.percentage_complete = 100;
                    $scope.state.processing = true;
                    $scope.state.next_step = 'DOWNLOAD_COMPLETED';
                });

                $scope.$on('$routeChangeSuccess', function() {
                    server_selected.promise.then(function() {
                        if ($scope.allow_custom_server) {
                            var server_url = converter.decode_utf8(converter.from_base58($routeParams.backend_server_url));
                            changing(server_url);
                        }
                        initiate_link_share_access();
                    });
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LinkShareAccessCtrl#select_server
             * @methodOf psonocli.controller:LinkShareAccessCtrl
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
             * @name psonocli.controller:LinkShareAccessCtrl#changing
             * @methodOf psonocli.controller:LinkShareAccessCtrl
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
             * @name psonocli.controller:LinkShareAccessCtrl#load_default_view
             * @methodOf psonocli.controller:LinkShareAccessCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the "Approve new server" dialog
             */
            function load_default_view() {
                $scope.view = 'default';
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LinkShareAccessCtrl#verify_server_signature
             * @methodOf psonocli.controller:LinkShareAccessCtrl
             *
             * @description
             * Triggers the actual login
             *
             * @param server_check
             */
            function verify_server_signature(server_check) {
                return $q(function(resolve, reject) {

                    $scope.approve_new_server = function () {
                        load_default_view();
                        managerHost.approve_host(server_check['server_url'], server_check['verify_key']);
                        return resolve(true);
                    };

                    $scope.disapprove_new_server = function () {
                        load_default_view();
                        return resolve(false);
                    };

                    if (server_check['status'] === 'matched') {
                        return resolve(true);

                    } else if (server_check['status'] === 'new_server') {
                        $scope.newServerFingerprint = server_check['verify_key'];
                        $scope.view = 'new_server';
                        $scope.errors = [];

                    } else if (server_check['status'] === 'signature_changed') {
                        $scope.view = 'signature_changed';
                        $scope.changedFingerprint = server_check['verify_key'];
                        $scope.oldFingerprint = server_check['verify_key_old'];
                        $scope.errors = [];
                    }

                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LinkShareAccessCtrl#link_share_access
             * @methodOf psonocli.controller:LinkShareAccessCtrl
             *
             * @description
             * Triggered automatically on route params change and when someone hits the send button
             */
            function link_share_access() {

                $scope.errors = [];

                $scope.state.open_requests = 1;
                $scope.state.closed_request = 0;
                $scope.state.percentage_complete = 0;
                $scope.state.next_step ='DECRYPTING';
                $scope.state.processing = true;

                var onSuccess = function(data) {
                    $scope.state.open_requests = 1;
                    $scope.state.closed_request = 1;
                    $scope.state.percentage_complete = 100;
                    $scope.state.next_step ='DOWNLOAD_COMPLETED';
                };

                var onError = function(data) {
                    reset();
                    if (data.hasOwnProperty('non_field_errors')) {
                        if (data.non_field_errors.length === 1 && data.non_field_errors[0] === 'PASSPHRASE_REQUIRED') {
                            $scope.state.passphrase_required = true;
                            return;
                        }

                        $scope.errors = data.non_field_errors;
                        $scope.state.next_step = '';
                        $scope.state.processing = false;
                    } else {
                        console.log(data);
                        $scope.errors = [data];
                    }
                };
                return managerLinkShare.link_share_access($routeParams.link_share_id, $routeParams.link_share_secret, $scope.state.passphrase).then(onSuccess, onError);
            }



            /**
             * @ngdoc
             * @name psonocli.controller:LinkShareAccessCtrl#initiate_link_share_access
             * @methodOf psonocli.controller:LinkShareAccessCtrl
             *
             * @description
             * Triggered automatically on route params change and when someone hits the send button
             *
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
             */
            function initiate_link_share_access(remember, trust_device, two_fa_redirect) {

                var onError = function() {
                    $scope.errors = ['Server offline.']
                };

                var onSuccess = function(server_check) {

                    var onError = function() {
                        // pass
                    };

                    var onSuccess = function(continue_login) {

                        return link_share_access();
                    };
                    verify_server_signature(server_check).then(onSuccess, onError);
                };
                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:LinkShareAccessCtrl#reset
             * @methodOf psonocli.controller:LinkShareAccessCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the modal
             */
            function reset() {
                $scope.state.open_requests = 0;
                $scope.state.closed_request = 0;
                $scope.state.percentage_complete = 0;
                $scope.state.next_step ='';
                $scope.state.processing = false;
            }
        }]);

}(angular));