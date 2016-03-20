(function(angular) {
    'use strict';

    var managerShare = function(managerBase, apiClient, cryptoLibrary,
                                 itemBlueprint, browserClient) {

        /**
         * Returns a share object with decrypted data
         *
         * @param share_id
         * @param secret_key
         * @returns {promise}
         */
        var read_share = function(share_id, secret_key) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key));
            };

            return apiClient.read_share(managerBase.find_one_nolimit('config', 'user_token'), share_id)
                .then(onSuccess, onError);
        };

        /**
         * updates a share
         *
         * @param share_id
         * @param content
         * @param secret_key
         * @returns {promise}
         */
        var write_share = function(share_id, content, secret_key) {
            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);
            return apiClient.write_share(managerBase.find_one_nolimit('config', 'user_token'), share_id, c.text, c.nonce);
        };

        /**
         * Creates a share for the given content and returns the id and the secret to decrypt the share secret
         *
         * @param content
         * @returns {promise}
         */
        var create_share = function (content) {
            var secret_key = cryptoLibrary.generate_secret_key();

            var json_content = JSON.stringify(content);

            var c = cryptoLibrary.encrypt_data(json_content, secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_id: content.data.share_id, secret_key: secret_key};
            };

            return apiClient.create_share(managerBase.find_one_nolimit('config', 'user_token'), c.text,
                c.nonce)
                .then(onSuccess, onError);
        };

        /**
         * creates the rights for a specified share and user
         *
         * @param title
         * @param type
         * @param share_id
         * @param user_id
         * @param user_public_key
         * @param key
         * @param read
         * @param write
         * @param grant
         * @returns {promise}
         */
        var create_share_right = function(title, type, share_id, user_id, user_public_key, key, read, write, grant) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_right_id: content.data.share_right_id};
            };

            var c = managerBase.encrypt_private_key(key, user_public_key);

            return apiClient.create_share_right(managerBase.find_one_nolimit('config', 'user_token'), title, type,
                share_id, user_id, c.text, c.nonce, read, write, grant)
                .then(onSuccess, onError);
        };

        // registrations

        itemBlueprint.register('create_share', create_share);
        itemBlueprint.register('create_share_right', create_share_right);

        return {
            read_share: read_share,
            write_share: write_share,
            create_share: create_share,
            create_share_right: create_share_right
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerShare", ['managerBase', 'apiClient', 'cryptoLibrary',
        'itemBlueprint', 'browserClient', managerShare]);

}(angular));