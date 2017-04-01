(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerSecret
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.itemBlueprint
     * @requires psonocli.browserClient
     *
     * @description
     * Service to handle all secret related tasks
     */

    var managerSecret = function(managerBase, apiClient, cryptoLibrary,
                           itemBlueprint, browserClient) {

        /**
         * @ngdoc
         * @name psonocli.managerSecret#create_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Encrypts the content and creates a new secret out of it.
         *
         * @param {object} content The content of the new secret
         * @param {uuid} link_id the local id of the share in the data structure
         * @param {uuid} [parent_datastore_id] (optional) The id of the parent datastore, may be left empty if the share resides in a share
         * @param {uuid} [parent_share_id] (optional) The id of the parent share, may be left empty if the share resides in the datastore
         * @returns {promise} Returns a promise with the new secret_id
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
         * @ngdoc
         * @name psonocli.managerSecret#read_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Reads a secret and decrypts it. Returns the decrypted object
         *
         * @param {uuid} secret_id The secret id one wants to fetch
         * @param {string} secret_key The secret key to decrypt the content
         *
         * @returns {promise} Returns a promise withe decrypted content of the secret
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
         * @ngdoc
         * @name psonocli.managerSecret#write_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Encrypts some content and updates a secret with it. returns the secret id
         *
         * @param {uuid} secret_id The id of the secret
         * @param {string} secret_key The secret key of the secret
         * @param {object} content The new content for the given secret
         *
         * @returns {promise} Returns a promise with the secret id
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
         * @ngdoc
         * @name psonocli.managerSecret#redirect_secret
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Fetches and decrypts a secret and initiates the redirect for the secret
         *
         * @param {string} type The type of the secret
         * @param {uuid} secret_id The id of the secret to read
         */
        var redirect_secret = function(type, secret_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                var secret_key = managerBase.find_one_nolimit('datastore-password-leafs', secret_id);

                var decrypted_secret = JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));

                var msg = itemBlueprint.blueprint_msg_before_open_secret(type, decrypted_secret);

                browserClient.emit_sec(msg.key, msg.content);

                itemBlueprint.blueprint_on_open_secret(type, decrypted_secret);
            };

            apiClient.read_secret(managerBase.get_token(),
                managerBase.get_session_secret_key(), secret_id)
                .then(onSuccess, onError);

        };
        /**
         * @ngdoc
         * @name psonocli.managerSecret#on_item_click
         * @methodOf psonocli.managerSecret
         *
         * @description
         * Handles item clicks and triggers behaviour
         *
         * @param {object} item The item one has clicked on
         */
        var on_item_click = function(item) {
            if (itemBlueprint.blueprint_has_on_click_new_tab(item.type)) {
                browserClient.open_tab('open-secret.html#/secret/'+item.type+'/'+item.secret_id);
            }
        };

        return {
            create_secret: create_secret,
            read_secret: read_secret,
            write_secret: write_secret,
            redirect_secret: redirect_secret,
            on_item_click: on_item_click
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerSecret", ['managerBase', 'apiClient', 'cryptoLibrary',
        'itemBlueprint', 'browserClient', managerSecret]);

}(angular));