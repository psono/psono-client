(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerFileTransfer
     * @requires $q
     * @requires psonocli.managerBase
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.apiClient
     * @requires psonocli.apiFileserver
     *
     * @description
     * Service to manage everything around file transfer
     */

    var managerFileTransfer = function($q, managerBase, cryptoLibrary , apiClient, apiFileserver) {


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#create_file
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to create a file object
         *
         * @param shard_id The id of the shard this upload goes to
         * @param size The file size in bytes
         * @param chunk_count The amount of chunks to upload
         * @param link_id The id of the link
         * @param parent_datastore_id The id of the parent datastore (can be undefined if the parent is a share)
         * @param parent_share_id The id of the parent share (can be undefined if the parent is a datastore)
         *
         * @returns {promise} promise
         */
        var create_file = function (shard_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id) {


            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data.file_id;
            };

            return apiClient.create_file(managerBase.get_token(),
                managerBase.get_session_secret_key(), shard_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id)
                .then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#upload
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to actually upload the file
         *
         * @param {Blob} chunk The content of the chunk to upload
         * @param {uuid} file_id The target id of the file this chunk belongs to
         * @param {int} chunk_position The sequence number of the chunk to determine the order
         * @param {uuid} shard_id The target shard ID
         * @param {string} hash_blake2b The blake2b hash
         *
         * @returns {promise} promise
         */
        var upload = function (chunk, file_id, chunk_position, shard_id, hash_blake2b) {

            var ticket = {
                'file_id': file_id,
                'chunk_position': chunk_position,
                'shard_id': shard_id,
                'hash_blake2b': hash_blake2b
            };

            var ticket_enc = cryptoLibrary.encrypt_data(JSON.stringify(ticket), managerBase.get_session_secret_key());


            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data;
            };

            return apiFileserver.upload(managerBase.get_token(), chunk, ticket_enc.text, ticket_enc.nonce)
                .then(onSuccess, onError);

        };

        return {
            create_file: create_file,
            upload: upload
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileTransfer", ['$q', 'managerBase', 'cryptoLibrary', 'apiClient', 'apiFileserver', managerFileTransfer]);

}(angular));