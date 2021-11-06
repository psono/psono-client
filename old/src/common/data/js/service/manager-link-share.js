(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerLinkShare
     * @requires $q
     * @requires $uibModal
     * @requires psonocli.managerBase
     * @requires psonocli.apiClient
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.managerFileTransfer
     *
     * @description
     * managerLinkShare collects all functions to edit / update / create link shares and to work with them.
     */

    var managerLinkShare = function($q, $uibModal, managerBase, apiClient, storage, cryptoLibrary, managerFileTransfer) {


        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#read_link_share
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Returns one link share of this user
         *
         * @returns {promise} Promise with the link shares
         */
        var read_link_share = function(link_share_id) {

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

            return apiClient.read_link_share(managerBase.get_token(),
                managerBase.get_session_secret_key(), link_share_id)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#read_link_shares
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Returns all link shares of this user
         *
         * @returns {promise} Promise with the link shares
         */
        var read_link_shares = function() {

            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function () {
                // pass
            };

            return apiClient.read_link_share(managerBase.get_token(),
                managerBase.get_session_secret_key())
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#read_secret_with_link_share
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Takes an ecrypted secret and the share link data object. Decrypt ths encrypted secret and displays the information.
         *
         * @param {object} encrypted_secret The encrypted secret
         * @param {object} share_link_data The decrypted share link data object
         *
         * @returns {promise} Promise with the secret
         */
        var read_secret_with_link_share = function(encrypted_secret, share_link_data) {

            // normal secret
            var secret_data = JSON.parse(cryptoLibrary.decrypt_data(encrypted_secret.secret_data, encrypted_secret.secret_data_nonce, share_link_data.secret_key));

            var modalInstance = $uibModal.open({
                templateUrl: 'view/modal/show-entry.html',
                controller: 'ModalEditEntryCtrl',
                backdrop: 'static',
                resolve: {
                    node: function () {
                        return share_link_data;
                    },
                    path: function () {
                        return '';
                    },
                    data: function () {
                        return secret_data;
                    }
                }
            });

            modalInstance.result.then(function () {
                // should never happen
            }, function () {
                // cancel triggered
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#read_file_with_link_share
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Takes an ecrypted secret and the share link data object. Decrypt ths encrypted secret and displays the information.
         *
         * @param {object} encrypted_file_meta The encrypted secret
         * @param {object} share_link_data The decrypted share link data object
         *
         * @returns {promise} Promise with the secret
         */
        var read_file_with_link_share = function(encrypted_file_meta, share_link_data) {

            return managerFileTransfer.download_file(share_link_data, encrypted_file_meta['shards'], encrypted_file_meta);
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#link_share_access
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Reads a secret belonging to a link share
         *
         * @param {uuid} link_share_id The id of the link share
         * @param {string} link_share_secret The secret to decrypt the share link secret
         * @param {string|null} passphrase The passphrase that protects the link share
         *
         * @returns {promise} Promise with the secret
         */
        var link_share_access = function(link_share_id, link_share_secret, passphrase) {

            var onSuccess = function (result) {
                var share_link_data = JSON.parse(cryptoLibrary.decrypt_data(result.data.node, result.data.node_nonce, link_share_secret));

                if (share_link_data.type === 'file') {
                    return read_file_with_link_share(result.data, share_link_data);
                } else {
                    // normal secret
                    return read_secret_with_link_share(result.data, share_link_data);
                }
            };
            var onError = function (result) {
                console.log(result);
                return $q.reject(result.data);
            };

            return apiClient.link_share_access(link_share_id, passphrase)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#create_link_share
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Creates a link share
         *
         * @param {uuid} secret_id The id of the secret
         * @param {uuid} file_id The id of the file
         * @param {string} node The encrypted node in hex format
         * @param {string} node_nonce The nonce of the encrypted node in hex format
         * @param {string} public_title The public title of the link share
         * @param {int|null} allowed_reads The amount of allowed access requests before this link secret becomes invalid
         * @param {string|null} passphrase The passphrase to protect the link secret
         * @param {string|null} valid_till The valid till time in iso format
         *
         * @returns {promise} Promise with the new link_secret_id
         */
        var create_link_share = function(secret_id, file_id, node, node_nonce, public_title, allowed_reads, passphrase, valid_till) {

            var onSuccess = function (result) {
                return result.data
            };
            var onError = function (result) {
                return $q.reject(result);
            };

            return apiClient.create_link_share(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                secret_id,
                file_id,
                node,
                node_nonce,
                public_title,
                allowed_reads,
                passphrase,
                valid_till
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#update_link_share
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Updates a link share
         *
         * @param {uuid} link_share_id The id of the link share
         * @param {string} public_title The new public_title of the link share
         * @param {int|null} allowed_reads The amount of allowed access requests before this link secret becomes invalid
         * @param {string|null} passphrase The passphrase to protect the link secret
         * @param {string|null} valid_till The valid till time in iso format
         *
         * @returns {promise} Promise with the new id
         */
        var update_link_share = function(link_share_id, public_title, allowed_reads, passphrase, valid_till) {


            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function (result) {
                return $q.reject(result.data)
            };

            return apiClient.update_link_share(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                link_share_id,
                public_title,
                allowed_reads,
                passphrase,
                valid_till
            )
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerLinkShare#delete_link_share
         * @methodOf psonocli.managerLinkShare
         *
         * @description
         * Deletes a link share
         *
         * @param {uuid} link_share_id The id of the link share to delete
         *
         * @returns {promise} Promise
         */
        var delete_link_share = function(link_share_id) {


            var onSuccess = function (result) {
                return result.data;
            };
            var onError = function (result) {
                // pass
            };

            return apiClient.delete_link_share(
                managerBase.get_token(),
                managerBase.get_session_secret_key(),
                link_share_id
            )
                .then(onSuccess, onError);
        };


        return {
            read_link_share: read_link_share,
            read_link_shares: read_link_shares,
            link_share_access: link_share_access,
            create_link_share: create_link_share,
            update_link_share: update_link_share,
            delete_link_share: delete_link_share
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerLinkShare", ['$q', '$uibModal', 'managerBase', 'apiClient', 'storage', 'cryptoLibrary', 'managerFileTransfer', managerLinkShare]);

}(angular));

