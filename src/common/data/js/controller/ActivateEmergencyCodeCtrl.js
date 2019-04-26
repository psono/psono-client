(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:ActivateEmergencyCodeCtrl
     * @requires $q
     * @requires $scope
     * @requires $window
     * @requires $route
     * @requires $filter
     * @requires psonocli.managerHost
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.helper
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.converter
     *
     * @description
     * Controller for the registration view
     */
    angular.module('psonocli').controller('ActivateEmergencyCodeCtrl', ['$q', '$scope', '$window', '$route', '$filter',
        'managerHost', 'managerDatastoreUser', 'browserClient', 'helper', 'cryptoLibrary', 'converter',
        function ($q, $scope, $window, $route, $filter,
                  managerHost, managerDatastoreUser, browserClient, helper, cryptoLibrary, converter) {

            $scope.select_server = select_server;
            $scope.changing = changing;
            $scope.code_changing = code_changing;
            $scope.words_changing = words_changing;
            $scope.arm_emergency_code = arm_emergency_code;
            $scope.set_new_password = set_new_password;
            $scope.load_default_view = load_default_view;
            $scope.view = 'default';

            /* preselected values */
            $scope.lostpasswordFormUsername = managerDatastoreUser.get_default('username');
            $scope.lostpasswordFormCode1 = {
                value: '',
                class: ''
            };
            $scope.lostpasswordFormCode2 = {
                value: '',
                class: ''
            };
            $scope.lostpasswordFormWords = {
                value: '',
                class: ''
            };

            activate();

            function activate() {
                var persistent_username = managerDatastoreUser.get_default('username');
                var persistent_server = managerDatastoreUser.get_default('server');

                /* preselected values */
                $scope.lostpasswordFormUsername = persistent_username;

                var onSuccess = function(config) {

                    // TODO check last visited server for "preselection"

                    /* Server selection with preselection */
                    $scope.servers = config['backend_servers'];
                    $scope.filtered_servers = $scope.servers;
                    $scope.allow_custom_server = !config.hasOwnProperty('allow_custom_server') || (config.hasOwnProperty('allow_custom_server') && config['allow_custom_server']);
                    $scope.allow_registration = !config.hasOwnProperty('allow_registration') || (config.hasOwnProperty('allow_registration') && config['allow_registration']);
                    $scope.allow_lost_password = !config.hasOwnProperty('allow_lost_password') || (config.hasOwnProperty('allow_lost_password') && config['allow_lost_password']);
                    $scope.authkey_enabled = config['authentication_methods'].indexOf('AUTHKEY') !== -1;
                    $scope.ldap_enabled = config['authentication_methods'].indexOf('LDAP') !== -1;
                    $scope.saml_enabled = config['authentication_methods'].indexOf('SAML') !== -1;
                    $scope.saml_provider = config['saml_provider'];
                    if (persistent_server) {
                        select_server(persistent_server);
                    } else {
                        select_server($scope.servers[0]);
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
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#select_server
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
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

                if(helper.endsWith($scope.lostpasswordFormUsername, '@' + $scope.selected_server_domain)) {
                    $scope.lostpasswordFormUsername = $scope.lostpasswordFormUsername.slice(0, - ('@' + $scope.selected_server_domain).length);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#changing
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
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

                if(helper.endsWith($scope.lostpasswordFormUsername, '@' + $scope.selected_server_domain)) {
                    $scope.lostpasswordFormUsername = $scope.lostpasswordFormUsername.slice(0, - ('@' + $scope.selected_server_domain).length);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#code_changing
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
             *
             * @description
             * Triggered automatically once someone types something into one of both code fields
             *
             * @param {string} code Part of a recovery code
             */
            function code_changing(code) {

                if (typeof(code['value']) === 'undefined' || code['value'] === '') {
                    code['class'] = 'form-field-validation-pass';
                    return;
                }

                var check = cryptoLibrary.recovery_password_chunk_pass_checksum(code['value']);
                if (check) {
                    code['class'] = 'form-field-validation-pass';
                } else {
                    code['class'] = 'form-field-validation-fail';
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#words_changing
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
             *
             * @description
             * Triggered automatically once someone types something into the words fields
             *
             * @param {string} words The recovery code as words
             */
            function words_changing(words) {
                //console.log(words);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#load_default_view
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
             *
             * @description
             * Triggered once someone clicks the cancel button in the "Approve new server" dialog
             */
            function load_default_view() {
                $scope.view = 'default';
            }

            /**
             * @ngdoc
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#verify_server_signature
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
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
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#arm_emergency_code
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
             *
             * @description
             * Triggered once someone clicks the "Request password Reset" button
             *
             * @param {string} username The username of the account one wants to reset
             * @param {string} code1 Part 1 of the reset code
             * @param {string} code2 Part 2 of the reset code
             * @param {string} words The word code alternative
             */
            function arm_emergency_code(username, code1, code2, words) {

                // TODO refactor this function and put logic into a service

                $scope.errors = [];
                $scope.msgs = [];
                var test_result;

                // a username is mandatory
                if (username === undefined) {
                    return;
                }

                // We need either words or code1 and code2
                if ((words === undefined || words === '') && (code1 === undefined || code2 === undefined || code1 === '' || code2 === '' )) {
                    return;
                }

                // Validate now the username
                username = helper.form_full_username(username, $scope.selected_server_domain);
                test_result = helper.is_valid_username(username);
                if (test_result !== true) {
                    $scope.errors.push(test_result);
                    return;
                }

                // Validate now the recovery code information (words and codes)
                var emergency_code;
                if (typeof(words) !== 'undefined' && words !== '') {
                    emergency_code = converter.hex_to_base58(converter.words_to_hex(words.split(' ')));
                } else if (typeof(code1) !== 'undefined' && code1 !== '' && typeof(code2) !== 'undefined' && code2 !== ''){
                    if (!cryptoLibrary.recovery_password_chunk_pass_checksum(code1) || !cryptoLibrary.recovery_password_chunk_pass_checksum(code2)) {
                        $scope.errors.push("At least one of your codes is wrong");
                        return;
                    }
                    emergency_code = cryptoLibrary.recovery_code_strip_checksums(code1+code2);
                } else {
                    $scope.errors.push("something strange happened...");
                    return;
                }


                var onError = function() {
                    $scope.errors = ['Server offline.']
                };

                var onSuccess = function(server_check) {

                    var onError = function() {
                        // pass
                    };

                    var onSuccess = function(continue_login) {

                        function onError(data) {
                            console.log(data);
                            if (data.hasOwnProperty('data') && data.data.hasOwnProperty('non_field_errors')) {
                                $scope.errors = data.data.non_field_errors;
                            } else if (data.hasOwnProperty('data') && data.data.hasOwnProperty('detail')) {
                                $scope.errors = [data.data.detail];
                            } else if (!data.hasOwnProperty('data')) {
                                $scope.errors = ['Server offline.'];
                            } else {
                                alert("Error, should not happen.");
                            }

                        }

                        function onSuccess(data) {

                            $scope.data = data;

                            if (data.status === 'active') {
                                $window.location.href = 'index.html';
                            }
                        }

                        if (continue_login) {
                            load_default_view();

                            managerDatastoreUser.arm_emergency_code(username, emergency_code,
                                angular.copy($scope.selected_server), server_check['info'], server_check['verify_key'])
                                .then(onSuccess, onError);
                        }
                    };
                    verify_server_signature(server_check).then(onSuccess, onError);
                };
                managerHost.check_host(angular.copy($scope.selected_server)).then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:ActivateEmergencyCodeCtrl#set_new_password
             * @methodOf psonocli.controller:ActivateEmergencyCodeCtrl
             *
             * @description
             * Triggered once someone clicks the "Set New Password" button
             *
             * @param {string} username the account's username e.g dummy@example.com
             * @param {string} emergency_code The recovery code in base58 format
             * @param {string} password The password one wants to set
             * @param {string} password2 The password repeated
             * @param {object} emergency_code_date The recovery data with the user's private and public key and the necessary verifier public key and verifier time
             */
            function set_new_password(username, emergency_code, password, password2, emergency_code_date) {

                var test_result = helper.is_valid_password(password, password2);
                if (test_result !== true) {
                    $scope.errors = [test_result];
                    return;
                }

                function onError() {
                    alert("Error, should not happen.");
                }

                function onSuccess() {
                    $scope.success = true;
                }

                managerDatastoreUser.set_password(username, emergency_code, password, emergency_code_date.user_private_key,
                    emergency_code_date.user_secret_key, emergency_code_date.user_sauce, emergency_code_date.verifier_public_key)
                    .then(onSuccess, onError);
            }
        }]
    );
}(angular));