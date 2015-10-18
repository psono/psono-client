(function(angular) {
    'use strict';

    var apidata = {
        user: {
            id: "",
            private_key_enc: "",
            private_key_nonce: "",
            private_key: "",
            secret_key_enc: "",
            secret_key_nonce: "",
            secret_key: "",
            public_key: "",
            email: "",
            token: ""
        }
    };

    var manager = function(apiClient, cryptoLibrary, storage) {

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
         * @returns {promise} promise
         */
        var login = function(email, password) {

            var authkey = cryptoLibrary.generate_authkey(email, password);

            storage.config_insert({key: 'user_email', value: email});

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
                console.log(storage.config_data());
                return {
                    response:"success"
                };
            };

            var onError = function(response){

                storage.config_remove(storage.config_find_one({'key': 'user_email'}));
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

            var onSucces = function (response) {
                //success
                storage.config_remove(storage.config_find_one({'key': 'user_email'}));
                storage.config_remove(storage.config_find_one({'key': 'user_id'}));
                storage.config_remove(storage.config_find_one({'key': 'user_token'}));
                storage.config_remove(storage.config_find_one({'key': 'user_public_key'}));
                storage.config_remove(storage.config_find_one({'key': 'user_private_key'}));
                storage.config_remove(storage.config_find_one({'key': 'user_secret_key'}));

                storage.save();

                return {
                    response:"success"
                };
            };

            var onError = function(response){

                console.log(response);

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            console.log(storage.config_find_one({'key': 'user_token'}));

            return apiClient.logout(storage.config_find_one({'key': 'user_token'}).value)
                .then(onSucces, onError);
        };
        /**
         * pass through for the event callback handling of config changes
         *
         * @param event
         * @param callback
         * @returns {*}
         */
        var config_on = function (event, callback) {
            return storage.config_on(event, callback);
        };

        var getUserEmail = function() {
            return storage.config_find_one({'key': 'user_email'});
        };

        return {
            login: login,
            logout: logout,
            isLoggedIn: isLoggedIn,
            getUserEmail: getUserEmail,
            config_on: config_on
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("manager", ['apiClient', 'cryptoLibrary', 'storage', manager]);

}(angular));