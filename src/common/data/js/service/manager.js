(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.manager
     * @requires managerBase
     * @requires apiClient
     * @requires cryptoLibrary
     * @requires storage
     *
     * @description
     * Service for functions that do not belong in any other manager nor can be
     * grouped in independent managers.
     */

    var manager = function(managerBase, apiClient, cryptoLibrary, storage) {


        /**
         * @ngdoc
         * @name psonocli.manager#find_one
         * @methodOf psonocli.manager
         *
         * @description
         * The public function for other services to search the database.
         * Finds object with specified key in specified db. Also checks if its in the forbidden key list
         *
         * @param {string} db The database to search
         * @param {string} key of the database entry to get
         *
         * @returns {*} Returns the database entry for the given database and key
         */
        var find_one = function(db, key) {

            return managerBase.find_one(db, key);
        };

        /**
         * @ngdoc
         * @name psonocli.manager#storage_on
         * @methodOf psonocli.manager
         *
         * @description
         * Pass through of the event listener function of the storage
         *
         * @param {string} db The database
         * @param {string} event The event to listen to
         * @param {function} callback The callback function to call once the event happens
         */
        var storage_on = function(db, event, callback) {
            storage.on(db, event, callback);
        };

        return {
            find_one: find_one,
            storage_on: storage_on
        };
    };

    var app = angular.module('psonocli');
    app.factory("manager", ['managerBase', 'apiClient', 'cryptoLibrary', 'storage', manager]);

}(angular));