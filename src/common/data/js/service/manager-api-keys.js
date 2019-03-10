(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerAPIKeys
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     *
     * @description
     * managerAPIKeys collects all functions to edit / update / create api keys and to work with them.
     */

    var managerAPIKeys = function($q, managerBase, apiClient, storage, cryptoLibrary) {


        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#read_api_key
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Returns one api keys
         *
         * @returns {promise} Promise with the api keys
         */
        var read_api_key = function(api_key_id) {

            var onSuccess = function (result) {

                result.data.private_key = managerBase.decrypt_secret_key(result.data.private_key, result.data.private_key_nonce);
                delete result.data.private_key_nonce;
                result.data.secret_key = managerBase.decrypt_secret_key(result.data.secret_key, result.data.secret_key_nonce);
                delete result.data.secret_key_nonce;

                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_api_key(managerBase.get_token(),
                managerBase.get_session_secret_key(), api_key_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#read_api_keys
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Returns all api keys
         *
         * @returns {promise} Promise with the api keys
         */
        var read_api_keys = function() {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_api_key(managerBase.get_token(),
                managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#read_api_key_secrets
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Returns all api keys
         *
         * @returns {promise} Promise with the api keys
         */
        var read_api_key_secrets = function(api_key_id) {

            var onSuccess = function (result) {
                var secrets = result.data;
                for (var i = 0; i < secrets.length; i++) {
                    secrets[i]['name'] = managerBase.decrypt_secret_key(secrets[i]['title'], secrets[i]['title_nonce'])
                }
                return secrets;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_api_key_secrets(managerBase.get_token(),
                managerBase.get_session_secret_key(), api_key_id)
                .then(onSuccess, onError);
        };
        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#add_secret_to_api_key
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Adds one secret to an api key
         *
         * @param {uuid} api_key_id The id of the api key
         * @param {string} api_key_secret_key The symmetric secret assiciated with the api key
         * @param {array} secret The secret to add
         *
         * @returns {promise} Promise with the new id
         */
        var add_secret_to_api_key = function(api_key_id, api_key_secret_key, secret) {

            var secret_secret_key_enc = cryptoLibrary.encrypt_data(secret.secret_key, api_key_secret_key);
            var secret_title_enc = managerBase.encrypt_secret_key(secret.name);

            return apiClient.add_secret_to_api_key(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                api_key_id,
                secret.secret_id,
                secret_title_enc.text,
                secret_title_enc.nonce,
                secret_secret_key_enc.text,
                secret_secret_key_enc.nonce
            );
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#add_secrets_to_api_key
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Adds multiple secrets to an api key
         *
         * @param {uuid} api_key_id The id of the api key
         * @param {string} api_key_secret_key The symmetric secret assiciated with the api key
         * @param {array} secrets The array of secrets to add to the api key
         *
         * @returns {promise} Promise with the new id
         */
        var add_secrets_to_api_key = function(api_key_id, api_key_secret_key, secrets) {
            var defer = $q.defer();

            var secret_promise_array = [];

            for (var i = 0; i < secrets.length; i++) {
                var promise = add_secret_to_api_key(api_key_id, api_key_secret_key, secrets[i]);
                secret_promise_array.push($q.when(promise));
            }

            $q.all(secret_promise_array).then(function() {
                defer.resolve();
            });

            return defer.promise;
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#create_api_key
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Creates an API Key
         *
         * @param {string} title The title of the new api key
         * @param {bool} restrict_to_secrets
         * @param {bool} allow_insecure_access
         * @param {array} secrets Array of secrets
         *
         * @returns {promise} Promise with the new id
         */
        var create_api_key = function(title, restrict_to_secrets, allow_insecure_access, secrets) {

            var api_key_secret_key = cryptoLibrary.generate_secret_key();
            var api_key_public_private_key_pair = cryptoLibrary.generate_public_private_keypair();

            var api_key_private_key_enc = managerBase.encrypt_secret_key(api_key_public_private_key_pair.private_key);
            var api_key_secret_key_enc = managerBase.encrypt_secret_key(api_key_secret_key);

            var user_private_key_enc = cryptoLibrary.encrypt_data(managerBase.find_key_nolimit('config', 'user_private_key'), api_key_secret_key);
            var user_secret_key_enc = cryptoLibrary.encrypt_data(managerBase.find_key_nolimit('config', 'user_secret_key'), api_key_secret_key);

            var verify_key = cryptoLibrary.get_verify_key(api_key_public_private_key_pair.private_key);

            var onSuccess = function (result) {
                var api_key_id = result.data['api_key_id'];
                return add_secrets_to_api_key(api_key_id, api_key_secret_key, secrets).then(function() {
                    return {
                        'api_key_id': api_key_id
                    }
                });
            };
            var onError = function () {
                // pass
            };

            return apiClient.create_api_key(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                title,
                api_key_public_private_key_pair.public_key,
                api_key_private_key_enc.text,
                api_key_private_key_enc.nonce,
                api_key_secret_key_enc.text,
                api_key_secret_key_enc.nonce,
                user_private_key_enc.text,
                user_private_key_enc.nonce,
                user_secret_key_enc.text,
                user_secret_key_enc.nonce,
                restrict_to_secrets,
                allow_insecure_access,
                verify_key
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#update_api_key
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Updates an API Key
         *
         * @param {uuid} api_key_id The id of the api key
         * @param {string} title The title of the new api key
         * @param {bool} restrict_to_secrets
         * @param {bool} allow_insecure_access
         *
         * @returns {promise} Promise with the new id
         */
        var update_api_key = function(api_key_id, title, restrict_to_secrets, allow_insecure_access) {

            return apiClient.update_api_key(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                api_key_id,
                title,
                restrict_to_secrets,
                allow_insecure_access
            )
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#delete_api_key
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Deletes an API Key
         *
         * @param {uuid} api_key_id The id of the api key to delete
         *
         * @returns {promise} Promise
         */
        var delete_api_key = function(api_key_id) {


            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function (result) {
                // pass
            };

            return apiClient.delete_api_key(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                api_key_id
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#delete_api_key_secret
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Deletes an API Key secret
         *
         * @param {uuid} api_key_secret_id The id of the api key secret to delete
         *
         * @returns {promise} Promise
         */
        var delete_api_key_secret = function(api_key_secret_id) {


            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function (result) {
                // pass
            };

            return apiClient.delete_api_key_secret(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                api_key_secret_id
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#api_keys_disabled
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Returns weather the server allows the api keys feature or not
         * By default it will return false (indicate enabled api keys)
         */
        var api_keys_disabled = function () {

            var server_info =  storage.find_key('config', 'server_info');

            if (server_info === null) {
                return true
            }
            if (!server_info.value.hasOwnProperty('compliance_disable_api_keys')) {
                return false
            }

            return server_info.value['compliance_disable_api_keys'];
        };

        /**
         * @ngdoc
         * @name psonocli.managerAPIKeys#get_server_parameter
         * @methodOf psonocli.managerAPIKeys
         *
         * @description
         * Returns the currents server url and public key
         */
        var get_server_parameter = function () {
            return {
                'url': storage.find_key('config', 'server')['value']['url'],
                'public_key': storage.find_key('config', 'server_info')['value']['public_key'],
                'signature': storage.find_key('config', 'server_verify_key').value
            }
        };


        return {
            read_api_key: read_api_key,
            read_api_keys: read_api_keys,
            read_api_key_secrets: read_api_key_secrets,
            create_api_key: create_api_key,
            update_api_key: update_api_key,
            delete_api_key: delete_api_key,
            add_secrets_to_api_key: add_secrets_to_api_key,
            add_secret_to_api_key: add_secret_to_api_key,
            delete_api_key_secret: delete_api_key_secret,
            api_keys_disabled: api_keys_disabled,
            get_server_parameter: get_server_parameter
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerAPIKeys", ['$q', 'managerBase', 'apiClient', 'storage', 'cryptoLibrary', managerAPIKeys]);

}(angular));

