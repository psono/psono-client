(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.offlineCache
     * @requires $rootScope
     * @requires $q
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * Service to talk to the psono REST api
     */

    var offlineCache = function($rootScope, $q, storage, cryptoLibrary) {



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
        var is_active = function() {
            var offline_mode = storage.find_key('config', 'offline-mode');

            if (offline_mode === null) {
                return false;
            }

            return offline_mode.value;
        };

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
        var set = function (request, data) {
            if (request.method !== 'GET' || !is_active()) {
                return;
            }

            storage.upsert('offline-cache', {key: request.url.toLowerCase(), value: JSON.stringify(data)});
        };

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
        var get = function (request) {
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

            return JSON.parse(storage_entry.value);

        };

        /**
         * @ngdoc
         * @name psonocli.offlineCache#enable
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Enables the offline cache
         */
        var enable = function () {
            storage.upsert('config', {key: 'offline-mode', value: true});
            storage.save();

            $rootScope.$broadcast('offline_mode_enabled', '');
        };

        /**
         * @ngdoc
         * @name psonocli.offlineCache#disable
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Disables the offline cache
         */
        var disable = function () {
            storage.upsert('config', {key: 'offline-mode', value: false});
            storage.save();
            $rootScope.$broadcast('offline_mode_disabled', '');
        };

        /**
         * @ngdoc
         * @name psonocli.offlineCache#clear
         * @methodOf psonocli.offlineCache
         *
         * @description
         * Clears the cache
         */
        var clear = function () {
            storage.remove_all('offline-cache');
            storage.save();
        };

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
        var save = function () {
            storage.save();
        };

        return {
            is_active: is_active,
            get: get,
            set: set,
            enable: enable,
            disable: disable,
            clear: clear,
            save: save
        };
    };

    var app = angular.module('psonocli');
    app.factory("offlineCache", ['$rootScope', '$q', 'storage', 'cryptoLibrary', offlineCache]);

}(angular));
