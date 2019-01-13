(function(angular, saveAs) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerFileTransfer
     * @requires $q
     * @requires psonocli.helper
     * @requires psonocli.storage
     * @requires psonocli.managerBase
     * @requires psonocli.browserClient
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.apiClient
     * @requires psonocli.apiFileserver
     *
     * @description
     * Service to manage everything around file transfer
     */

    var managerFileTransfer = function($q, helper, storage, managerBase, browserClient, cryptoLibrary , converter, apiClient, apiFileserver) {


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
                return result.data;
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
         * @param {uuid} file_transfer_id The id of the file transfer
         * @param {int} chunk_position The sequence number of the chunk to determine the order
         * @param {uuid} shard The target shard
         * @param {string} hash_blake2b The blake2b hash
         *
         * @returns {promise} promise
         */
        var upload = function (chunk, file_transfer_id, chunk_position, shard, hash_blake2b) {

            var ticket = {
                'file_transfer_id': file_transfer_id,
                'chunk_position': chunk_position,
                'hash_blake2b': hash_blake2b
            };

            var ticket_enc = cryptoLibrary.encrypt_data(JSON.stringify(ticket), managerBase.get_session_secret_key());

            var fileserver;
            if (shard['fileserver'].length > 1) {
                // math random should be good enough here, don't use for crypto!
                var pos = Math.floor(Math.random() * shard['fileserver'].length);
                fileserver = shard['fileserver'][pos];
            } else {
                fileserver = shard['fileserver'][0];
            }

            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data;
            };

            return apiFileserver.upload(fileserver['fileserver_url'], managerBase.get_token(), chunk, ticket_enc.text, ticket_enc.nonce)
                .then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#read_shard
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to retrieve the potential shards from the server
         *
         * @returns {promise} promise with all the shards
         */
        var read_shards = function () {
            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data['shards']
            };

            return apiClient.read_shards(managerBase.get_token(),
                managerBase.get_session_secret_key())
                .then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#filter_shards
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Filters an array of shards and fileservers
         *
         * @param {array} shards Array of shards
         * @param {bool} require_read Determines whether read is required or not
         * @param {bool} require_write Determines whether write is required or not
         *
         * @returns {array} list of shards with fileservers that fulfill the filter criteria
         */
        var filter_shards = function (shards, require_read, require_write) {

            var filtered_shards = [];

            for (var i = 0; i < shards.length; i++) {
                if (require_read && !shards[i]['read']) {
                    continue
                }
                if (require_write && !shards[i]['write']) {
                    continue
                }
                var filtered_shard = angular.copy(shards[i]);
                filtered_shards.push(filtered_shard);

                helper.remove_from_array(filtered_shard['fileserver'], undefined, function(fileserver, nothing) {
                    return (require_read && !fileserver['read']) || (require_write && !fileserver['write'])
                })
            }

            return filtered_shards;

        };
        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#on_item_click
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Handles item clicks and triggers behaviour
         *
         * @param {object} item The item one has clicked on
         */
        var on_item_click = function(item) {

            read_shards().then(function(data){
                console.log(data);
                storage.upsert('config', {'key': 'shards', 'value': data});
                storage.save();
                browserClient.open_tab('download-file.html#!/file/download/'+item.file_id).then(function (window) {
                    //window.psono_offline_cache_encryption_key = offlineCache.get_encryption_key();
                });
            });
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#create_shard_read_dict
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Takes a list of shards with their fileservers and created a lookup dictionary that only contains those
         * with read privilege
         *
         * @param {array} shards A list of shards
         */
        var create_shard_read_dict = function(shards) {

            var shards_dict = {};

            for (var i = 0; i < shards.value.length; i++) {
                if (!shards.value[i]['read']) {
                    continue;
                }
                if (!shards_dict.hasOwnProperty(shards.value[i]['shard_id'])) {
                    shards_dict[shards.value[i]['shard_id']] = {
                        'fileserver' : [],
                        'shard_id' : shards.value[i]['shard_id']
                    };
                }

                for (var ii = 0; ii < shards.value[i]['fileserver'].length; ii++) {
                    if (!shards.value[i]['fileserver'][ii]['read']) {
                        continue;
                    }
                    shards_dict[shards.value[i]['shard_id']]['fileserver'].push(shards.value[i]['fileserver'][ii])
                }
            }

            for (var shard_id in shards_dict) {
                if (!shards_dict.hasOwnProperty(shard_id)) {
                    continue;
                }
                if (shards_dict[shard_id]['fileserver'].length === 0) {
                    delete shards_dict[shard_id];
                }

            }

            return shards_dict;

        };


        var download = function (chunk_position, shard, hash_blake2b) {
            var ticket = {
                'shard_id': shard['shard_id'],
                'hash_blake2b': hash_blake2b
            };

            var ticket_enc = cryptoLibrary.encrypt_data(JSON.stringify(ticket), managerBase.get_session_secret_key());
            console.log(shard['fileserver']);
            var fileserver;
            if (shard['fileserver'].length > 1) {
                // math random should be good enough here, don't use for crypto!
                var pos = Math.floor(Math.random() * shard['fileserver'].length);
                fileserver = shard['fileserver'][pos];
            } else {
                fileserver = shard['fileserver'][0];
            }

            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data;
            };

            return apiFileserver.download(fileserver['fileserver_url'], managerBase.get_token(), ticket_enc.text, ticket_enc.nonce)
                .then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#download_file
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Downloads a file
         *
         * @param {string} file_id The id of the file to download
         */
        var download_file = function(file_id) {

            var file = storage.find_key('datastore-file-leafs', file_id);
            var shards = storage.find_key('config', 'shards');

            if (file === null || typeof(file) === 'undefined') {
                return
            }
            if (shards === null || typeof(shards) === 'undefined') {
                return
            }

            var chunk_count = Object.keys(file.file_chunks).length;

            var next_chunk_id = 1;

            var shards_dict = create_shard_read_dict(shards);
            var shard_id = file['file_shard_id'];

            if (!shards_dict.hasOwnProperty(shard_id)) {
                alert("No Fileserver available offering the location for this file");
                return
            }
            var shard = shards_dict[shard_id];

            var allblobs = [];

            function onError(data) {
                console.log(data);
                // pass
            }

            function on_chunk_download(data) {
                next_chunk_id = next_chunk_id + 1;
                // TODO decrypt data
                data = cryptoLibrary.decrypt_file(new Uint8Array(data), file['file_secret_key']);
                console.log(data);
                allblobs.push(data);
                if (next_chunk_id > chunk_count) {
                    var concat = new Blob(allblobs, {type: 'application/octet-string'});
                    console.log(concat);
                    saveAs(concat, file['file_title']);
                } else {
                    return download(next_chunk_id, shard, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);
                }
            }

            download(next_chunk_id, shard, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);

            console.log(file);
            console.log(shard);
            console.log(chunk_count);



            // var blob01 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob02 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob03 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob04 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob05 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob06 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob07 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob08 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob09 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var blob10 = new Blob([new Uint8Array(128*1024*1024)], {type: 'application/octet-string'});
            // var allblobs = [blob01, blob02, blob03, blob04, blob05, blob06, blob07, blob08, blob09, blob10];
            // var concat = new Blob(allblobs, {type: 'application/octet-string'});
            // console.log("concatinated blob: ", concat);
            // saveAs(concat, file['file_title']);


        };

        return {
            create_file: create_file,
            upload: upload,
            read_shards: read_shards,
            filter_shards: filter_shards,
            on_item_click: on_item_click,
            download_file: download_file
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileTransfer", ['$q', 'helper', 'storage', 'managerBase', 'browserClient', 'cryptoLibrary', 'converter', 'apiClient', 'apiFileserver', managerFileTransfer]);

}(angular, saveAs));