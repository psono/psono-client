(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.storage
     *
     * @description
     * Service that handles local storage access
     */

    var loki_storage = new loki("password_manager_local_storage");
    var dbs = [];

    var dbconfig = [
        {
            name: 'config',
            indices: ['key'],
            uniques: ['key']
        },
        {
            name: 'settings',
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

        for (var i = dbconfig.length - 1; i >= 0; i--) {

            dbs[dbconfig[i].name] = loki_storage.getCollection(dbconfig[i].name);

            if (dbs[dbconfig[i].name] === null) {
                dbs[dbconfig[i].name] = loki_storage.addCollection(dbconfig[i].name, { indices: dbconfig[i].indices});
                for (var t = 0; t < dbconfig[i].uniques.length; t++) {
                    dbs[dbconfig[i].name].ensureUniqueIndex(dbconfig[i].uniques[t]);
                }
            }
        }
    });

    var storage = function() {
        //localStorageService.set('user', 'me');

        /**
         * @ngdoc
         * @name psonocli.storage#insert
         * @methodOf psonocli.storage
         *
         * @description
         * sets one or more items in the specified db
         *
         * @param {string} db The database
         * @param {object|Array} items One or multiple items to put into the database
         */
        var insert = function (db, items) {

            dbs[db].insert(items);
        };

        /**
         * @ngdoc
         * @name psonocli.storage#update
         * @methodOf psonocli.storage
         *
         * @description
         * updates one or more items in the specified db
         *
         * @param {string} db The database
         * @param {object|Array} items One or multiple items to update in the database
         */
        var update = function (db, items) {
            dbs[db].update(items);
        };

        /**
         * @ngdoc
         * @name psonocli.storage#upsert
         * @methodOf psonocli.storage
         *
         * @description
         * inserts or updates one or more items in the specified db.
         * CAUTION: Poor performance. Use direct insert and update wherever possible, especially if you big arrays of items
         *
         * @param {string} db The database
         * @param {object|Array} items One or multiple items to update in the database
         */
        var upsert = function(db, items) {
            var local_items, db_entry;

            if (! (items instanceof Array)) {
                local_items = [items]
            } else {
                local_items = items
            }
            for (var i = 0; i < local_items.length; i++) {
                db_entry = dbs[db].findOne({'key': local_items[i]['key']});

                if (db_entry!== null) {
                    db_entry.value = local_items[i]['value'];
                    dbs[db].update(db_entry);
                } else {
                    dbs[db].insert(local_items[i]);
                }

            }
        };

        /**
         * @ngdoc
         * @name psonocli.storage#data
         * @methodOf psonocli.storage
         *
         * @description
         * gets the data of a database
         *
         * @param {string} db The database
         *
         * @returns {*} Returns the data
         */
        var data = function (db) {
            return dbs[db].data;
        };

        /**
         * @ngdoc
         * @name psonocli.storage#find_one
         * @methodOf psonocli.storage
         *
         * @description
         * returns the first result in config that matches the query
         *
         * @param {string} db The database
         * @param {object} query The query object
         *
         * @returns {object|null} Returns the data object
         */
        var find_one = function (db, query) {
            return dbs[db].findOne(query);
        };

        /**
         * @ngdoc
         * @name psonocli.storage#key_exists
         * @methodOf psonocli.storage
         *
         * @description
         * returns if a specified item exists
         *
         * @param {string} db The database
         * @param {object} key The key of the object
         *
         * @returns {boolean} Returns whether the specified key already exists.
         */
        var key_exists = function (db, key) {
            return dbs[db].findOne({'key': key}) !== null;
        };

        /**
         * @ngdoc
         * @name psonocli.storage#remove
         * @methodOf psonocli.storage
         *
         * @description
         * removes the specified object or object_id
         *
         * @param {string} db The database
         * @param {object} obj The data object
         */
        var remove = function (db, obj) {
            dbs[db].remove(obj);
        };

        /**
         * @ngdoc
         * @name psonocli.storage#remove_all
         * @methodOf psonocli.storage
         *
         * @description
         * removes all objects in all dbs or only in the specified one
         *
         * @param {string} db The database
         */
        var remove_all = function(db) {
            if (typeof db !== 'undefined') {
                dbs[db].removeWhere(function() {
                    return true;
                })
            } else {
                for (var i = dbconfig.length - 1; i >= 0; i--) {
                    dbs[dbconfig[i].name].removeWhere(function() {
                        return true;
                    })
                }
            }

        };

        /**
         * @ngdoc
         * @name psonocli.storage#on
         * @methodOf psonocli.storage
         *
         * @description
         * setups an event listener on an event
         *
         * @param {string} db The database
         * @param {string} event The event to listen to
         * @param {function} callback The callback function
         */
        var on = function (db, event, callback) {
            dbs[db].on(event, callback);
        };
        /**
         * @ngdoc
         * @name psonocli.storage#save
         * @methodOf psonocli.storage
         *
         * @description
         * saves the database, needs to be triggered once some changes are meant to be made persistent
         */
        var save = function () {
            loki_storage.save();
        };

        return {
            insert: insert,
            update: update,
            upsert: upsert,
            data: data,
            find_one: find_one,
            remove: remove,
            remove_all: remove_all,
            on: on,
            save: save
        };
    };

    var app = angular.module('psonocli');
    app.factory("storage", [storage]);

}(angular));