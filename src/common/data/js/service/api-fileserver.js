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

    var apiFileserver = function($http, $q, $rootScope, storage, cryptoLibrary, device, offlineCache) {

        var decrypt_data = function(session_secret_key, data, req) {
            if (session_secret_key && data !== null
                && data.hasOwnProperty('data')
                && data.data.hasOwnProperty('text')
                && data.data.hasOwnProperty('nonce')) {
                data.data = JSON.parse(cryptoLibrary.decrypt_data(data.data.text, data.data.nonce, session_secret_key));
            }
            return data;
        };

        var call = function(fileserver_url, connection_type, endpoint, data, headers, session_secret_key, transformRequest) {

            if (!transformRequest) {
                transformRequest = $http.defaults.transformRequest;
            }

            var req = {
                method: connection_type,
                url: fileserver_url + endpoint,
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
         * @param {string} fileserver_url The url of the target fileserver
         * @param {string} token The token of the user
         * @param {Blob} chunk The content of the chunk to upload
         * @param {string} ticket The ticket to authenticate the upload
         * @param {string} ticket_nonce The nonce of the ticket
         *
         * @returns {promise} promise
         */
        var upload = function (fileserver_url, token, chunk, ticket, ticket_nonce) {

            var endpoint = '/upload/';
            var connection_type = "POST";
            var data = new FormData();
            data.append('token', token);
            data.append('chunk', chunk);
            data.append('ticket', ticket);
            data.append('ticket_nonce', ticket_nonce);
            var headers = {
                'Content-Type': undefined
            };

            return call(fileserver_url, connection_type, endpoint, data, headers, '', angular.identity);
        };

        /**
         * @ngdoc
         * @name psonocli.apiFileserver#info
         * @methodOf psonocli.apiFileserver
         *
         * @description
         * Ajax GET request to get the server info
         *
         * @param {string} fileserver_url The url of the target fileserver
         *
         * @returns {promise} promise
         */
        var info = function (fileserver_url) {

            var endpoint = '/info/';
            var connection_type = "GET";
            var data = null;
            var headers = null;

            return call(fileserver_url, connection_type, endpoint, data, headers);
        };

        return {
            info: info,
            upload: upload
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiFileserver", ['$http', '$q', '$rootScope', 'storage', 'cryptoLibrary', 'device', 'offlineCache', apiFileserver]);

}(angular));
