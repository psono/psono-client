(function(angular) {
    'use strict';

    var managerSecret = function(managerBase, apiClient, cryptoLibrary,
                           itemBlueprint, browserClient) {

        /**
         * Creates a secret for the given content and returns the id
         *
         * @param {object} content
         * @param {uuid} link_id - the local id of the share in the datastructure
         * @param {uuid} [parent_datastore_id] - optional id of the parent datastore, may be left empty if the share resides in a share
         * @param {uuid} [parent_share_id] - optional id of the parent share, may be left empty if the share resides in the datastore
         * @returns {promise}
         */
        var create_secret = function (content, link_id, parent_datastore_id, parent_share_id) {
            var secret_key = cryptoLibrary.generate_secret_key();

            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {secret_id: content.data.secret_id, secret_key: secret_key};
            };

            return apiClient.create_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), c.text, c.nonce, link_id, parent_datastore_id, parent_share_id)
                .then(onSuccess, onError);
        };

        /**
         * Reads a secret and decrypts it. Returns the decrypted object
         *
         * @param {uuid} secret_id
         * @param {string} secret_key
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

            return apiClient.read_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), secret_id)
                .then(onSuccess, onError);
        };

        /**
         * Writes a secret after encrypting the object. returns the secret id
         *
         * @param {uuid} secret_id
         * @param {string} secret_key
         * @param {object} content
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

            return apiClient.write_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), secret_id, c.text, c.nonce)
                .then(onSuccess, onError);
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
                var secret_key = managerBase.find_one_nolimit('datastore-password-leafs', secret_id);

                var decrypted_secret = JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));

                var msg = itemBlueprint.blueprint_msg_before_open_secret(type, decrypted_secret);

                browserClient.emitSec(msg.key, msg.content);

                itemBlueprint.blueprint_on_open_secret(type, decrypted_secret);
            };

            apiClient.read_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), secret_id)
                .then(onSuccess, onError);

        };

        return {
            create_secret: create_secret,
            read_secret: read_secret,
            write_secret: write_secret,
            redirectSecret: redirectSecret
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerSecret", ['managerBase', 'apiClient', 'cryptoLibrary',
        'itemBlueprint', 'browserClient', managerSecret]);

}(angular));