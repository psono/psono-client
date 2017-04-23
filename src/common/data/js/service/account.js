(function(angular, qrcode) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.account
     * @requires $q
     * @requires psonocli.storage
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastoreSetting
     * @requires psonocli.apiClient
     *
     * @description
     * Service that handles all the account details
     */


    var account = function($q, $uibModal, storage, managerDatastoreUser, managerDatastoreSetting, cryptoLibrary, apiClient) {

        var _tabs = [
            { key: 'overview', title: 'Overview' },
            { key: 'email', title: 'Change E-Mail' },
            { key: 'password', title: 'Change Password' },
            { key: 'recovery', title: 'Generate Password Recovery' },
            { key: 'multi_factor', title: 'Setup Multifactor Authentication' }
        ];

        var _account = {
            fields: [
                // Overview
                { key: "user_id", field: "input", type: "text", title: "User ID", placeholder: "User ID", required: true, readonly: true, tab: 'overview'},
                { key: "user_username", field: "input", type: "email", title: "Username", placeholder: "Username", required: true, readonly: true, tab: 'overview'},
                { key: "user_email", field: "input", type: "email", title: "E-Mail", placeholder: "E-Mail", required: true, readonly: true, tab: 'overview'},
                { key: "user_public_key", field: "input", type: "text", title: "Public Key", placeholder: "Public Key", required: true, readonly: true, tab: 'overview'},
                // Change E-Mail
                { key: "setting_email", field: "input", type: "email", title: "New E-Mail", placeholder: "New E-Mail", required: true, tab: 'email'},
                { key: "setting_email_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'email'},
                // Change Password
                { key: "setting_password", field: "input", type: "password", title: "New Password", placeholder: "New Password", tab: 'password', complexify: true},
                { key: "setting_password_repeat", field: "input", type: "password", title: "New Password (repeat)", placeholder: "New Password (repeat)", tab: 'password'},
                { key: "setting_password_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'password'},
                // Password Recovery
                { name: "generate_password_recovery_button", field: "button", type: "button", title: "New Password Recovery Code", btnLabel: "Generate", class: 'btn-primary', onClick:"onClickGenerateNewPasswordRecoveryCode", tab: 'recovery' },
                // Password Recovery
                { name: "google_authenticator_setup", field: "button", type: "button", title: "Google Authenticator", btnLabel: "Setup", class: 'btn-primary', onClick:"onClickSetupGoogleAuthenticator", tab: 'multi_factor' }
            ],
            onClickGenerateNewPasswordRecoveryCode: function () {

                var onSuccess = function(recovery_information) {

                    var modalInstance = $uibModal.open({
                        templateUrl: 'view/modal-show-recoverycode.html',
                        controller: 'ModalShowRecoverycodeCtrl',
                        backdrop: 'static',
                        resolve: {
                            recovery_information: function () {
                                return recovery_information;
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        // User clicked the prime button

                    }, function () {
                        // cancel triggered
                    });
                };

                var onError = function() {
                    //pass
                };

                managerDatastoreUser.recovery_generate_information().then(onSuccess, onError);

            },
            onClickSetupGoogleAuthenticator: function () {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-setup-google-authenticator.html',
                    controller: 'ModalSetupGoogleAuthenticatorCtrl',
                    backdrop: 'static',
                    resolve: {}
                });

                modalInstance.result.then(function () {
                    // User clicked the prime button

                }, function () {
                    // cancel triggered
                });

            }
        };

        // will be handled different, and not saved directly to the account
        var _config_account = [
            "user_email",
            "setting_email",
            "setting_email_password_old",
            "setting_password",
            "setting_password_repeat",
            "setting_password_password_old"
        ];

        /**
         * @ngdoc
         * @name psonocli.account#get_tabs
         * @methodOf psonocli.account
         *
         * @description
         * Returns the list of available tabs
         *
         * @returns {Array} Returns a list of available tabs
         */
        var get_tabs = function() {
            return _tabs;
        };

        /**
         * @ngdoc
         * @name psonocli.account#get_account_detail
         * @methodOf psonocli.account
         *
         * @description
         * returns the account detail with a specific key, applies default values
         *
         * @param {string} key They key of the account detail one wants to fetch
         * @returns {*} Returns the account detail
         */
        var get_account_detail = function (key) {

            if (key === 'user_id') {
                return storage.find_one('config', {key: 'user_id'}).value;
            }

            if (key === 'user_username') {
                return storage.find_one('config', {key: 'user_username'}).value;
            }

            if (key === 'user_public_key') {
                return storage.find_one('config', {key: 'user_public_key'}).value;
            }

            if (key === 'user_email') {
                return storage.find_one('config', {key: 'user_email'}).value;
            }

            if (key === 'setting_email') {
                return storage.find_one('config', {key: 'user_email'}).value;
            }

            return null
        };

        /**
         * @ngdoc
         * @name psonocli.account#get_account
         * @methodOf psonocli.account
         *
         * @description
         * returns all account details with structure
         *
         * @returns {Array} Returns a list of all account
         */
        var get_account = function() {

            for (var i = _account['fields'].length - 1; i >= 0; i--) {
                _account['fields'][i].value = get_account_detail(_account['fields'][i].key)
            }
            return _account;
        };


        /**
         * @ngdoc
         * @name psonocli.account#save
         * @methodOf psonocli.account
         *
         * @description
         * Saves the account details and might update the user data (e.g. The password)
         *
         * @returns {promise} Returns a promise with the status
         */
        var save = function() {
            return $q(function(resolve, reject) {

                var authkey_old, new_authkey, user_private_key, user_secret_key, user_sauce, priv_key_enc, secret_key_enc, onSucces, onError;

                // TODO move this function to managerDatastoreUser as it directly accesses public / private / secret keys
                var specials = {};

                // lets search our account for the interesting account
                for (var i = _account.length - 1; i >= 0; i--) {
                    if (_config_account.indexOf(_account[i].key) > -1) {
                        specials[_account[i].key] = _account[i];
                    }
                }

                var mailobj = storage.find_one('config', {key: 'user_email'});
                var config_email = mailobj.value;

                var totalSuccess = function() {
                    return resolve({msgs: ['Saved successfully']})
                };

                // change email
                // lets check for a correct old password and then update our backend
                if (config_email !== specials['setting_email'].value) {

                    if (specials['setting_email_password_old'].value === null || specials['setting_email_password_old'].value.length === 0) {
                        return reject({errors: ['Old password empty']})
                    }

                    new_password = specials['setting_email_password_old'].value;

                    authkey_old = cryptoLibrary.generate_authkey(storage.find_one('config', {key: 'user_username'}).value, specials['setting_email_password_old'].value);

                    onSucces = function(data) {

                        //update local mail storage
                        mailobj.value = specials['setting_email'].value;
                        storage.update('config', mailobj);

                        specials['setting_email_password_old'].value = '';
                        return totalSuccess();
                    };
                    onError = function() {
                        specials['setting_email_password_old'].value = '';
                        return reject({errors: ['Old password incorrect']})
                    };
                    return managerDatastoreUser.update_user(specials['setting_email'].value, null, authkey_old)
                        .then(onSucces, onError);


                }

                // change password
                // lets check for a correct old password and then update our backend
                if ((specials['setting_password'].value && specials['setting_password'].value.length > 0)
                    || (specials['setting_password_repeat'].value && specials['setting_password_repeat'].value.length > 0)) {

                    var new_password = specials['setting_password'].value;

                    if (specials['setting_password'].value !== specials['setting_password_repeat'].value) {
                        console.log("reject");
                        return reject({errors: ['Passwords mismatch']})
                    }
                    if (specials['setting_password_password_old'].value === null || specials['setting_password_password_old'].value.length === 0) {
                        return reject({errors: ['Old password empty']})
                    }

                    authkey_old = cryptoLibrary.generate_authkey(storage.find_one('config', {key: 'user_username'}).value, specials['setting_password_password_old'].value);

                    new_authkey = cryptoLibrary.generate_authkey(storage.find_one('config', {key: 'user_username'}).value, new_password);
                    user_private_key = storage.find_one('config', {key: 'user_private_key'});
                    user_secret_key = storage.find_one('config', {key: 'user_secret_key'});
                    user_sauce = storage.find_one('config', {key: 'user_sauce'}).value;

                    priv_key_enc = cryptoLibrary.encrypt_secret(user_private_key.value, new_password, user_sauce);
                    secret_key_enc = cryptoLibrary.encrypt_secret(user_secret_key.value, new_password, user_sauce);

                    onSucces = function(data) {
                        specials['setting_password'].value = '';
                        specials['setting_password_repeat'].value = '';
                        specials['setting_password_password_old'].value = '';
                        return totalSuccess();
                    };
                    onError = function() {
                        return reject({errors: ['Old password incorrect']})
                    };
                    return managerDatastoreUser.update_user(null, new_authkey, authkey_old, priv_key_enc.text, priv_key_enc.nonce, secret_key_enc.text, secret_key_enc.nonce)
                        .then(onSucces, onError);


                }
            });
        };

        return {
            get_tabs: get_tabs,
            get_account_detail: get_account_detail,
            get_account: get_account,
            save: save
        };
    };

    var app = angular.module('psonocli');
    app.factory("account", ['$q', '$uibModal', 'storage', 'managerDatastoreUser', 'managerDatastoreSetting', 'cryptoLibrary', 'apiClient', account]);


    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalShowRecoverycodeCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "Show Recoverycode" modal
     */
    app.controller('ModalShowRecoverycodeCtrl', ['$scope', '$uibModalInstance', 'recovery_information',
        function ($scope, $uibModalInstance, recovery_information) {

            $scope.recovery_information = recovery_information;


            /**
             * @ngdoc
             * @name psonocli.controller:ModalShowRecoverycodeCtrl#close
             * @methodOf psonocli.controller:ModalShowRecoverycodeCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            $scope.close = function () {
                $uibModalInstance.dismiss('close');
            };


        }]);
    /**
     * @ngdoc controller
     * @name psonocli.controller:ModalSetupGoogleAuthenticatorCtrl
     * @requires $scope
     * @requires $uibModalInstance
     *
     * @description
     * Controller for the "Setup Google Authenticator" modal
     */
    app.controller('ModalSetupGoogleAuthenticatorCtrl', ['$scope', '$uibModalInstance', 'managerDatastoreUser',
        function ($scope, $uibModalInstance, managerDatastoreUser) {

            $scope.new_ga = {
                'title': undefined
            };

            $scope.gas = [];

            /**
             * @ngdoc
             * @name psonocli.controller:ModalSetupGoogleAuthenticatorCtrl#new_ga
             * @methodOf psonocli.controller:ModalSetupGoogleAuthenticatorCtrl
             *
             * @description
             * Triggered once someone clicks the "New Google Authenticator" button in the modal
             *
             * @param {string} new_ga The new Google Authenticator object with title attribute
             *
             * @return {promise} Returns a promise with the new Google authenticator secret
             */
            $scope.create_ga = function (new_ga) {

                if (typeof(new_ga.title) === 'undefined') {
                    $scope.errors = ['Title is required'];
                    return;
                } else {
                    $scope.errors = [];
                }

                var onSuccess = function(ga) {

                    var typeNumber = 6;
                    var errorCorrectionLevel = 'L';
                    var qr = qrcode(typeNumber, errorCorrectionLevel);
                    qr.addData(ga.uri);
                    qr.make();
                    $scope.google_authenticator_html = qr.createImgTag(4, 16);
                    $scope.gas.push({
                        'id': ga.id,
                        'title': new_ga['title']
                    });
                };

                var onError = function() {
                    //pass
                };

                return managerDatastoreUser.create_ga(new_ga.title).then(onSuccess, onError);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ModalSetupGoogleAuthenticatorCtrl#delete_ga
             * @methodOf psonocli.controller:ModalSetupGoogleAuthenticatorCtrl
             *
             * @description
             * Triggered once someone clicks on a delete link
             *
             * @param {string} gas A list of all current google authenticator
             * @param {string} ga_id The id of the google Authenticator to delete
             *
             * @return {promise} Returns a promise which can result either to true of false
             */
            $scope.delete_ga = function (gas, ga_id) {

                var onSuccess = function() {
                    for (var i = 0; i < gas.length; i++) {
                        if (gas[i].id !== ga_id) {
                            continue;
                        }
                        gas.splice(i, 1);
                    }
                    return true;
                };

                var onError = function() {
                    return false;
                };

                return managerDatastoreUser.delete_ga(ga_id).then(onSuccess, onError);
            };

            /**
             * @ngdoc
             * @name psonocli.controller:ModalSetupGoogleAuthenticatorCtrl#close
             * @methodOf psonocli.controller:ModalSetupGoogleAuthenticatorCtrl
             *
             * @description
             * Triggered once someone clicks the close button in the modal
             */
            $scope.close = function () {
                $uibModalInstance.dismiss('close');
            };

            var onSuccess = function(gas) {
                $scope.gas = gas;
            };

            var onError = function() {
                //pass
            };

            managerDatastoreUser.read_ga()
                .then(onSuccess, onError);

        }]);

}(angular, qrcode));
