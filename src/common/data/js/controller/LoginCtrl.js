(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:LoginCtrl
     * @requires $scope
     * @requires $rootScope
     * @requires $filter
     * @requires $timeout
     * @requires snapRemote
     * @requires $window
     * @requires $route
     * @requires $routeParams
     * @requires $location
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.storage
     * @requires psonocli.helper
     *
     * @description
     * Controller for the Login view
     */
    angular.module('psonocli').controller('LoginCtrl', ['$scope', '$sce', '$templateRequest', '$templateCache', '$rootScope', '$filter', '$timeout',
        'managerDatastoreUser', 'managerHost', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location', 'helper',
        function ($scope, $sce, $templateRequest, $templateCache, $rootScope, $filter, $timeout,
                  managerDatastoreUser, managerHost, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location, helper) {

            $scope.select_server = select_server;
            $scope.changing = changing;
            $scope.ga_verify = ga_verify;
            $scope.yubikey_otp_verify = yubikey_otp_verify;
            $scope.login = login;
            $scope.load_default_view = load_default_view;

            $scope.open_tab = browserClient.open_tab;
            $scope.view = 'default';

            /* test background page */
            //console.log(browserClient.test_background_page());

            activate();

            function activate() {
                var onSuccess = function(config) {
                    var persistent_username = managerDatastoreUser.get_default('username');
                    var persistent_server = managerDatastoreUser.get_default('server');
                    var persistent_trust_device = managerDatastoreUser.get_default('trust_device');

                    /* preselected values */
                    $scope.loginFormUsername = persistent_username;
                    // $scope.loginFormPassword = "myPassword";
                    $scope.loginFormRemember = persistent_username !== "";
                    $scope.loginFormTrustDevice = persistent_trust_device === true;

                    // TODO interpret "allow_custom_server"

                    if (config.hasOwnProperty("default_username")) {
                        $scope.loginFormUsername = config['default_username'];
                    }
                    if (config.hasOwnProperty("default_password")) {
                        $scope.loginFormPassword = config['default_password'];
                    }

                    /* Server selection with preselection */
                    $scope.servers = config['backend_servers'];
                    $scope.filtered_servers = $scope.servers;
                    if (persistent_server) {
                        select_server(persistent_server);
                    } else {
                        select_server($scope.servers[0]);
                    }
                };

                var onError = function() {

                };

                browserClient.get_config().then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#select_server
             * @methodOf psonocli.controller:LoginCtrl
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
                $scope.selected_server_domain = helper.get_domain(server.url);

                if(helper.endsWith($scope.loginFormUsername, '@' + $scope.selected_server_domain)) {
                    $scope.loginFormUsername = $scope.loginFormUsername.slice(0, - ('@' + $scope.selected_server_domain).length);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#changing
             * @methodOf psonocli.controller:LoginCtrl
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

                if(helper.endsWith($scope.loginFormUsername, '@' + $scope.selected_server_domain)) {
                    $scope.loginFormUsername = $scope.loginFormUsername.slice(0, - ('@' + $scope.selected_server_domain).length);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#ga_verify
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the "Send" Button on the google authenticator request screen
             *
             * @param {string} ga_token The GA Token
             */
            function ga_verify(ga_token) {

                if (typeof(ga_token) === 'undefined' || ga_token.length !== 6) {
                    // Dont do anything if the token is not 6 digits long
                    // because the html5 form validation will tell the user
                    // whats wrong
                    return;
                }

                var onError = function(data) {
                    console.log(data);
                    if (data.error_data === null) {
                        $scope.errors = ['Server offline.']
                    } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.error_data.non_field_errors;
                    } else if (data.error_data.hasOwnProperty('username')) {
                        $scope.errors = data.error_data.username;
                    } else {
                        $scope.errors = ['Server offline.']
                    }
                };

                var onSuccess = function(required_multifactors) {
                    return next_login_step(required_multifactors);
                };

                managerDatastoreUser.ga_verify(ga_token, angular.copy($scope.selected_server)).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#yubikey_otp_verify
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the "Send" Button on the YubiKey OTP request screen
             *
             * @param {string} yubikey_otp_token The Yubikey OTP Token
             */
            function yubikey_otp_verify(yubikey_otp_token) {

                if (typeof(yubikey_otp_token) === 'undefined') {
                    // Dont do anything if the token is not 6 digits long
                    // because the html5 form validation will tell the user
                    // whats wrong
                    return;
                }

                var onError = function(data) {
                    console.log(data);
                    if (data.error_data === null) {
                        $scope.errors = ['Server offline.']
                    } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.error_data.non_field_errors;
                    } else if (data.error_data.hasOwnProperty('username')) {
                        $scope.errors = data.error_data.username;
                    } else if (data.error_data.hasOwnProperty('detail')) {
                        $scope.errors = [data.error_data.detail];
                    } else {
                        $scope.errors = ['Server offline.']
                    }
                };

                var onSuccess = function(required_multifactors) {
                    return next_login_step(required_multifactors);
                };

                managerDatastoreUser.yubikey_otp_verify(yubikey_otp_token, angular.copy($scope.selected_server)).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#next_login_step
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button
             *
             * @param {array} required_multifactors The username
             */
            function next_login_step(required_multifactors) {
                $scope.errors = [];

                if (required_multifactors.length === 0) {

                    var onError = function(data) {
                        console.log(data);
                        if (data.error_data === null) {
                            $scope.errors = ['Server offline.']
                        } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                            $scope.errors = data.error_data.non_field_errors;
                        } else if (data.error_data.hasOwnProperty('username')) {
                            $scope.errors = data.error_data.username;
                        } else {
                            $scope.errors = ['Server offline.']
                        }
                    };

                    var onSuccess = function(data) {
                        $scope.errors = [];
                    };

                    return managerDatastoreUser.activate_token().then(onSuccess, onError);
                }

                var multifactor_method = required_multifactors.shift();

                if (multifactor_method === 'google_authenticator_2fa') {
                    $scope.view = 'google_authenticator_2fa';

                } else if (multifactor_method === 'yubikey_otp_2fa') {
                    $scope.view = 'yubikey_otp_2fa';
                } else {
                    alert('Unknown Multifactor Method requested. Please upgrade your client.')
                }
            }


            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the "Approve new server" dialog
             */
            function load_default_view() {
                $scope.view = 'default';
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button
             *
             * @param {string} username The username
             * @param {string} password The password
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             */
            function login(username, password, remember, trust_device) {
                if (username === undefined || password === undefined) {
                    // Dont do anything if username or password is wrong,
                    // because the html5 form validation will tell the user
                    // whats wrong
                    return;
                }

                var onError = function() {
                    $scope.errors = ['Server offline.']
                };

                var onSuccess = function(server_check) {

                    var onSuccess = function(required_multifactors) {
                        return next_login_step(required_multifactors);
                    };


                    var onError = function(data) {
                        $scope.view = 'default';

                        if (data.error_data === null) {
                            $scope.errors = ['Server offline.']
                        } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                            $scope.errors = data.error_data.non_field_errors;
                        } else if (data.error_data.hasOwnProperty('username')) {
                            $scope.errors = data.error_data.username;
                        } else {
                            $scope.errors = ['Server offline.']
                        }
                    };

                    var really_login = function() {
                        managerDatastoreUser.login(username, $scope.selected_server_domain, password, remember, trust_device,
                            angular.copy($scope.selected_server), server_check['info']['public_key'])
                            .then(onSuccess, onError);
                    };

                    $scope.approve_new_server = function() {
                        managerHost.approve_host(server_check['server_url'], server_check['verify_key']);
                        really_login()
                    };

                    if (server_check['status'] === 'matched') {
                        really_login()
                    } else if (server_check['status'] === 'new_server') {
                        $scope.newServerFingerprint = server_check['verify_key'];
                        $scope.view = 'new_server';
                        $scope.errors = [];

                    } else if(server_check['status'] === 'signature_changed') {
                        $scope.view = 'signature_changed';
                        $scope.changedFingerprint = server_check['verify_key'];
                        $scope.oldFingerprint = server_check['verify_key_old'];
                        $scope.errors = [];
                    }
                };

                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);

            }
        }]
    );
}(angular));