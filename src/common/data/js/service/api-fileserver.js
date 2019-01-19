(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.apiFileserver
     * @requires $http
     * @requires $q
     *
     * @description
     * Service to talk to the psono REST api
     */

    var apiFileserver = function($http, $q) {

        var call = function(fileserver_url, connection_type, endpoint, data, headers, transformRequest, responseType) {

            if (!transformRequest) {
                transformRequest = $http.defaults.transformRequest;
            }

            var req = {
                method: connection_type,
                url: fileserver_url + endpoint,
                data: data,
                transformRequest: transformRequest,
                responseType: responseType
            };

            req.headers = headers;

            return $q(function(resolve, reject) {

                var onSuccess = function(data) {
                    return resolve(data);
                };

                var onError = function(data) {
                    return reject(data);
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

            return call(fileserver_url, connection_type, endpoint, data, headers, angular.identity);
        };

        /**
         * @ngdoc
         * @name psonocli.apiFileserver#download
         * @methodOf psonocli.apiFileserver
         *
         * @description
         * Ajax POST request to download a file chunk
         *
         * @param {string} fileserver_url The url of the target fileserver
         * @param {string} token The token of the user
         * @param {string} ticket The ticket to authenticate the download
         * @param {string} ticket_nonce The nonce of the ticket
         *
         * @returns {promise} promise
         */
        var download = function (fileserver_url, token, ticket, ticket_nonce) {

            var endpoint = '/download/';
            var connection_type = "POST";
            var data = {
                token: token,
                ticket: ticket,
                ticket_nonce: ticket_nonce
            };

            var headers = {
            };

            return call(fileserver_url, connection_type, endpoint, data, headers,  undefined, 'arraybuffer');
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
            upload: upload,
            download: download
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiFileserver", ['$http', '$q', apiFileserver]);

}(angular));
