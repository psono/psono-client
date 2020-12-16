(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.settings
     * @requires $q
     * @requires psonocli.storage
     * @requires psonocli.managerDatastore
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.managerDatastoreSetting
     * @requires psonocli.languagePicker
     *
     * @description
     * Service that handles all the settings
     */


    var settings = function($q, storage, managerDatastore, managerDatastoreUser, managerDatastoreSetting, languagePicker) {

        var _default_tab = 'password-generator';

        var registrations = {};

        var _tabs = [
            { key: 'password-generator', title: 'PASSWORD_GENERATOR', description: 'PASSWORD_GENERATOR_DESCRIPTION' },
            { key: 'language', title: 'LANGUAGE', description: 'LANGUAGE_DESCRIPTION' },
            { key: 'notification', title: 'NOTIFICATIONS', description: 'NOTIFICATIONS_DESCRIPTION' },
            { key: 'gpg', title: 'GPG', description: 'GPG_DESCRIPTION' },
        ];

        var _settings = {
            fields: [
                // Password Generator
                { key: "setting_password_length", field: "input", type: "text", title: "PASSWORD_LENGTH", placeholder: "PASSWORD_LENGTH", required: true, default: 16, tab: 'password-generator'},
                { key: "setting_password_letters_uppercase", field: "input", type: "text", title: "LETTERS_UPPERCASE", placeholder: "LETTERS_UPPERCASE", default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', tab: 'password-generator'},
                { key: "setting_password_letters_lowercase", field: "input", type: "text", title: "LETTERS_LOWERCASE", placeholder: "LETTERS_LOWERCASE", default: 'abcdefghijklmnopqrstuvwxyz', tab: 'password-generator'},
                { key: "setting_password_numbers", field: "input", type: "text", title: "NUMBERS", placeholder: "NUMBERS", required: true, default: '0123456789', tab: 'password-generator'},
                { key: "setting_password_special_chars", field: "input", type: "text", title: "SPECIAL_CHARS", placeholder: "SPECIAL_CHARS", default: ',.-;:_#\'+*~!"§$%&/()=?{[]}\\', tab: 'password-generator'},
                // Language
                { key: "language_language", field: "select", type: "select", title: "LANGUAGE", get_options: "get_language_options", get_default: "get_default_language", tab: 'language', save: '', onChange: 'on_change_language'},
                // GPG
                { key: "gpg_default_key", field: "select", type: "select", title: "DEFAULT_KEY", default: '', get_options: "get_gpg_default_key_options", tab: 'gpg'},
                { key: "gpg_hkp_key_server", field: "input", type: "text", title: "HKP_SERVER", placeholder: "HKP_SERVER", default: 'https://keyserver.ubuntu.com', tab: 'gpg'},
                { key: "gpg_hkp_search", field: "input", type: "checkbox", title: "AUTOSEARCH_HKP", default: true, tab: 'gpg' },
                // Notification
                { key: "enable_notification_password_copy", field: "input", type: "checkbox", title: "ENABLE_NOTIFICATION_ON_PASSWORD_COPY", default: true, tab: 'notification'},
                // General
            ],
            get_gpg_default_key_options: function () {
                return $q(function(resolve) {

                    registrations['get_password_datastore']().then(function(datastore){

                        var own_pgp_secrets = [];

                        managerDatastore.filter(datastore, function(item) {
                            if (!item.hasOwnProperty("type") || item['type'] !== 'mail_gpg_own_key') {
                                return;
                            }
                            own_pgp_secrets.push({
                                id: item.id,
                                label: item.name
                            });
                        });
                        resolve(own_pgp_secrets);

                    });
                });
            },
            get_language_options: function () {
                return $q(function(resolve) {

                    var langs = languagePicker.get_language_array();
                    var lang_options = [];
                    for (var i = 0; i < langs.length; i++) {
                        if (! langs[i]['active']) {
                            continue;
                        }
                        lang_options.push({
                            id: langs[i]['code'],
                            label: langs[i]['lng_code']
                        })
                    }
                    resolve(lang_options);
                });
            },
            get_default_language: function () {
                var lang = languagePicker.get_active_language();
                return {
                    id: lang['code'],
                    label: lang['lng_code']
                };
            },
            on_change_language: function (fields) {
                for(var i = 0; i < fields.length; i++) {
                    if (fields[i].key !== 'language_language') {
                        continue;
                    }
                    languagePicker.changeLanguage(fields[i].value.id)
                }
            }
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
                            } else if (typeof _settings['fields'][i].get_default !== 'undefined') {
                                return _settings[_settings['fields'][i].get_default]();
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
            function set_option(field) {
                if (!field.hasOwnProperty('get_options')) {
                    return;
                }
                _settings[field['get_options']]().then(function(options) {
                    field['options'] = options;
                })
            }

            for (var i = _settings['fields'].length - 1; i >= 0; i--) {
                _settings['fields'][i].value = get_setting(_settings['fields'][i].key);
                set_option(_settings['fields'][i]);
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
                    if (key[i].hasOwnProperty('save')) {
                        if (_settings.hasOwnProperty(key[i]['save'])) {
                            _settings[key[i]['save']](key[i]);
                        }
                    } else {
                        _set_setting(key[i].key, key[i].value);
                    }
                }
            }

            var s = get_settings();
            var content = [];
            for (var k = 0; k < s['fields'].length; k++) {
                if (_config_settings.indexOf(s['fields'][k].key) > -1) {
                    continue;
                }

                if (s['fields'][k].hasOwnProperty('save')) {
                    continue;
                }

                content.push({
                    key: s['fields'][k].key,
                    value: s['fields'][k].value
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

                    return resolve({msgs: ['SAVE_SUCCESS']})
                };
                return totalSuccess();
            });
        };

        /**
         * @ngdoc
         * @name psonocli.itemBlueprint#register
         * @methodOf psonocli.itemBlueprint
         *
         * @description
         * used to register functions to bypass circular dependencies
         *
         * @param {string} key The key of the function (usually the function name)
         * @param {function} func The call back function
         */
        var register = function (key, func) {
            registrations[key] = func;
        };

        return {
            get_tabs: get_tabs,
            get_default_tab: get_default_tab,
            get_setting: get_setting,
            get_settings: get_settings,
            set_settings: set_settings,
            save: save,
            register: register,
        };
    };

    var app = angular.module('psonocli');
    app.factory("settings", ['$q', 'storage', 'managerDatastore', 'managerDatastoreUser', 'managerDatastoreSetting', 'languagePicker', settings]);

}(angular));
