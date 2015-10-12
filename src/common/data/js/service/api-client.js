(function(angular, nacl_factory, scrypt_module_factory) {
    'use strict';

    var iso_datetime = 'yyyy-MM-dd HH:mm:ss';
    var iso_date = 'yyyy-MM-dd';

    var backend = 'http://dev.sanso.pw:8001';

    var apiClient = function($http, $filter) {

        var call = function(type, ressource, data, headers) {

            var req = {
                method: type,
                url: backend + ressource,
                data: data
            };

            if (headers) {
                req.headers = headers;
            }

            return $http(req);
        };
        /**
         * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
         * and all the different keys of a user in the apidata storage
         *
         * @param email
         * @param authkey
         * @returns {promise} promise
         */
        var login = function(email, authkey) {
            return call("POST", "/authentication/login/", {email: email, authkey: authkey}, false);
        };

        /**
         * Ajax POST request to destroy the token and logout the user
         *
         * @param token
         * @returns {promise}
         */
        var logout = function (token) {

            return call("POST", "/authentication/logout/", {}, { "Authorization": "Token "+ token} );
        };

        return {
            login: login,
            logout: logout
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("apiClient", ['$http', '$filter', apiClient]);

}(angular, nacl_factory, scrypt_module_factory));