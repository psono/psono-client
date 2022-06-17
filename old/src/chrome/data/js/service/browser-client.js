(function(angular, $, window) {
    'use strict';

        var browserClient = function(helper, $rootScope, $q, $templateRequest, $http, $location, storage) {

        var registrations = {};

        activate();

        function activate() {
            storage.register("storage-reload", function(){
                emit("storage-reload", null);
            });
        }

        chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            for (var i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
                registrations[request.event][i](request.data);
            }
        });

        /**
         * @ngdoc
         * @name psonocli.browserClient#register_auth_required_listener
         * @methodOf psonocli.browserClient
         *
         * @description
         * Registers a listener with chrome.webRequest.onAuthRequired.addListener
         */
        function register_auth_required_listener(callback) {
            if (typeof chrome.webRequest !== 'undefined') {
                chrome.webRequest.onAuthRequired.addListener(callback, {urls: ["<all_urls>"]}, ["asyncBlocking"]);
            }
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_client_type
         * @methodOf psonocli.browserClient
         *
         * @description
         * Returns the client type
         */
        function get_client_type() {
            return 'chrome_extension'
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#open_tab
         * @methodOf psonocli.browserClient
         *
         * @description
         * Opens the URL in a new browser tab
         * @param url
         */
        function open_tab(url) {
            return $q(function (resolve) {
                var new_window = window.open(url, '_blank');
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
            return chrome.identity.getRedirectURL() + 'data/index.html#!/saml/token/';
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_oidc_return_to_url
         * @methodOf psonocli.browserClient
         *
         * @description
         * cosntructs and returns the "return to" address for OIDC
         *
         * @returns {string}
         */
        function get_oidc_return_to_url() {
            return chrome.identity.getRedirectURL() + 'data/index.html#!/oidc/token/';
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

            return $q(function(resolve, reject) {

                chrome.identity.launchWebAuthFlow({
                    url: url,
                    interactive: true
                }, function(response_url) {
                    if (response_url.indexOf(get_oidc_return_to_url()) !== -1) {
                        var oidc_token_id = response_url.replace(get_oidc_return_to_url(), '');
                        resolve(oidc_token_id)
                    } else {
                        var saml_token_id = response_url.replace(get_saml_return_to_url(), '');
                        resolve(saml_token_id)
                    }
                })

            });
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
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#replace_tab_url
         * @methodOf psonocli.browserClient
         *
         * @description
         * Replaces the URL of the current browser tab (from the background page)
         *
         * @param url
         * @param callback_function
         */
        function replace_tab_url(url, callback_function) {
            chrome.tabs.update({
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

            chrome.windows.create({
                url: url,
                type: "popup",
                width: 800,
                height: 600
            }, callback_function);
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
            return chrome.windows.remove(window_id);
        }

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
        function get_base_url() {
            return $q(function (resolve) {
                resolve("chrome-extension://"+chrome.runtime.id+"/data/");
            });
        }

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
         * @returns {Promise}
         */
        function load_config() {

            var remote_config_json = storage.find_key('persistent', 'remote_config_json');

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
                    var parsed_url = helper.parse_url('https://www.psono.pw/');

                    if (!new_config.hasOwnProperty('base_url')) {
                        new_config['base_url'] = parsed_url['base_url'] + '/';
                    }

                    if (new_config.hasOwnProperty('backend_servers')) {
                        for (var i = 0; i < new_config['backend_servers'].length; i++) {
                            if (new_config['backend_servers'][i].hasOwnProperty('url')) {
                                continue;
                            }
                            new_config['backend_servers'][i]['url'] = parsed_url['base_url'] + '/server';
                        }
                    }

                    if (!new_config.hasOwnProperty('authentication_methods')) {
                        new_config['authentication_methods'] = ["AUTHKEY", "LDAP", "SAML", "OIDC"];
                    }
                    if (!new_config.hasOwnProperty('saml_provider')) {
                        new_config['saml_provider'] = [];
                    }
                    if (!new_config.hasOwnProperty('disable_download_bar')) {
                        new_config['disable_download_bar'] = false;
                    }
                    if (!new_config.hasOwnProperty('more_links')) {
                        new_config['more_links'] = [{
                            'href': 'https://doc.psono.com/',
                            'title': 'DOCUMENTATION',
                            'class': 'fa-book'
                        },{
                            'href': 'privacy-policy.html',
                            'title': 'PRIVACY_POLICY',
                            'class': 'fa-user-secret'
                        },{
                            'href': 'https://www.psono.com',
                            'title': 'ABOUT_US',
                            'class': 'fa-info-circle'
                        }];
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

            if (remote_config_json === null) {
                return $http(req)
                    .then(onSuccess, onError);
            } else {
                return onSuccess({data:remote_config_json.value})
            }
        }

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
        function get_active_tab() {
            return $q(function (resolve) {
                chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
                    resolve(arrayOfTabs[0])}
                );
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
        function test_background_page () {
            return backgroundPage.bg.test();
        }

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
        function emit (event, data) {
            chrome.runtime.sendMessage({event: event, data: data}, function(response) {
                //console.log(response);
            });
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
         * @param event
         * @param data
         * @param fnc
         */
        function emit_sec(event, data, fnc) {
            chrome.runtime.sendMessage({event: event, data: data}, fnc);
        }

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
        function on(event, myFunction) {

            $rootScope.$on(event, myFunction);

            if (!registrations.hasOwnProperty(event)) {
                registrations[event] = [];
            }
            registrations[event].push(myFunction);
        }


        var config = {};

        /**
         * helper function to return either the config itself or if key has been specified only the config part for the key
         *
         * @param key
         * @returns {*}
         * @private
         */
        function _get_config(key) {

            if (typeof(key) === 'undefined') {
                return config;
            }
            if (config.hasOwnProperty(key)) {
                return config[key];
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
         * @param key
         * @returns {*}
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
         * @name psonocli.browserClient#clear_config_cache
         * @methodOf psonocli.browserClient
         *
         * @description
         * Clears the config cache
         */
        function clear_config_cache() {
            config = {};
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#get_config
         * @methodOf psonocli.browserClient
         *
         * @description
         * Closes the popup
         */
        function close_popup() {
            window.close()
        }

        /**
         * @ngdoc
         * @name psonocli.browserClient#disable_browser_password_saving
         * @methodOf psonocli.browserClient
         *
         * @description
         * Manipulate the password saving function in the browser
         *
         * @returns {promise} A promise with the success or failure state
         */
        function disable_browser_password_saving(value) {
            var oldPMValue = storage.find_key('settings', 'disable_browser_pm');
            if (oldPMValue == null) {
                oldPMValue = true;
            } else {
                oldPMValue = oldPMValue.value;
            }
            value = value !== undefined ? value : oldPMValue;
            return $q(function(resolve, reject) {
                chrome.privacy.services.passwordSavingEnabled.get({}, function(details) {
                    if (details.levelOfControl === "controlled_by_this_extension" ||
                        details.levelOfControl === "controllable_by_this_extension") {
                        chrome.privacy.services.passwordSavingEnabled.set({ value: !value }, function() {
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
         * @name psonocli.browserClient#notify
         * @methodOf psonocli.browserClient
         *
         * @description
         * Create a notification
         *
         * @param {string} content The notification content
         */
        function notify(content) {
            chrome.notifications.getPermissionLevel(function (permissionLevel) {
                if (permissionLevel === 'denied') {
                    console.warn("Notification are denied");
                    return
                }

                chrome.notifications.create(undefined, {
                    type: 'basic',
                    title: content,
                    message: '',
                    iconUrl: 'img/icon-32.png'
                })
            })
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
            register_auth_required_listener: register_auth_required_listener,
            get_client_type: get_client_type,
            open_tab: open_tab,
            get_saml_return_to_url: get_saml_return_to_url,
            get_oidc_return_to_url: get_oidc_return_to_url,
            launch_web_auth_flow: launch_web_auth_flow,
            open_tab_bg: open_tab_bg,
            replace_tab_url: replace_tab_url,
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
            clear_config_cache:clear_config_cache,
            close_popup:close_popup,
            disable_browser_password_saving:disable_browser_password_saving,
            copy_to_clipboard: copy_to_clipboard,
            notify: notify,
            getOfflineCacheEncryptionKey: getOfflineCacheEncryptionKey
        };
    };

    var app = angular.module('psonocli');
    app.factory("browserClient", ['helper', '$rootScope', '$q', '$templateRequest', '$http', '$location', 'storage', browserClient]);

}(angular, $, window));
