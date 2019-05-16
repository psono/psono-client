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

    var browserClient = function($rootScope, $q, $templateRequest, $http, $location, $window, $document) {

        var config = {};
        var events = [
            'login',
            'logout'
        ];

        /**
         * @ngdoc
         * @name psonocli.browserClient#register_auth_required_listener
         * @methodOf psonocli.browserClient
         *
         * @description
         * Registers a listener with browser.webRequest.onAuthRequired.addListener
         */
        function register_auth_required_listener(callback) {
            // pass don't do anything
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_client_type
         * @methodOf psonocli.browserClient
         *
         * @description
         * Returns the client type
         */
        function get_client_type(url) {
            return 'webclient'
        }

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
        function open_tab(url) {
            return $q(function (resolve) {
                var new_window = $window.open(url, '_blank');
                resolve(new_window);
            });
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_saml_return_to_url
         * @methodOf psonocli.browserClient
         *
         * @description
         * cosntructs and returns the "return to" address for SAML
         *
         * @returns {string}
         */
        function get_saml_return_to_url() {
            return $location.absUrl().split('#')[0].split('/').slice(0, -1).join('/') + '/index.html#!/saml/token/';
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#launch_web_auth_flow
         * @methodOf psonocli.browserClient
         *
         * @description
         * Launches the web authflow
         *
         * @param {string} url The url to open
         */
        function launch_web_auth_flow(url) {
            $window.location.href = url;
            return $q.resolve();
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#open_tab_bg
         * @methodOf psonocli.browserClient
         *
         * @description
         * Opens the URL in a new browser tab (from the background page)
         *
         * @param url
         * @param callback_function
         */
        function open_tab_bg(url, callback_function) {
            // pass, websites have no background page
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#open_popup
         * @methodOf psonocli.browserClient
         *
         * @description
         * Opens the URL in a popup
         *
         * @param url
         * @param callback_function
         */
        function open_popup(url, callback_function) {
            var win = $window.open(url, '_blank', "width=800,height=600");
            win.onload = function() { win.RunCallbackFunction = callback_function; };
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#close_opened_popup
         * @methodOf psonocli.browserClient
         *
         * @description
         * Closes a popup
         *
         * @param window_id
         */
        function close_opened_popup(window_id) {
            // pass
        }

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
        function get_base_url() {

            var onSuccess = function(base_url) {
                return base_url;
            };
            var onError = function() {

            };

            return get_config('base_url').then(onSuccess, onError);
        }

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
        function load_version() {
            return $templateRequest('./VERSION.txt');
        }


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
        function load_config() {

            var req = {
                method: 'GET',
                url: "config.json"
            };

            var onSuccess = function(orig_json_config) {
                var new_config = orig_json_config.data;

                if (!new_config.hasOwnProperty('authentication_methods')) {
                    new_config['authentication_methods'] = ["AUTHKEY", "LDAP", "SAML"];
                }
                if (!new_config.hasOwnProperty('saml_provider')) {
                    new_config['saml_provider'] = [];
                }

                return $q.resolve(new_config);
            };

            var onError = function(error) {
                //should not happen
                console.log(error);
                return $q.reject(error);
            };

            return $http(req)
                .then(onSuccess, onError);
        }

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
        function get_active_tab() {
            return $q(function (resolve) {
                resolve({
                    title: $document.title,
                    url: $window.location.href
                });
            });
        }

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
        function get_active_tab_url() {
            return get_active_tab().then(function(tab){
                return tab.url;
            });
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#test_background_page
         * @methodOf psonocli.browserClient
         *
         * @description
         * Dummy function to see if the background page works
         */
        function test_background_page() {
            return false;
        }

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
        function emit(event, data) {
            $rootScope.$broadcast(event, '');
        }

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
        function emit_sec(event, data, fnc) {

        }

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
        function on(event, myFunction) {

            if(events.indexOf(event) === -1)
                return false;

            $rootScope.$on(event, myFunction);
            return true;
        }

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
        function _get_config(key) {

            if (typeof(key) === 'undefined') {
                return angular.copy(config);
            }
            if (config.hasOwnProperty(key)) {
                return angular.copy(config[key]);
            }

            return null;
        }

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
        function get_config(key) {
            return $q(function(resolve, reject) {

                if (Object.keys(config).length === 0) {


                    var onSuccess = function(new_config) {
                        config = new_config;
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
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#close_popup
         * @methodOf psonocli.browserClient
         *
         * @description
         * Closes the popup
         */
        function close_popup() {
            // pass
        }

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
        function disable_browser_password_saving() {
            return $q.resolve('nothing done');
        }


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


        /**
         * @ngdoc
         * @name psonocli.browserClient#getOfflineCacheEncryptionKey
         * @methodOf psonocli.browserClient
         *
         * @description
         * Asks the background page for the offline cache encryption key
         *
         * @param {function} fnc The callback function
         */
        function getOfflineCacheEncryptionKey(fnc) {
            //pass, no background page on the website
        }

        return {
            register_auth_required_listener: register_auth_required_listener,
            get_client_type: get_client_type,
            open_tab: open_tab,
            get_saml_return_to_url: get_saml_return_to_url,
            launch_web_auth_flow: launch_web_auth_flow,
            open_tab_bg: open_tab_bg,
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
            copy_to_clipboard: copy_to_clipboard,
            getOfflineCacheEncryptionKey: getOfflineCacheEncryptionKey
        };
    };

    var app = angular.module('psonocli');
    app.factory("browserClient", ['$rootScope', '$q', '$templateRequest', '$http', '$location', '$window', '$document', browserClient]);

}(angular));
