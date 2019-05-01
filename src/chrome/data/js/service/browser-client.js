(function(angular, $, window) {
    'use strict';

    var browserClient = function($rootScope, $q, $templateRequest, $http, $location) {

        var registrations = {};

        chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
                registrations[request.event][i](request.data);
            }
        });

        /**
         * Returns the client type
         */
        var get_client_type = function() {
            return 'chrome_extension'
        };

        /**
         * Opens the URL in a new browser tab
         * @param url
         */
        var open_tab = function(url) {
            return $q(function (resolve) {
                var new_window = window.open(url, '_blank');
                resolve(new_window);
            });
        };

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
        var get_saml_return_to_url = function() {
            return chrome.identity.getRedirectURL() + '/data/index.html#!/saml/token/';
        };

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
        var launch_web_auth_flow = function(url) {
            chrome.identity.launchWebAuthFlow({
                url: url,
                interactive: true
            }, function(response_url) {
                var path = response_url.replace(chrome.identity.getRedirectURL() + '/data/index.html#!', '');
                $location.path(path);
            })
        };

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
        var open_tab_bg = function(url, callback_function) {
            chrome.tabs.create({
                url: url
            }, function(tab) {
                if (!callback_function) {
                    return;
                }
                chrome.tabs.onUpdated.addListener(function listener (tabId, info) {
                    if (info.status === 'complete' && tabId === tab.id) {
                        chrome.tabs.onUpdated.removeListener(listener);
                        callback_function(tab);
                    }
                });
            });
        };

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
        var open_popup = function(url, callback_function) {

            chrome.windows.create({
                url: url,
                type: "popup",
                width: 800,
                height: 600
            }, callback_function);
        };

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
        var close_opened_popup = function(window_id) {
            return chrome.windows.remove(window_id);
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_base_url
         * @methodOf psonocli.browserClient
         *
         * @description
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
         * @ngdoc
         * @name psonocli.browserClient#load_version
         * @methodOf psonocli.browserClient
         *
         * @description
         * returns a promise with the version string
         *
         * @returns {Promise}
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
         * @returns {Promise}
         */
        var load_config = function() {

            var req = {
                method: 'GET',
                url: "config.json"
            };

            var onSuccess = function(orig_json_config) {

                var new_config = orig_json_config.data;

                var deferred = $q.defer();

                var onStorageRetrieve = function(storage_item) {
                    try {
                        new_config = JSON.parse(storage_item.ConfigJson);
                    } catch (e) {
                        // pass
                    }
                    if (!new_config.hasOwnProperty('authentication_methods')) {
                        new_config['authentication_methods'] = ["AUTHKEY", "LDAP", "SAML"];
                    }
                    if (!new_config.hasOwnProperty('saml_provider')) {
                        new_config['saml_provider'] = [];
                    }

                    return deferred.resolve(new_config);
                };

                chrome.storage.managed.get('ConfigJson', onStorageRetrieve);

                return deferred.promise;
            };

            var onError = function(error) {
                //should not happen
                console.log(error);
                return $q.reject(error);
            };

            return $http(req)
                .then(onSuccess, onError);
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_active_tab
         * @methodOf psonocli.browserClient
         *
         * @description
         * returns the active tab
         *
         * @returns {promise}
         */
        var get_active_tab = function() {
            return $q(function (resolve) {
                chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
                    resolve(arrayOfTabs[0])}
                );
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
            return backgroundPage.bg.test();
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#emit
         * @methodOf psonocli.browserClient
         *
         * @description
         * sends an event message to browser
         *
         * @param event
         * @param data
         */
        var emit = function (event, data) {
            chrome.runtime.sendMessage({event: event, data: data}, function(response) {
                //console.log(response);
            });
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
         * @param event
         * @param data
         * @param fnc
         */
        var emit_sec = function(event, data, fnc) {
            chrome.runtime.sendMessage({event: event, data: data}, fnc);
        };

        /**
         * @ngdoc
         * @name psonocli.browserClient#on
         * @methodOf psonocli.browserClient
         *
         * @description
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
         * @ngdoc
         * @name psonocli.browserClient#get_config
         * @methodOf psonocli.browserClient
         *
         * @description
         * Loads the config (or only the part specified by the "key") fresh or from "cache"
         *
         * @param key
         * @returns {*}
         */
        var get_config = function (key) {
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
            return $q(function(resolve, reject) {
                chrome.privacy.services.passwordSavingEnabled.get({}, function(details) {
                    if (details.levelOfControl === 'controllable_by_this_extension') {
                        chrome.privacy.services.passwordSavingEnabled.set({ value: false }, function() {
                            if (chrome.runtime.lastError === undefined) {
                                resolve("Hooray, it worked!");
                            } else {
                                reject("Sadness!");
                                console.log("Sadness!", chrome.runtime.lastError);
                            }
                        });
                    }
                });
            });
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
            chrome.runtime.getBackgroundPage(function (bg) {
                fnc(bg.psono_offline_cache_encryption_key)
            });
        }

        return {
            get_client_type: get_client_type,
            open_tab: open_tab,
            get_saml_return_to_url: get_saml_return_to_url,
            launch_web_auth_flow: launch_web_auth_flow,
            open_tab_bg: open_tab_bg,
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
            disable_browser_password_saving:disable_browser_password_saving,
            copy_to_clipboard: copy_to_clipboard,
            getOfflineCacheEncryptionKey: getOfflineCacheEncryptionKey
        };
    };

    var app = angular.module('psonocli');
    app.factory("browserClient", ['$rootScope', '$q', '$templateRequest', '$http', '$location', browserClient]);

}(angular, $, window));