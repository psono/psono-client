(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.apiPwnedpasswords
     * @requires $http
     * @requires $q
     * @requires $rootScope
     * @requires psonocli.storage
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.device
     *
     * @description
     * Service to talk to the psono REST api
     */

    var apiPwnedpasswords = function($http, $q) {

        var call = function(connection_type, endpoint, data, headers, session_secret_key, synchronous) {

            var backend = 'https://api.pwnedpasswords.com';

            var req = {
                method: connection_type,
                url: backend + endpoint,
                data: data
            };

            req.headers = headers;

            if (synchronous) {
                /**
                 * Necessary evil... used to copy data to the clipboard which can only happen on user interaction,
                 * which means that we need a user event for it, which means that we have to block the thread with a
                 * synchronous wait... If someone has a better idea let me know!
                 */
                return jQuery.ajax({
                    type: connection_type,
                    url: backend + endpoint,
                    async: false,
                    data: data, // No data required for get
                    dataType: 'text', // will be json but for the demo purposes we insist on text
                    beforeSend: function (xhr) {
                        for (var header in headers) {
                            if (!headers.hasOwnProperty(header)) {
                                continue;
                            }
                            xhr.setRequestHeader(header, headers[header]);
                        }
                    }
                }).then(function(data) {
                    return data
                });
            } else {
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
            }
        };

        /**
         * @ngdoc
         * @name psonocli.apiPwnedpasswords#range
         * @methodOf psonocli.apiPwnedpasswords
         *
         * @description
         * Ajax GET request to get a list pf pwned password hashes based on the first 5 digits of the sha1 hash of a password
         *
         * @param {string} hash_chars The first 5 digits of the sha1 of a password
         *
         * @returns {promise} Returns a list of sha1 hashes
         */
        var range = function (hash_chars) {

            var endpoint = '/range/' + hash_chars;
            var connection_type = "GET";
            var data = null;
            var headers = null;

            return call(connection_type, endpoint, data, headers);
        };

        return {
            range: range
        };
    };

    var app = angular.module('psonocli');
    app.factory("apiPwnedpasswords", ['$http', '$q', apiPwnedpasswords]);

}(angular));
