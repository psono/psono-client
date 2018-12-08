(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerDatastore
     * @requires $q
     * @requires $timeout
     * @requires psonocli.browserClient
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.storage
     * @requires psonocli.helper
     *
     * @description
     * managerDatastore collects all functions to edit / update / create a datastore and to work with it.
     */

    var managerDatastore = function($q, $timeout, browserClient, managerBase, apiClient, cryptoLibrary, storage, helper) {

        var registrations = {};
        var temp_datastore_key_storage = {};
        var temp_datastore_overview = false;

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#get_datastore_overview
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Returns the overview of all datastores that belong to this user
         *
         * @param {boolean} [force_fresh] (optional) Force fresh call to the backend
         *
         * @returns {promise} Promise with the datastore overview
         */
        var get_datastore_overview = function(force_fresh) {

            if ( (typeof force_fresh === 'undefined' || force_fresh === false) && temp_datastore_overview) {
                // we have them in cache, so lets save the query
                return $q(function (resolve) {
                    resolve(temp_datastore_overview);
                });
            } else {
                // we dont have them in cache, so lets query and save them in cache for next time
                var onSuccess = function (result) {
                    temp_datastore_overview = result;
                    emit('on_datastore_overview_update', undefined);
                    return result
                };
                var onError = function () {
                    // pass
                };

                return apiClient.read_datastore(managerBase.get_token(),
                    managerBase.get_session_secret_key())
                    .then(onSuccess, onError);
            }

        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#get_datastore_id
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Returns the datastore_id for the given type
         *
         * @param {string} type The type of the datastore that we are looking for
         * @param {boolean|undefined} [force_fresh] (optional) if you want to force a fresh query to the backend
         *
         * @returns {promise} Promise with the datastore id
         */
        var get_datastore_id = function (type, force_fresh) {

            var onSuccess = function (result) {

                if (typeof(result) === 'undefined') {
                    return;
                }

                var stores = result.data['datastores'];

                var datastore_id = '';
                for (var i = 0; i < stores.length; i++) {
                    if (stores[i].type === type && stores[i].is_default) {
                        datastore_id = stores[i].id
                    }
                }

                return datastore_id
            };
            var onError = function () {
                // pass
            };

            return get_datastore_overview(force_fresh)
                .then(onSuccess, onError);
        };
        /**
         * @ngdoc
         * @name psonocli.managerDatastore#get_datastore_with_id
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Returns the datastore for a given id
         *
         * @param {uuid} datastore_id The datastore id
         *
         * @returns {promise} Promise with the datastore that belongs to the given id
         */
        var get_datastore_with_id = function (datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {

                var datastore_secret_key = managerBase.decrypt_secret_key(
                    result.data.secret_key,
                    result.data.secret_key_nonce
                );

                temp_datastore_key_storage[datastore_id] = datastore_secret_key;

                var datastore = {};

                if (result.data.data !== '') {
                    var data = cryptoLibrary.decrypt_data(
                        result.data.data,
                        result.data.data_nonce,
                        datastore_secret_key
                    );

                    datastore = JSON.parse(data);
                }

                datastore['datastore_id'] = datastore_id;

                return datastore;
            };

            return apiClient.read_datastore(managerBase.get_token(),
                managerBase.get_session_secret_key(), datastore_id)
                .then(onSuccess, onError);
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastore#create_datastore
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Creates a datastore with the given type, description and default status
         *
         * @param {string} type The type of the datastore
         * @param {string} description The description
         * @param {boolean} is_default Is it a default datastore or not?
         *
         * @returns {promise} A promise with result of the operation
         */
        var create_datastore = function(type, description, is_default) {
            //datastore does really not exist, lets create one and return it
            var secret_key = cryptoLibrary.generate_secret_key();
            var cipher = managerBase.encrypt_secret_key(secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {

                if (temp_datastore_overview) {
                    if (is_default) {
                        // New datastore is the new default, so update the existing list
                        for (var i = 0; i < temp_datastore_overview.data.datastores.length; i++) {
                            temp_datastore_overview.data.datastores[i].is_default = false;
                        }
                    }

                    temp_datastore_overview.data.datastores.push({
                        id: result.data.datastore_id,
                        description: description,
                        type: type,
                        is_default: is_default
                    });
                    emit('on_datastore_overview_update', undefined);
                }
                return result;
            };

            return apiClient.create_datastore(managerBase.get_token(),
                managerBase.get_session_secret_key(), type, description, '', '',
                is_default, cipher.text, cipher.nonce).then(onSuccess, onError);
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastore#delete_datastore
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Deletes a datastore
         *
         * @param {uuid} datastore_id The id of the datastore
         * @param {string} password The user's password
         *
         * @returns {promise} A promise with result of the operation
         */
        var delete_datastore = function(datastore_id, password) {

            var authkey = cryptoLibrary.generate_authkey(storage.find_key('config', 'user_username').value, password);


            var onError = function(result) {
                return $q.reject(result.data);
            };

            var onSuccess = function(data) {
                // pass
            };


            return apiClient.delete_datastore(managerBase.get_token(),
                managerBase.get_session_secret_key(), datastore_id, authkey)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#get_datastore
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Returns the datastore for the given type and and description
         *
         * @param {string} type The type of the datastore
         * @param {uuid} id The id of a datastore
         *
         * @returns {promise} Promise with the datastore's content
         */
        var get_datastore = function(type, id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(datastore_id) {
                if (datastore_id === '') {
                    //datastore does not exist, lets force a fresh query to make sure

                    var onSuccess = function(datastore_id) {

                        if (datastore_id === '') {
                            //datastore does really not exist, lets create one and return it

                            var onError = function(result) {
                                // pass
                            };

                            var onSuccess = function(result) {
                                return get_datastore_with_id(result.data.datastore_id);
                            };

                            return create_datastore(type, 'Default', true)
                                .then(onSuccess, onError);
                        } else {
                            // okay, cache was out of date, so lets get this datastore now
                            return get_datastore_with_id(datastore_id);
                        }
                    };

                    var onError = function(result) {
                        // pass
                    };


                    return get_datastore_id(type, true)
                        .then(onSuccess, onError);

                } else {
                    return get_datastore_with_id(datastore_id);
                }
            };

            if (id) {
                return onSuccess(id);
            } else {
                return get_datastore_id(type)
                    .then(onSuccess, onError);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#add_node_to_storage
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Adds a node to the storage
         *
         * @param {string} db The database to add the item to
         * @param {TreeObject} folder The Tree object
         * @param {Array} map The map with key / value
         */
        var add_node_to_storage = function (db, folder, map) {
            if(typeof folder === 'undefined') {
                return;
            }
            var i;
            for (i = 0; folder.hasOwnProperty("folders") && i < folder.folders.length; i ++) {
                add_node_to_storage(db, folder.folders[i], map);
            }

            for (i = 0; folder.hasOwnProperty("items") && i < folder.items.length; i++) {
                var item = {};

                for (var m = 0; m < map.length; m++) {
                    item[map[m][0]] = folder.items[i][map[m][1]];
                }

                item['type'] = folder.items[i].type;

                storage.upsert(db, item);
            }

        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastore#fill_storage
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Fills the local datastore with given name
         *
         * @param {string} db The database to add the item to
         * @param {TreeObject} datastore The Tree object
         * @param {Array} map The map with key / value
         */
        var fill_storage = function(db, datastore, map) {
            storage.remove_all(db);

            add_node_to_storage(db, datastore, map);

            storage.save();
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#encrypt_datastore
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Encrypts the content for a datastore with given id. The function will check if the secret key of the
         * datastore is already known, otherwise it will query the server for the details.
         *
         * @param {uuid} datastore_id The datastore id
         * @param {TreeObject} content The real object you want to encrypt in the datastore
         *
         * @returns {promise} Promise with the status of the save
         */
        var encrypt_datastore = function (datastore_id, content) {

            var json_content = JSON.stringify(content);

            var encrypt = function (datastore_id, json_content) {
                var secret_key = temp_datastore_key_storage[datastore_id];

                return cryptoLibrary.encrypt_data(json_content, secret_key);
            };

            if (temp_datastore_key_storage.hasOwnProperty(datastore_id)) {
                // datastore secret key exists in temp datastore key storage, but we have to return a promise :/
                return $q(function (resolve) {
                    resolve(encrypt(datastore_id, json_content));
                });
            } else {

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(datastore_id) {
                    // datastore_secret key should now exist in temp datastore key storage
                    return encrypt(datastore_id, json_content);
                };

                return get_datastore_with_id(datastore_id)
                    .then(onSuccess, onError)

            }
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastore#save_datastore_content_with_id
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Saves some content in a datastore
         *
         * @param {uuid} datastore_id The datastore id
         * @param {TreeObject} content The real object you want to encrypt in the datastore
         *
         * @returns {promise} Promise with the status of the save
         */
        var save_datastore_content_with_id = function (datastore_id, content) {

            var onError = function(result) {
                // pass
            };
            var onSuccess = function(data) {

                var onError = function(result) {
                    // pass
                };
                var onSuccess = function(result) {
                    return result.data;
                };

                return apiClient.write_datastore(managerBase.get_token(),
                    managerBase.get_session_secret_key(), datastore_id, data.text, data.nonce)
                    .then(onSuccess, onError);
            };

            return encrypt_datastore(datastore_id, content)
                .then(onSuccess, onError);
        };


        /**
         * @ngdoc
         * @name psonocli.managerDatastore#save_datastore_meta
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Updates the meta of a datastore specified by the datastore id
         *
         * @param {uuid} datastore_id The id of the datastore to update
         * @param {string} description The new description
         * @param {boolean} is_default Is this the new default datastore
         *
         * @returns {promise} Promise with the status of the save
         */
        var save_datastore_meta = function (datastore_id, description, is_default) {

            var onError = function(result) {
                // pass
            };
            var onSuccess = function(result) {
                // update our datastore overview cache
                var update_happened = false;
                for (var i = 0; i < temp_datastore_overview.data.datastores.length; i++) {
                    if (temp_datastore_overview.data.datastores[i].id === datastore_id
                        && temp_datastore_overview.data.datastores[i].description === description
                        && temp_datastore_overview.data.datastores[i].is_default === is_default) {
                        break
                    }

                    if (temp_datastore_overview.data.datastores[i].id === datastore_id) {
                        temp_datastore_overview.data.datastores[i].description = description;
                        temp_datastore_overview.data.datastores[i].is_default = is_default;
                        update_happened = true;
                    }
                    if (temp_datastore_overview.data.datastores[i].id !== datastore_id && is_default) {
                        temp_datastore_overview.data.datastores[i].is_default = false;
                    }
                }
                if (update_happened) {
                    emit('on_datastore_overview_update', undefined);
                }
                return result.data;
            };

            return apiClient.write_datastore(managerBase.get_token(),
                managerBase.get_session_secret_key(), datastore_id, undefined, undefined,
                undefined, undefined, description, is_default)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#save_datastore_content
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Saves some content in a datastore specified with type and description
         *
         * @param {string} type The type of the datastore that we want to save
         * @param {string} description The description of the datastore we want to save
         * @param {TreeObject} content The content of the datastore
         *
         * @returns {promise} Promise with the status of the save
         */
        var save_datastore_content = function (type, description, content) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(datastore_id) {

                return save_datastore_content_with_id(datastore_id, content);
            };

            return get_datastore_id(type)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#filter
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * used to filter a datastore
         *
         * @param {string} folder The key of the function
         * @param {function} func The call back function
         */
        var filter = function (folder, func) {
            var i;
            if (!folder) {
                return;
            }
            if (folder.hasOwnProperty('folders')) {
                for (i = 0; i < folder['folders'].length; i++) {
                    filter(folder['folders'][i], func);
                }
            }

            if (folder.hasOwnProperty('items')) {
                for (i = 0; i < folder['items'].length; i++) {
                    func(folder['items'][i]);
                }
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#register
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * used to register functions to bypass circular dependencies
         *
         * @param {string} key The key of the function
         * @param {function} func The call back function
         */
        var register = function (key, func) {
            if (!registrations.hasOwnProperty(key)) {
                registrations[key] = []
            }
            registrations[key].push(func);
        };

        /**
         * @ngdoc
         * @name psonocli.managerDatastore#emit
         * @methodOf psonocli.managerDatastore
         *
         * @description
         * Small wrapper to execute all functions that have been registered for an event once the event is triggered
         *
         * @param {string} key The key of the event
         * @param {*} payload The payload of the event
         */
        var emit = function(key, payload) {
            if (registrations.hasOwnProperty(key)) {
                for (var i = 0; i < registrations[key].length; i++) {
                    registrations[key][i](payload);
                }
            }
        };

        var on_logout = function () {
            temp_datastore_key_storage = {};
            temp_datastore_overview = false;
        };

        browserClient.on("logout", on_logout);


        return {
            get_datastore_overview: get_datastore_overview,
            get_datastore_id: get_datastore_id,
            get_datastore_with_id: get_datastore_with_id,
            create_datastore: create_datastore,
            delete_datastore: delete_datastore,
            get_datastore: get_datastore,
            add_node_to_storage: add_node_to_storage,
            fill_storage: fill_storage,
            save_datastore_content: save_datastore_content,
            save_datastore_content_with_id: save_datastore_content_with_id,
            save_datastore_meta: save_datastore_meta,
            encrypt_datastore: encrypt_datastore,
            filter: filter,
            register: register
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerDatastore", ['$q', '$timeout', 'browserClient', 'managerBase', 'apiClient', 'cryptoLibrary', 'storage', 'helper', managerDatastore]);

}(angular));
