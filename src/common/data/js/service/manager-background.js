(function(angular) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.managerBackground
     * @requires $q
     * @requires $timeout
     * @requires $translate
     * @requires psonocli.managerBase
     * @requires psonocli.storage
     * @requires psonocli.managerDatastorePassword
     * @requires psonocli.managerDatastore
     * @requires psonocli.managerDatastoreUser
     * @requires psonocli.helper
     * @requires psonocli.cryptoLibrary
     * @requires psonocli.apiClient
     * @requires psonocli.device
     * @requires psonocli.browser
     * @requires psonocli.chrome
     * @requires psonocli.browserClient
     * @requires psonocli.settings
     * @requires psonocli.openpgp
     * @requires psonocli.offlineCache
     *
     * @description
     * Service that handles the complete background process
     */
    var managerBackground = function($q, $timeout, $translate, managerBase, managerSecret, storage, managerDatastorePassword,
                                     managerDatastore, managerDatastoreUser, helper, cryptoLibrary, apiClient, device,
                                     browser, chrome, browserClient, settings, openpgp, offlineCache) {

        var last_login_credentials;
        var activeTabId;
        var entry_extra_info = {};
        var fillpassword = [];
        var already_filled_max_allowed = {};

        var gpg_messages = {};

        var num_tabs;

        activate();

        function activate() {

            browserClient.disable_browser_password_saving();

            if (typeof chrome.tabs !== 'undefined') {
                chrome.tabs.onActivated.addListener(function(activeInfo) {
                    activeTabId = activeInfo.tabId;
                });
            }

            if (typeof chrome.omnibox !== 'undefined') {
                chrome.omnibox.onInputChanged.addListener(on_input_changed);
                chrome.omnibox.onInputEntered.addListener(on_input_entered);
                chrome.omnibox.setDefaultSuggestion({
                    description: "Search datastore: <match>%s</match>"
                });

            }
            if (typeof browser.runtime.onMessage !== 'undefined') {
                browser.runtime.onMessage.addListener(on_message);
            }
            browserClient.register_auth_required_listener(on_auth_required);
            // browser.webRequest.onBeforeRequest.addListener(on_before_request, {urls: ["<all_urls>"]}, ["blocking", "requestBody"]);
            // browser.webRequest.onBeforeSendHeaders.addListener(on_before_send_headers, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

            if (typeof browser.notifications !== 'undefined') {
                browser.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
                    if (notificationId.startsWith('new-password-detected-')  && buttonIndex === 0) {
                        save_last_login_credentials();
                    }
                    chrome.notifications.clear(notificationId)
                });
            }

            if (typeof browser.runtime.setUninstallURL !== 'undefined') {
                // set url to open if someone uninstalls our extension
                browser.runtime.setUninstallURL("https://psono.com/uninstall-successfull/");
            }


            if (typeof browser.runtime.onInstalled !== 'undefined') {
                // set url to open if someone installs our extension
                browser.runtime.onInstalled.addListener(function(details) {
                    if(details.reason !== "install"){
                        return;
                    }

                    browser.tabs.create({
                        url: 'https://www.psono.pw/register.html'
                    });
                });
            }

            if (typeof browser.tabs !== 'undefined') {
                // count tabs to logout on browser close
                browser.tabs.query({currentWindow: true}, function( tabs ){
                    num_tabs = tabs.length;
                });
                browser.tabs.onCreated.addListener(function(tab){
                    num_tabs++;
                });
                browser.tabs.onRemoved.addListener(function(tabId){
                    num_tabs--;
                    if( num_tabs === 0 && managerDatastoreUser.get_default('trust_device') !== true) {
                        managerDatastoreUser.logout();
                    }
                });
            }


            $translate([
                'OPEN_DATASTORE',
                'RECHECK_PAGE'
            ]).then(function (translations) {

                var parent = chrome.contextMenus.create({"title": "Psono"});
                var child1 = chrome.contextMenus.create({
                    "title": translations.OPEN_DATASTORE,
                    "contexts": ["all"],
                    "parentId": parent,
                    "onclick": open_datastore
                });
                var child2 = chrome.contextMenus.create({
                    "title": translations.RECHECK_PAGE,
                    "contexts": ["all"],
                    "parentId": parent,
                    "onclick": recheck_page
                });
            });
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#open_datastore
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Opens the datastore whenever someone clicks in the context menu the open datastore
         *
         * @param info
         * @param tab
         */
        function open_datastore(info, tab) {
            browser.tabs.create({
                url: '/data/index.html'
            });
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#recheck_page
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggers a check for all the forms
         *
         * @param info
         * @param tab
         */
        function recheck_page(info, tab) {
            // TODO implement
        }

        // Start helper functions

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_message
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Main function to deal with messages
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_message(request, sender, sendResponse) {
            var event_functions = {
                'fillpassword': on_fillpassword,
                'ready': on_ready,
                'fillpassword-active-tab': on_fillpassword_active_tab,
                'save-password-active-tab': save_password_active_tab,
                'bookmark-active-tab': bookmark_active_tab,
                'login': on_login,
                'logout': on_logout,
                'storage-reload': on_storage_reload,
                'website-password-refresh': on_website_password_refresh,
                'request-secret': on_request_secret,
                'open-tab': on_open_tab,
                'login-form-submit': login_form_submit,
                'decrypt-gpg': decrypt_pgp,
                'encrypt-gpg': encrypt_pgp,
                'read-gpg': read_gpg,
                'write-gpg': write_gpg,
                'write-gpg-complete': write_gpg_complete,
                'secrets-changed': secret_changed,
                'set-offline-cache-encryption-key': set_offline_cache_encryption_key,
                'launch-web-auth-flow-in-background': launch_web_auth_flow_in_background
            };

            if (event_functions.hasOwnProperty(request.event)){
                return event_functions[request.event](request, sender, sendResponse);
            } else {
                // not catchable event
                console.log(sender.tab);
                console.log("background script received (uncaptured)    " + request.event);
            }
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_ready
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a ready event from a content script that finished loading
         * lets provide the possible passwords
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        var on_ready = function(request, sender, sendResponse) {
            if (sender.tab) {
                var url = sender.tab.url;
                var parsed_url = helper.parse_url(url);

                for(var i = fillpassword.length - 1; i >= 0; i--) {
                    if( helper.endsWith(parsed_url.authority, fillpassword[i].authority)) {
                        fillpassword[i].submit = parsed_url.scheme === 'https';
                        sendResponse({event: "fillpassword", data: fillpassword[i]});
                        break;
                    }
                }
                $timeout(function () {
                    fillpassword = [];
                }, 3000);
            }
        };

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_fillpassword
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a fillpassword event
         * lets remember it
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_fillpassword(request, sender, sendResponse) {
            fillpassword.push(request.data);
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_fillpassword_active_tab
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a fillpassword active tab event
         * lets send a fillpassword event to the to the active tab
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_fillpassword_active_tab (request, sender, sendResponse) {
            if (typeof(activeTabId) === 'undefined') {
                return;
            }
            browser.tabs.sendMessage(activeTabId, {event: "fillpassword", data: request.data}, function(response) {
                // pass
            });
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#save_password_active_tab
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a fillpassword active tab event
         * lets send a fillpassword event to the to the active tab
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function save_password_active_tab (request, sender, sendResponse) {
            if (typeof(activeTabId) === 'undefined') {
                return;
            }
            var onError = function(data) {
                console.log(data);
            };

            var onSuccess = function(datastore_object) {
                $timeout(function() {
                    chrome.tabs.sendMessage(activeTabId, {event: 'secrets-changed', data: {}}, function(response) {
                        // don't do anything
                    });
                }, 500); // delay 500 ms to give the storage a chance to be stored

                browserClient.open_tab('index.html#!/datastore/edit/'+datastore_object.type+'/'+datastore_object.secret_id);
            };
            
            managerDatastorePassword.save_password_active_tab(request.data.password).then(onSuccess, onError);
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#bookmark_active_tab
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a fillpassword active tab event
         * lets send a fillpassword event to the to the active tab
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function bookmark_active_tab (request, sender, sendResponse) {
            if (typeof(activeTabId) === 'undefined') {
                return;
            }

            var onError = function(data) {
                console.log(data);
            };

            var onSuccess = function(datastore_object) {
                $timeout(function() {
                    chrome.tabs.sendMessage(activeTabId, {event: 'secrets-changed', data: {}}, function(response) {
                        // don't do anything
                    });
                }, 500); // delay 500 ms to give the storage a chance to be stored

                browserClient.open_tab('index.html#!/datastore/edit/'+datastore_object.type+'/'+datastore_object.secret_id);

            };
            managerDatastorePassword.bookmark_active_tab().then(onSuccess, onError);
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_logout
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a logout event
         * lets close all extension tabs
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_logout(request, sender, sendResponse) {

            chrome.tabs.query({url: 'chrome-extension://'+chrome.runtime.id+'/*'}, function(tabs) {
                var tabids = [];

                if (typeof(tabs) !== 'undefined') {
                    for (var i = 0; i < tabs.length; i++) {
                        tabids.push(tabs[i].id);
                    }
                }

                chrome.tabs.remove(tabids)
            });
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_storage_reload
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Reloads the storage
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_storage_reload(request, sender, sendResponse) {
            storage.reload();
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_login
         * @methodOf psonocli.managerBackground
         *
         * @description
         * we received a login event
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_login(request, sender, sendResponse) {
            // pass
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#search_website_passwords_by_urlfilter
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Returns all website passwords where the specified url matches the url filter
         *
         * @param {string} url The url to match
         * @param {boolean} only_autosubmit Only entries with autosubmit
         *
         * @returns {Array} The database objects where the url filter match the url
         */
        function search_website_passwords_by_urlfilter(url, only_autosubmit) {

            var parsed_url = helper.parse_url(url);

            var filter = function(leaf) {

                if (leaf.type !== 'website_password') {
                    return false;
                }

                if (typeof(leaf.urlfilter) === 'undefined') {
                    return false;
                }

                if (leaf.urlfilter) {
                    var urlfilters = leaf.urlfilter.split(/\s+/);
                    for (var i = 0; i < urlfilters.length; i++) {
                        if (!helper.endsWith(parsed_url.authority, urlfilters[i])) {
                            continue;
                        }
                        return !only_autosubmit || (leaf.hasOwnProperty('autosubmit') && leaf['autosubmit']);
                    }
                    
                }
                
                return false;
            };

            return storage.where('datastore-password-leafs', filter);
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_website_password_refresh
         * @methodOf psonocli.managerBackground
         *
         * @description
         * a page finished loading, and wants to know if we have passwords for this page to display to the customer
         * in the input popup menu
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_website_password_refresh(request, sender, sendResponse) {
            var update = [];
            var leafs;

            if (!sender.tab) {
                return;
            }

            leafs = search_website_passwords_by_urlfilter(sender.tab.url, false);

            for (var ii = 0; ii < leafs.length; ii++) {
                update.push({
                    secret_id: leafs[ii].secret_id,
                    name: leafs[ii].name
                });
            }

            sendResponse({event: "website-password-update", data: update});
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#request_secret
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Reads the specified secret of the server, decrypts it and returns a promise
         *
         * @param {uuid} secret_id The id of the secret
         *
         * @returns {promise} Returns a promise with the decrypted secret content
         */
        function request_secret(secret_id) {
            var secret_key = managerBase.find_key_nolimit('datastore-password-leafs', secret_id);
            return managerSecret.read_secret(secret_id, secret_key);
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_request_secret
         * @methodOf psonocli.managerBackground
         *
         * @description
         * some content script requested a secret
         * lets search in our localstorage for the config and the secret_key of the requested secret
         * lets request the content of the secret from our backend server
         *
         * https://developer.chrome.com/extensions/runtime#event-onMessage
         * Check "unless you return true" if you do not understand the return value
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         *
         * @returns {boolean} Returns true, to indicate the async sendResponse to happen.
         */
        function on_request_secret(request, sender, sendResponse) {

            request_secret(request.data.secret_id)
                .then(function(data) {
                    sendResponse({event: "return-secret", data: data});
                }, function(value) {
                    // failed
                    sendResponse({event: "return-secret", data: 'fail'});
                });

            return true; // Important, do not remove! Otherwise Async password fill will not work.
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_open_tab
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Opens a new tab
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function on_open_tab(request, sender, sendResponse) {
            browser.tabs.create({
                url: request.data.url
            });
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#decrypt_pgp
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Receives the messages with the parsed data once someone clicks on the green "DECRYPT" symbol in a mail
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function decrypt_pgp(request, sender, sendResponse) {
            var message_id = cryptoLibrary.generate_uuid();
            gpg_messages[message_id] = {
                message: request.data.message,
                sender: request.data.sender
            };

            // Delete the message after 60 minutes
            $timeout(function() {
                delete gpg_messages[message_id];
            }, 60000);

            browserClient.open_popup("/data/popup_pgp.html#!/gpg/read/"+message_id)
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#encrypt_pgp
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Receives a message from a content script to get some encrypted data back
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function encrypt_pgp(request, sender, sendResponse) {
            var message_id = cryptoLibrary.generate_uuid();
            gpg_messages[message_id] = {
                receiver: request.data.receiver,
                sendResponse: sendResponse
            };
            browserClient.open_popup("/data/popup_pgp.html#!/gpg/write/"+message_id, function(window) {
                gpg_messages[message_id]['window_id'] = window.id;
            });

            return true; // Important, do not remove! Otherwise Async return wont work
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#read_gpg
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered upon the request of popup_pgp.html when it finished loading and wants to have the decrypted content
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function read_gpg(request, sender, sendResponse) {
            var message_id = request.data;
            if (!gpg_messages.hasOwnProperty(message_id)) {
                return sendResponse({
                    error: "Message not found"
                });
            }
            var pgp_message = gpg_messages[message_id]['message'];
            var pgp_sender = gpg_messages[message_id]['sender'];

            function decrypt(public_key) {
                return managerDatastorePassword.get_all_own_pgp_keys().then(function(private_keys) {

                    var private_keys_array = [];

                    for (var i = 0; i < private_keys.length; i++ ) {
                        var temp = openpgp.key.readArmored(private_keys[i]).keys;
                        for (var ii = 0; ii < temp.length; ii++) {
                            private_keys_array.push(temp[ii]);
                        }
                    }

                    if (public_key) {
                        options = {
                            message: openpgp.message.readArmored(pgp_message),     // parse armored message
                            publicKeys: openpgp.key.readArmored(public_key).keys,
                            privateKeys: private_keys_array
                        };
                    } else {
                        options = {
                            message: openpgp.message.readArmored(pgp_message),     // parse armored message
                            privateKeys: private_keys_array
                        };
                    }

                    openpgp.decrypt(options).then(function(plaintext) {
                        return sendResponse({
                            public_key: public_key,
                            sender: pgp_sender,
                            plaintext: plaintext
                        });
                    }, function(error) {
                        console.log(error);
                        return sendResponse({
                            public_key: public_key,
                            sender: pgp_sender,
                            message: error.message
                        });
                    });
                });
            }

            var gpg_hkp_search = new openpgp.HKP(settings.get_setting('gpg_hkp_search'));

            if (gpg_hkp_search && pgp_sender && pgp_sender.length) {

                var hkp = new openpgp.HKP(settings.get_setting('gpg_hkp_key_server'));
                var options = {
                    query: pgp_sender
                };
                hkp.lookup(options).then(function(public_key) {
                    decrypt(public_key);
                }, function(error) {
                    console.log(error);
                    console.log(error.message);
                    decrypt();
                });
            } else {
                decrypt();
            }

            return true; // Important, do not remove! Otherwise Async return wont work
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#write_gpg
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered upon the request of popup_pgp.html when it finished loading and wants to have the receiver
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function write_gpg(request, sender, sendResponse) {
            var message_id = request.data;
            if (!gpg_messages.hasOwnProperty(message_id)) {
                return sendResponse({
                    error: "Message not found"
                });
            }
            var pgp_receiver = gpg_messages[message_id]['receiver'];

            return sendResponse({
                receiver: pgp_receiver
            });
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#secret_changed
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered whenever a secret changed / updated
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function secret_changed(request, sender, sendResponse) {
            
            $timeout(function() {
                var url_filter = '';
                var url_filter_fields = ['website_password_url_filter', 'bookmark_url_filter'];
                for (var i = 0; i < url_filter_fields.length; i++) {
                    if (request.data.hasOwnProperty(url_filter_fields[i])) {
                        url_filter = request.data[url_filter_fields[i]];
                        break;
                    }
                }
                if (url_filter) {
                    chrome.tabs.query({url: '*://'+url_filter+'/*'}, function(tabs) {
                        for (var i = 0; i < tabs.length; i++) {
                            chrome.tabs.sendMessage(tabs[i].id, {event: 'secrets-changed', data: {}}, function(response) {
                                // don't do anything
                            });
                        }
                    });
                    chrome.tabs.query({url: '*://*.'+url_filter+'/*'}, function(tabs) {
                        for (var i = 0; i < tabs.length; i++) {
                            chrome.tabs.sendMessage(tabs[i].id, {event: 'secrets-changed', data: {}}, function(response) {
                                // don't do anything
                            });
                        }
                    });
                }
            }, 300); // delay 300 ms to give the storage a chance to be stored
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#write_gpg_complete
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered from the encryption popup once a user clicks "encrypt". Contains the encrypted message and the
         * origininal message_id. Will close the corresponding window and return the message
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function write_gpg_complete(request, sender, sendResponse) {
            var message_id = request.data.message_id;
            var message = request.data.message;
            var receivers = request.data.receivers;
            var public_keys = request.data.public_keys;
            var private_key = request.data.private_key;
            var sign_message = request.data.sign_message;
            var options;

            if (!gpg_messages.hasOwnProperty(message_id)) {
                return sendResponse({
                    error: "Message not found"
                });
            }

            var public_keys_array = [];

            for (var i = 0; i < public_keys.length; i++ ) {
                var temp = openpgp.key.readArmored(public_keys[i]).keys;
                for (var ii = 0; ii < temp.length; ii++) {
                    public_keys_array.push(temp[ii]);
                }
            }

            function finalise_encryption(options) {
                openpgp.encrypt(options).then(function(ciphertext) {
                    var originalSendResponse = gpg_messages[message_id]['sendResponse'];
                    var window_id = gpg_messages[message_id]['window_id'];

                    delete gpg_messages[message_id];

                    browserClient.close_opened_popup(window_id);
                    return originalSendResponse({
                        message: ciphertext.data,
                        receivers: receivers
                    });
                });
            }

            if (sign_message) {

                var onSuccess = function(data) {

                    options = {
                        data: message,
                        publicKeys: public_keys_array,
                        privateKeys: openpgp.key.readArmored(data['mail_gpg_own_key_private']).keys
                    };

                    finalise_encryption(options);
                };

                var onError = function() {

                };

                managerSecret.read_secret(private_key.secret_id, private_key.secret_key)
                    .then(onSuccess, onError);
            } else {
                options = {
                    data: message,
                    publicKeys: public_keys_array,
                };
                finalise_encryption(options);
            }
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#set_offline_cache_encryption_key
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered once the user goes into offline mode
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function set_offline_cache_encryption_key(request, sender, sendResponse) {
            var encryption_key = request.data.encryption_key;
            offlineCache.set_encryption_key(encryption_key);

        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#launch_web_auth_flow_in_background
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggers the web auth flow in the background of an extension
         * used in the firefox extension, as the panel collapses and wont allow the processing
         * of the rest of the authentication flow.
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function launch_web_auth_flow_in_background(request, sender, sendResponse) {
            browser.identity.launchWebAuthFlow({
                url: request.data.url,
                interactive: true
            }, function(response_url) {
                if (response_url.indexOf(browserClient.get_oidc_return_to_url()) !== -1) {
                    var oidc_token_id = response_url.replace(browserClient.get_oidc_return_to_url(), '');
                    browserClient.open_tab_bg('/data/index.html#!/oidc/token/' + oidc_token_id);
                } else {
                    var saml_token_id = response_url.replace(browserClient.get_saml_return_to_url(), '');
                    browserClient.open_tab_bg('/data/index.html#!/saml/token/' + saml_token_id);
                }
            })
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#login_form_submit
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Catches login form submits
         *
         * @param {object} request The message sent by the calling script.
         * @param {object} sender The sender of the message
         * @param {function} sendResponse Function to call (at most once) when you have a response.
         */
        function login_form_submit(request, sender, sendResponse) {
            last_login_credentials = request.data;
            last_login_credentials['url'] = sender.url;

            if (!managerDatastoreUser.is_logged_in()) {
                return;
            }

            var existing_passwords = search_website_passwords_by_urlfilter(sender.url, false);
            if (existing_passwords.length > 0) {
                return;
            }

            $translate([
                'NEW_PASSWORD_DETECTED',
                'DO_YOU_WANT_TO_SAVE_THIS_PASSWORD',
                'PSONO_WILL_STORE_THE_PASSWORD_ENCRYPTED',
                'YES',
                'NO'
            ]).then(function (translations) {

                browser.notifications.create('new-password-detected-' + cryptoLibrary.generate_uuid(), {
                    "type": 'basic',
                    "iconUrl": "img/icon-64.png",
                    "title": translations.NEW_PASSWORD_DETECTED,
                    "message": translations.DO_YOU_WANT_TO_SAVE_THIS_PASSWORD,
                    "contextMessage": translations.PSONO_WILL_STORE_THE_PASSWORD_ENCRYPTED,
                    "buttons": [{"title": translations.YES}, {"title": translations.NO}],
                    "eventTime": Date.now() + 4 * 1000
                })
            });
        }

        /**
         * Omnibox feauture
         */

        /**
         * @ngdoc
         * @name psonocli.managerBackground#search_datastore
         * @methodOf psonocli.managerBackground
         *
         * @description
         * searches the datastore for all entries that either match the searched text either with their urlfilter or name
         * and returns the found results
         *
         * @param {string} text The text to search
         *
         * @returns {Array} The entries found
         */
        function search_datastore(text) {

            var password_filter = helper.get_password_filter(text);
            var entries = [];
            var datastore_entry;
            var leafs = storage.where('datastore-password-leafs', password_filter);
            for (var i = 0; i < leafs.length; i++) {
                datastore_entry = leafs[i];
                entries.push({
                    content: datastore_entry.name + ' [Secret: ' + datastore_entry.key + ']',
                    description: datastore_entry.name
                });

                entry_extra_info[datastore_entry.key] = {type: datastore_entry.type}
            }

            return entries;
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_input_changed
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered once the input in the omnibox changes. Searches the datastore for the input and provides the
         * suggestions for the omnibox
         *
         * @param {string} text The text to search
         * @param {function} suggest The callback function to execute with the suggestions
         */
        function on_input_changed(text, suggest) {
            suggest(search_datastore(text));
        }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_input_entered
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered once someone selected a proposal in the omnibox and opens a new tab with either the selected website
         * or the datastore with a pre-filled search
         *
         * @param {string} text The text entered
         */
        function on_input_entered(text) {
            var to_open = '';

            try {
                to_open = text.split(/Secret: /).pop().split("]")[0];
            }
            catch(err) {
                return;
            }

            if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(to_open)) {
                browserClient.open_tab_bg('/data/open-secret.html#!/secret/' + entry_extra_info[to_open]['type'] + '/' + to_open);
            } else {
                browserClient.open_tab_bg('/data/index.html#!/datastore/search/' + encodeURIComponent(to_open));
            }
        }

        // var fp_nonces = {
        //     'b6251e77-ac4f-443b-b4d9-00771a38c0ec': 'OtherPassword'
        // };
        //
        // function get_redirect_url(details) {
        //     var find_me;
        //     for (var nonce in fp_nonces) {
        //         if (!fp_nonces.hasOwnProperty(nonce)) {
        //             continue;
        //         }
        //         find_me = 'psono-fp-' + nonce;
        //         if (details.url.indexOf(find_me) !== -1) {
        //             console.log("new_redirect_url_found");
        //             return details.url.replace(find_me, fp_nonces[nonce]);
        //         }
        //     }
        // }
        //
        // function get_new_request_body(request_body) {
        //     return {"formData":{"password":['OtherPassword'],"username":["UsernamePOST"]}}
        // }
        //
        // function on_before_request(details) {
        //     var return_value = {};
        //     if (details.tabId < 0 || details.url.startsWith('chrome-extension://')) {
        //         // request of an extension
        //         return return_value;
        //     }
        //     console.log("on_before_request:");
        //     var redirect_url = get_redirect_url(details);
        //     if (redirect_url) {
        //         return_value.redirectUrl = redirect_url;
        //     }
        //     var request_body = get_new_request_body(details.requestBody);
        //     if (request_body) {
        //         return_value.requestBody = request_body;
        //     }
        //     console.log(details);
        //     console.log(return_value);
        //     return return_value;
        // }
        //
        // function replace_in_request_headers(request_headers) {
        //     var find_me;
        //     for (var nonce in fp_nonces) {
        //         if (!fp_nonces.hasOwnProperty(nonce)) {
        //             continue;
        //         }
        //         find_me = 'psono-fp-' + nonce;
        //         for (var i = 0; i < request_headers.length; i++) {
        //
        //             if (request_headers[i].value.indexOf(find_me) !== -1) {
        //                 request_headers[i].value = request_headers[i].value.replace(find_me, fp_nonces[nonce]);
        //             }
        //         }
        //     }
        //     return request_headers;
        // }
        // function on_before_send_headers(details) {
        //     var return_value = {};
        //     if (details.tabId < 0) {
        //         // request of an extension
        //         return return_value;
        //     }
        //     console.log("on_before_send_headers:");
        //     var new_request_headers = replace_in_request_headers(details.requestHeaders);
        //     if (new_request_headers) {
        //         return_value.requestHeaders = new_request_headers;
        //     }
        //     console.log(details);
        //     console.log(return_value);
        //     return return_value;
        // }

        /**
         * @ngdoc
         * @name psonocli.managerBackground#on_auth_required
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Triggered once a website loads that requires authentication (e.g. basic auth)
         * More infos can be found here: https://developer.chrome.com/extensions/webRequest
         *
         * @param {object} details An object with the details of the request
         * @param {function} callbackFn The callback function to call once the secret has been returned
         */
        function on_auth_required(details, callbackFn) {
            var return_value = {};

            var entries = search_website_passwords_by_urlfilter(details.url, true);

            if (entries.length < 1) {
                callbackFn(return_value);
                return;
            }

            if (already_filled_max_allowed.hasOwnProperty(details.requestId) && already_filled_max_allowed[details.requestId] < 1) {
                callbackFn(return_value);
                return;
            }

            if (! already_filled_max_allowed.hasOwnProperty(details.requestId)) {
                already_filled_max_allowed[details.requestId] = Math.min(entries.length, 2);
            }

            already_filled_max_allowed[details.requestId]--;
            request_secret(entries[already_filled_max_allowed[details.requestId]]['secret_id'])
                .then(function(data){
                    return_value = {
                        authCredentials: {
                            username: data['website_password_username'],
                            password: data['website_password_password']
                        }
                    };
                    callbackFn(return_value);
                    return; // unnecessary but we leave it
                }, function(value) {
                    callbackFn(return_value);
                    return; // unnecessary but we leave it
                });
        }




        /**
         * @ngdoc
         * @name psonocli.managerBackground#save_last_login_credentials
         * @methodOf psonocli.managerBackground
         *
         * @description
         * Saves the last login credentials in the datastore
         *
         * @returns {promise} Returns a promise with the password
         */
        function save_last_login_credentials() {
            return managerDatastorePassword.save_password(
                last_login_credentials['url'],
                last_login_credentials['username'],
                last_login_credentials['password']
            )
        }

        return {};
    };

    var app = angular.module('psonocli');
    app.factory("managerBackground", ['$q', '$timeout', '$translate', 'managerBase', 'managerSecret', 'storage', 'managerDatastorePassword','managerDatastore',
        'managerDatastoreUser', 'helper', 'cryptoLibrary', 'apiClient', 'device', 'browser', 'chrome',
        'browserClient', 'settings', 'openpgp', 'offlineCache', managerBackground]);

}(angular));
