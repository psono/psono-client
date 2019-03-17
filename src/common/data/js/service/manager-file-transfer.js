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

    var managerFileTransfer = function($q, helper, storage, managerBase, browserClient, cryptoLibrary , converter, apiClient, apiFileserver, apiGCP) {

        var registrations = {};

        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#read_file
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to read a file
         *
         * @param file_id The id of the file to read
         *
         * @returns {promise} promise
         */
        var read_file = function (file_id) {


            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data;
            };

            return apiClient.read_file(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_id)
                .then(onSuccess, onError);

        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#create_file
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to create a file object
         *
         * @param shard_id (optional) The id of the shard this upload goes to
         * @param file_repository_id (optional) The id of the file repository this upload goes to
         * @param size The file size in bytes
         * @param chunk_count The amount of chunks to upload
         * @param link_id The id of the link
         * @param parent_datastore_id The id of the parent datastore (can be undefined if the parent is a share)
         * @param parent_share_id The id of the parent share (can be undefined if the parent is a datastore)
         *
         * @returns {promise} promise
         */
        var create_file = function (shard_id, file_repository_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id) {

            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {
                return result.data;
            };

            return apiClient.create_file(managerBase.get_token(),
                managerBase.get_session_secret_key(), shard_id, file_repository_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id)
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
         * @param {object} shard The target shard
         * @param {string} hash_checksum The sha512 hash
         *
         * @returns {promise} promise
         */
        var upload_shard = function(chunk, file_transfer_id, chunk_position, shard, hash_checksum) {

            var ticket = {
                'file_transfer_id': file_transfer_id,
                'chunk_position': chunk_position,
                'hash_checksum': hash_checksum
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
         * @name psonocli.managerFileTransfer#upload
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Triggered once someone wants to actually upload the file
         *
         * @param {Blob} chunk The content of the chunk to upload
         * @param {uuid} file_transfer_id The id of the file transfer
         * @param {int} chunk_size The size of the complete chunk in bytes
         * @param {int} chunk_position The sequence number of the chunk to determine the order
         * @param {string} hash_checksum The sha512 hash
         *
         * @returns {promise} promise
         */
        var upload_file_repository_gcp_cloud_storage = function(chunk, file_transfer_id, chunk_size, chunk_position, hash_checksum) {

            var onError = function(result) {
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {

                var onError = function(result) {
                    return $q.reject(result.data)
                };

                var onSuccess = function(result) {
                    return result;
                };

                return apiGCP.upload(result.data.url, chunk)
                    .then(onSuccess, onError);
            };

            return apiClient.file_repository_upload(managerBase.get_token(),
                managerBase.get_session_secret_key(), file_transfer_id, chunk_size, chunk_position, hash_checksum)
                .then(onSuccess, onError);


            //
            // var ticket = {
            //     'file_transfer_id': file_transfer_id,
            //     'chunk_position': chunk_position,
            //     'hash_checksum': hash_checksum
            // };
            //
            // var ticket_enc = cryptoLibrary.encrypt_data(JSON.stringify(ticket), managerBase.get_session_secret_key());
            //
            // var fileserver;
            // if (shard['fileserver'].length > 1) {
            //     // math random should be good enough here, don't use for crypto!
            //     var pos = Math.floor(Math.random() * shard['fileserver'].length);
            //     fileserver = shard['fileserver'][pos];
            // } else {
            //     fileserver = shard['fileserver'][0];
            // }
            //
            // var onError = function(result) {
            //     return $q.reject(result.data)
            // };
            //
            // var onSuccess = function(result) {
            //     return result.data;
            // };
            //
            // return apiFileserver.upload(fileserver['fileserver_url'], managerBase.get_token(), chunk, ticket_enc.text, ticket_enc.nonce)
            //     .then(onSuccess, onError);
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
         * @param {int} chunk_size The size of the complete chunk in bytes
         * @param {int} chunk_position The sequence number of the chunk to determine the order
         * @param {object|undefined} shard (optional) The target shard
         * @param {object|undefined} file_repository (optional) The target file repository
         * @param {string} hash_checksum The sha512 hash
         *
         * @returns {promise} promise
         */
        var upload = function (chunk, file_transfer_id, chunk_size, chunk_position, shard, file_repository, hash_checksum) {

            if (typeof(shard) !== 'undefined') {
                return upload_shard(chunk, file_transfer_id, chunk_position, shard, hash_checksum);
            } else if (typeof(file_repository) !== 'undefined' && file_repository['type'] === 'gcp_cloud_storage') {
                return upload_file_repository_gcp_cloud_storage(chunk, file_transfer_id, chunk_size, chunk_position, hash_checksum);
            }

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
                storage.upsert('config', {'key': 'shards', 'value': data});
                storage.save();
                browserClient.open_tab('download-file.html#!/file/download/'+item.id).then(function (window) {
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
                if (!shards_dict.hasOwnProperty(shards.value[i]['id'])) {
                    shards_dict[shards.value[i]['id']] = {
                        'fileserver' : [],
                        'id' : shards.value[i]['id']
                    };
                }

                for (var ii = 0; ii < shards.value[i]['fileserver'].length; ii++) {
                    if (!shards.value[i]['fileserver'][ii]['read']) {
                        continue;
                    }
                    shards_dict[shards.value[i]['id']]['fileserver'].push(shards.value[i]['fileserver'][ii])
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


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#shard_download
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Downloads a file from a shard
         *
         * @param file_transfer_id
         * @param shard
         * @param hash_checksum
         *
         * @returns {PromiseLike<T | void> | Promise<T | void> | *}
         */
        var shard_download = function (file_transfer_id, shard, hash_checksum) {

            registrations['download_step_complete']('DOWNLOADING_FILE_CHUNK');

            var ticket = {
                'file_transfer_id': file_transfer_id,
                'hash_checksum': hash_checksum
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
                console.log(result);
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
         * @name psonocli.managerFileTransfer#file_repository_download
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Downloads a file from a file repository
         *
         * @param file_transfer_id
         * @param hash_checksum
         *
         * @returns {PromiseLike<T | void> | Promise<T | void> | *}
         */
        var file_repository_download = function (file_transfer_id, hash_checksum) {

            registrations['download_step_complete']('DOWNLOADING_FILE_CHUNK');

            var onError = function(result) {
                console.log(result);
                return $q.reject(result.data)
            };

            var onSuccess = function(result) {

                var onError = function(result) {
                    console.log(result);
                    return $q.reject(result.data)
                };

                var onSuccess = function(result) {
                    return result.data;
                };

                return apiGCP.download(result.data.url)
                    .then(onSuccess, onError);
            };

            return apiClient.file_repository_download(managerBase.get_token(), managerBase.get_session_secret_key(), file_transfer_id, hash_checksum)
                .then(onSuccess, onError);

        };

        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#download_file_from_shard
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Downloads a file from a shard
         *
         * @param file
         *
         * @returns {promise}
         */
        var download_file_from_shard = function (file) {

            var shards = storage.find_key('config', 'shards');
            if (shards === null || typeof(shards) === 'undefined') {
                return
            }

            var shards_dict = create_shard_read_dict(shards);
            var shard_id = file['file_shard_id'];

            if (!shards_dict.hasOwnProperty(shard_id)) {
                return $q.reject({
                    non_field_errors: ['NO_FILESERVER_AVAILABLE']
                })
            }


            function onSuccess(data) {

                var file_transfer_id = data.file_transfer_id;

                var shard = shards_dict[shard_id];
                var next_chunk_id = 1;
                var allblobs = [];
                var chunk_count = Object.keys(file.file_chunks).length;

                registrations['download_started'](chunk_count * 2);

                function onError(data) {
                    return $q.reject(data);
                }

                function on_chunk_download(data) {

                    registrations['download_step_complete']('DECRYPTING_FILE_CHUNK');

                    next_chunk_id = next_chunk_id + 1;
                    return cryptoLibrary.decrypt_file(new Uint8Array(data), file['file_secret_key']).then(function(data) {

                        allblobs.push(data);
                        if (next_chunk_id > chunk_count) {
                            var concat = new Blob(allblobs, {type: 'application/octet-string'});
                            registrations['download_complete']();
                            saveAs(concat, file['file_title']);
                        } else {
                            return shard_download(file_transfer_id, shard, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);
                        }
                    });
                }

                return shard_download(file_transfer_id, shard, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);

            }
            function onError(data) {
                return $q.reject(data);
            }

            return read_file(file['file_id']).then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#download_file_from_file_repository
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Downloads a file from a file repository
         *
         * @param file
         *
         * @returns {promise}
         */
        var download_file_from_file_repository = function (file) {


            function onSuccess(data) {

                var file_transfer_id = data.file_transfer_id;

                var next_chunk_id = 1;
                var allblobs = [];
                var chunk_count = Object.keys(file.file_chunks).length;

                registrations['download_started'](chunk_count * 2);

                function onError(data) {
                    return $q.reject(data);
                }

                function on_chunk_download(data) {

                    registrations['download_step_complete']('DECRYPTING_FILE_CHUNK');

                    next_chunk_id = next_chunk_id + 1;
                    return cryptoLibrary.decrypt_file(new Uint8Array(data), file['file_secret_key']).then(function(data) {

                        allblobs.push(data);
                        if (next_chunk_id > chunk_count) {
                            var concat = new Blob(allblobs, {type: 'application/octet-string'});
                            registrations['download_complete']();
                            saveAs(concat, file['file_title']);
                        } else {
                            return file_repository_download(file_transfer_id, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);
                        }
                    });
                }

                return file_repository_download(file_transfer_id, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);

            }
            function onError(data) {
                console.log(data);
                return $q.reject(data);
            }

            return read_file(file['file_id']).then(onSuccess, onError);
        };


        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#download_file
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * Downloads a file
         *
         * @param {string} id The id of the file to download
         *
         * @returns {promise}
         */
        var download_file = function(id) {

            var file = storage.find_key('datastore-file-leafs', id);
            if (file === null || typeof(file) === 'undefined') {
                return $q.resolve();
            }

            if (!file.hasOwnProperty('file_id') || !file.hasOwnProperty('file_chunks') || !file['file_id'] || Object.keys(file.file_chunks).length === 0) {
                registrations['download_complete']();
                saveAs(new Blob([''], {type: 'text/plain;charset=utf-8'}), file['file_title']);
                return $q.resolve();
            }

            if (file.hasOwnProperty('file_shard_id') && file['file_shard_id']) {
                return download_file_from_shard(file);
            } else {
                return download_file_from_file_repository(file);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerFileTransfer#register
         * @methodOf psonocli.managerFileTransfer
         *
         * @description
         * used to register functions for callbacks
         *
         * @param {string} key The key of the function (usually the function name)
         * @param {function} func The call back function
         */
        var register = function (key, func) {
            registrations[key] = func;
        };

        return {
            read_file: read_file,
            create_file: create_file,
            upload: upload,
            read_shards: read_shards,
            filter_shards: filter_shards,
            on_item_click: on_item_click,
            download_file: download_file,
            register: register
        };
    };

    var app = angular.module('psonocli');
    app.factory("managerFileTransfer", ['$q', 'helper', 'storage', 'managerBase', 'browserClient', 'cryptoLibrary', 'converter', 'apiClient', 'apiFileserver', 'apiGCP', managerFileTransfer]);

}(angular, saveAs));