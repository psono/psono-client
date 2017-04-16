(function(angular, $, window) {
    'use strict';

    var browserClient = function($rootScope, $q, $templateRequest, $http) {

        var registrations = {};

        browser.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
                "from the extension");

            console.log("received something");
            console.log(request);

            for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
                registrations[request.event][i](request.data);
            }
        });

        /**
         * Resize the panel according to the provided width and height
         *
         * @param height
         * @param width
         */
        var resize = function (height, width) {
            // pass
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var open_tab = function(url) {
            window.open(url, '_blank');
        };

        /**
         * returns the base url which can be used to generate activation links
         *
         * @returns {string}
         */
        var get_base_url = function() {
            return $q(function (resolve) {
                resolve("chrome-extension://"+chrome.runtime.id+"/data/");
            });
        };

        /**
         * returns a promise with the version string
         *
         * @returns {Promise}
         */
        var load_version = function() {
            return $templateRequest('./VERSION.txt');
        };

        /**
         * returns a promise with the version string
         *
         * @returns {Promise}
         */
        var load_config = function() {

            var req = {
                method: 'GET',
                url: "config.json"
            };

            return $http(req);
        };

        /**
         * returns the active tabs url
         *
         * @returns {promise}
         */
        var get_active_tab_url = function() {
            return $q(function (resolve) {
                browser.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
                    resolve(arrayOfTabs[0].url)}
                );
            });
        };

        /**
         * Dummy function to see if the background page works
         */
        var test_background_page = function () {
            return backgroundPage.bg.test();
        };

        /**
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            browser.runtime.sendMessage({event: event, data: data}, function(response) {
                console.log(response);
            });
            $rootScope.$broadcast(event, '');
        };

        /**
         * emits sensitive data only to secure locations
         *
         * @param event
         * @param data
         */
        var emit_sec = function(event, data) {
            browser.runtime.sendMessage({event: event, data: data}, function(response) {
                console.log(response);
            });
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

            $rootScope.$on(event, myFunction);

            if (!registrations.hasOwnProperty(event)) {
                registrations[event] = [];
            }
            registrations[event].push(myFunction);
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

            if (typeof(key) === 'undefined') {
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

                    load_config()
                        .then(onSuccess, onError);

                } else {
                    return resolve(_get_config(key));
                }
            });

        };

        return {
            resize: resize,
            open_tab: open_tab,
            get_base_url: get_base_url,
            load_version: load_version,
            load_config: load_config,
            get_active_tab_url: get_active_tab_url,
            test_background_page: test_background_page,
            emit: emit,
            emit_sec: emit_sec,
            on: on,
            get_config:get_config
        };
    };

    var app = angular.module('psonocli');
    app.factory("browserClient", ['$rootScope', '$q', '$templateRequest', '$http', browserClient]);

}(angular, $, window));