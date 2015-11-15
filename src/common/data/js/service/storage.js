(function(angular) {
    'use strict';

    var loki_storage = new loki("password_manager_local_storage");
    var dbs = [];
    loki_storage.loadDatabase({}, function () {

        dbs['config'] = loki_storage.getCollection('config');

        if (dbs['config'] === null) {
            dbs['config'] = loki_storage.addCollection('config', { indices: ['key']});
            dbs['config'].ensureUniqueIndex('key');
        }

        // Start of temporary storages

        dbs['temp_secret'] = loki_storage.getCollection('temp_secret');

        if (dbs['temp_secret'] === null) {
            dbs['temp_secret'] = loki_storage.addCollection('temp_secret', { indices: ['key']});
            dbs['temp_secret'].ensureUniqueIndex('key');
        }
    });

    var storage = function(localStorageService, cryptoLibrary) {
        //localStorageService.set('user', 'me');

        /**
         * sets one or more items in the specified db
         *
         * @param db
         * @param items
         */
        var insert = function (db, items) {
            dbs[db].insert(items);
        };

        /**
         * gets config data
         *
         * @param db
         */
        var data = function (db) {
            return dbs[db].data;
        };
        /**
         * returns the first result in config that matches the query
         *
         * @param db
         * @param query
         */
        var find_one = function (db, query) {
            return dbs[db].findOne(query);
        };
        /**
         * removes the specified object or object_id
         *
         * @param db
         * @param obj
         * @returns {*}
         */
        var remove = function (db, obj) {
            return dbs[db].remove(obj);
        };

        /**
         * setups an event listener on an event
         *
         * @param db
         * @param event
         * @param callback
         * @returns {*}
         */
        var on = function (db, event, callback) {
            return dbs[db].on(event, callback);
        };
        /**
         * saves the database, needs to be triggered once some changes are meant to be made persistent
         *
         * @returns {*}
         */
        var save = function () {
            return loki_storage.save()
        };

        return {
            insert: insert,
            data: data,
            find_one: find_one,
            remove: remove,
            on: on,
            save: save
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("storage", ['localStorageService', 'cryptoLibrary', storage]);

}(angular));