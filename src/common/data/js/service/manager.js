(function(angular) {
    'use strict';

    /**
     * manager is the "catch all" of all managers, for functions that do not belong in any other manager nor can be
     * grouped in independent managers.
     *
     * @param managerBase
     * @param apiClient
     * @param cryptoLibrary
     * @param storage
     * @returns {{find_one: find_one, storage_on: storage_on}}
     */

    var manager = function(managerBase, apiClient, cryptoLibrary, storage) {


        /**
         * Finds object with specified key in specified db. Also checks if its in the forbidden key list
         * @param db
         * @param key
         *
         * @returns {string}
         */
        var find_one = function(db, key) {

            return managerBase.find_one(db, key);
        };

        /**
         * Pass through of the event listener function of the storage
         *
         * @param db
         * @param event
         * @param callback
         *
         * @returns {*}
         */
        var storage_on = function(db, event, callback) {
            return storage.on(db, event, callback);
        };

        return {
            find_one: find_one,
            storage_on: storage_on
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("manager", ['managerBase', 'apiClient', 'cryptoLibrary', 'storage', manager]);

}(angular));