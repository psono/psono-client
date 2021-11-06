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
     * @requires psonocli.languagePicker
     *
     * @description
     * Controller for the Login view
     */
    angular.module('psonocli').controller('LoginCtrl', ['$scope', '$sce', '$templateRequest', '$templateCache', '$q',
        '$rootScope', '$filter', '$timeout',
        'managerDatastoreUser', 'managerHost', 'browserClient', 'storage',
        'snapRemote', '$window', '$route', '$routeParams', '$location', 'helper',
        function ($scope, $sce, $templateRequest, $templateCache, $q,
                  $rootScope, $filter, $timeout,
                  managerDatastoreUser, managerHost, browserClient, storage,
                  snapRemote, $window, $route, $routeParams, $location, helper) {

            $scope.saml_provider = [];
            $scope.oidc_provider = [];
            $scope.login_data = {
                multifactor_enabled: true
            };
            $scope.select_server = select_server;
            $scope.changing = changing;
            $scope.ga_verify = ga_verify;
            $scope.yubikey_otp_verify = yubikey_otp_verify;
            $scope.duo_verify = duo_verify;
            $scope.show_duo_2fa_form = show_duo_2fa_form;
            $scope.show_ga_2fa_form = show_ga_2fa_form;
            $scope.show_yubikey_otp_2fa_form = show_yubikey_otp_2fa_form;
            $scope.initiate_login = initiate_login;
            $scope.initiate_saml_login = initiate_saml_login;
            $scope.initiate_oidc_login = initiate_oidc_login;
            $scope.initiate_saml_login_new_tab = initiate_saml_login_new_tab;
            $scope.initiate_oidc_login_new_tab = initiate_oidc_login_new_tab;
            $scope.load_default_view = load_default_view;
            $scope.remote_config = remote_config;
            $scope.cancel = cancel;

            $scope.open_tab = browserClient.open_tab;
            $scope.view = 'default';

            var redirect_on_two_fa_missing;

            /* test background page */
            //console.log(browserClient.test_background_page());

            activate();

            function activate() {
                var onSuccess = function(config) {
                    return on_new_config_loaded(config);
                };

                var onError = function(data) {
                    console.log(data);
                };

                browserClient.get_config().then(onSuccess, onError);

                $scope.$on('$routeChangeSuccess', function () {
                    if (typeof($routeParams.saml_token_id) !== 'undefined') {
                        saml_login($routeParams.saml_token_id);
                        $location.path('/');
                    }
                    if (typeof($routeParams.oidc_token_id) !== 'undefined') {
                        oidc_login($routeParams.oidc_token_id);
                        $location.path('/');
                    }
                    on_potential_saml_autologin();
                    on_potential_oidc_autologin();
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#on_potential_saml_autologin
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Checks if an autologin for saml needs to be triggered
             */
            function on_potential_saml_autologin() {
                if (typeof($routeParams.saml_autologin_provider_id) === 'undefined') {
                    return
                }
                for (var i = 0; i < $scope.saml_provider.length; i++) {
                    if ($scope.saml_provider[i].provider_id.toString() !== $routeParams.saml_autologin_provider_id) {
                        continue;
                    }
                    initiate_saml_login($scope.saml_provider[i], $routeParams.remember === 'true', $routeParams.trust_device === 'true', $routeParams.two_fa_redirect === 'true')
                    $location.path('/');
                    return
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#on_potential_oidc_autologin
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Checks if an autologin for oidc needs to be triggered
             */
            function on_potential_oidc_autologin() {
                if (typeof($routeParams.oidc_autologin_provider_id) === 'undefined') {
                    return
                }
                for (var i = 0; i < $scope.oidc_provider.length; i++) {
                    if ($scope.oidc_provider[i].provider_id.toString() !== $routeParams.oidc_autologin_provider_id) {
                        continue;
                    }
                    initiate_oidc_login($scope.oidc_provider[i], $routeParams.remember === 'true', $routeParams.trust_device === 'true', $routeParams.two_fa_redirect === 'true')
                    $location.path('/');
                    return
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#on_config_loaded
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Callback function that is executed once the
             *
             * @param {object} config The config
             */
            function on_new_config_loaded(config) {
                var persistent_username = managerDatastoreUser.get_default('username');
                var persistent_server = managerDatastoreUser.get_default('server');
                var persistent_trust_device = managerDatastoreUser.get_default('trust_device');

                /* preselected values */
                $scope.login_data['username'] = persistent_username;
                //$scope.login_data['password'] = "myPassword";
                $scope.login_data['remember'] = persistent_username !== "";
                $scope.login_data['trust'] = persistent_trust_device === true;

                $scope.allow_custom_server = !config.hasOwnProperty('allow_custom_server') || (config.hasOwnProperty('allow_custom_server') && config['allow_custom_server']);
                $scope.allow_registration = !config.hasOwnProperty('allow_registration') || (config.hasOwnProperty('allow_registration') && config['allow_registration']);
                $scope.allow_lost_password = (!config.hasOwnProperty('allow_lost_password') || (config.hasOwnProperty('allow_lost_password') && config['allow_lost_password'])) && config['authentication_methods'].indexOf('AUTHKEY') !== -1
                $scope.authkey_enabled = config['authentication_methods'].indexOf('AUTHKEY') !== -1;
                $scope.ldap_enabled = config['authentication_methods'].indexOf('LDAP') !== -1;
                $scope.saml_enabled = config['authentication_methods'].indexOf('SAML') !== -1;
                $scope.oidc_enabled = config['authentication_methods'].indexOf('OIDC') !== -1;
                $scope.saml_provider = config['saml_provider'];
                $scope.oidc_provider = config['oidc_provider'];

                /* Server selection with preselection */
                $scope.servers = config['backend_servers'];
                $scope.filtered_servers = $scope.servers;

                if (persistent_server) {
                    select_server(persistent_server);
                } else {
                    select_server($scope.servers[0]);
                }
                on_potential_saml_autologin();
                on_potential_oidc_autologin();
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
                if (server.domain) {
                    $scope.selected_server_domain = server.domain;
                } else {
                    $scope.selected_server_domain = helper.get_domain(server.url);
                }

                if(helper.endsWith($scope.login_data.username, '@' + $scope.selected_server_domain)) {
                    $scope.login_data.username = $scope.login_data.username.slice(0, - ('@' + $scope.selected_server_domain).length);
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

                if(helper.endsWith($scope.login_data.username, '@' + $scope.selected_server_domain)) {
                    $scope.login_data.username = $scope.login_data.username.slice(0, - ('@' + $scope.selected_server_domain).length);
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
                    if (data.error_data === null) {
                        $scope.errors = ['SERVER_OFFLINE']
                    } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.error_data.non_field_errors;
                    } else if (data.error_data.hasOwnProperty('username')) {
                        $scope.errors = data.error_data.username;
                    } else {
                        $scope.errors = ['SERVER_OFFLINE']
                    }
                };

                var onSuccess = function(required_multifactors) {

                    var index = required_multifactors.indexOf('google_authenticator_2fa');
                    if (index !== -1) {
                        required_multifactors.splice(index, 1);
                    }

                    return next_login_step(required_multifactors, true);
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
                        $scope.errors = ['SERVER_OFFLINE']
                    } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.error_data.non_field_errors;
                    } else if (data.error_data.hasOwnProperty('username')) {
                        $scope.errors = data.error_data.username;
                    } else if (data.error_data.hasOwnProperty('detail')) {
                        $scope.errors = [data.error_data.detail];
                    } else {
                        $scope.errors = ['SERVER_OFFLINE']
                    }
                };

                var onSuccess = function(required_multifactors) {

                    var index = required_multifactors.indexOf('yubikey_otp_2fa');
                    if (index !== -1) {
                        required_multifactors.splice(index, 1);
                    }

                    return next_login_step(required_multifactors, true);
                };

                managerDatastoreUser.yubikey_otp_verify(yubikey_otp_token, angular.copy($scope.selected_server)).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#duo_verify
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered automatically if duo auth is required or once someone clicks the "Send" Button on the Duo request screen
             *
             * @param {string} [duo_token] (optional) The Duo Token
             */
            function duo_verify(duo_token) {

                var onError = function(data) {
                    console.log(data);
                    if (data.error_data === null) {
                        $scope.errors = ['SERVER_OFFLINE']
                    } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.error_data.non_field_errors;
                    } else if (data.error_data.hasOwnProperty('username')) {
                        $scope.errors = data.error_data.username;
                    } else if (data.error_data.hasOwnProperty('detail')) {
                        $scope.errors = [data.error_data.detail];
                    } else {
                        $scope.errors = ['SERVER_OFFLINE']
                    }
                };

                var onSuccess = function(required_multifactors) {

                    var index = required_multifactors.indexOf('duo_2fa');
                    if (index !== -1) {
                        required_multifactors.splice(index, 1);
                    }

                    return next_login_step(required_multifactors, true);
                };

                managerDatastoreUser.duo_verify(duo_token).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#cancel
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered if someone clicks abort
             */
            function cancel() {
                load_default_view();
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#remote_config
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered if someone clicks the "Remote Config" link in the footer
             */
            function remote_config(url) {

                var onError = function() {
                    $scope.errors = ['SERVER_OFFLINE']
                };

                var onSuccess = function(server_check) {

                    var onError = function(data) {
                        console.log(data);
                    };

                    var onSuccess = function(continue_login) {

                        var onError = function(data) {
                            console.log(data);
                        };

                        var onSuccess = function() {

                            var onError = function(data) {
                                console.log(data);
                            };

                            var onSuccess = function(config) {
                                return on_new_config_loaded(config);
                            };

                            browserClient.get_config().then(onSuccess, onError);
                        };
                        if (continue_login) {
                            load_default_view();
                            managerHost.load_remote_config(server_check["info"]["web_client"], server_check["server_url"]).then(onSuccess, onError);
                        }
                    };
                    verify_server_signature(server_check).then(onSuccess, onError);
                };
                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#show_duo_2fa_form
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Shows the 2FA form for duo
             */
            function show_duo_2fa_form() {
                duo_verify();
                $scope.view = 'duo_2fa'
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#show_ga_2fa_form
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Shows the 2FA form for Google Authenticator
             */
            function show_ga_2fa_form() {
                $scope.view = 'google_authenticator_2fa'
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#show_yubikey_otp_2fa_form
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Shows the 2FA form for Yubikey
             */
            function show_yubikey_otp_2fa_form() {
                $scope.view = 'yubikey_otp_2fa';
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
             * @param {boolean} solved_two_fa Wether one 2fa has been solved
             */
            function next_login_step(required_multifactors, solved_two_fa) {
                $scope.errors = [];
                $scope.login_data['required_multifactors'] = required_multifactors;

                if (required_multifactors.length === 0 || (solved_two_fa && $scope.login_data['multifactor_enabled'] === false)) {
                    var onError = function(data) {
                        console.log(data);
                        if (data.error_data === null) {
                            $scope.errors = ['SERVER_OFFLINE']
                        } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                            $scope.errors = data.error_data.non_field_errors;
                        } else if (data.error_data.hasOwnProperty('username')) {
                            $scope.errors = data.error_data.username;
                        } else {
                            $scope.errors = ['SERVER_OFFLINE']
                        }
                    };

                    var onSuccess = function(data) {
                        $scope.errors = [];
                        var require_two_fa_setup = managerDatastoreUser.require_two_fa_setup();
                        if (require_two_fa_setup && redirect_on_two_fa_missing) {
                            $window.location.href = 'enforce-two-fa.html';
                        }
                    };

                    return managerDatastoreUser.activate_token().then(onSuccess, onError);
                }

                if ($scope.login_data['multifactor_enabled'] === false && required_multifactors.length > 1) {
                    $scope.view = 'pick_second_factor';
                } else {
                    var multifactor_method = required_multifactors[0];

                    if (multifactor_method === 'google_authenticator_2fa') {
                        show_ga_2fa_form();
                    } else if (multifactor_method === 'yubikey_otp_2fa') {
                        show_yubikey_otp_2fa_form();
                    } else if (multifactor_method === 'duo_2fa') {
                        show_duo_2fa_form();
                    } else {
                        alert('Unknown Multifactor Method requested. Please upgrade your client.')
                    }
                }
            }


            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#load_default_view
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
             * @name psonocli.controller:LoginCtrl#verify_server_signature
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggers the actual login
             *
             * @param server_check
             */
            function verify_server_signature(server_check) {
                return $q(function(resolve, reject) {

                    $scope.approve_new_server = function () {
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
             * @name psonocli.controller:LoginCtrl#ask_send_plain
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Checks the server info if the Sever might need the plaintext password and asks the users if its ok or not
             *
             * @param server_check
             * @param disable_send_plain Param to disable any plain text password transmission
             *
             * @returns {promise} A promise with weather the client should send the plaintext password or not
             */
            function ask_send_plain(server_check, disable_send_plain) {

                function has_ldap_auth(server_check) {
                    return server_check.hasOwnProperty('info') && server_check['info'].hasOwnProperty('authentication_methods') && server_check['info']['authentication_methods'].indexOf('LDAP') !== -1
                }

                return $q(function(resolve, reject) {

                    if (!disable_send_plain && has_ldap_auth(server_check)) {

                        $scope.approve_send_plain = function () {
                            return resolve(true);
                        };

                        $scope.disapprove_send_plain = function () {
                            return resolve(false);
                        };

                        $scope.view = 'ask_send_plain';
                        $scope.errors = [];

                    } else {
                        return resolve(false);
                    }


                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#initiate_login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button and will initiate the login sequence
             *
             * @param {string} username The username
             * @param {string} password The password
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
             */
            function initiate_login(username, password, remember, trust_device, two_fa_redirect) {

                if (username === undefined || password === undefined) {
                    // Dont do anything if username or password is wrong,
                    // because the html5 form validation will tell the user
                    // whats wrong
                    return;
                }
                redirect_on_two_fa_missing = two_fa_redirect;

                var onError = function(response) {
                    if (response.data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = response.data.non_field_errors;
                    } else {
                        $scope.errors = ['SERVER_OFFLINE']
                    }
                };

                var onSuccess = function(server_check) {

                    if (server_check['info'].hasOwnProperty('multifactor_enabled')) {
                        $scope.login_data['multifactor_enabled'] = server_check['info']['multifactor_enabled'];
                    }

                    var onError = function() {
                        // pass
                    };

                    var onSuccess = function(continue_login) {

                        var onError = function() {
                            // pass
                        };

                        var onSuccess = function(send_plain) {

                            var onSuccess = function (required_multifactors) {
                                return next_login_step(required_multifactors);
                            };

                            var onError = function (data) {
                                $scope.view = 'default';
                                console.log(data);

                                if (data.error_data === null) {
                                    $scope.errors = ['SERVER_OFFLINE']
                                } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                                    $scope.errors = data.error_data.non_field_errors;
                                } else if (data.error_data.hasOwnProperty('username')) {
                                    $scope.errors = data.error_data.username;
                                } else {
                                    $scope.errors = ['SERVER_OFFLINE']
                                }
                            };

                            managerDatastoreUser.login(username, $scope.selected_server_domain, password, remember, trust_device,
                                angular.copy($scope.selected_server), server_check['info'], server_check['verify_key'], send_plain)
                                .then(onSuccess, onError);
                        };
                        if (continue_login) {
                            ask_send_plain(server_check, false).then(onSuccess, onError);
                        }
                    };
                    verify_server_signature(server_check).then(onSuccess, onError);
                };
                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#saml_login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone comes back from a redirect to a index.html#!/saml/token/... url
             * Will try to use the token to authenticate and login
             *
             * @param {string} saml_token_id The saml token id
             */
            function saml_login(saml_token_id) {


                var onSuccess = function(required_multifactors) {
                    return next_login_step(required_multifactors, false);
                };

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.non_field_errors;
                        $scope.view = 'default';
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                managerDatastoreUser.saml_login(saml_token_id).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#oidc_login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone comes back from an OIDC redirect
             * Will try to use the token to authenticate and login
             *
             * @param {string} oidc_token_id The saml token id
             */
            function oidc_login(oidc_token_id) {


                var onSuccess = function(required_multifactors) {
                    return next_login_step(required_multifactors, false);
                };

                var onError = function(data) {
                    if (data.hasOwnProperty('non_field_errors')) {
                        $scope.errors = data.non_field_errors;
                        $scope.view = 'default';
                    } else {
                        console.log(data);
                        alert("Error, should not happen.");
                    }
                };

                managerDatastoreUser.oidc_login(oidc_token_id).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#initiate_saml_login_new_tab
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button for a SAML provider in the panel and will initiate the
             * login sequence in a new tab
             *
             * @param {string} provider The provider config from config.json passed down
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
             */
            function initiate_saml_login_new_tab(provider, remember, trust_device, two_fa_redirect) {
                browserClient.open_tab('index.html#!/initiate-saml-login/'+provider.provider_id+'/'+(remember === true)+'/'+(trust_device === true)+'/'+(two_fa_redirect === true));
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#initiate_oidc_login_new_tab
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button for a OIDC provider in the panel and will initiate the
             * login sequence in a new tab
             *
             * @param {string} provider The provider config from config.json passed down
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
             */
            function initiate_oidc_login_new_tab(provider, remember, trust_device, two_fa_redirect) {
                browserClient.open_tab('index.html#!/initiate-oidc-login/'+provider.provider_id+'/'+(remember === true)+'/'+(trust_device === true)+'/'+(two_fa_redirect === true));
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#initiate_saml_login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button for a SAML provider and will initiate the login sequence
             *
             * @param {string} provider The provider config from config.json passed down
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
             */
            function initiate_saml_login(provider, remember, trust_device, two_fa_redirect) {

                redirect_on_two_fa_missing = two_fa_redirect;

                var onError = function() {
                    $scope.errors = ['SERVER_OFFLINE']
                };

                var onSuccess = function(server_check) {

                    var onError = function() {
                        // pass
                    };

                    var onSuccess = function(continue_login) {

                        var onError = function() {
                            // pass
                        };

                        var onSuccess = function(send_plain) {

                            var onSuccess = function (saml_token_id) {
                                // comes only here in extensions
                                if (saml_token_id) {
                                    return saml_login(saml_token_id);
                                }
                            };

                            var onError = function (data) {
                                $scope.view = 'default';
                                console.log(data);

                                if (data.error_data === null) {
                                    $scope.errors = ['SERVER_OFFLINE']
                                } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                                    $scope.errors = data.error_data.non_field_errors;
                                } else if (data.error_data.hasOwnProperty('username')) {
                                    $scope.errors = data.error_data.username;
                                } else {
                                    $scope.errors = ['SERVER_OFFLINE']
                                }
                            };

                            managerDatastoreUser.saml_initiate_login(provider, remember, trust_device,
                                angular.copy($scope.selected_server), server_check['info'], server_check['verify_key'])
                                .then(onSuccess, onError);
                        };
                        if (continue_login) {
                            ask_send_plain(server_check, true).then(onSuccess, onError);
                        }
                    };
                    verify_server_signature(server_check).then(onSuccess, onError);
                };
                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LoginCtrl#initiate_oidc_login
             * @methodOf psonocli.controller:LoginCtrl
             *
             * @description
             * Triggered once someone clicks the login button for a OIDC provider and will initiate the login sequence
             *
             * @param {string} provider The provider config from config.json passed down
             * @param {boolean|undefined} remember Remember username and server
             * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
             * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
             */
            function initiate_oidc_login(provider, remember, trust_device, two_fa_redirect) {

                redirect_on_two_fa_missing = two_fa_redirect;

                var onError = function() {
                    $scope.errors = ['SERVER_OFFLINE']
                };

                var onSuccess = function(server_check) {

                    var onError = function() {
                        // pass
                    };

                    var onSuccess = function(continue_login) {

                        var onError = function() {
                            // pass
                        };

                        var onSuccess = function(send_plain) {

                            var onSuccess = function (oidc_token_id) {
                                // comes only here in extensions
                                if (oidc_token_id) {
                                    return oidc_login(oidc_token_id);
                                }
                            };

                            var onError = function (data) {
                                $scope.view = 'default';
                                console.log(data);

                                if (data.error_data === null) {
                                    $scope.errors = ['SERVER_OFFLINE']
                                } else if (data.error_data.hasOwnProperty('non_field_errors')) {
                                    $scope.errors = data.error_data.non_field_errors;
                                } else if (data.error_data.hasOwnProperty('username')) {
                                    $scope.errors = data.error_data.username;
                                } else {
                                    $scope.errors = ['SERVER_OFFLINE']
                                }
                            };

                            managerDatastoreUser.oidc_initiate_login(provider, remember, trust_device,
                                angular.copy($scope.selected_server), server_check['info'], server_check['verify_key'])
                                .then(onSuccess, onError);
                        };
                        if (continue_login) {
                            ask_send_plain(server_check, true).then(onSuccess, onError);
                        }
                    };
                    verify_server_signature(server_check).then(onSuccess, onError);
                };
                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);
            }
        }]
    );
}(angular));