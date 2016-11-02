(function(angular) {
    'use strict';


    var configLoader = function($http, $q) {

        var config = {};

        var _get_config = function(key) {

            if (typeof(key) == 'undefined') {
                return config;
            }
            if (config.hasOwnProperty(key)) {
                return config[key];
            }

            return null;
        };

        var get_config = function (key) {
            return $q(function(resolve, reject) {

                if (Object.keys(config).length === 0) {

                    var req = {
                        method: 'GET',
                        url: "config.json"
                    };

                    var onSuccess = function(data) {
                        config = data.data;
                        return resolve(_get_config(key));
                    };

                    var onError = function(data) {
                        reject(data);
                    };

                    return $http(req)
                        .then(onSuccess, onError);
                } else {
                    return resolve(_get_config(key));
                }
            });

        };

        return {
            get_config:get_config
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("configLoader", ['$http', '$q', configLoader]);

}(angular));
