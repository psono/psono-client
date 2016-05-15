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
         * Returns a list of all shares
         *
         * @returns {promise}
         */
        var read_shares = function() {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return content.data;
            };

            return apiClient.read_shares(managerBase.find_one_nolimit('config', 'user_token'))
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
            var c2 = managerBase.encrypt_secret_key(secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_id: content.data.share_id, secret_key: secret_key};
            };

            return apiClient.create_share(managerBase.find_one_nolimit('config', 'user_token'), c.text,
                c.nonce, c2.text, c2.nonce)
                .then(onSuccess, onError);
        };

        /**
         * Returns share rights for a specific share
         *
         * @param share_id
         * @returns {promise}
         */
        var read_share_rights = function(share_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return content.data;
            };

            return apiClient.read_share_rights(managerBase.find_one_nolimit('config', 'user_token'), share_id)
                .then(onSuccess, onError);
        };

        /**
         * creates the rights for a specified share and user
         *
         * @param title
         * @param share_id
         * @param user_id
         * @param user_public_key
         * @param key
         * @param read
         * @param write
         * @param grant
         * @returns {promise}
         */
        var create_share_right = function(title, share_id, user_id, user_public_key, key, read, write, grant) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_right_id: content.data.share_right_id};
            };

            var c = managerBase.encrypt_private_key(key, user_public_key);

            return apiClient.create_share_right(managerBase.find_one_nolimit('config', 'user_token'), title,
                share_id, user_id, c.text, c.nonce, read, write, grant)
                .then(onSuccess, onError);
        };

        /**
         * updates the rights for a specified share right and user
         *
         * @param share_id
         * @param user_id
         * @param read
         * @param write
         * @param grant
         * @returns {*}
         */
        var update_share_right = function(share_id, user_id, read, write, grant) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_right_id: content.data.share_right_id};
            };


            return apiClient.create_share_right(managerBase.find_one_nolimit('config', 'user_token'), null,
                share_id, user_id, null, null, read, write, grant)
                .then(onSuccess, onError);
        };

        /**
         * deletes a specific share right
         *
         * @param share_right_id
         * @returns {promise}
         */
        var delete_share_right = function(share_right_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                console.log(content);
                return {share_right_id: content.data.share_right_id};
            };

            return apiClient.delete_share_right(managerBase.find_one_nolimit('config', 'user_token'), share_right_id)
                .then(onSuccess, onError);
        };

        /**
         * accepts a specific share right
         *
         * @param share_right_id
         * @param text
         * @param nonce
         * @param public_key
         * @returns {promise}
         */
        var accept_share_right = function(share_right_id, text, nonce, public_key) {

            var secret_key = managerBase.decrypt_private_key(text, nonce, public_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                var share = JSON.parse(cryptoLibrary.decrypt_data(content.data.share_data, content.data.share_data_nonce, secret_key));
                share.share_id = content.data.share_id;
                share.share_secret_key = secret_key;

                return share;
            };

            var c = managerBase.encrypt_secret_key(secret_key);

            return apiClient.accept_share_right(managerBase.find_one_nolimit('config', 'user_token'), share_right_id, c.text, c.nonce)
                .then(onSuccess, onError);
        };

        /**
         * declines a specific share right
         *
         * @param share_right_id
         * @returns {promise}
         */
        var decline_share_right = function(share_right_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                // pass
            };

            return apiClient.decline_share_right(managerBase.find_one_nolimit('config', 'user_token'), share_right_id)
                .then(onSuccess, onError);
        };

        // registrations

        itemBlueprint.register('read_share_rights', read_share_rights);
        itemBlueprint.register('create_share', create_share);
        itemBlueprint.register('create_share_right', create_share_right);

        return {
            read_share: read_share,
            read_shares: read_shares,
            write_share: write_share,
            create_share: create_share,
            read_share_rights: read_share_rights,
            create_share_right: create_share_right,
            update_share_right: update_share_right,
            delete_share_right: delete_share_right,
            accept_share_right: accept_share_right,
            decline_share_right: decline_share_right
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("managerShare", ['managerBase', 'apiClient', 'cryptoLibrary',
        'itemBlueprint', 'browserClient', managerShare]);

}(angular));