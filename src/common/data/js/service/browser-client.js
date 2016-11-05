(function(angular, $, window) {
    'use strict';

    var events = [
        'login',
        'logout'
    ];

    var browserClient = function($rootScope, $q, $templateRequest, $http) {
        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            console.log("addon.js browserClient.resize triggered");
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var openTab = function(url) {
            window.open(url, '_blank');
        };

        /**
         * returns the base url which can be used to generate activation links
         *
         * @returns {string}
         */
        var getBaseUrl = function() {

            var onSuccess = function(base_url) {
                return base_url;
            };
            var onError = function() {

            };

            return get_config('base_url').then(onSuccess, onError);
        };

        /**
         * returns a promise with the version string
         *
         * @returns {Promise}
         */
        var loadVersion = function() {
            return $templateRequest('./VERSION.txt');
        };

        /**
         * returns a promise with the version string
         *
         * @returns {Promise}
         */
        var loadConfig = function() {

            var req = {
                method: 'GET',
                url: "config.json"
            };

            return $http(req);
        };

        /**
         * returns a promise which will return the active tabs url
         *
         * @returns {promise}
         */
        var getActiveTabUrl = function() {
            return $q(function (resolve) {
                resolve(window.location.href);
            });
        };

        /**
         * Dummy function to see if the background page works
         */
        var testBackgroundPage = function () {
            return false;
        };

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            console.log("browser-client.js $rootScope.$broadcast " + event);
            $rootScope.$broadcast(event, '');
        };

        /**
         * emits sensitive data only to secure locations
         *
         * @param event
         * @param data
         */
        var emitSec = function(event, data) {

        };

        /**
         * registers for an event with a function
         *
         * @param event
         * @param myFunction
         *
         * @returns {boolean}
         */
        var on = function (event, myFunction) {

            if(events.indexOf(event) == -1)
                return false;

            $rootScope.$on(event, myFunction);
        };


        var config = {};

        /**
         * helper function to return either the config itself or if key has been specified only the config part for the key
         *
         * @param key
         * @returns {*}
         * @private
         */
        var _get_config = function(key) {

            if (typeof(key) == 'undefined') {
                return config;
            }
            if (config.hasOwnProperty(key)) {
                return config[key];
            }

            return null;
        };

        /**
         * Loads the config (or only the part specified by the "key") fresh or from "cache"
         *
         * @param key
         * @returns {*}
         */
        var get_config = function (key) {
            return $q(function(resolve, reject) {

                if (Object.keys(config).length === 0) {


                    var onSuccess = function(data) {
                        config = data.data;
                        return resolve(_get_config(key));
                    };

                    var onError = function(data) {
                        reject(data);
                    };

                    loadConfig()
                        .then(onSuccess, onError);

                } else {
                    return resolve(_get_config(key));
                }
            });

        };

        return {
            resize: resize,
            openTab: openTab,
            getBaseUrl: getBaseUrl,
            loadVersion: loadVersion,
            loadConfig: loadConfig,
            getActiveTabUrl: getActiveTabUrl,
            testBackgroundPage: testBackgroundPage,
            emit: emit,
            emitSec: emitSec,
            on: on,
            get_config:get_config
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("browserClient", ['$rootScope', '$q', '$templateRequest', '$http', browserClient]);

}(angular, $, window));
