(function(angular) {
    'use strict';

    /**
     * managerBase is 'like' a base class for all managers. It contains functions that should be accessible by several
     * managers but should never be added in any other services (because of design pattern and security reasons)
     *
     * @param $q
     * @param $timeout
     * @param $rootScope
     * @param apiClient
     * @param cryptoLibrary
     * @param storage
     * @returns {{delete_local_data: delete_local_data, find_one_nolimit: find_one_nolimit, find_one: find_one}}
     */

    var managerBase = function($q, $timeout, $rootScope, apiClient, cryptoLibrary, storage) {

        var forbidden_keys = {
            'config': [
                'user_token',
                'user_private_key',
                'user_secret_key',
                'user_sauce'
            ]
        };

        /**
         * Deletes local data in storage
         */
        var delete_local_data = function () {
            storage.removeAll();
            storage.save();
        };
        
        /**
         * Privat function, that will return the object with the specified key from the specified db
         *
         * @param db
         * @param key
         *
         * @returns {*}
         * @private
         */
        var find_one_nolimit = function(db, key) {

            var obj = storage.find_one(db, {'key': key});
            if (obj === null) {
                return ''
            }
            return obj['value'];
        };

        /**
         * Finds object with specified key in specified db. Also checks if its in the forbidden key list
         * @param db
         * @param key
         *
         * @returns {string}
         */
        var find_one = function(db, key) {

            if (forbidden_keys.hasOwnProperty(db) && forbidden_keys[db].indexOf(key) >= 0) {
                return ''
            }
            return find_one_nolimit(db, key);
        };

        return {
            delete_local_data: delete_local_data,
            find_one_nolimit: find_one_nolimit,
            find_one: find_one
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerBase", ['$q', '$timeout', '$rootScope', 'apiClient', 'cryptoLibrary', 'storage', managerBase]);

}(angular));