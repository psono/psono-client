(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerShare
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.itemBlueprint
     *
     * @description
     * Service to handle all share related tasks
     */

    var managerShare = function(managerBase, apiClient, cryptoLibrary,
                                 itemBlueprint) {

        /**
         * @ngdoc
         * @name psonocli.managerShare#read_share
         * @methodOf psonocli.managerShare
         *
         * @description
         * Returns a share object with decrypted data
         *
         * @param {uuid} share_id The id of the share
         * @param {string} secret_key The secret key of the share
         *
         * @returns {promise} Returns a promise with the decrypted content of the share
         */
        var read_share = function(share_id, secret_key) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {
                    data: JSON.parse(cryptoLibrary.decrypt_data(content.data.data, content.data.data_nonce, secret_key)),
                    user_share_rights: content.data.user_share_rights,
                    user_share_rights_inherited: content.data.user_share_rights_inherited
                };
            };

            return apiClient.read_share(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                share_id
            ).then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#read_shares
         * @methodOf psonocli.managerShare
         *
         * @description
         * Fetches an overview of all shares
         *
         * @returns {promise} Returns a list of all shares
         */
        var read_shares = function() {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {

                for (var i = content.data.shares.length - 1; i >= 0; i--) {
                    if (content.data.shares[i].share_right_title != '') {
                        content.data.shares[i].share_right_title = managerBase.decrypt_private_key(
                            content.data.shares[i].share_right_title,
                            content.data.shares[i].share_right_title_nonce,
                            content.data.shares[i].share_right_create_user_public_key
                        )
                    }
                }

                return content.data;
            };

            return apiClient.read_shares(
                managerBase.get_token(),
                managerBase.get_session_secret_key()
            ).then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#write_share
         * @methodOf psonocli.managerShare
         *
         * @description
         * updates a share
         *
         * @param {uuid} share_id The id of the share
         * @param {object} content The content that the share should be updated with
         * @param {string} secret_key The secret key of the share
         *
         * @returns {promise} Returns a promise with the status of the update
         */
        var write_share = function(share_id, content, secret_key) {

            if (content.hasOwnProperty("id")) {
                delete content.id;
            }

            var json_content = JSON.stringify(content);

            var encrypted_data = cryptoLibrary.encrypt_data(json_content, secret_key);
            return apiClient.write_share(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                share_id,
                encrypted_data.text, encrypted_data.nonce);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#create_share
         * @methodOf psonocli.managerShare
         *
         * @description
         * Creates a share for the given content and returns the id and the secret to decrypt the share secret
         *
         * @param {object} content The content of the new share
         * @param {uuid} [parent_share_id] (optional) The parent share's id
         * @param {uuid} [parent_datastore_id] (optional) The parent datastore's id
         * @param {uuid} link_id The link id in the parent
         *
         * @returns {promise} Returns a promise with the status and the new share id
         */
        var create_share = function (content, parent_share_id,
                                     parent_datastore_id, link_id) {

            if (content.hasOwnProperty("id")) {
                delete content.id;
            }

            var secret_key = cryptoLibrary.generate_secret_key();

            var json_content = JSON.stringify(content);

            var encrypted_data = cryptoLibrary.encrypt_data(json_content, secret_key);
            var encrypted_key = managerBase.encrypt_secret_key(secret_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_id: content.data.share_id, secret_key: secret_key};
            };

            return apiClient.create_share(managerBase.get_token(),
                managerBase.get_session_secret_key(), encrypted_data.text,
                encrypted_data.nonce, encrypted_key.text, encrypted_key.nonce, parent_share_id, parent_datastore_id, link_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#read_share_rights
         * @methodOf psonocli.managerShare
         *
         * @description
         * Returns share rights for a specific share
         *
         * @param {uuid} share_id The id of the share
         *
         * @returns {promise} Returns a promise with all the specific rights
         */
        var read_share_rights = function(share_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return content.data;
            };

            return apiClient.read_share_rights(managerBase.get_token(),
                managerBase.get_session_secret_key(), share_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#read_share_rights_overview
         * @methodOf psonocli.managerShare
         *
         * @description
         * Returns all the share rights of the current user
         *
         * @returns {promise} Returns a promise with the share rights overview
         */
        var read_share_rights_overview = function() {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return content.data;
            };

            return apiClient.read_share_rights_overview(
                managerBase.get_token(),
                managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#create_share_right
         * @methodOf psonocli.managerShare
         *
         * @description
         * creates the rights for a specified share and user
         *
         * @param {string} title The title of the share right
         * @param {string} type The type of the share right
         * @param {uuid} share_id The share id
         * @param {uuid} user_id The user id
         * @param {string} user_public_key The other users public key
         * @param {string} key the key of the share
         * @param {boolean} read The read right
         * @param {boolean} write The write right
         * @param {boolean} grant The grant right
         *
         * @returns {promise} Returns a promise with the new share right id
         */
        var create_share_right = function(title, type, share_id, user_id, user_public_key, key, read, write, grant) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_right_id: content.data.share_right_id};
            };

            var encrypted_key = managerBase.encrypt_private_key(key, user_public_key);
            var encrypted_title = managerBase.encrypt_private_key(title, user_public_key);
            var encrypted_type = managerBase.encrypt_private_key(type, user_public_key);

            return apiClient.create_share_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), encrypted_title.text,
                encrypted_title.nonce, encrypted_type.text,
                encrypted_type.nonce, share_id, user_id, encrypted_key.text, encrypted_key.nonce, read, write, grant)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#update_share_right
         * @methodOf psonocli.managerShare
         *
         * @description
         * updates the rights for a specified share and user
         *
         * @param {uuid} share_id The share id
         * @param {uuid} user_id The user id
         * @param {boolean} read The read right
         * @param {boolean} write The write right
         * @param {boolean} grant The grant right
         *
         * @returns {promise} Returns a promise with the update status
         */
        var update_share_right = function(share_id, user_id, read, write, grant) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_right_id: content.data.share_right_id};
            };

            return apiClient.update_share_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), share_id, user_id, read, write, grant)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#delete_share_right
         * @methodOf psonocli.managerShare
         *
         * @description
         * deletes a specific share right
         *
         * @param {uuid} share_right_id The share right id
         *
         * @returns {promise} Returns a promise with the status of the delete
         */
        var delete_share_right = function(share_right_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                return {share_right_id: content.data.share_right_id};
            };

            return apiClient.delete_share_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), share_right_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#accept_share_right
         * @methodOf psonocli.managerShare
         *
         * @description
         * accepts a specific share right
         *
         * @param {uuid} share_right_id The share right id that one wants to accept
         * @param {string} text The encrypted share secret key
         * @param {string} nonce The nonce of the share secret key
         * @param {string} public_key The public key of the other user
         * @param {uuid} link_id The link id in the parent (datastore or share)
         * @param {uuid} [parent_share_id] (optional) The id of the parent share
         * @param {uuid} [parent_datastore_id] (optional) The id of the parent datastore
         *
         * @returns {promise} Returns a promise with the share content
         */
        var accept_share_right = function(share_right_id, text, nonce, public_key, link_id, parent_share_id,
                                          parent_datastore_id) {

            var secret_key = managerBase.decrypt_private_key(text, nonce, public_key);

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                var share = {};
                if (typeof content.data.share_data !== "undefined") {
                    share = JSON.parse(cryptoLibrary.decrypt_data(content.data.share_data,
                        content.data.share_data_nonce,secret_key));
                }


                if (typeof share.type == 'undefined' && typeof content.data.share_type !== "undefined") {

                    var type = managerBase.decrypt_private_key(content.data.share_type,
                        content.data.share_type_nonce, public_key);

                    if (type != 'folder') {
                        share.type = type;
                    }
                }

                share.share_id = content.data.share_id;
                share.share_secret_key = secret_key;

                return share;
            };

            var encrypted_key = managerBase.encrypt_secret_key(secret_key);

            return apiClient.accept_share_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), share_right_id,
                encrypted_key.text, encrypted_key.nonce, link_id, parent_share_id, parent_datastore_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#decline_share_right
         * @methodOf psonocli.managerShare
         *
         * @description
         * declines a specific share right
         *
         * @param {uuid} share_right_id The share right id of the share right one wants to decline
         *
         * @returns {promise} Returns a promise with the status of the decline
         */
        var decline_share_right = function(share_right_id) {

            var onError = function(result) {
                // pass
            };

            var onSuccess = function(content) {
                // pass
            };

            return apiClient.decline_share_right(managerBase.get_token(),
                managerBase.get_session_secret_key(), share_right_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerShare#get_closest_parent_share
         * @methodOf psonocli.managerShare
         *
         * @description
         * returns the closest share. if no share exists for the specified path, the initially specified closest_share
         * is returned.
         *
         * @param {Array} path The path of the item we want the closest parent of
         * @param {TreeObject} datastore The datastore to search
         * @param {TreeObject} closest_share The closest parent (so far)
         * @param {int} distance The distance to keep to the actual objects path
         *
         * @returns {false|TreeObject} Returns the closest parent or false
         */
        var get_closest_parent_share = function(path, datastore, closest_share, distance) {
            var n,l;

            if (path.length == distance) {
                return closest_share;
            }

            var to_search = path.shift();

            if (datastore.hasOwnProperty('folders')) {
                for (n = 0, l = datastore.folders.length; n < l; n++) {
                    if (datastore.folders[n].id == to_search) {
                        if (typeof(datastore.folders[n].share_id) !== 'undefined') {
                            return get_closest_parent_share(path.slice(), datastore.folders[n], datastore.folders[n], distance);
                        } else {
                            return get_closest_parent_share(path.slice(), datastore.folders[n], closest_share, distance);
                        }
                    }
                }
            }

            if (datastore.hasOwnProperty('items')) {
                for (n = 0, l = datastore.items.length; n < l; n++) {
                    if (datastore.items[n].id == to_search) {
                        return closest_share;
                    }
                }
            }

            return false;
        };

        // registrations

        itemBlueprint.register('read_share_rights', read_share_rights);
        itemBlueprint.register('create_share', create_share);
        itemBlueprint.register('create_share_right', create_share_right);
        itemBlueprint.register('get_closest_parent_share', get_closest_parent_share);

        return {
            read_share: read_share,
            read_shares: read_shares,
            write_share: write_share,
            create_share: create_share,
            read_share_rights: read_share_rights,
            read_share_rights_overview: read_share_rights_overview,
            create_share_right: create_share_right,
            update_share_right: update_share_right,
            delete_share_right: delete_share_right,
            accept_share_right: accept_share_right,
            decline_share_right: decline_share_right,
            get_closest_parent_share: get_closest_parent_share
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerShare", ['managerBase', 'apiClient', 'cryptoLibrary',
        'itemBlueprint', managerShare]);

}(angular));