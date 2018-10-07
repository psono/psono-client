(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.account
     * @requires $q
     * @requires $uibModal
     * @requires psonocli.storage
     * @requires psonocli.helper
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastoreSetting
     *
     * @description
     * Service that handles all the account details
     */


    var account = function($q, $uibModal, $filter, storage, helper, managerDatastoreUser, managerDatastoreSetting) {

        var _default_tab = 'overview';

        var _tabs = [
            { key: 'overview', title: 'OVERVIEW', description: 'OVERVIEW_DESCRIPTION' },
            { key: 'change-email', title: 'CHANGE_E_MAIL', description: 'CHANGE_E_MAIL_DESCRIPTION' },
            { key: 'change-password', title: 'CHANGE_PASSWORD', description: 'CHANGE_PASSWORD_DESCRIPTION' },
            { key: 'generate-password-recovery', title: 'GENERATE_PASSWORD_RECOVERY', description: 'GENERATE_PASSWORD_RECOVERY_DESCRIPTION' },
            { key: 'emergency-codes', title: 'EMERGENCY_CODES', description: 'EMERGENCY_CODES_DESCRIPTION' },
            { key: 'multifactor-authentication', title: 'MULTIFACTOR_AUTHENTICATION', description: 'MULTIFACTOR_AUTHENTICATION_DESCRIPTION' },
            { key: 'delete-account', title: 'DELETE_ACCOUNT', description: 'DELETE_ACCOUNT_DESCRIPTION' }
        ];

        var _account = {
            fields: [
                // Overview
                { key: "client_label", type: "label_only", title: "CLIENT_INFO", tab: 'overview'},
                { key: "user_id", field: "input", type: "text", title: "USER_ID", placeholder: "USER_ID", required: true, readonly: true, tab: 'overview'},
                { key: "user_username", field: "input", type: "email", title: "USERNAME", placeholder: "USERNAME", required: true, readonly: true, tab: 'overview'},
                { key: "user_email", field: "input", type: "email", title: "E_MAIL", placeholder: "E_MAIL", required: true, readonly: true, tab: 'overview'},
                { key: "user_public_key", field: "input", type: "text", title: "PUBLIC_KEY", placeholder: "PUBLIC_KEY", required: true, readonly: true, tab: 'overview'},
                { key: "server_label", type: "label_only", title: "SERVER_INFO", tab: 'overview'},
                { key: "server_api_version", field: "input", type: "text", title: "SERVER_API_VERSION", placeholder: "SERVER_API_VERSION", required: true, readonly: true, tab: 'overview'},
                { key: "server_version", field: "input", type: "text", title: "SERVER_VERSION", placeholder: "SERVER_VERSION", required: true, readonly: true, tab: 'overview'},
                { key: "server_signature", field: "input", type: "text", title: "SERVER_SIGNATURE", placeholder: "SERVER_SIGNATURE", required: true, readonly: true, tab: 'overview'},
                { key: "server_log_audit", field: "input", type: "text", title: "SERVER_AUDIT_LOGGING", placeholder: "SERVER_AUDIT_LOGGING", required: true, readonly: true, tab: 'overview'},
                { key: "server_public_key", field: "input", type: "text", title: "SERVER_PUBLIC_KEY", placeholder: "SERVER_PUBLIC_KEY", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_type", field: "input", type: "text", title: "SERVER_LICENSE_TYPE", placeholder: "SERVER_LICENSE_TYPE", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_max_users", field: "input", type: "text", title: "SERVER_MAX_USERS", placeholder: "SERVER_MAX_USERS", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_valid_from", field: "input", type: "text", title: "SERVER_LICENSE_VALID_FROM", placeholder: "SERVER_LICENSE_VALID_FROM", required: true, readonly: true, tab: 'overview'},
                { key: "server_license_valid_till", field: "input", type: "text", title: "SERVER_LICENSE_VALID_TILL", placeholder: "SERVER_LICENSE_VALID_TILL", required: true, readonly: true, tab: 'overview'},
                // Change E-Mail
                { key: "setting_email", field: "input", type: "email", title: "NEW_E_MAIL", placeholder: "NEW_E_MAIL", required: true, tab: 'change-email'},
                { key: "setting_email_password_old", field: "input", type: "password", title: "CURRENT_PASSWORD", placeholder: "CURRENT_PASSWORD", tab: 'change-email'},
                // Change Password
                { key: "setting_password", field: "input", type: "password", title: "NEW_PASSWORD", placeholder: "NEW_PASSWORD", tab: 'change-password', complexify: true},
                { key: "setting_password_repeat", field: "input", type: "password", title: "NEW_PASSWORD_REPEAT", placeholder: "NEW_PASSWORD_REPEAT", tab: 'change-password'},
                { key: "setting_password_password_old", field: "input", type: "password", title: "OLD_PASSWORD", placeholder: "OLD_PASSWORD", tab: 'change-password'},
                // Password Recovery
                { name: "generate_password_recovery_button", field: "button", type: "button", title: "NEW_PASSWORD_RECOVERY_CODE", btnLabel: "GENERATE", class: 'btn-primary', onClick:"onClickGenerateNewPasswordRecoveryCode", tab: 'generate-password-recovery' },
                // Emergency Codes
                { name: "emergency_code_setup", field: "button", type: "button", title: "EMERGENCY_CODES", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureEmergencyCodes", tab: 'emergency-codes' },
                // 2FA
                // controlled by serer, check activate()
                // { name: "google_authenticator_setup", field: "button", type: "button", title: "Google Authenticator", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureGoogleAuthenticator", tab: 'multifactor-authentication' },
                // { name: "yubikey_otp_setup", field: "button", type: "button", title: "YubiKey (OTP)", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureYubiKeyOTP", tab: 'multifactor-authentication' },
                // { name: "duo_setup", field: "button", type: "button", title: "Duo (Push or Code)", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureDuo", tab: 'multifactor-authentication' },
                // Delete Account
                { name: "delete_account", field: "button", type: "button", title: "DELETE_ACCOUNT", btnLabel: "DELETE", class: 'btn-primary', onClick:"onClickOpenDeleteAccountModal", tab: 'delete-account' }
            ],
            onClickOpenDeleteAccountModal: function (node) {

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
            onClickConfigureEmergencyCodes: function (node) {


                var modalInstance = $uibModal.open({
                    templateUrl: 'view/modal-show-emergencycodes.html',
                    controller: 'ModalShowEmergencyCodesCtrl',
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
            onClickGenerateNewPasswordRecoveryCode: function (node) {

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
            onClickConfigureGoogleAuthenticator: function (node) {
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
            onClickConfigureYubiKeyOTP: function (node) {
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
            onClickConfigureDuo: function (node) {
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

            var server_info = storage.find_key('config', 'server_info');
            if (!server_info) {
                return
            }
            var allowed_second_factors = storage.find_key('config', 'server_info').value['allowed_second_factors'];


            if (typeof(allowed_second_factors) === 'undefined') {
                allowed_second_factors = ['google_authenticator', 'yubikey_otp_setup', 'duo_setup'];
            }

            if (allowed_second_factors.indexOf('google_authenticator') !== -1) {
                _account.fields.push({ name: "google_authenticator_setup", field: "button", type: "button", title: "GOOGLE_AUTHENTICATOR", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureGoogleAuthenticator", tab: 'multifactor-authentication' })
            }
            if (allowed_second_factors.indexOf('yubikey_otp') !== -1) {
                _account.fields.push({ name: "yubikey_otp_setup", field: "button", type: "button", title: "YUBIKEY_OTP", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureYubiKeyOTP", tab: 'multifactor-authentication' })
            }
            if (allowed_second_factors.indexOf('duo') !== -1) {
                _account.fields.push({ name: "duo_setup", field: "button", type: "button", title: "DUO_PUSH_OR_CODE", btnLabel: "CONFIGURE", class: 'btn-primary', onClick:"onClickConfigureDuo", tab: 'multifactor-authentication' })
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
            helper.remove_from_array(_account['fields'], undefined, function (a, b) {
                return ['google_authenticator_setup', 'yubikey_otp_setup', 'duo_setup'].indexOf(a['name']) !== -1;
            });

            activate();

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
    app.factory("account", ['$q', '$uibModal', '$filter', 'storage', 'helper', 'managerDatastoreUser', 'managerDatastoreSetting', account]);

}(angular));
