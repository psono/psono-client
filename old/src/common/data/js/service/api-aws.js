(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.apiAWS
     * @requires $http
     * @requires $q
     * @requires psonocli.converter
     *
     * @description
     * Service to talk to the AWS S3 and upload or download files
     */

    var apiAWS = function($http, $q, converter) {

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
         * @name psonocli.apiAWS#upload
         * @methodOf psonocli.apiAWS
         *
         * @description
         * Ajax PUT request to upload a file chunk to AWS S3
         *
         * @param {string} signed_url The signed ulr
         * @param {object} fields Array of fields that need to be part of the request
         * @param {Blob} chunk The content of the chunk to upload
         *
         * @returns {promise} promise
         */
        var upload = function (signed_url, fields, chunk) {

            var endpoint = ''; // the signed url already has everything
            var connection_type = "POST";
            var data = new FormData();
            for (var field_name in fields) {
                if (!fields.hasOwnProperty(field_name)) {
                    continue;
                }
                data.append(field_name, fields[field_name]);
            }
            data.append('file', chunk);
            var headers = {
                'Content-Type': undefined
            };

            return call(signed_url, connection_type, endpoint, data, headers, angular.identity);
        };

        /**
         * @ngdoc
         * @name psonocli.apiAWS#download
         * @methodOf psonocli.apiAWS
         *
         * @description
         * Ajax GET request to download a file chunk from AWS S3
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
    app.factory("apiAWS", ['$http', '$q', 'converter', apiAWS]);

}(angular));
