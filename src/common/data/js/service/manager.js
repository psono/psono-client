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

    var manager = function(apiClient, cryptoLibrary) {
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

            apidata.user.email = email;

            /**
             * @param response.data.datastore_owner The datastore owner object in response.
             */
            var onSucces = function (response) {
                //success
                apidata.user.id = response.data.datastore_owner.id;
                apidata.user.token = response.data.token;
                apidata.user.public_key = response.data.datastore_owner.public_key;

                apidata.user.private_key = cryptoLibrary.decrypt_secret(
                    response.data.datastore_owner.private_key,
                    response.data.datastore_owner.private_key_nonce,
                    password
                );

                apidata.user.secret_key = cryptoLibrary.decrypt_secret(
                    response.data.datastore_owner.secret_key,
                    response.data.datastore_owner.secret_key_nonce,
                    password
                );

                return {
                    response:"success"
                };
            };

            var onError = function(response){

                apidata.user.email = "";

                console.log(response);

                return {
                    response:"error",
                    error_data: response.data
                };
            };

            return apiClient.login(apidata.user.email, authkey)
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
                apidata.user.email = '';
                apidata.user.id = '';
                apidata.user.token = '';
                apidata.user.public_key = '';

                apidata.user.private_key = '';

                apidata.user.secret_key = '';

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

            return apiClient.logout(apidata.user.token)
                .then(onSucces, onError);
        };

        return {
            login: login,
            logout: logout
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("manager", ['apiClient', 'cryptoLibrary', manager]);

}(angular));