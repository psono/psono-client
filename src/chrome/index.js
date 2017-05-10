"use strict";

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
    return to_test.indexOf(suffix, to_test.length - suffix.length) !== -1;
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
    for (var i = 0; i < db.collections.length; i++) {
        if (db.collections[i].name !== collection) {
            continue;
        }

        return db.collections[i].data;
    }
}

var activeTabId;
chrome.tabs.onActivated.addListener(function(activeInfo) {
    activeTabId = activeInfo.tabId;
});


var fillpassword = [];

// End helper functions

// Actual messaging stuff
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    /**
     * we received a ready event from a content script that finished loading
     * lets provide the possible passwords
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
     */
    var on_fillpassword = function(request, sender, sendResponse) {
        fillpassword.push(request.data);
    };

    /**
     * we received a fillpassword active tab event
     * lets send a fillpassword event to the to the active tab
     */
    var on_fillpassword_active_tab = function(request, sender, sendResponse) {
        chrome.tabs.sendMessage(activeTabId, {event: "fillpassword", data: request.data}, function(response) {
            // pass
        });
    };

    /**
     * we received a logout event
     * lets close all extension tabs
     */
    var on_logout = function(request, sender, sendResponse) {
        chrome.tabs.query({url: 'chrome-extension://'+chrome.runtime.id+'/*'}, function(tabs) {
            var tabids = [];
            for (var i = 0; i < tabs.length; i++) {
                tabids.push(tabs[i].id);
            }

            chrome.tabs.remove(tabids)
        });
    };

    /**
     * a page finished loading, and wants to know if we have passwords for this page to display to the customer
     * in the input popup menu
     */
    var on_website_password_refresh = function(request, sender, sendResponse) {
        if (sender.tab) {
            var url = sender.tab.url;
            var parsed_url = parse_url(url);

            var update = [];

            var leafs = searchLocalStorage('password_manager_local_storage', 'datastore-password-leafs');

            for (var ii = 0; ii < leafs.length; ii++) {
                if (endsWith(parsed_url.authority, leafs[ii].urlfilter)) {
                    update.push({
                        secret_id: leafs[ii].secret_id,
                        name: leafs[ii].name
                    })
                }
            }

            sendResponse({event: "website-password-update", data: update});
        }
    };

    /**
     * some content script requested a secret
     * lets search in our localstorage for the config and the secret_key of the requested secret
     * lets request the content of the secret from our backend server
     *
     * @returns {boolean}
     */
    var on_request_secret = function(request, sender, sendResponse) {
        var _config = searchLocalStorage('password_manager_local_storage', 'config');

        var config = {};
        for (var ii = 0; ii < _config.length; ii++) {
            config[_config[ii].key] = _config[ii].value;
        }

        var client = new ClassClient(config.server.url, require, jQuery, sha512);

        client.read_secret(config.user_token, request.data.secret_id)
            .done(function(value) {
                // successful

                var leafs = searchLocalStorage('password_manager_local_storage', 'datastore-password-leafs');

                var secret_key = '';
                for (var ii = 0; ii < leafs.length; ii++) {
                    if (leafs[ii].key === request.data.secret_id) {
                        secret_key = leafs[ii].value;
                    }
                }

                value = JSON.parse(value);
                var plaintext_json = client.decrypt_data(
                    value.data,
                    value.data_nonce,
                    secret_key
                );

                sendResponse({event: "return-secret", data: JSON.parse(plaintext_json)});
            })
            .fail(function(value) {
                // failed
                sendResponse({event: "return-secret", data: 'fail'});
            });

        return true; // return true because of async response
    };

    /**
     * copies to the clipboard
     * lets create and element, put the content there, and call the normal execCommand('copy') function
     */
    var on_copy_to_clipboard = function(request, sender, sendResponse) {
        var copyFrom = document.createElement("textarea");
        copyFrom.textContent = request.data.text;
        var body = document.getElementsByTagName('body')[0];
        body.appendChild(copyFrom);
        copyFrom.select();
        document.execCommand('copy');
        body.removeChild(copyFrom);
    };

    var event_functions = {
        'fillpassword': on_fillpassword,
        'ready': on_ready,
        'fillpassword-active-tab': on_fillpassword_active_tab,
        'logout': on_logout,
        'website-password-refresh': on_website_password_refresh,
        'request-secret': on_request_secret,
        'copy-to-clipboard': on_copy_to_clipboard
    };


    if (event_functions.hasOwnProperty(request.event)){
        return event_functions[request.event](request, sender, sendResponse);
    } else {
        // not catchable event
        console.log(sender.tab);
        console.log("background script received (uncaptured)    " + request.event);
    }

});




