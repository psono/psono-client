(function(angular) {
    'use strict';

    var db = new loki("password_manager_local_storage");
    var config;
    db.loadDatabase({}, function () {

        config = db.getCollection('config');

        if (config === null) {
            config = db.addCollection('config', { indices: ['key']});
            config.ensureUniqueIndex('key');
        }
    });

    var storage = function(localStorageService, cryptoLibrary) {
        //localStorageService.set('user', 'me');

        /**
         * sets one or more items in config
         *
         * @param items
         */
        var config_insert = function (items) {
            config.insert(items);
        };

        /**
         * gets config data
         */
        var config_data = function () {
            return config.data;
        };
        /**
         * returns the first result in config that matches the query
         *
         * @param query
         */
        var config_find_one = function (query) {
            return config.findOne(query);
        };
        /**
         * removes the specified object or object_id
         *
         * @param obj
         * @returns {*}
         */
        var config_remove = function (obj) {
            return config.remove(obj);
        };

        /**
         * setups an event listener on an event
         *
         * @param event
         * @param callback
         * @returns {*}
         */
        var config_on = function (event, callback) {
            return config.on(event, callback);
        };
        /**
         * saves the database, needs to be triggered once some changes are meant to be made persistent
         *
         * @returns {*}
         */
        var save = function () {
            return db.save()
        };

        return {
            config_insert: config_insert,
            config_data: config_data,
            config_find_one: config_find_one,
            config_remove: config_remove,
            config_on: config_on,
            save: save
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("storage", ['localStorageService', 'cryptoLibrary', storage]);

}(angular));