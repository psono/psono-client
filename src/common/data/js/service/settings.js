(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.settings
     * @requires $q
     * @requires psonocli.storage
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastoreSetting
     * @requires psonocli.apiClient
     *
     * @description
     * Service that handles all the settings
     */


    var settings = function($q, storage, managerDatastoreUser, managerDatastoreSetting) {

        var _default_tab = 'password-generator';

        var _tabs = [
            { key: 'password-generator', title: 'Password Generator', description: 'Adjust here the settings for the password generator.' }
        ];

        var _settings = {
            fields: [
                // Password Generator
                { key: "setting_password_length", field: "input", type: "text", title: "Password length", placeholder: "Password length", required: true, default: 16, tab: 'password-generator'},
                { key: "setting_password_letters_uppercase", field: "input", type: "text", title: "Letters uppercase", placeholder: "Letters uppercase", default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', tab: 'password-generator'},
                { key: "setting_password_letters_lowercase", field: "input", type: "text", title: "Letters lowercase", placeholder: "Letters lowercase", default: 'abcdefghijklmnopqrstuvwxyz', tab: 'password-generator'},
                { key: "setting_password_numbers", field: "input", type: "text", title: "Numbers", placeholder: "Numbers", required: true, default: '0123456789', tab: 'password-generator'},
                { key: "setting_password_special_chars", field: "input", type: "text", title: "Special chars", placeholder: "Special chars", default: ',.-;:_#\'+*~!"§$%&/()=?{[]}\\', tab: 'password-generator'}
                // General
            ]
        };

        // will be handled different, and not saved directly to the settings
        var _config_settings = [
        ];

        /**
         * @ngdoc
         * @name psonocli.settings#get_tabs
         * @methodOf psonocli.settings
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
         * @name psonocli.settings#get_default_tab
         * @methodOf psonocli.settings
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
         * @name psonocli.settings#get_setting
         * @methodOf psonocli.settings
         *
         * @description
         * returns the setting with a specific key, applies default values
         *
         * @param {string} key They key of the setting one wants to fetch
         * @returns {*} Returns the setting
         */
        var get_setting = function (key) {

            if (typeof key !== 'undefined') {
                // key specified
                var s = storage.find_key('settings', key);
                if (s !== null) {
                    // found in storage
                    return s.value;
                } else {
                    // not found in storage, lets look for a default value, otherwise return null
                    for (var i = _settings['fields'].length - 1; i >= 0; i--) {
                        if (_settings['fields'][i].key === key) {
                            if (typeof _settings['fields'][i].default !== 'undefined') {
                                return _settings['fields'][i].default
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
         * @ngdoc
         * @name psonocli.settings#get_settings
         * @methodOf psonocli.settings
         *
         * @description
         * returns all settings with structure
         *
         * @returns {Array} Returns a list of all settings
         */
        var get_settings = function() {

            for (var i = _settings['fields'].length - 1; i >= 0; i--) {
                _settings['fields'][i].value = get_setting(_settings['fields'][i].key)
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

            var s = storage.find_key('settings', key);
            if (s !== null) {
                s.value = value;
                storage.update('settings', s);
            } else {
                storage.insert('settings', {key: key, value: value});
            }
        };

        /**
         * @ngdoc
         * @name psonocli.settings#set_settings
         * @methodOf psonocli.settings
         *
         * @description
         * will update one setting specified as key value or many settings as a list of key value objects
         *
         * @param {string|Array} key The key of the setting one wants to update or a list of objects with key and value
         * @param {string} [value] The value of the setting
         */
        var set_settings = function (key, value) {
            if (typeof value !== 'undefined') {
                _set_setting(key, value);
            } else {
                for (var i = key.length - 1; i >= 0; i--) {
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
            storage.save();
        };

        /**
         * @ngdoc
         * @name psonocli.settings#save
         * @methodOf psonocli.settings
         *
         * @description
         * Saves the settings and might update the user data.
         *
         * @returns {promise} Returns a promise with the status
         */
        var save = function() {
            return $q(function(resolve, reject) {

                var specials = {};

                // lets search our settings for the interesting settings
                for (var i = _settings['fields'].length - 1; i >= 0; i--) {
                    if (_config_settings.indexOf(_settings['fields'][i].key) > -1) {
                        specials[_settings['fields'][i].key] = _settings['fields'][i];
                    }
                }

                var totalSuccess = function() {

                    for (var i = _config_settings.length - 1; i >= 0; i--) {
                        specials[_config_settings[i]].value = '';
                    }
                    set_settings(_settings['fields']);

                    return resolve({msgs: ['Saved successfully']})
                };
                return totalSuccess();
            });
        };

        return {
            get_tabs: get_tabs,
            get_default_tab: get_default_tab,
            get_setting: get_setting,
            get_settings: get_settings,
            set_settings: set_settings,
            save: save
        };
    };

    var app = angular.module('psonocli');
    app.factory("settings", ['$q', 'storage', 'managerDatastoreUser', 'managerDatastoreSetting', settings]);

}(angular));
