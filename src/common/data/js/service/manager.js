(function(angular, uuid) {
    'use strict';

    var manager = function($q, $timeout, apiClient, cryptoLibrary, storage, itemBlueprint, browserClient,
                           $injector, helper) {

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
                console.log(response);

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
         * Update user base settings
         *
         * @param email
         * @param authkey
         * @param authkey_old
         * @param public_key
         * @param private_key
         * @param private_key_nonce
         * @param secret_key
         * @param secret_key_nonce
         *
         * @returns {promise}
         */
        var updateUser = function(email, authkey, authkey_old, private_key, private_key_nonce, secret_key,
                                  secret_key_nonce) {
            return apiClient.update_user(storage.find_one('config', {'key': 'user_token'}).value, email, authkey, authkey_old,
                private_key, private_key_nonce, secret_key, secret_key_nonce);
        };

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

            var password = $injector('passwordGenerator').generate();

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
            updateUser: updateUser,
            find_one: find_one,
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
        '$injector', 'helper', manager]);

}(angular, uuid));