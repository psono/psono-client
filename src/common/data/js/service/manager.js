(function(angular, uuid) {
    'use strict';

    var manager = function($q, $timeout, apiClient, cryptoLibrary, storage, itemBlueprint, browserClient,
                           passwordGenerator, helper) {

        var temp_datastore_key_storage = {};
        var temp_datastore_overview = false;

        var forbidden_keys = {
            'config': [
                'user_token',
                'user_private_key',
                'user_secret_key'
            ]
        };

        /**
         * Checks if the user is logged in.
         * Returns either true or false
         *
         * @return {boolean} is the user logged in
         */
        var is_logged_in = function () {
            return storage.find_one('config', {'key': 'user_token'}) !== null;
        };

        /**
         * Deletes local data in storage
         */
        var _delete_local_data = function () {
            storage.removeAll();
            storage.save();
        };

        /**
         * Ajax POST request to the backend with email and authkey for registration
         *
         * @param email
         * @param password
         * @param server server object
         *
         * @returns {promise} promise
         */
        var register = function(email, password, server) {

            _delete_local_data();

            storage.insert('config', {key: 'user_email', value: email});
            storage.insert('config', {key: 'server', value: server});

            var pair = cryptoLibrary.generate_public_private_keypair();

            var priv_key_enc = cryptoLibrary.encrypt_secret(pair.private_key, password);
            var secret_key_enc = cryptoLibrary.encrypt_secret(cryptoLibrary.generate_secret_key(), password);

            var onSuccess = function () {

                storage.save();

                return {
                    response:"success"
                };
            };

            var onError = function(response){

                storage.remove('config', storage.find_one('config', {'key': 'user_email'}));
                storage.remove('config', storage.find_one('config', {'key': 'server'}));
                storage.save();

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            return apiClient.register(email, cryptoLibrary.generate_authkey(email, password), pair.public_key,
                priv_key_enc.text, priv_key_enc.nonce, secret_key_enc.text, secret_key_enc.nonce, browserClient.getBaseUrl())
                .then(onSuccess, onError);
        };

        /**
         * Activates a user account with the provided activation code
         *
         * @param activate_code
         * @param server
         *
         * @returns {promise}
         */
        var activate = function(activate_code, server) {

            storage.insert('config', {key: 'server', value: server});

            var onSuccess = function () {

                storage.save();

                return {
                    response:"success"
                };
            };

            var onError = function(response){

                storage.remove('config', storage.find_one('config', {'key': 'server'}));
                storage.save();

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            return apiClient.verify_email(activate_code)
                .then(onSuccess, onError);
        };

        /**
         * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
         * and all the different keys of a user in the apidata storage
         *
         * @param email
         * @param password
         * @param server server object
         *
         * @returns {promise} promise
         */
        var login = function(email, password, server) {

            _delete_local_data();

            var authkey = cryptoLibrary.generate_authkey(email, password);

            storage.insert('config', {key: 'user_email', value: email});
            storage.insert('config', {key: 'server', value: server});

            /**
             * @param response.data.user The datastore owner object in response.
             */
            var onSuccess = function (response) {

                storage.insert('config', {key: 'user_id', value: response.data.user.id});
                storage.insert('config', {key: 'user_token', value: response.data.token});
                storage.insert('config', {key: 'user_public_key', value: response.data.user.public_key});
                storage.insert('config', {key: 'user_private_key', value: cryptoLibrary.decrypt_secret(
                    response.data.user.private_key,
                    response.data.user.private_key_nonce,
                    password
                )});
                storage.insert('config', {key: 'user_secret_key', value: cryptoLibrary.decrypt_secret(
                    response.data.user.secret_key,
                    response.data.user.secret_key_nonce,
                    password
                )});

                storage.save();

                return {
                    response:"success"
                };
            };

            var onError = function(response){

                storage.remove('config', storage.find_one('config', {'key': 'user_email'}));
                storage.remove('config', storage.find_one('config', {'key': 'server'}));
                storage.save();

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            return apiClient.login(email, authkey)
                .then(onSuccess, onError);
        };

        /**
         * Ajax POST request to destroy the token and logout the user
         *
         * @returns {promise}
         */
        var logout = function () {

            var onSuccess = function () {

                _delete_local_data();
                browserClient.emit("logout", null);
                browserClient.resize(250);

                return {
                    response:"success"
                };
            };

            var onError = function(){
                //session expired, so lets delete the data anyway

                _delete_local_data();
                browserClient.emit("logout", null);
                browserClient.resize(250);

                return {
                    response:"success"
                };
            };

            return apiClient.logout(storage.find_one('config', {'key': 'user_token'}).value)
                .then(onSuccess, onError);
        };

        /**
         * Privat function, that will return the object with the specified key from the specified db
         *
         * @param db
         * @param key
         *
         * @returns {*}
         *
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
         * Finds object with specified key in specified db. Also checks if its in the forbidden key list
         * @param db
         * @param key
         *
         * @returns {string}
         */
        var find_one = function(db, key) {

            if (forbidden_keys.hasOwnProperty(db) && forbidden_keys[db].indexOf(key) >= 0) {
                return ''
            }
            return _find_one(db, key);
        };


        /**
         * Returns the overview of all datastores that belong to this user
         *
         * @param force_fresh
         * @returns {promise}
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
         */
        var get_datastore_id = function (type, description, force_fresh) {

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

            return get_datastore_overview(force_fresh)
                .then(onSuccess, onError);
        };
        /**
         * Returns the datastore for a given id
         *
         * @param datastore_id
         *
         * @returns {promise}
         */
        var get_datastore_with_id = function (datastore_id) {

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
         */
        var get_datastore = function(type, description) {

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
                                return get_datastore_with_id(result.data.datastore_id);
                            };

                            return apiClient.create_datastore(_find_one('config', 'user_token'), type, description, '', '', cipher.text, cipher.nonce)
                                .then(onSuccess, onError);
                        }
                    };

                    var onError = function(result) {
                        // pass
                    };


                    return get_datastore_id(type, description, true)
                        .then(onSuccess, onError);

                } else {
                    return get_datastore_with_id(datastore_id);
                }
            };

            return get_datastore_id(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Adds a node to the storage
         *
         * @param name
         * @param folder
         * @param map
         */
        var addNodeToStorage = function (name, folder, map) {
            var i;
            for (i = 0; folder.hasOwnProperty("folders") && i < folder.folders.length; i ++) {
                addNodeToStorage(name, folder.folders[i], map);
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
         */
        var fill_storage = function(name, datastore, map) {
            storage.removeAll(name);

            addNodeToStorage(name, datastore, map);

            storage.save();
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

                fill_storage('datastore-password-leafs', result, [
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

            return get_datastore(type, description)
                .then(onSuccess, onError);
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
                fill_storage('datastore-user-leafs', result, [
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

            return get_datastore(type, description)
                .then(onSuccess, onError);
        };

        /**
         * Encrypts the content for a datastore with given id. The function will check if the secret key of the
         * datastore is already known, otherwise it will query the server for the details.
         *
         * @param datastore_id The datastore id
         * @param content The real object you want to encrypt in the datastore
         *
         * @returns {promise}
         */
        var encrypt_datastore = function (datastore_id, content) {

            var json_content = JSON.stringify(content);

            var _encrypt_datastore = function (datastore_id, json_content) {
                var secret_key = temp_datastore_key_storage[datastore_id];

                return cryptoLibrary.encrypt_data(json_content, secret_key);
            };

            if (temp_datastore_key_storage.hasOwnProperty(datastore_id)) {
                // datastore secret key exists in temp datastore key storage, but we have to return a promise :/
                return $q(function (resolve) {
                    resolve(_encrypt_datastore(datastore_id, json_content));
                });
            } else {

                var onError = function(result) {
                    // pass
                };

                var onSuccess = function(datastore_id) {
                    // datastore_secret key should now exist in temp datastore key storage
                    return _encrypt_datastore(datastore_id, json_content);
                };

                return get_datastore_with_id(datastore_id)
                    .then(onSuccess, onError)

            }
        };

        /**
         * Creates a copy of content and filters some attributes out, to save some storage or fix some missbehaviour
         *
         * @param content
         */
        var filter_datastore_content = function(content) {

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
         */
        var save_datastore_with_id = function (datastore_id, content) {

            content = filter_datastore_content(content);


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

            return encrypt_datastore(datastore_id, content)
                .then(onSuccess, onError);
        };

        /**
         * Saves some content in a datastore specified with type and description
         *
         * @param type
         * @param description
         * @param content The real object you want to encrypt in the datastore
         *
         * @returns {promise}
         */
        var save_datastore = function (type, description, content) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(datastore_id) {

                return save_datastore_with_id(datastore_id, content);
            };

            return get_datastore_id(type, description)
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
            fill_storage('datastore-password-leafs', content, [
                ['key', 'secret_id'],
                ['value', 'secret_key'],
                ['name', 'name'],
                ['urlfilter', 'urlfilter']
            ]);

            return save_datastore(type, description, content)
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

            return save_datastore(type, description, content)
        };

        /**
         * Creates a secret for the given content and returns the id
         *
         * @param content
         * @returns {promise}
         */
        var create_secret = function (content) {
            var secret_key = cryptoLibrary.generate_secret_key();

            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {secret_id: content.data.secret_id, secret_key: secret_key};
            };

            return apiClient.create_secret(_find_one('config', 'user_token'), c.text, c.nonce)
                .then(onSuccess, onError);
        };

        /**
         * Reads a secret and decrypts it. Returns the decrypted object
         *
         * @param secret_id
         * @param secret_key
         *
         * @returns {promise}
         */
        var read_secret = function(secret_id, secret_key) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));
            };

            return apiClient.read_secret(_find_one('config', 'user_token'), secret_id)
                .then(onSuccess, onError);
        };

        /**
         * Writes a secret after encrypting the object. returns the secret id
         *
         * @param secret_id
         * @param secret_key
         * @param content
         *
         * @returns {promise}
         */
        var write_secret = function(secret_id, secret_key, content) {

            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {secret_id: content.data.secret_id};
            };

            return apiClient.write_secret(_find_one('config', 'user_token'), secret_id, c.text, c.nonce)
                .then(onSuccess, onError);
        };

        /**
         * Handles node selections and triggers behaviour
         *
         * @param node
         */
        var onNodeSelect = function(node) {
            //pass
        };

        /**
         * Handles item selections and triggers behaviour
         *
         * @param item
         */
        var onItemSelect = function(item) {
            //pass
        };
        /**
         * Handles node clicks and triggers behaviour
         *
         * @param node
         * @param path
         */
        var onNodeClick = function(node, path) {
            //pass
        };
        /**
         * Handles item clicks and triggers behaviour
         *
         * @param item
         */
        var onItemClick = function(item) {
            if (itemBlueprint.blueprint_has_on_click_new_tab(item.type)) {
                browserClient.openTab('/data/open-secret.html#/secret/'+item.type+'/'+item.secret_id);
            }
        };

        /**
         * Decrypts a secret and initiates the redirect
         *
         * @param type
         * @param secret_id
         */
        var redirectSecret = function(type, secret_id) {

            var onError = function(result) {
            // pass
            };

            var onSuccess = function(content) {
                var secret_key = _find_one('datastore-password-leafs', secret_id);

                var decrypted_secret = JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));

                var msg = itemBlueprint.blueprint_msg_before_open_secret(type, decrypted_secret);

                browserClient.emitSec(msg.key, msg.content);

                itemBlueprint.blueprint_on_open_secret(type, decrypted_secret);
            };

            apiClient.read_secret(_find_one('config', 'user_token'), secret_id)
                .then(onSuccess, onError);

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

        /**
         * Generates a new password for a given url and saves the password in the datastore.
         * Returns a promise with the new password
         *
         * @returns {promise}
         */
        var generatePassword = function(url) {

            var password = passwordGenerator.generate();

            var parsed_url = helper.parse_url(url);

            var secret_object = {
                website_password_title: "Generated for " + parsed_url.authority,
                website_password_url: url,
                website_password_username: "",
                website_password_password: password,
                website_password_notes: "",
                website_password_auto_submit: false,
                website_password_url_filter: parsed_url.authority
            };

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(e) {

                get_password_datastore()
                    .then(function (data) {

                        var datastore_object = {
                            id: uuid.v4(),
                            type: 'website_password',
                            name: "Generated for " + parsed_url.authority,
                            urlfilter: parsed_url.authority,
                            secret_id: e.secret_id,
                            secret_key: e.secret_key
                        };

                        data.items.push(datastore_object);
                        save_password_datastore(data);
                    });
            };

            create_secret(secret_object)
                .then(onSuccess, onError);

            // we return a promise. So far its
            // , but we do not yet have a proper error handling and returning
            // a promise might make it easier later to wait for the errors
            return $q(function (resolve) {
                resolve(password);
            });
        };

        /**
         * Generates a password for the active tab
         *
         * @returns {promise}
         */
        var generatePasswordActiveTab = function() {

            var onError = function(result) {
                console.log(result);
                alert("could not find out the url of the active tab");
            };

            var onSuccess = function(url) {


                var onError = function(result) {
                    //pass
                };
                var onSuccess = function(password) {

                    browserClient.emitSec('fillpassword-active-tab', {password: password});

                    return password;
                };

                return generatePassword(url)
                    .then(onSuccess, onError);

            };

            return browserClient.getActiveTabUrl()
                .then(onSuccess, onError);

        };



        return {
            register: register,
            activate: activate,
            login: login,
            logout: logout,
            is_logged_in: is_logged_in,
            find_one: find_one,
            get_password_datastore: get_password_datastore,
            save_password_datastore: save_password_datastore,
            get_user_datastore: get_user_datastore,
            save_user_datastore: save_user_datastore,
            create_secret: create_secret,
            read_secret: read_secret,
            write_secret: write_secret,
            onNodeSelect: onNodeSelect,
            onItemSelect: onItemSelect,
            onNodeClick: onNodeClick,
            onItemClick: onItemClick,
            redirectSecret: redirectSecret,
            storage_on: storage_on,
            generatePassword: generatePassword,
            generatePasswordActiveTab: generatePasswordActiveTab
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("manager", ['$q', '$timeout', 'apiClient', 'cryptoLibrary', 'storage', 'itemBlueprint', 'browserClient',
        'passwordGenerator', 'helper', manager]);

}(angular, uuid));