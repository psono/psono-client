(function(angular) {
    'use strict';


    var settings = function($q, storage, manager, managerDatastoreSetting, cryptoLibrary, apiClient) {

        var _tabs = [
            //{ key: 'general', title: 'General' },
            { key: 'profile', title: 'Profile' },
            { key: 'password', title: 'Password Generator' }
        ];

        var _settings = [
            // Profile
            { key: "setting_email", field: "input", type: "email", title: "E-Mail", placeholder: "E-Mail", required: true, tab: 'profile'},
            { key: "setting_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'profile'},
            { key: "setting_password", field: "input", type: "password", title: "New Password", placeholder: "New Password", tab: 'profile', complexify: true},
            { key: "setting_password_repeat", field: "input", type: "password", title: "New Password (repeat)", placeholder: "New Password (repeat)", tab: 'profile'},
            // Password
            { key: "setting_password_length", field: "input", type: "text", title: "Password length", placeholder: "Password length", required: true, default: 16, tab: 'password'},
            { key: "setting_password_letters_uppercase", field: "input", type: "text", title: "Letters uppercase", placeholder: "Letters uppercase", default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', tab: 'password'},
            { key: "setting_password_letters_lowercase", field: "input", type: "text", title: "Letters lowercase", placeholder: "Letters lowercase", default: 'abcdefghijklmnopqrstuvwxyz', tab: 'password'},
            { key: "setting_password_numbers", field: "input", type: "text", title: "Numbers", placeholder: "Numbers", required: true, default: '0123456789', tab: 'password'},
            { key: "setting_password_special_chars", field: "input", type: "text", title: "Special chars", placeholder: "Special chars", default: ',.-;:_#\'+*~!"§$%&/()=?{[]}\\', tab: 'password'}
            // General
        ];

        // will be handled different, and not saved directly to the settings
        var _config_settings = [
            "setting_email",
            "setting_password_old",
            "setting_password",
            "setting_password_repeat"
        ];

        /**
         * returns the tabs
         *
         * @returns {*[]}
         */
        var get_tabs = function() {
            return _tabs;
        };

        /**
         * returns the setting with a specific key, applies default values
         *
         * @param key
         * @returns {*}
         */
        var get_setting = function (key) {

            if (key == 'setting_email') {
                return storage.find_one('config', {key: 'user_email'}).value;
            }

            if (typeof key !== 'undefined') {
                // key specified
                var s = storage.find_one('settings', {'key': key});
                if (s !== null) {
                    // found in storage
                    return s.value;
                } else {
                    // not found in storage, lets look for a default value, otherwise return null
                    for (var i = 0; i < _settings.length; i++) {
                        if (_settings[i].key === key) {
                            if (typeof _settings[i].default !== 'undefined') {
                                return _settings[i].default
                            } else {
                                return null;
                            }
                        }
                    }
                }
            }
            return null
        };

        /**
         * returns all settings with structure
         *
         * @returns {*[]}
         */
        var get_settings = function() {

            for (var i = 0; i < _settings.length; i++) {
                _settings[i].value = get_setting(_settings[i].key)
            }
            return _settings;
        };


        /**
         * will update the storage with a given value for a specific setting
         *
         * @param key
         * @param value
         * @private
         */
        var _set_setting = function(key, value) {

            var s = storage.find_one('settings', {'key': key});
            if (s !== null) {
                s.value = value;
                storage.update('settings', s);
            } else {
                storage.insert('settings', {key: key, value: value});
            }
        };

        /**
         * will update one setting specified as key value or many settings as a list of key value objects
         *
         * @param key
         * @param value
         * @returns {*}
         */
        var set_settings = function (key, value) {
            if (typeof value !== 'undefined') {
                _set_setting(key, value);
            } else {
                for (var i = 0; i < key.length; i++) {
                    _set_setting(key[i].key, key[i].value);
                }
            }

            var s = get_settings();
            var content = [];
            for (var k = 0; k < s.length; k++) {
                if (_config_settings.indexOf(s[k].key) > -1) {
                    continue;
                }
                content.push({
                    key: s[k].key,
                    value: s[k].value
                });
            }
            managerDatastoreSetting.save_settings_datastore(content);
            return storage.save();
        };

        /**
         * triggers a save
         *
         * @returns {*}
         */
        var save = function() {
            return $q(function(resolve, reject) {
                var specials = {};

                // lets search our settings for the interesting settings
                for (var i = 0; i < _settings.length; i++) {
                    if (_config_settings.indexOf(_settings[i].key) > -1) {
                        specials[_settings[i].key] = _settings[i];
                    }
                }

                var mailobj = storage.find_one('config', {key: 'user_email'});
                var config_email = mailobj.value;

                var totalSuccess = function() {

                    for (var i = 0; i < _config_settings.length; i++) {
                        specials[_config_settings[i]].value = '';
                    }
                    set_settings(_settings);

                    return resolve({msgs: ['Saved successfully']})
                };


                if ((specials['setting_password'].value && specials['setting_password'].value.length > 0)
                    || (specials['setting_password_repeat'].value && specials['setting_password_repeat'].value.length > 0)
                    || config_email !== specials['setting_email'].value) {

                    // email or password changed, lets check for a correct old password and then update our backend

                    var new_password = specials['setting_password'].value;

                    if (specials['setting_password'].value !== specials['setting_password_repeat'].value) {
                        console.log("reject");
                        return reject({errors: ['Passwords mismatch']})
                    }
                    if (((specials['setting_password'].value !== null && specials['setting_password'].value.length > 0)
                        || (specials['setting_password_repeat'].value !== null && specials['setting_password_repeat'].value.length > 0))
                        && (specials['setting_password_old'].value == null || specials['setting_password_old'].value.length == 0)) {
                        return reject({errors: ['Old password empty']})
                    }
                    if (specials['setting_password'].value === null || specials['setting_password'].value.length == 0) {
                        // no new password specified, so user wants to update the email
                        new_password = specials['setting_password_old'].value;

                    }

                    var authkey_old = cryptoLibrary.generate_authkey(config_email, specials['setting_password_old'].value);

                    var new_authkey = cryptoLibrary.generate_authkey(specials['setting_email'].value, new_password);
                    var user_private_key = storage.find_one('config', {key: 'user_private_key'});
                    var user_secret_key = storage.find_one('config', {key: 'user_secret_key'});
                    var user_sauce = storage.find_one('config', {key: 'user_sauce'}).value;

                    var priv_key_enc = cryptoLibrary.encrypt_secret(user_private_key.value, new_password, user_sauce);
                    var secret_key_enc = cryptoLibrary.encrypt_secret(user_secret_key.value, new_password, user_sauce);

                    var onSucces = function(data) {

                        //update local mail storage
                        mailobj.value = specials['setting_email'].value;
                        storage.update('config', mailobj);

                        return totalSuccess();
                    };
                    var onError = function() {
                        return reject({errors: ['Old password incorrect']})
                    };
                    return manager.updateUser(specials['setting_email'].value, new_authkey, authkey_old, priv_key_enc.text, priv_key_enc.nonce, secret_key_enc.text, secret_key_enc.nonce, user_sauce)
                        .then(onSucces, onError);


                }
                return totalSuccess();
            });
        };

        return {
            get_tabs: get_tabs,
            get_setting: get_setting,
            get_settings: get_settings,
            set_settings: set_settings,
            save: save
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("settings", ['$q', 'storage', 'manager', 'managerDatastoreSetting', 'cryptoLibrary', 'apiClient', settings]);

}(angular));
