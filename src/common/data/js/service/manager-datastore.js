(function(angular) {
    'use strict';

    var managerDatastore = function($q, $timeout, apiClient, cryptoLibrary, storage) {

        var temp_datastore_key_storage = {};
        var temp_datastore_overview = false;

        /**
         * Privat function, that will return the object with the specified key from the specified db
         *
         * @param db
         * @param key
         *
         * @returns {*}
         * @private
         */
        var _find_one = function(db, key) {

            var obj = storage.find_one(db, {'key': key});
            if (obj === null) {
                return ''
            }
            return obj['value'];
        };

        /**
         * Returns the overview of all datastores that belong to this user
         *
         * @param force_fresh
         * @returns {promise}
         * @private
         */
        var _get_datastore_overview = function(force_fresh) {

            if ( (typeof force_fresh === 'undefined' || force_fresh === false) && temp_datastore_overview) {
                // we have them in cache, so lets save the query
                return $q(function (resolve) {
                    resolve(temp_datastore_overview);
                });
            } else {
                // we dont have them in cache, so lets query and save them in cache for next time
                var onSuccess = function (result) {
                    temp_datastore_overview = result;
                    return result
                };
                var onError = function () {
                    // pass
                };

                return apiClient.read_datastore(_find_one('config', 'user_token'))
                    .then(onSuccess, onError);
            }

        };

        /**
         * Returns the datastore_id for the given type and description
         *
         * @param type
         * @param description
         * @param force_fresh (optional) if you want to force a fresh query to the backend
         *
         * @returns {promise}
         * @private
         */
        var _get_datastore_id = function (type, description, force_fresh) {

            var onSuccess = function (result) {

                var stores = result.data['datastores'];

                var datastore_id = '';
                for (var i = 0; i < stores.length; i++) {
                    if (stores[i].type === type && stores[i].description === description) {
                        datastore_id = stores[i].id
                    }
                }

                return datastore_id
            };
            var onError = function () {
                // pass
            };

            return _get_datastore_overview(force_fresh)
                .then(onSuccess, onError);
        };
        /**
         * Returns the datastore for a given id
         *
         * @param datastore_id
         *
         * @returns {promise}
         * @private
         */
        var _get_datastore_with_id = function (datastore_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(result) {

                var datastore_secret_key = cryptoLibrary.decrypt_data(
                    result.data.secret_key,
                    result.data.secret_key_nonce,
                    _find_one('config', 'user_secret_key')
                );

                temp_datastore_key_storage[datastore_id] = datastore_secret_key;


                if (result.data.data === '') {
                    return {}
                }

                var data = cryptoLibrary.decrypt_data(
                    result.data.data,
                    result.data.data_nonce,
                    datastore_secret_key
                );

                return JSON.parse(data);
            };

            return apiClient.read_datastore(_find_one('config', 'user_token'), datastore_id)
                .then(onSuccess, onError);
        };


        /**
         * Returns the datastore for the given type and and description
         *
         * @param type
         * @param description
         *
         * @returns {promise}
         * @private
         */
        var _get_datastore = function(type, description) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(datastore_id) {

                if (datastore_id === '') {
                    //datastore does not exist, lets force a fresh query to make sure

                    var onSuccess = function(datastore_id) {

                        if (datastore_id === '') {
                            //datastore does really not exist, lets create one and return it

                            var secret_key = cryptoLibrary.generate_secret_key();

                            var cipher = cryptoLibrary.encrypt_data(
                                secret_key,
                                _find_one('config', 'user_secret_key')
                            );


                            var onError = function(result) {
                                // pass
                            };

                            var onSuccess = function(result) {
                                return _get_datastore_with_id(result.data.datastore_id);
                            };

                            return apiClient.create_datastore(_find_one('config', 'user_token'), type, description, '', '', cipher.text, cipher.nonce)
                                .then(onSuccess, onError);
                        }
                    };

                    var onError = function(result) {
                        // pass
                    };


                    return _get_datastore_id(type, description, true)
                        .then(onSuccess, onError);

                } else {
                    return _get_datastore_with_id(datastore_id);
                }
            };

            return _get_datastore_id(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Adds a node to the storage
         *
         * @param name
         * @param folder
         * @param map
         * @private
         */
        var _addNodeToStorage = function (name, folder, map) {
            if(typeof folder === 'undefined') {
                return;
            }
            var i;
            for (i = 0; folder.hasOwnProperty("folders") && i < folder.folders.length; i ++) {
                _addNodeToStorage(name, folder.folders[i], map);
            }
            for (i = 0; folder.hasOwnProperty("items") && i < folder.items.length; i++) {

                var value = {};

                for (var m = 0; m < map.length; m++) {
                    value[map[m][0]] = folder.items[i][map[m][1]];
                }

                value['type'] = folder.items[i].type;

                storage.insert(name, value);
            }

        };


        /**
         * Fills the local datastore with given name
         *
         * @param name
         * @param datastore
         * @param map
         * @private
         */
        var _fill_storage = function(name, datastore, map) {
            storage.removeAll(name);

            _addNodeToStorage(name, datastore, map);

            storage.save();
        };

        /**
         * Encrypts the content for a datastore with given id. The function will check if the secret key of the
         * datastore is already known, otherwise it will query the server for the details.
         *
         * @param datastore_id The datastore id
         * @param content The real object you want to encrypt in the datastore
         *
         * @returns {promise}
         * @private
         */
        var _encrypt_datastore = function (datastore_id, content) {

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

                return _get_datastore_with_id(datastore_id)
                    .then(onSuccess, onError)

            }
        };

        /**
         * Creates a copy of content and filters some attributes out, to save some storage or fix some missbehaviour
         *
         * @param content
         * @private
         */
        var _filter_datastore_content = function(content) {

            var content_copy  = JSON.parse(JSON.stringify(content));

            var filter = ['expanded', 'filter'];

            var filter_content = function (content, filter) {
                var i, m;

                // test attributes in content
                for (m = 0; m < filter.length; m++) {
                    if (content.hasOwnProperty(filter[m])) {
                        delete content[filter[m]];
                    }
                }

                // test items
                for (i = 0; content.hasOwnProperty("items") && i < content.items.length; i++) {

                    for (m = 0; m < filter.length; m++) {
                        if (content.items[i].hasOwnProperty(filter[m])) {
                            delete content.items[i][filter[m]];
                        }
                    }
                }
                // call self recursivly for folders
                for (i = 0; content.hasOwnProperty("folders") && i < content.folders.length; i ++) {
                    filter_content(content.folders[i], filter);
                }

            };

            filter_content(content_copy, filter);

            return content_copy;
        };


        /**
         * Saves some content in a datastore
         *
         * @param datastore_id The datastore id
         * @param content The real object you want to encrypt in the datastore
         *
         * @returns {promise}
         * @private
         */
        var _save_datastore_with_id = function (datastore_id, content) {

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

                return apiClient.write_datastore(_find_one('config', 'user_token'), datastore_id, data.text, data.nonce)
                    .then(onSuccess, onError);
            };

            return _encrypt_datastore(datastore_id, content)
                .then(onSuccess, onError);
        };

        /**
         *
         * Saves some content in a datastore specified with type and description
         *
         * @param type
         * @param description
         * @param content The real object you want to encrypt in the datastore
         *
         * @returns {promise}
         * @private
         */
        var _save_datastore = function (type, description, content) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(datastore_id) {

                return _save_datastore_with_id(datastore_id, content);
            };

            return _get_datastore_id(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Returns the password datastore. In addition this function triggers the generation of the local datastore
         * storage to
         *
         * @returns {promise}
         */
        var get_password_datastore = function() {
            var type = "password";
            var description = "default";


            var onSuccess = function (result) {

                _fill_storage('datastore-password-leafs', result, [
                    ['key', 'secret_id'],
                    ['secret_id', 'secret_id'],
                    ['value', 'secret_key'],
                    ['name', 'name'],
                    ['urlfilter', 'urlfilter'],
                    ['search', 'urlfilter']

                ]);

                return result
            };
            var onError = function () {
                // pass
            };

            return _get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Saves the password datastore with given content
         *
         * @param content The real object you want to encrypt in the datastore
         * @returns {promise}
         */
        var save_password_datastore = function (content) {
            var type = "password";
            var description = "default";

            // datastore has changed, so lets regenerate local lookup
            _fill_storage('datastore-password-leafs', content, [
                ['key', 'secret_id'],
                ['value', 'secret_key'],
                ['name', 'name'],
                ['urlfilter', 'urlfilter']
            ]);


            content = _filter_datastore_content(content);

            return _save_datastore(type, description, content)
        };

        /**
         * Returns the user datastore. In addition this function triggers the generation of the local datastore
         * storage to
         *
         * @returns {promise}
         */
        var get_user_datastore = function() {
            var type = "user";
            var description = "default";


            var onSuccess = function (result) {
                /*
                 _fill_storage('datastore-user-leafs', result, [
                 ['key', 'secret_id'],
                 ['value', 'secret_key'],
                 ['name', 'name'],
                 ['filter', 'filter']
                 ]);
                 */
                return result
            };
            var onError = function () {
                // pass
            };

            return _get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Saves the user datastore with given content
         *
         * @param content The real object you want to encrypt in the datastore
         * @returns {promise}
         */
        var save_user_datastore = function (content) {
            var type = "user";
            var description = "default";

            content = _filter_datastore_content(content);

            return _save_datastore(type, description, content)
        };

        /**
         * Returns the settings datastore.
         *
         * @returns {promise}
         */
        var get_settings_datastore = function() {
            var type = "settings";
            var description = "key-value-settings";

            var onSuccess = function (results) {

                for (var i = 0; i < results.length; i++) {
                    var s = storage.find_one('settings', {key: results[i].key});
                    if (s !== null) {
                        s.value = results[i].value;
                        storage.update('settings', s);
                    } else {
                        storage.insert('settings', {key: results[i].key, value: results[i].value});
                    }
                }

                return results
            };
            var onError = function () {
                // pass
            };

            return _get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         *
         * Saves the settings datastore with given content
         *
         * @param content The real object you want to encrypt in the datastore
         * @returns {promise}
         * @private
         */
        var save_settings_datastore = function (content) {
            var type = "settings";
            var description = "key-value-settings";

            return _save_datastore(type, description, content)
        };

        return {
            get_password_datastore: get_password_datastore,
            save_password_datastore: save_password_datastore,
            get_user_datastore: get_user_datastore,
            save_user_datastore: save_user_datastore,
            get_settings_datastore: get_settings_datastore,
            save_settings_datastore: save_settings_datastore
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerDatastore", ['$q', '$timeout', 'apiClient', 'cryptoLibrary', 'storage', managerDatastore]);

}(angular));