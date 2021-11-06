(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.offlineCache
     * @requires $rootScope
     * @requires $q
     * @requires $window
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.browserClient
     *
     * @description
     * Service to talk to the psono REST api
     */

    var offlineCache = function($rootScope, $q, $window, storage, cryptoLibrary, browserClient) {

        var encryption_key = '';
        var on_set_encryption_key_registrations = [];

        activate();

        function activate() {
            if ($window.psono_offline_cache_encryption_key) {
                set_encryption_key($window.psono_offline_cache_encryption_key);
            }
            browserClient.getOfflineCacheEncryptionKey(function(new_encryption_key) {
                set_encryption_key(new_encryption_key);
            });
        }


        /**
         * @ngdoc
         * @name psonocli.offlineCache#is_active
         * @methodOf psonocli.offlineCache
         *
         * @description
         * returns weather the cache is active or not
         *
         * @returns {boolean} promise
         */
        function is_active() {
            var offline_mode = storage.find_key('config', 'offline-mode');

            if (offline_mode === null) {
                return false;
            }

            return offline_mode.value;
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#is_encrypted
         * @methodOf psonocli.offlineCache
         *
         * @description
         * returns weather the cache is encrypted or not
         *
         * @returns {boolean} promise
         */
        function is_encrypted() {
            return storage.find_key('config', 'offline-cache-encryption-key') !== null;
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#get_encryption_key
         * @methodOf psonocli.offlineCache
         *
         * @description
         * returns the encryption key
         *
         * @returns {string} The hex representation of the encryption key
         */
        function get_encryption_key() {
            return encryption_key;
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#is_encrypted
         * @methodOf psonocli.offlineCache
         *
         * @description
         * returns weather the store is locked or not
         *
         * @returns {boolean} locked status
         */
        function is_locked() {
            return is_encrypted() && !encryption_key;
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#is_encrypted
         * @methodOf psonocli.offlineCache
         *
         * @description
         * returns weather the store is locked or not
         *
         * @returns {boolean} locked status
         */
        function unlock(password) {
            if (typeof(password) === 'undefined') {
                password = '';
            }
            var encryption_key_encrypted = storage.find_key('config', 'offline-cache-encryption-key');
            var encryption_key_salt = storage.find_key('config', 'offline-cache-encryption-salt');
            if (encryption_key_encrypted === null || encryption_key_salt === null) {
                return true;
            }
            try {
                var new_encryption_key = cryptoLibrary.decrypt_secret(
                    encryption_key_encrypted.value.text,
                    encryption_key_encrypted.value.nonce,
                    password,
                    encryption_key_salt.value
                );
            } catch(e) {
                return false;
            }
            set_encryption_key(new_encryption_key);
            browserClient.emit_sec('set-offline-cache-encryption-key', {encryption_key: new_encryption_key});

            return true;
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#set_encryption_key
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Sets the encryption key
         *
         * @param {string} new_encryption_key The new key
         */
        function set_encryption_key (new_encryption_key) {
            if (typeof(new_encryption_key) === 'undefined') {
                return;
            }
            encryption_key = new_encryption_key;
            $window.psono_offline_cache_encryption_key = new_encryption_key;
            for (var i = 0; i < on_set_encryption_key_registrations.length; i++) {
                on_set_encryption_key_registrations[i]();
            }
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#set_encryption_password
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Sets the encryption password
         *
         * @param {string} password The password
         */
        function set_encryption_password(password) {
            var new_encryption_key = cryptoLibrary.generate_secret_key();
            set_encryption_key(new_encryption_key);
            var new_encryption_key_salt = cryptoLibrary.generate_secret_key();
            var new_encryption_key_encrypted = cryptoLibrary.encrypt_secret(new_encryption_key, password, new_encryption_key_salt);
            storage.upsert('config', {key: 'offline-cache-encryption-key', value: new_encryption_key_encrypted});
            storage.upsert('config', {key: 'offline-cache-encryption-salt', value: new_encryption_key_salt});
            storage.save();
            browserClient.emit_sec('set-offline-cache-encryption-key', {encryption_key: new_encryption_key});
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#set
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Sets the request data in cache
         *
         * @param {object} request the request
         * @param {object} data the data
         *
         * @returns {promise} promise
         */
        function set(request, data) {
            if (request.method !== 'GET' || !is_active()) {
                return;
            }

            var value = JSON.stringify(data);

            if (encryption_key) {
                value = cryptoLibrary.encrypt_data(value, encryption_key);

            }

            storage.upsert('offline-cache', {key: request.url.toLowerCase(), value: value});
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#get
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Returns the cached request
         *
         * @param {object} request the request
         *
         * @returns {object} our original request
         */
        function get(request) {
            if (!is_active()) {
                return null;
            }
            if (request.method !== 'GET') {
                return {
                    data: {
                        error: ['Leave the offline mode before creating / modifying any content.']
                    }
                };
            }

            var storage_entry = storage.find_key('offline-cache', request.url.toLowerCase());

            if (storage_entry === null) {
                return null
            }

            var value = storage_entry.value;

            if (encryption_key) {
                value = cryptoLibrary.decrypt_data(value.text, value.nonce, encryption_key);
            }

            return JSON.parse(value);

        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#enable
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Enables the offline cache
         */
        function enable() {
            storage.upsert('config', {key: 'offline-mode', value: true});
            storage.save();

            $rootScope.$broadcast('offline_mode_enabled', '');
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#disable
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Disables the offline cache
         */
        function disable() {
            storage.upsert('config', {key: 'offline-mode', value: false});
            storage.save();
            $rootScope.$broadcast('offline_mode_disabled', '');
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#clear
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Clears the cache
         */
        function clear() {
            storage.remove_all('offline-cache');
            storage.save();
        }

        /**
         * @ngdoc
         * @name psonocli.offlineCache#save
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Saves teh cache
         *
         * @returns {promise} promise
         */
        function save() {
            storage.save();
        }


        /**
         * @ngdoc
         * @name psonocli.offlineCache#on_set_encryption_key
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Registers for unlock events
         *
         * @param {function} fnc The callback function
         */
        function on_set_encryption_key(fnc) {
            on_set_encryption_key_registrations.push(fnc);
        }

        return {
            is_active: is_active,
            get: get,
            set: set,
            get_encryption_key: get_encryption_key,
            is_locked: is_locked,
            unlock: unlock,
            set_encryption_key : set_encryption_key,
            set_encryption_password : set_encryption_password,
            enable: enable,
            disable: disable,
            clear: clear,
            save: save,
            on_set_encryption_key: on_set_encryption_key
        };
    };

    var app = angular.module('psonocli');
    app.factory("offlineCache", ['$rootScope', '$q', '$window', 'storage', 'cryptoLibrary', 'browserClient', offlineCache]);

}(angular));
