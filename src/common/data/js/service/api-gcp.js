(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.apiGCP
     * @requires $http
     * @requires $q
     * @requires psonocli.converter
     *
     * @description
     * Service to talk to the psono REST api
     */

    var apiGCP = function($http, $q, converter) {

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
         * @name psonocli.apiGCP#upload
         * @methodOf psonocli.apiGCP
         *
         * @description
         * Ajax PUT request to upload a file chunk to GCP storage
         *
         * @param {string} signed_url The signed ulr
         * @param {Blob} chunk The content of the chunk to upload
         *
         * @returns {promise} promise
         */
        var upload = function (signed_url, chunk) {

            var endpoint = ''; // the signed url already has everything
            var connection_type = "PUT";

            var headers = {
                'Content-Type': 'application/octet-stream'
            };

            return call(signed_url, connection_type, endpoint, chunk, headers, angular.identity);
        };

        /**
         * @ngdoc
         * @name psonocli.apiGCP#download
         * @methodOf psonocli.apiGCP
         *
         * @description
         * Ajax GET request to download a file chunk from GCP storage
         *
         * @param {string} signed_url The signed ulr
         *
         * @returns {promise} promise with the data
         */
        var download = function (signed_url) {

            var endpoint = ''; // the signed url already has everything
            var connection_type = "GET";
            var data = null;

            var headers = {
            };

            return call(signed_url, connection_type, endpoint, data, headers,  undefined, 'arraybuffer').then(function(data) {
                return data
            },function(data) {
                if (data.status === 400) {
                    data.data = JSON.parse(converter.bytes_to_string(data.data));
                }
                return $q.reject(data)
            });
        };

        return {
            upload: upload,
            download: download
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiGCP", ['$http', '$q', 'converter', apiGCP]);

}(angular));
