(function(angular) {
    'use strict';

    var loki_storage = new loki("password_manager_local_storage");
    var dbs = [];

    var dbconfig = [
        {
            name: 'config',
            indices: ['key'],
            uniques: ['key']
        },
        {
            name: 'datastore-password-leafs',
            indices: ['key', 'urlfilter', 'name'],
            uniques: ['key']
        },
        {
            name: 'datastore-user-leafs',
            indices: ['key', 'filter', 'name'],
            uniques: ['key']
        }

    ];

    loki_storage.loadDatabase({}, function () {

        for(var i = 0; i < dbconfig.length; i++) {

            dbs[dbconfig[i].name] = loki_storage.getCollection(dbconfig[i].name);

            if (dbs[dbconfig[i].name] === null) {
                dbs[dbconfig[i].name] = loki_storage.addCollection(dbconfig[i].name, { indices: dbconfig[i].indices});
                for (var t = 0; t < dbconfig[i].uniques.length; t++) {
                    dbs[dbconfig[i].name].ensureUniqueIndex(dbconfig[i].uniques[t]);
                }
            }
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
         * removes all objects in all dbs or only in the specified one
         *
         * @param db
         */
        var removeAll = function(db) {
            if (typeof db !== 'undefined') {
                dbs[db].removeWhere(function() {
                    return true;
                })
            } else {
                for(var i = 0; i < dbconfig.length; i++) {
                    dbs[dbconfig[i].name].removeWhere(function() {
                        return true;
                    })
                }
            }

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
            removeAll: removeAll,
            on: on,
            save: save
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("storage", ['localStorageService', 'cryptoLibrary', storage]);

}(angular));