(function(angular) {
    'use strict';


    var settings = function(storage) {

        var _tabs = [
            { key: 'general', title: 'General' },
            { key: 'profile', title: 'Profile' },
            { key: 'password', title: 'Password Generator' }
        ];

        var _settings = [
            // Profile
            { key: "setting_email", field: "input", type: "email", title: "E-Mail", placeholder: "E-Mail", required: true, tab: 'profile'},
            { key: "setting_password_old", field: "input", type: "password", title: "Old Password", placeholder: "Old Password", tab: 'profile'},
            { key: "setting_password", field: "input", type: "password", title: "New Password", placeholder: "New Password", tab: 'profile'},
            { key: "setting_password_repeat", field: "input", type: "password", title: "New Password (repeat)", placeholder: "New Password (repeat)", tab: 'profile'},
            // Password
            { key: "setting_password_length", field: "input", type: "text", title: "Password length", placeholder: "Password length", required: true, default: 16, tab: 'password'},
            { key: "setting_password_letters_uppercase", field: "input", type: "text", title: "Letters uppercase", placeholder: "Letters uppercase", default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', tab: 'password'},
            { key: "setting_password_letters_lowercase", field: "input", type: "text", title: "Letters lowercase", placeholder: "Letters lowercase", default: 'abcdefghijklmnopqrstuvwxyz', tab: 'password'},
            { key: "setting_password_numbers", field: "input", type: "text", title: "Numbers", placeholder: "Numbers", required: true, default: '0123456789', tab: 'password'},
            { key: "setting_password_special_chars", field: "input", type: "text", title: "Special chars", placeholder: "Special chars", default: ',.-;:_#\'+*~!"§$%&/()=?{[]}\\', tab: 'password'}
            // General
        ];

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
            if (typeof key !== 'undefined') {
                // key specified
                var s = storage.find_one('settings', {'key': 'key'});
                if (s !== null) {
                    // found in storage
                    return s;
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
            try {
                storage.insert('settings', {key: key, value: value});
            } catch(e){
                storage.update({key: key, value: value});
            }
        };

        /**
         * will update one setting or many settings specified as key value or as a list of key value objects
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
            return storage.save();
        };


        return {
            get_tabs: get_tabs,
            get_setting: get_setting,
            get_settings: get_settings,
            set_settings: set_settings
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("settings", ['storage', settings]);

}(angular));
