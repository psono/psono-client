(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.apiFileserver
     * @requires $http
     * @requires $q
     * @requires $rootScope
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.device
     * @requires psonocli.offlineCache
     *
     * @description
     * Service to talk to the psono REST api
     */

    var apiFileserver = function($http, $q, $rootScope, storage, cryptoLibrary, device) {

        var decrypt_data = function(session_secret_key, data, req) {
            if (session_secret_key && data !== null
                && data.hasOwnProperty('data')
                && data.data.hasOwnProperty('text')
                && data.data.hasOwnProperty('nonce')) {
                data.data = JSON.parse(cryptoLibrary.decrypt_data(data.data.text, data.data.nonce, session_secret_key));
            }
            return data;
        };

        var call = function(connection_type, endpoint, data, headers, session_secret_key, transformRequest) {

            if (!transformRequest) {
                transformRequest = $http.defaults.transformRequest;
            }

            var backend = 'https://browserplugins.chickahoona.com/fileserver01';

            var req = {
                method: connection_type,
                url: backend + endpoint,
                data: data,
                transformRequest: transformRequest
            };

            req.headers = headers;

            return $q(function(resolve, reject) {

                var onSuccess = function(data) {
                    return resolve(decrypt_data(session_secret_key, data, req));
                };

                var onError = function(data) {
                    return reject(decrypt_data(session_secret_key, data, req));
                };

                $http(req)
                    .then(onSuccess, onError);

            });
        };

        /**
         * @ngdoc
         * @name psonocli.apiFileserver#upload
         * @methodOf psonocli.apiFileserver
         *
         * @description
         * Ajax POST request to upload a file chunk
         *
         * @param {Uint8Array} file_chunk The content of the file chunk to upload
         * @param {uuid} shard_id The target shard ID
         * @param {string} hash_blake2b The blake2b hash
         *
         * @returns {promise} promise
         */
        var upload = function (file_chunk, shard_id, hash_blake2b) {

            var endpoint = '/upload/';
            var connection_type = "POST";
            var data = new FormData();
            data.append('file', file_chunk);
            data.append('shard_id', shard_id);
            data.append('hash_blake2b', hash_blake2b);
            var headers = {
                'Content-Type': undefined
            };

            return call(connection_type, endpoint, data, headers, '', angular.identity);
        };

        /**
         * @ngdoc
         * @name psonocli.apiFileserver#info
         * @methodOf psonocli.apiFileserver
         *
         * @description
         * Ajax GET request to get the server info
         *
         * @returns {promise} promise
         */
        var info = function () {

            var endpoint = '/info/';
            var connection_type = "GET";
            var data = null;
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        return {
            info: info,
            upload: upload
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiFileserver", ['$http', '$q', '$rootScope', 'storage', 'cryptoLibrary', 'device', 'offlineCache', apiFileserver]);

}(angular));
