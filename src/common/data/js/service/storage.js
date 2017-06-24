(function(angular, loki) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.storage
     * @requires psonocli.browserClient
     *
     * @description
     * Service that handles local storage access
     */
    var storage = function(browserClient) {

        var loki_storage = new loki("password_manager_local_storage");
        var dbs = [];

        var db_config = {
            'config': {
                name: 'config',
                indices: ['key'],
                uniques: ['key']
            },
            'persistent': {
                name: 'persistent',
                indices: ['key'],
                uniques: ['key']
            },
            'settings': {
                name: 'settings',
                indices: ['key'],
                uniques: ['key']
            },
            'datastore-password-leafs': {
                name: 'datastore-password-leafs',
                indices: ['key', 'urlfilter', 'name'],
                uniques: ['key']
            },
            'datastore-user-leafs': {
                name: 'datastore-user-leafs',
                indices: ['key', 'filter', 'name'],
                uniques: ['key'],
                subscribers: {
                    update: {
                        current: 0,
                        max: 1
                    },
                    insert: {
                        current: 0,
                        max: 1
                    },
                    delete: {
                        current: 0,
                        max: 1
                    }
                }
            }
        };

        activate();

        function activate() {
            reload();
        }

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
        function insert(db, items) {

            return dbs[db].insert(items);
        }

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
        function update(db, items) {
            return dbs[db].update(items);
        }

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
        function upsert(db, items) {
            var local_items, db_entry;
            var return_values = [];

            if (! (items instanceof Array)) {
                local_items = [items]
            } else {
                local_items = items
            }
            for (var i = 0; i < local_items.length; i++) {
                db_entry = dbs[db].findOne({'key': local_items[i]['key']});

                if (db_entry!== null) {
                    db_entry.value = local_items[i]['value'];
                    return_values.push(dbs[db].update(db_entry));
                } else {
                    return_values.push(dbs[db].insert(local_items[i]));
                }
            }

            if (! (items instanceof Array)) {
                return return_values;
            } else {
                return return_values[0]
            }
        }

        /**
         * @ngdoc
         * @name psonocli.storage#where
         * @methodOf psonocli.storage
         *
         * @description
         * Searches for multiple entries and filter according to a function
         *
         * @param {string} db The database
         * @param {object|Array} filter_function The filter function
         */
        function where(db, filter_function) {
            return dbs[db].where(filter_function);
        }

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
        function find_one(db, query) {
            return dbs[db].findOne(query);
        }

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
        function key_exists(db, key) {
            return dbs[db].findOne({'key': key}) !== null;
        }

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
        function remove(db, obj) {
            dbs[db].remove(obj);
        }

        /**
         * @ngdoc
         * @name psonocli.storage#remove_all
         * @methodOf psonocli.storage
         *
         * @description
         * removes all objects in all dbs (excluding the persistent one) or only in the specified one
         *
         * @param {string} db The database
         */
        function remove_all(db) {
            if (typeof db !== 'undefined') {
                dbs[db].removeWhere(function() {
                    return true;
                })
            } else {

                for (var db_name in dbs) {
                    if (!dbs.hasOwnProperty(db_name)) {
                        continue;
                    }
                    if (db_name === 'persistent') {
                        continue;
                    }
                    dbs[db_name].removeWhere(function() {
                        return true;
                    })

                }
            }

        }

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
        function on(db, event, callback) {

            if (!db_config.hasOwnProperty(db)) {
                return;
            }
            if (db_config[db].hasOwnProperty('subscribers') &&
                db_config[db]['subscribers'].hasOwnProperty(event) &&
                db_config[db]['subscribers'] &&
                db_config[db]['subscribers']['current'] >= db_config[db]['subscribers']['max']) {

                console.log("already reached maximum subscribers");
                return;
            }

            dbs[db].on(event, callback);
        }

        /**
         * @ngdoc
         * @name psonocli.storage#save
         * @methodOf psonocli.storage
         *
         * @description
         * saves the database, needs to be triggered once some changes are meant to be made persistent
         */
        function save() {
            browserClient.emit("storage-reload", null);
            loki_storage.save();
        }

        /**
         * @ngdoc
         * @name psonocli.storage#reload
         * @methodOf psonocli.storage
         *
         * @description
         * Reloads the storage
         */
        function reload() {
            loki_storage.loadDatabase({}, function () {

                for (var db_name in db_config) {
                    if (!db_config.hasOwnProperty(db_name)) {
                        continue;
                    }

                    dbs[db_name] = loki_storage.getCollection(db_name);

                    if (dbs[db_name] === null) {
                        dbs[db_name] = loki_storage.addCollection(db_name, { indices: db_config[db_name].indices});
                        for (var t = 0; t < db_config[db_name].uniques.length; t++) {
                            dbs[db_name].ensureUniqueIndex(db_config[db_name].uniques[t]);
                        }
                    }
                }
            });
        }

        return {
            insert: insert,
            update: update,
            upsert: upsert,
            where: where,
            find_one: find_one,
            key_exists: key_exists,
            remove: remove,
            remove_all: remove_all,
            on: on,
            save: save,
            reload: reload
        };
    };

    var app = angular.module('psonocli');
    app.factory("storage", ['browserClient', storage]);

}(angular, loki));