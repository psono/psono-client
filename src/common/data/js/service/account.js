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
     *
     * @description
     * Service that handles all the account details
     */


    var account = function($q, $uibModal, $filter, storage, managerDatastoreUser, managerDatastoreSetting) {

        var _default_tab = 'overview';

        var _tabs = [
            { key: 'overview', title: 'Overview', description: 'The overview of your account with details like your public key.' },
            { key: 'change-email', title: 'Change E-Mail', description: 'You can provide here a new e-mail address (together with your current password for verification)' },
            { key: 'change-password', title: 'Change Password', description: 'You can provide here a new password address (together with your current password for verification)' },
            { key: 'generate-password-recovery', title: 'Generate Password Recovery', description: 'You should create a password recovery code to recover your account with a lost password.' },
            { key: 'multifactor-authentication', title: 'Multifactor Authentication', description: 'A second factor is the best security improvement for your account.' },
            { key: 'delete-account', title: 'Delete Account', description: 'If you plan to delete your account you can do that here. Be aware all data will be lost.' }
        ];

        var _account = {
            fields: [
                // Overview
                { key: "client_label", type: "label_only", title: "Client:", tab: 'overview'},
                { key: "user_id", field: "input", type: "text", title: "User ID", placeholder: "User ID", required: true, readonly: true, tab: 'overview'},
                { key: "user_username", field: "input", type: "email", title: "Username", placeholder: "Username", required: true, readonly: true, tab: 'overview'},
                { key: "user_email", field: "input", type: "email", title: "E-Mail", placeholder: "E-Mail", required: true, readonly: true, tab: 'overview'},
                { key: "user_public_key", field: "input", type: "text", title: "Public Key", placeholder: "Public Key", required: true, readonly: true, tab: 'overview'},
                { key: "server_label", type: "label_only", title: "Server:", tab: 'overview'},
                { key: "server_api_version", field: "input", type: "text", title: "Server API Version", placeholder: "Server API Version", required: true, readonly: true, tab: 'overview'},
                { key: "server_version", field: "input", type: "text", title: "Server Version", placeholder: "Server Version", required: true, readonly: true, tab: 'overview'},
                { key: "server_signature", field: "input", type: "text", title: "Server Signature", placeholder: "Server Signature", required: true, readonly: true, tab: 'overview'},
                { key: "server_log_audit", field: "input", type: "text", title: "Server Audit Logging", placeholder: "Server Audit Logging", required: true, readonly: true, tab: 'overview'},
                { key: "server_public_key", field: "input", type: "text", title: "Server Public Key", placeholder: "Server Public Key", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_type", field: "input", type: "text", title: "Server License Type", placeholder: "Server License Type", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_max_users", field: "input", type: "text", title: "Server Max. Users", placeholder: "Server Max. Users", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_valid_from", field: "input", type: "text", title: "Server License Valid From", placeholder: "Server License Valid From", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_valid_till", field: "input", type: "text", title: "Server License Valid Till", placeholder: "Server License Valid Till", required: true, readonly: true, tab: 'overview'},
                // Change E-Mail
                { key: "setting_email", field: "input", type: "email", title: "New E-Mail", placeholder: "New E-Mail", required: true, tab: 'change-email'},
                { key: "setting_email_password_old", field: "input", type: "password", title: "Current Password", placeholder: "Current Password", tab: 'change-email'},
                // Change Password
                { key: "setting_password", field: "input", type: "password", title: "New Password", placeholder: "New Password", tab: 'change-password', complexify: true},
                { key: "setting_password_repeat", field: "input", type: "password", title: "New Password (repeat)", placeholder: "New Password (repeat)", tab: 'change-password'},
                { key: "setting_password_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'change-password'},
                // Password Recovery
                { name: "generate_password_recovery_button", field: "button", type: "button", title: "New Password Recovery Code", btnLabel: "Generate", class: 'btn-primary', onClick:"onClickGenerateNewPasswordRecoveryCode", tab: 'generate-password-recovery' },
                // 2FA
                // controlled by serer, check activate()
                // { name: "google_authenticator_setup", field: "button", type: "button", title: "Google Authenticator", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureGoogleAuthenticator", tab: 'multifactor-authentication' },
                // { name: "yubikey_otp_setup", field: "button", type: "button", title: "YubiKey (OTP)", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureYubiKeyOTP", tab: 'multifactor-authentication' },
                // { name: "duo_setup", field: "button", type: "button", title: "Duo (Push or Code)", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureDuo", tab: 'multifactor-authentication' },
                // Delete Account
                { name: "delete_account", field: "button", type: "button", title: "Delete Account", btnLabel: "Delete", class: 'btn-primary', onClick:"onClickOpenDeleteAccountModal", tab: 'delete-account' }
            ],
            onClickOpenDeleteAccountModal: function () {

                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-delete-account.html',
                    controller: 'ModalDeleteAccountCtrl',
                    backdrop: 'static',
                    resolve: {
                    }
                });

                modalInstance.result.then(function () {
                    // User clicked the prime button
                }, function () {
                    // cancel triggered
                });

            },
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

            },
            onClickConfigureDuo: function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-setup-duo.html',
                    controller: 'ModalConfigureDuoCtrl',
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

        activate();

        function activate() {
            var allowed_second_factors = storage.find_key('config', 'server_info').value['allowed_second_factors'];

            if (allowed_second_factors.indexOf('google_authenticator') !== -1) {
                _account.fields.push({ name: "google_authenticator_setup", field: "button", type: "button", title: "Google Authenticator", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureGoogleAuthenticator", tab: 'multifactor-authentication' })
            }
            if (allowed_second_factors.indexOf('yubikey_otp') !== -1) {
                _account.fields.push({ name: "yubikey_otp_setup", field: "button", type: "button", title: "YubiKey (OTP)", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureYubiKeyOTP", tab: 'multifactor-authentication' })
            }
            if (allowed_second_factors.indexOf('duo') !== -1) {
                _account.fields.push({ name: "duo_setup", field: "button", type: "button", title: "Duo (Push or Code)", btnLabel: "Configure", class: 'btn-primary', onClick:"onClickConfigureDuo", tab: 'multifactor-authentication' })
            }
        }

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
         *
         * @returns {*} Returns the account detail
         */
        var get_account_detail = function (key) {

            if (key === 'user_id') {
                return storage.find_key('config', 'user_id').value;
            }

            if (key === 'user_username') {
                return storage.find_key('config', 'user_username').value;
            }

            if (key === 'user_public_key') {
                return storage.find_key('config', 'user_public_key').value;
            }

            if (key === 'user_email') {
                return storage.find_key('config', 'user_email').value;
            }

            if (key === 'setting_email') {
                return storage.find_key('config', 'user_email').value;
            }

            if (key === 'server_api_version') {
                return storage.find_key('config', 'server_info').value['api'];
            }

            if (key === 'server_version') {
                return storage.find_key('config', 'server_info').value['version'];
            }

            if (key === 'server_signature') {
                return storage.find_key('config', 'server_verify_key').value;
            }

            if (key === 'server_log_audit') {
                return storage.find_key('config','server_info').value['log_audit'];
            }

            if (key === 'server_public_key') {
                return storage.find_key('config', 'server_info').value['public_key'];
            }

            if (key === 'server_license_type') {
                if (storage.find_key('config','server_info').value.hasOwnProperty('license_type')) {
                    if (storage.find_key('config','server_info').value['license_type'] === 'paid') {
                        return 'Enterprise Edition (EE)'
                    } else {
                        return 'Enterprise Edition (EE) limited'
                    }

                }
                return 'Community Edition (CE)';
            }

            if (key === 'server_license_max_users') {
                if (storage.find_key('config','server_info').value.hasOwnProperty('license_max_users')) {
                    return storage.find_key('config','server_info').value['license_max_users'];
                }
                return 'unlimited';
            }

            if (key === 'server_license_valid_from') {
                if (storage.find_key('config','server_info').value.hasOwnProperty('license_valid_from')) {
                    return $filter('date')(storage.find_key('config','server_info').value['license_valid_from']*1000, 'mediumDate');
                }
                return 'N/A';
            }

            if (key === 'server_license_valid_till') {
                if (storage.find_key('config','server_info').value.hasOwnProperty('license_valid_till')) {
                    return $filter('date')(storage.find_key('config','server_info').value['license_valid_till']*1000, 'mediumDate');
                }
                return 'N/A';
            }

            return '';
        };

        /**
         * @ngdoc
         * @name psonocli.account#get_account
         * @methodOf psonocli.account
         *
         * @description
         * returns all account details with structure
         *
         * @returns {*} Returns a dict of all account
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

                var old_email = storage.find_key('config', 'user_email').value;
                var new_email = specials['setting_email'].value;
                old_password = specials['setting_email_password_old'].value;
                // change email
                // lets check for a correct old password and then update our backend
                if (old_email !== new_email) {
                    return managerDatastoreUser.save_new_email(
                        new_email,
                        old_password
                    ).then(function(data){
                        specials['setting_email_password_old'].value = '';
                        resolve(data);
                    }, function(data) {
                        specials['setting_email_password_old'].value = '';
                        reject(data)
                    });
                }


                var new_password = specials['setting_password'].value;
                var new_password_repeat = specials['setting_password_repeat'].value;
                old_password = specials['setting_password_password_old'].value;
                // change password
                // lets check for a correct old password and then update our backend
                if ((new_password && new_password.length > 0)
                    || (new_password_repeat && new_password_repeat.length > 0)) {
                    managerDatastoreUser.save_new_password(
                        new_password,
                        new_password_repeat,
                        old_password
                    ).then(function(data){
                            specials['setting_password'].value = '';
                            specials['setting_password_repeat'].value = '';
                            specials['setting_password_password_old'].value = '';

                            $uibModal.open({
                                templateUrl: 'view/modal-delete-other-sessions.html',
                                controller: 'ModalDeleteOtherSessionsCtrl',
                                backdrop: 'static',
                                resolve: {}
                            });

                            resolve(data);
                    }, function(data) {
                        specials['setting_password'].value = '';
                        specials['setting_password_repeat'].value = '';
                        specials['setting_password_password_old'].value = '';
                        reject(data)
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
    app.factory("account", ['$q', '$uibModal', '$filter', 'storage', 'managerDatastoreUser', 'managerDatastoreSetting', account]);

}(angular));
