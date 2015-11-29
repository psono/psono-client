"use strict";

/*
 * Dummy context menu
 */
function onClick(info, tab) {
    console.log(JSON.stringify(info));
    console.log(JSON.stringify(tab));
}

var contexts = [
    "page"
];

for (var i = 0; i < contexts.length; i++) {
    var context = contexts[i];
    var title = "My menuitem";
    var id = chrome.contextMenus.create({"title": title, "contexts":[context], "onclick": onClick});
}


// Create a parent item and two children.
var parent = chrome.contextMenus.create({"title": "My parent"});
var child1 = chrome.contextMenus.create(
    {"title": "My child 1", "parentId": parent, "onclick": onClick});
var child2 = chrome.contextMenus.create(
    {"title": "My child 2", "parentId": parent, "onclick": onClick});

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
 * backups the data of fill password event
 *
 * @param data
 */
var fillpassword = [];
var onFillpassword = function (data) {
    fillpassword.push(data);
};
// End helper functions

// Actual messaging stuff
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    var url = sender.tab.url;
    var parsed_url = parse_url(url);

    // From content script with ready event
    if (sender.tab && request.event == "ready") {
        console.log("background script received    'ready'");

        for(var i = fillpassword.length - 1; i >= 0; i--) {
            if( endsWith(parsed_url.authority, fillpassword[i].authority)) {
                fillpassword[i].submit = parsed_url.scheme == 'https';
                sendResponse({event: "fillpassword", data: fillpassword[i]});
                fillpassword.splice(i, 1);
                break;
            }
        }
        return;
    }

    if (request.event == "fillpassword") {
        console.log("background script received    'fillpassword'");
        onFillpassword(request.data);
        return;
    }

    if (request.event == "logout") {
        console.log("background script received    'logout'");

        chrome.tabs.query({url: 'chrome-extension://'+chrome.runtime.id+'/*'}, function(tabs) {
            var tabids = [];
            for (var i = 0; i < tabs.length; i++) {
                tabids.push(tabs[i].id);
            }

            chrome.tabs.remove(tabids)
        });

        return;
    }


    if (request.event == "website-password-refresh") {
        console.log("background script received    'website-password-refresh'");

        var data = localStorage.getItem('password_manager_local_storage');
        var db = JSON.parse(data);
        var update = [];
        for (var i = 0; i < db.collections.length; i++) {
            if (db.collections[i].name !== 'datastore-password-leafs') {
                continue;
            }
            var leafs = db.collections[i].data;
            for (var ii = 0; ii < leafs.length; ii++) {
                if (endsWith(parsed_url.authority, leafs[ii].urlfilter)) {
                    update.push({
                        secret_id: leafs[ii].secret_id,
                        name: leafs[ii].name
                    })
                }
            }
            break;
        }

        sendResponse({event: "website-password-update", data: update});

        return;
    }

    console.log(sender.tab);
    console.log("background script received (uncaptured)    " + request.event);

});




