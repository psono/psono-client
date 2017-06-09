var ClassWorkerBackgroundScript = function (chrome, browser) {
    "use strict";

    var activeTabId;
    var hits_additional_info = {};
    var fillpassword = [];
    var already_filled = {};

    activate();

    function activate() {

        chrome.tabs.onActivated.addListener(function(activeInfo) {
            activeTabId = activeInfo.tabId;
        });

        chrome.omnibox.onInputChanged.addListener(on_input_changed);
        chrome.omnibox.onInputEntered.addListener(on_input_entered);
        chrome.omnibox.setDefaultSuggestion({
            description: "Search datastore: <match>%s</match>"
        });
        console.log("sexy");
        browser.runtime.onMessage.addListener(on_message);
        browser.webRequest.onAuthRequired.addListener(on_auth_required, {urls: ["<all_urls>"]}, ["asyncBlocking"]);
        // browser.webRequest.onBeforeRequest.addListener(on_before_request, {urls: ["<all_urls>"]}, ["blocking", "requestBody"]);
        // browser.webRequest.onBeforeSendHeaders.addListener(on_before_send_headers, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

    }

    // /*
    //  * Dummy context menu
    //  */
    // function onClick(info, tab) {
    //     console.log(JSON.stringify(info));
    //     console.log(JSON.stringify(tab));
    // }
    //
    // var contexts = [
    //     "page"
    // ];
    //
    // for (var i = 0; i < contexts.length; i++) {
    //     var context = contexts[i];
    //     var title = "My menuitem";
    //     var id = chrome.contextMenus.create({"title": title, "contexts":[context], "onclick": onClick});
    // }
    //
    //
    // // Create a parent item and two children.
    // var parent = chrome.contextMenus.create({"title": "My parent"});
    // var child1 = chrome.contextMenus.create(
    //     {"title": "My child 1", "parentId": parent, "onclick": onClick});
    // var child2 = chrome.contextMenus.create(
    //     {"title": "My child 2", "parentId": parent, "onclick": onClick});

    /*
     * Some messaging stuff
     */

    // Start helper functions

    /**
     * parse an url and returns a structured object
     *
     * @param url
     * @returns {{scheme: *, authority: *, path: *, query: *, fragment: *}}
     */
    function parse_url(url) {
        // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
        var pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        var matches =  url.match(pattern);

        return {
            scheme: matches[2],
            authority: matches[4].replace(/^(www\.)/,""), //remove leading www.
            path: matches[5],
            query: matches[7],
            fragment: matches[9]
        };
    }

    /**
     * checks if a string ends with a special suffix
     *
     * @param to_test
     * @param suffix
     * @returns {boolean}
     */
    function endsWith (to_test, suffix) {
        return suffix !== "" && to_test.indexOf(suffix, to_test.length - suffix.length) !== -1;
    }

    /**
     * search the loki structured localStorage
     *
     * @param storage
     * @param collection
     * @returns {*}
     */
    function searchLocalStorage(storage, collection) {

        var data = localStorage.getItem(storage);
        var db = JSON.parse(data);
        if (db === null) {
            return [];
        }
        for (var i = 0; i < db.collections.length; i++) {
            if (db.collections[i].name !== collection) {
                continue;
            }

            return db.collections[i].data;
        }
    }

    /**
     * Main function to deal with messages
     *
     * @param request
     * @param sender
     * @param sendResponse
     *
     * @returns {*}
     */
    function on_message(request, sender, sendResponse) {

        var event_functions = {
            'fillpassword': on_fillpassword,
            'ready': on_ready,
            'fillpassword-active-tab': on_fillpassword_active_tab,
            'login': on_login,
            'logout': on_logout,
            'website-password-refresh': on_website_password_refresh,
            'request-secret': on_request_secret,
            'open-tab': on_open_tab
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
     * we received a ready event from a content script that finished loading
     * lets provide the possible passwords
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    var on_ready = function(request, sender, sendResponse) {
        if (sender.tab) {
            var url = sender.tab.url;
            var parsed_url = parse_url(url);

            for(var i = fillpassword.length - 1; i >= 0; i--) {
                if( endsWith(parsed_url.authority, fillpassword[i].authority)) {
                    fillpassword[i].submit = parsed_url.scheme === 'https';
                    sendResponse({event: "fillpassword", data: fillpassword[i]});
                    fillpassword.splice(i, 1);
                    break;
                }
            }
        }
    };

    /**
     * we received a fillpassword event
     * lets remember it
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function on_fillpassword(request, sender, sendResponse) {
        fillpassword.push(request.data);
    }

    /**
     * we received a fillpassword active tab event
     * lets send a fillpassword event to the to the active tab
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function on_fillpassword_active_tab (request, sender, sendResponse) {
        browser.tabs.sendMessage(activeTabId, {event: "fillpassword", data: request.data}, function(response) {
            // pass
        });
    }

    /**
     * we received a logout event
     * lets close all extension tabs
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function on_logout(request, sender, sendResponse) {
        chrome.tabs.query({url: 'chrome-extension://'+chrome.runtime.id+'/*'}, function(tabs) {
            var tabids = [];
            for (var i = 0; i < tabs.length; i++) {
                tabids.push(tabs[i].id);
            }

            chrome.tabs.remove(tabids)
        });
    }

    /**
     * we received a login event
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function on_login(request, sender, sendResponse) {
        // pass
    }

    /**
     * Returns all website passwords where the specified url matches the url filter
     *
     * @param {string} url The url to match
     *
     * @returns {Array} The database objects where the url filter match the url
     */
    function search_website_passwords_by_urlfilter(url) {
        var parsed_url = parse_url(url);
        var return_value = [];
        var leafs = searchLocalStorage('password_manager_local_storage', 'datastore-password-leafs');

        for (var ii = 0; ii < leafs.length; ii++) {
            if (leafs[ii].type !== 'website_password') {
                continue;
            }
            if (!endsWith(parsed_url.authority, leafs[ii].urlfilter)) {
                continue;
            }
            return_value.push(leafs[ii]);
        }

        return return_value;
    }

    /**
     * a page finished loading, and wants to know if we have passwords for this page to display to the customer
     * in the input popup menu
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function on_website_password_refresh(request, sender, sendResponse) {
        var update = [];
        var leafs;

        if (!sender.tab) {
            return;
        }

        leafs = search_website_passwords_by_urlfilter(sender.tab.url);

        for (var ii = 0; ii < leafs.length; ii++) {
            update.push({
                secret_id: leafs[ii].secret_id,
                name: leafs[ii].name
            });
        }

        sendResponse({event: "website-password-update", data: update});
    }

    /**
     * Reads the specified secret of the server, decrypts it and returns a promise
     *
     * @param secret_id
     *
     * @returns {promise} Returns a promise with the decrypted secret content
     */
    function request_secret(secret_id) {
        var _config = searchLocalStorage('password_manager_local_storage', 'config');

        if (_config.length === 0) {
            return jQuery.Deferred().reject();
        }

        var config = {};
        for (var ii = 0; ii < _config.length; ii++) {
            config[_config[ii].key] = _config[ii].value;
        }

        var client = new ClassClient(config.server.url, require, jQuery, sha512);

        return client.read_secret(config.user_token, secret_id).then(function(value) {
            // successful

            var leafs = searchLocalStorage('password_manager_local_storage', 'datastore-password-leafs');

            var secret_key = '';
            for (var ii = 0; ii < leafs.length; ii++) {
                if (leafs[ii].key === secret_id) {
                    secret_key = leafs[ii].value;
                }
            }

            value = JSON.parse(value);
            value = JSON.parse(client.decrypt_data(value.text, value.nonce, config.session_secret_key));


            var plaintext_json = client.decrypt_data(
                value.data,
                value.data_nonce,
                secret_key
            );
            return JSON.parse(plaintext_json);
        });

    }

    /**
     * some content script requested a secret
     * lets search in our localstorage for the config and the secret_key of the requested secret
     * lets request the content of the secret from our backend server
     *
     * @param request
     * @param sender
     * @param sendResponse
     *
     * @returns {boolean}
     */
    function on_request_secret(request, sender, sendResponse) {

        request_secret(request.data.secret_id)
            .done(function(data) {
                sendResponse({event: "return-secret", data: data});
            })
            .fail(function(value) {
                // failed
                sendResponse({event: "return-secret", data: 'fail'});
            });

        return true; // return true because of async response
    }

    /**
     * Opens a new tab
     *
     * @param request
     * @param sender
     * @param sendResponse
     */
    function on_open_tab(request, sender, sendResponse) {
        browser.tabs.create({
            url: request.data.url
        });
    }

    /**
     * Omnibox feauture
     */

    /**
     * searches the datastore for all entries that either match the searched text either with their urlfilter or name
     * and returns the found results
     *
     * @param text
     * @returns {Array}
     */
    function search_datastore(text) {

        var regex = new RegExp(text.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'i');
        var hits = [];
        var datastore_entry;

        var leafs = searchLocalStorage('password_manager_local_storage', 'datastore-password-leafs');

        for (var ii = 0; ii < leafs.length; ii++) {
            datastore_entry = leafs[ii];
            if (regex.test(datastore_entry.name) || regex.test(datastore_entry.urlfilter)) {
                hits.push({
                    content: datastore_entry.name + ' [Secret: ' + datastore_entry.secret_id + ']',
                    description: datastore_entry.name
                });

                hits_additional_info[datastore_entry.secret_id] = {type: datastore_entry.type}
            }
        }

        return hits;
    }

    /**
     * Triggered once the input in the omnibox changes. Searches the datastore for the input and provides the
     * suggestions for the omnibox
     *
     * @param text
     * @param suggest
     */
    function on_input_changed(text, suggest) {
        suggest(search_datastore(text));
    }

    /**
     * Triggered once someone selected a proposal in the omnibox and opens a new tab with either the selected website
     * or the datastore with a pre-filled search
     *
     * @param text
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
            chrome.tabs.create({
                url: '/data/open-secret.html#!/secret/' + hits_additional_info[to_open]['type'] + '/' + to_open
            });
        } else {
            chrome.tabs.create({
                url: '/data/index.html#!/datastore/search/' + encodeURIComponent(to_open)
            });
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
     * Triggered once a website loads that requires authentication (e.g. basic auth)
     *
     * @param {object} details
     * @param {function} callbackFn The callback function to call once the secret has been returned
     *
     * @returns {object}
     */
    function on_auth_required(details, callbackFn) {
        var return_value = {};
        var entries;
        entries = search_website_passwords_by_urlfilter(details.url);

        if (entries.length < 1) {
            return callbackFn(return_value);
        }

        if (already_filled.hasOwnProperty(details.requestId) && already_filled[details.requestId] > 0) {
            return callbackFn(return_value);
        }

        if (! already_filled.hasOwnProperty(details.requestId)) {
            already_filled[details.requestId] = Math.max(entries.length, 2);
        }

        already_filled[details.requestId]--;

        request_secret(entries[already_filled[details.requestId]]['secret_id'])
            .done(function(data){
                return_value = {
                    authCredentials: {
                        username: data['website_password_username'],
                        password: data['website_password_password']
                    }
                };
                return callbackFn(return_value);
            })
            .fail(function(value) {
                return callbackFn(return_value);
            });
    }
};