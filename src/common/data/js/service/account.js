(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.account
     * @requires $q
     * @requires $uibModal
     * @requires psonocli.storage
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastoreSetting
     * @requires psonocli.apiClient
     *
     * @description
     * Service that handles all the account details
     */


    var account = function($q, $uibModal, storage, managerDatastoreUser, managerDatastoreSetting, cryptoLibrary, apiClient) {

        var _default_tab = 'overview';

        var _tabs = [
            { key: 'overview', title: 'Overview' },
            { key: 'change-email', title: 'Change E-Mail' },
            { key: 'change-password', title: 'Change Password' },
            { key: 'generate-password-recovery', title: 'Generate Password Recovery' },
            { key: 'multifactor-authentication', title: 'Multifactor Authentication' }
        ];

        var _account = {
            fields: [
                // Overview
                { key: "user_id", field: "input", type: "text", title: "User ID", placeholder: "User ID", required: true, readonly: true, tab: 'overview'},
                { key: "user_username", field: "input", type: "email", title: "Username", placeholder: "Username", required: true, readonly: true, tab: 'overview'},
                { key: "user_email", field: "input", type: "email", title: "E-Mail", placeholder: "E-Mail", required: true, readonly: true, tab: 'overview'},
                { key: "user_public_key", field: "input", type: "text", title: "Public Key", placeholder: "Public Key", required: true, readonly: true, tab: 'overview'},
                // Change E-Mail
                { key: "setting_email", field: "input", type: "email", title: "New E-Mail", placeholder: "New E-Mail", required: true, tab: 'change-email'},
                { key: "setting_email_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'change-email'},
                // Change Password
                { key: "setting_password", field: "input", type: "password", title: "New Password", placeholder: "New Password", tab: 'change-password', complexify: true},
                { key: "setting_password_repeat", field: "input", type: "password", title: "New Password (repeat)", placeholder: "New Password (repeat)", tab: 'change-password'},
                { key: "setting_password_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'change-password'},
                // Password Recovery
                { name: "generate_password_recovery_button", field: "button", type: "button", title: "New Password Recovery Code", btnLabel: "Generate", class: 'btn-primary', onClick:"onClickGenerateNewPasswordRecoveryCode", tab: 'generate-password-recovery' },
                // Password Recovery
                { name: "google_authenticator_setup", field: "button", type: "button", title: "Google Authenticator", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureGoogleAuthenticator", tab: 'multifactor-authentication' },
                { name: "yubikey_otp_setup", field: "button", type: "button", title: "YubiKey (OTP)", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureYubiKeyOTP", tab: 'multifactor-authentication' }
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
            onClickConfigureGoogleAuthenticator: function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-setup-google-authenticator.html',
                    controller: 'ModalConfigureGoogleAuthenticatorCtrl',
                    backdrop: 'static',
                    resolve: {}
                });

                modalInstance.result.then(function () {
                    // User clicked the prime button
                }, function () {
                    // cancel triggered
                });

            },
            onClickConfigureYubiKeyOTP: function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-setup-yubikey-otp.html',
                    controller: 'ModalConfigureYubiKeyOTPCtrl',
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
         * @name psonocli.account#get_default_tab
         * @methodOf psonocli.account
         *
         * @description
         * Returns the default tab
         *
         * @returns {string} Returns the default tab
         */
        var get_default_tab = function() {
            return _default_tab;
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

                var specials = {};
                var old_password;

                // lets search our account for the interesting account
                for (var i = _account['fields'].length - 1; i >= 0; i--) {
                    if (_config_account.indexOf(_account['fields'][i].key) > -1) {
                        specials[_account['fields'][i].key] = _account['fields'][i];
                    }
                }

                var old_email = storage.find_one('config', {key: 'user_email'}).value;
                var new_email = specials['setting_email'].value;
                old_password = specials['setting_email_password_old'].value;
                // change email
                // lets check for a correct old password and then update our backend
                if (old_email !== new_email) {
                    return managerDatastoreUser.save_new_email(
                        new_email,
                        old_password,
                        resolve,
                        reject
                    ).then(function(data){
                        specials['setting_email_password_old'].value = '';
                        return data;
                    }, function(data) {
                        specials['setting_email_password_old'].value = '';
                        return $q.reject(data)
                    });
                }


                var new_password = specials['setting_password'].value;
                var new_password_repeat = specials['setting_password_repeat'].value;
                old_password = specials['setting_password_password_old'].value;
                // change password
                // lets check for a correct old password and then update our backend
                if ((new_password && new_password.length > 0)
                    || (new_password_repeat && new_password_repeat.length > 0)) {
                    return managerDatastoreUser.save_new_password(
                        new_password,
                        new_password_repeat,
                        old_password,
                        resolve,
                        reject
                    ).then(function(data){
                            specials['setting_password'].value = '';
                            specials['setting_password_repeat'].value = '';
                            specials['setting_password_password_old'].value = '';
                            return data;
                    }, function(data) {
                        specials['setting_password'].value = '';
                        specials['setting_password_repeat'].value = '';
                        specials['setting_password_password_old'].value = '';
                        return $q.reject(data)
                    });
                }
            });
        };

        return {
            get_tabs: get_tabs,
            get_default_tab: get_default_tab,
            get_account_detail: get_account_detail,
            get_account: get_account,
            save: save
        };
    };

    var app = angular.module('psonocli');
    app.factory("account", ['$q', '$uibModal', 'storage', 'managerDatastoreUser', 'managerDatastoreSetting', 'cryptoLibrary', 'apiClient', account]);

}(angular));
