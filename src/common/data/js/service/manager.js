(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.manager
     * @requires managerBase
     * @requires storage
     *
     * @description
     * Service for functions that do not belong in any other manager nor can be
     * grouped in independent managers.
     */

    var manager = function(managerBase, storage) {

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
            storage_on: storage_on
        };
    };

    var app = angular.module('psonocli');
    app.factory("manager", ['managerBase', 'storage', manager]);

}(angular));