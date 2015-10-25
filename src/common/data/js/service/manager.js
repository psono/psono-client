(function(angular) {
    'use strict';

    var manager = function(apiClient, cryptoLibrary, storage) {


        var forbidden_keys = [
            'user_token',
            'user_private_key',
            'user_secret_key'
        ];

        /**
         * checks if the user is logged in
         * returns either true or false
         *
         * @return {bool} is the user logged in
         */
        var isLoggedIn = function () {
            console.log(storage.config_data());
            return storage.config_find_one({'key': 'user_token'}) !== null;
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

            storage.config_insert({key: 'user_email', value: email});
            storage.config_insert({key: 'server', value: server});

            /**
             * @param response.data.user The datastore owner object in response.
             */
            var onSucces = function (response) {
                //success

                storage.config_insert({key: 'user_id', value: response.data.user.id});
                storage.config_insert({key: 'user_token', value: response.data.token});
                storage.config_insert({key: 'user_public_key', value: response.data.user.public_key});
                storage.config_insert({key: 'user_private_key', value: cryptoLibrary.decrypt_secret(
                    response.data.user.private_key,
                    response.data.user.private_key_nonce,
                    password
                )});
                storage.config_insert({key: 'user_secret_key', value: cryptoLibrary.decrypt_secret(
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

                storage.config_remove(storage.config_find_one({'key': 'user_email'}));
                storage.config_remove(storage.config_find_one({'key': 'server'}));
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
                storage.config_remove(storage.config_find_one({'key': 'user_email'}));
                storage.config_remove(storage.config_find_one({'key': 'server'}));
                storage.config_remove(storage.config_find_one({'key': 'user_id'}));
                storage.config_remove(storage.config_find_one({'key': 'user_token'}));
                storage.config_remove(storage.config_find_one({'key': 'user_public_key'}));
                storage.config_remove(storage.config_find_one({'key': 'user_private_key'}));
                storage.config_remove(storage.config_find_one({'key': 'user_secret_key'}));

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

            return apiClient.logout(storage.config_find_one({'key': 'user_token'}).value)
                .then(onSucces, onError);
        };

        var get = function(key) {

            if (forbidden_keys.indexOf(key) >= 0) {
                return ''
            }
            var obj = storage.config_find_one({'key': key});
            if (obj === null) {
                return ''
            }
            return obj['value'];
        };

        return {
            login: login,
            logout: logout,
            isLoggedIn: isLoggedIn,
            get: get
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("manager", ['apiClient', 'cryptoLibrary', 'storage', manager]);

}(angular));