(function(angular, $, window) {
    'use strict';

    var browserClient = function($rootScope, $q, $templateRequest, $http) {

        var registrations = {};

        browser.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
                registrations[request.event][i](request.data);
            }
        });

        /**
         * Returns the client type
         */
        var get_client_type = function() {
            return 'firefox_extension'
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var open_tab = function(url) {
            window.open(url, '_blank');
        };

        /**
         * Opens the URL in a popup
         *
         * @param url
         * @param callback_function
         */
        var open_popup = function(url, callback_function) {

            return browser.windows.create({
                url: browser.runtime.getURL(url),
                type: "popup",
                width: 800,
                height: 600
            }, callback_function);
        };

        /**
         * Closes a popup
         *
         * @param window_id
         */
        var close_opened_popup = function(window_id) {
            return browser.windows.remove(window_id);
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
         * returns the active tab
         *
         * @returns {promise}
         */
        var get_active_tab = function() {
            return $q(function (resolve) {
                browser.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
                    resolve(arrayOfTabs[0])}
                );
            });
        };

        /**
         * returns a promise which will return the active tabs url
         *
         * @returns {promise} promise
         */
        var get_active_tab_url = function() {
            return get_active_tab().then(function(tab){
                return tab.url;
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
                //console.log(response);
            });
            $rootScope.$broadcast(event, '');
        };

        /**
         * emits sensitive data only to secure locations
         *
         * @param event
         * @param data
         * @param fnc
         */
        var emit_sec = function(event, data, fnc) {
            browser.runtime.sendMessage({event: event, data: data}, fnc);
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

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_config
         * @methodOf psonocli.browserClient
         *
         * @description
         * Closes the popup
         */
        var close_popup = function() {
            window.close()
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#disable_browser_password_saving
         * @methodOf psonocli.browserClient
         *
         * @description
         * Disables the password saving function in the browser
         *
         * @returns {promise} A promise with the success or failure state
         */
        var disable_browser_password_saving = function() {
            return $q.resolve('nothing done');
        };


        /**
         * @ngdoc
         * @name psonocli.browserClient#copy_to_clipboard
         * @methodOf psonocli.browserClient
         *
         * @description
         * Copies some content to the clipboard
         *
         * @param {string} content The content to copy
         */
        function copy_to_clipboard(content) {

            var copy = function (e) {
                e.preventDefault();
                if (e.clipboardData) {
                    e.clipboardData.setData('text/plain', content);
                } else if (window.clipboardData) {
                    window.clipboardData.setData('Text', content);
                }

            };
            document.addEventListener('copy', copy);
            document.execCommand('copy');
            document.removeEventListener('copy', copy);
        }

        return {
            get_client_type: get_client_type,
            open_tab: open_tab,
            open_popup: open_popup,
            close_opened_popup: close_opened_popup,
            get_base_url: get_base_url,
            load_version: load_version,
            load_config: load_config,
            get_active_tab: get_active_tab,
            get_active_tab_url: get_active_tab_url,
            test_background_page: test_background_page,
            emit: emit,
            emit_sec: emit_sec,
            on: on,
            get_config:get_config,
            close_popup:close_popup,
            disable_browser_password_saving: disable_browser_password_saving,
            copy_to_clipboard: copy_to_clipboard
        };
    };

    var app = angular.module('psonocli');
    app.factory("browserClient", ['$rootScope', '$q', '$templateRequest', '$http', browserClient]);

}(angular, $, window));