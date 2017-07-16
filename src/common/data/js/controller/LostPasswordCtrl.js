(function(angular) {
    'use strict';

    /**
     * @ngdoc controller
     * @name psonocli.controller:LostPasswordCtrl
     * @requires $scope
     * @requires $route
     * @requires $filter
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.browserClient
     * @requires psonocli.helper
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Controller for the registration view
     */
    angular.module('psonocli').controller('LostPasswordCtrl', ['$scope', '$route', '$filter', 'managerDatastoreUser', 'browserClient',
        'helper', 'cryptoLibrary',
        function ($scope, $route, $filter, managerDatastoreUser, browserClient, helper, cryptoLibrary) {

            $scope.select_server = select_server;
            $scope.changing = changing;
            $scope.code_changing = code_changing;
            $scope.words_changing = words_changing;
            $scope.recovery_enable = recovery_enable;
            $scope.set_new_password = set_new_password;

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

                    // TODO interpret "allow_custom_server"
                    // TODO check last visited server for "preselection"

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

                browserClient.get_base_url().then(function(base_url){
                    $scope.base_url = base_url;
                });
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LostPasswordCtrl#select_server
             * @methodOf psonocli.controller:LostPasswordCtrl
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

                if(helper.endsWith($scope.lostpasswordFormUsername, '@' + $scope.selected_server_domain)) {
                    $scope.lostpasswordFormUsername = $scope.lostpasswordFormUsername.slice(0, - ('@' + $scope.selected_server_domain).length);
                }
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LostPasswordCtrl#changing
             * @methodOf psonocli.controller:LostPasswordCtrl
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
             * @name psonocli.controller:LostPasswordCtrl#code_changing
             * @methodOf psonocli.controller:LostPasswordCtrl
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
             * @name psonocli.controller:LostPasswordCtrl#words_changing
             * @methodOf psonocli.controller:LostPasswordCtrl
             *
             * @description
             * Triggered automatically once someone types something into the words fields
             *
             * @param {string} words The recovery code as words
             */
            function words_changing(words) {
                console.log(words);
            }

            /**
             * @ngdoc
             * @name psonocli.controller:LostPasswordCtrl#recovery_enable
             * @methodOf psonocli.controller:LostPasswordCtrl
             *
             * @description
             * Triggered once someone clicks the "Request password Reset" button
             *
             * @param {string} username The username of the account one wants to reset
             * @param {string} code1 Part 1 of the reset code
             * @param {string} code2 Part 2 of the reset code
             * @param {string} words The word code alternative
             */
            function recovery_enable(username, code1, code2, words) {

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
                var recovery_code;
                if (typeof(words) !== 'undefined' && words !== '') {
                    recovery_code = cryptoLibrary.hex_to_base58(cryptoLibrary.words_to_hex(words.split(' ')));
                } else if (typeof(code1) !== 'undefined' && code1 !== '' && typeof(code2) !== 'undefined' && code2 !== ''){
                    if (!cryptoLibrary.recovery_password_chunk_pass_checksum(code1) || !cryptoLibrary.recovery_password_chunk_pass_checksum(code2)) {
                        $scope.errors.push("At least one of your codes is wrong");
                        return;
                    }
                    recovery_code = cryptoLibrary.recovery_code_strip_checksums(code1+code2);
                } else {
                    $scope.errors.push("something strange happened...");
                    return;
                }

                function onError(data) {
                    console.log(data);
                    if (data.hasOwnProperty('data') && data.data.hasOwnProperty('message')) {
                        $scope.errors = [data.data.message];
                    } else if (!data.hasOwnProperty('data')) {
                        $scope.errors = ['Server offline.'];
                    } else {
                        alert("Error, should not happen.");
                    }

                }

                function onSuccess(data) {
                    if (data.hasOwnProperty('message')) {
                        $scope.errors.push(data.message);
                    } else {
                        $scope.username = username;
                        $scope.recovery_code = recovery_code;
                        $scope.recovery_enabled = true;
                        $scope.errors = [];
                        $scope.recovery_data = data;

                        // TODO start timer with data.verifier_time_valid seconds
                    }
                }

                managerDatastoreUser.recovery_enable(username, recovery_code, angular.copy($scope.selected_server))
                    .then(onSuccess, onError);
            }


            /**
             * @ngdoc
             * @name psonocli.controller:LostPasswordCtrl#set_new_password
             * @methodOf psonocli.controller:LostPasswordCtrl
             *
             * @description
             * Triggered once someone clicks the "Set New Password" button
             *
             * @param {string} username the account's username e.g dummy@example.com
             * @param {string} recovery_code The recovery code in base58 format
             * @param {string} password The password one wants to set
             * @param {string} password2 The password repeated
             * @param {object} recovery_data The recovery data with the user's private and public key and the necessary verifier public key and verifier time
             */
            function set_new_password(username, recovery_code, password, password2, recovery_data) {

                var test_result = helper.is_valid_password(password, password2);
                if (test_result !== true) {
                    $scope.errors.push(test_result);
                    return;
                }

                function onError() {
                    alert("Error, should not happen.");
                }

                function onSuccess() {
                    $scope.success = true;
                }

                managerDatastoreUser.set_password(username, recovery_code, password, recovery_data.user_private_key,
                    recovery_data.user_secret_key, recovery_data.user_sauce, recovery_data.verifier_public_key)
                    .then(onSuccess, onError);
            }
        }]
    );
}(angular));