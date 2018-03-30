(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.browserClient
     * @requires $rootScope
     * @requires $q
     * @requires $templateRequest
     * @requires $http
     * @requires $window
     *
     * @description
     * The browser interface, responsible for the cross browser / platform compatibility.
     */

    var browserClient = function($rootScope, $q, $templateRequest, $http, $window, $document) {

        var config = {};
        var events = [
            'login',
            'logout'
        ];

        /**
         * Returns the client type
         */
        var get_client_type = function(url) {
            return 'webclient'
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#open_tab
         * @methodOf psonocli.browserClient
         *
         * @description
         * Opens the URL in a new browser tab
         *
         * @param {string} url The url to open
         */
        var open_tab = function(url) {
            $window.open(url, '_blank');
        };

        /**
         * Opens the URL in a popup
         *
         * @param url
         * @param callback_function
         */
        var open_popup = function(url, callback_function) {
            var win = $window.open(url, '_blank', "width=800,height=1000");
            win.onload = function() { win.RunCallbackFunction = callback_function; };
        };

        /**
         * Closes a popup
         *
         * @param window_id
         */
        var close_opened_popup = function(window_id) {
            // pass
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_base_url
         * @methodOf psonocli.browserClient
         *
         * @description
         * returns the base url which can be used to generate activation links
         *
         * @returns {string} The base url
         */
        var get_base_url = function() {

            var onSuccess = function(base_url) {
                return base_url;
            };
            var onError = function() {

            };

            return get_config('base_url').then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#load_version
         * @methodOf psonocli.browserClient
         *
         * @description
         * returns a promise with the version string
         *
         * @returns {promise} promise
         */
        var load_version = function() {
            return $templateRequest('./VERSION.txt');
        };


        /**
         * @ngdoc
         * @name psonocli.browserClient#load_config
         * @methodOf psonocli.browserClient
         *
         * @description
         * returns a promise with the version string
         *
         * @returns {promise} promise
         */
        var load_config = function() {

            var req = {
                method: 'GET',
                url: "config.json"
            };

            return $http(req);
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_active_tab
         * @methodOf psonocli.browserClient
         *
         * @description
         * returns a promise which will return the active tab
         *
         * @returns {promise} promise
         */
        var get_active_tab = function() {
            return $q(function (resolve) {
                resolve({
                    title: $document.title,
                    url: $window.location.href
                });
            });
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_active_tab_url
         * @methodOf psonocli.browserClient
         *
         * @description
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
         * @ngdoc
         * @name psonocli.browserClient#test_background_page
         * @methodOf psonocli.browserClient
         *
         * @description
         * Dummy function to see if the background page works
         */
        var test_background_page = function () {
            return false;
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#emit
         * @methodOf psonocli.browserClient
         *
         * @description
         * sends an event message to browser
         *
         * @param {string} event The event
         * @param {*} data The payload for the event
         */
        var emit = function (event, data) {
            $rootScope.$broadcast(event, '');
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#emit_sec
         * @methodOf psonocli.browserClient
         *
         * @description
         * emits sensitive data only to secure locations
         *
         *
         * @param {string} event The event
         * @param {*} data The payload for the event
         * @param {function} fnc An optional callback function with the return value
         */
        var emit_sec = function(event, data, fnc) {

        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#on
         * @methodOf psonocli.browserClient
         *
         * @description
         * registers for an event with a function
         *
         * @param {string} event The event
         * @param {function} myFunction The callback function
         *
         * @returns {boolean} Returns if the registration was successful
         */
        var on = function (event, myFunction) {

            if(events.indexOf(event) === -1)
                return false;

            $rootScope.$on(event, myFunction);
            return true;
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#on
         * @methodOf psonocli.browserClient
         *
         * @description
         * helper function to return either the config itself or if key has been specified only the config part for the key
         *
         * @param {string} key The config "key" one wants to have
         * @returns {*} The config value
         * @private
         */
        var _get_config = function(key) {

            if (typeof(key) === 'undefined') {
                return angular.copy(config);
            }
            if (config.hasOwnProperty(key)) {
                return angular.copy(config[key]);
            }

            return null;
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_config
         * @methodOf psonocli.browserClient
         *
         * @description
         * Loads the config (or only the part specified by the "key") fresh or from "cache"
         *
         * @param {string} key The config "key" one wants to have
         *
         * @returns {promise} A promise with the config value
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
         * @name psonocli.browserClient#close_popup
         * @methodOf psonocli.browserClient
         *
         * @description
         * Closes the popup
         */
        var close_popup = function() {
            // pass
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
            var input = angular.element('<input>');
            input.attr('type', 'text');
            input.attr('value', content);
            angular.element(document.body).append(input);
            input.select();
            document.execCommand("Copy");
            input.remove();
        }

        return {
            get_client_type: get_client_type,
            open_tab: open_tab,
            open_popup: open_popup,
            close_opened_popup: close_opened_popup,
            close_popup: close_popup,
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
            disable_browser_password_saving: disable_browser_password_saving,
            copy_to_clipboard: copy_to_clipboard
        };
    };

    var app = angular.module('psonocli');
    app.factory("browserClient", ['$rootScope', '$q', '$templateRequest', '$http', '$window', '$document', browserClient]);

}(angular));
