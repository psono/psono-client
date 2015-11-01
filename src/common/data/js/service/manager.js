(function(angular) {
    'use strict';

    var manager = function(apiClient, cryptoLibrary, storage) {


        var forbidden_keys = {
            'config': [
                'user_token',
                'user_private_key',
                'user_secret_key'
            ]
        };

        /**
         * checks if the user is logged in
         * returns either true or false
         *
         * @return {bool} is the user logged in
         */
        var is_logged_in = function () {
            return storage.find_one('config', {'key': 'user_token'}) !== null;
        };

        /**
         * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
         * and all the different keys of a user in the apidata storage
         *
         * @param email
         * @param password
         * @param server server object
         * @returns {promise} promise
         */
        var login = function(email, password, server) {


            var authkey = cryptoLibrary.generate_authkey(email, password);

            storage.insert('config', {key: 'user_email', value: email});
            storage.insert('config', {key: 'server', value: server});

            /**
             * @param response.data.user The datastore owner object in response.
             */
            var onSucces = function (response) {
                //success

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

                console.log(response);

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            return apiClient.login(email, authkey)
                .then(onSucces, onError);
        };

        /**
         * Ajax POST request to destroy the token and logout the user
         *
         * @returns {promise}
         */
        var logout = function () {

            var delete_local_data = function () {
                storage.remove('config', storage.find_one('config', {'key': 'user_email'}));
                storage.remove('config', storage.find_one('config', {'key': 'server'}));
                storage.remove('config', storage.find_one('config', {'key': 'user_id'}));
                storage.remove('config', storage.find_one('config', {'key': 'user_token'}));
                storage.remove('config', storage.find_one('config', {'key': 'user_public_key'}));
                storage.remove('config', storage.find_one('config', {'key': 'user_private_key'}));
                storage.remove('config', storage.find_one('config', {'key': 'user_secret_key'}));

                storage.save();
            };

            var onSucces = function (response) {

                delete_local_data();

                return {
                    response:"success"
                };
            };

            var onError = function(response){
                //session expired, so lets delete the data anyway

                delete_local_data();

                return {
                    response:"success"
                };
            };

            return apiClient.logout(storage.find_one('config', {'key': 'user_token'}).value)
                .then(onSucces, onError);
        };

        var _find_one = function(db, key) {

            var obj = storage.find_one('config', {'key': key});
            if (obj === null) {
                return ''
            }
            return obj['value'];
        };

        var find_one = function(db, key) {

            if (forbidden_keys.hasOwnProperty(db) && forbidden_keys[db].indexOf(key) >= 0) {
                return ''
            }
            return _find_one(db, key);
        };

        var get_password_datastore = function() {

            var onSucces = function(result) {

                var stores = result.data['datastores'];

                var datastore_id = ''
                for (var i = 0; i < stores.length; i++) {
                    if (stores[i].type === 'password' && stores[i].description === 'default') {
                        datastore_id = stores[i].id
                    }
                }

                var onSucces = function(result) {

                    var datastore_secret_key = cryptoLibrary.decrypt_data(
                        result.data.secret_key,
                        result.data.secret_key_nonce,
                        _find_one('config', 'user_secret_key')
                    );

                    var data = cryptoLibrary.decrypt_data(
                        result.data.data,
                        result.data.data_nonce,
                        datastore_secret_key
                    );

                    return JSON.parse( data );

                };
                var onError = function(result) {
                    // pass
                };


                return apiClient.read_datastore(_find_one('config', 'user_token'), datastore_id)
                    .then(onSucces, onError);
            };

            var onError = function(result) {
                // pass
            };


            return apiClient.read_datastore(_find_one('config', 'user_token'))
                .then(onSucces, onError);
        };

        return {
            login: login,
            logout: logout,
            is_logged_in: is_logged_in,
            find_one: find_one,
            get_password_datastore: get_password_datastore
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("manager", ['apiClient', 'cryptoLibrary', 'storage', manager]);

}(angular));