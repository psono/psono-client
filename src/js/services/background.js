/**
 * Service that handles the complete background process
 */
import browserClient from "./browser-client";
import browser from "./browser";
import i18n from "../i18n";
import store from "./store";
import datastorePasswordService from "./datastore-password";
import offlineCache from "./offline-cache";
import helper from "./helper";
import user from "./user";
import secretService from "./secret";
import cryptoLibrary from "./crypto-library";
import HKP from "@openpgp/hkp-client";
import * as openpgp from "openpgp";
import storage from "./storage";

let lastLoginCredentials;
let activeTabId;
let activeTabUrl;
const entryExtraInfo = {};
let fillpassword = [];
const alreadyFilledMaxAllowed = {};

const gpgMessages = {};

let numTabs;
let clearFillPasswordTimeout;

const CM_PSONO_ID = "psono-psono";
const CM_DATASTORE_ID = "psono-datastore";
const CM_AUTOFILL_CREDENTIAL_ID = "psono-autofill-credential";
const CM_AUTOFILL_CREDIT_CARD_ID = "psono-autofill-creditcard";
const CM_RECHECK_PAGE_ID = "psono-recheck-page";


function activate() {
    browserClient.disableBrowserPasswordSaving();

    if (typeof chrome.tabs !== "undefined") {
        chrome.tabs.onActivated.addListener(function (activeInfo) {
            activeTabId = activeInfo.tabId;
            chrome.tabs.get(activeInfo.tabId, function (tabInfo) {
                activeTabUrl = tabInfo.url;
                updateContextMenu();
            });
        });
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tabInfo) {
            if (changeInfo.status !== 'complete') {
                return;
            }
            activeTabUrl = tabInfo.url;
            updateContextMenu();
        });
    }

    if (typeof chrome.omnibox !== "undefined") {
        chrome.omnibox.onInputChanged.addListener(onInputChanged);
        chrome.omnibox.onInputEntered.addListener(onInputEntered);
        chrome.omnibox.setDefaultSuggestion({
            description: "Search datastore: <match>%s</match>",
        });
    }
    if (typeof browser.runtime.onMessage !== "undefined") {
        browser.runtime.onMessage.addListener(onMessage);
    }
    browserClient.registerAuthRequiredListener(onAuthRequired);
    // browser.webRequest.onBeforeRequest.addListener(on_before_request, {urls: ["<all_urls>"]}, ["blocking", "requestBody"]);
    // browser.webRequest.onBeforeSendHeaders.addListener(on_before_send_headers, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

    if (typeof browser.notifications !== "undefined") {
        browser.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
            if (notificationId.startsWith("new-password-detected-") && buttonIndex === 0) {
                saveLastLoginCredentials();
            }
            chrome.notifications.clear(notificationId);
        });
    }

    if (typeof browser.runtime.setUninstallURL !== "undefined") {
        // set url to open if someone uninstalls our extension
        browser.runtime.setUninstallURL("https://psono.com/uninstall-successfull/");
    }

    if (typeof browser.runtime.onInstalled !== "undefined") {
        // set url to open if someone installs our extension
        browser.runtime.onInstalled.addListener(function (details) {
            if (details.reason !== "install") {
                return;
            }

            browser.tabs.create({
                url: "/data/index.html",
            });
        });
    }

    if (typeof browser.tabs !== "undefined") {
        // count tabs to logout on browser close
        browser.tabs.query({ currentWindow: true }, function (tabs) {
            numTabs = tabs.length;
        });
        browser.tabs.onCreated.addListener(function (tab) {
            numTabs++;
        });
        browser.tabs.onRemoved.addListener(function (tabId) {
            numTabs--;
            if (numTabs === 0 && !store.getState().user.trustDevice) {
                user.logout();
            }
        });
    }

    // create the context menu once the translations are loaded
    i18n.on("loaded", function (loaded) {
        updateContextMenu();
    });


    if (chrome.contextMenus) {
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            switch (info.menuItemId) {
                case CM_DATASTORE_ID:
                    openDatastore()
                    break;
                case CM_RECHECK_PAGE_ID:
                    recheckPage()
                    break;
                default:
                    fillSecretTab(info.menuItemId, tab)

            }
        });
    }

    // set the correct icon on start
    if (user.isLoggedIn()) {
        browserClient.setIcon({
            path : "/data/img/icon-32.png"
        });
    } else {
        browserClient.setIcon({
            path : "/data/img/icon-32-disabled.png"
        });
    }
}



/**
 * Updates the context menu, usually called when the language changes or new tab loads or url changes.
 */
function updateContextMenu() {
    if (!chrome.contextMenus) {
        return;
    }
    chrome.contextMenus.removeAll(function() {
        const contextMenu = chrome.contextMenus.create({
            id: CM_PSONO_ID,
            title: "Psono",
        });
        chrome.contextMenus.create({
            id: CM_DATASTORE_ID,
            title: i18n.t("OPEN_DATASTORE"),
            contexts: ["all"],
            parentId: contextMenu,
        });
        const contextMenuChildAutofillCredential = chrome.contextMenus.create({
            id: CM_AUTOFILL_CREDENTIAL_ID,
            title: i18n.t("AUTOFILL_CREDENTIAL"),
            contexts: ["all"],
            visible: false,
            parentId: contextMenu,
        });
        const contextMenuChildAutofillCreditCard = chrome.contextMenus.create({
            id: CM_AUTOFILL_CREDIT_CARD_ID,
            title: i18n.t("AUTOFILL_CREDIT_CARD"),
            contexts: ["all"],
            visible: false,
            parentId: contextMenu,
        });
        chrome.contextMenus.create({
            id: CM_RECHECK_PAGE_ID,
            title: i18n.t("RECHECK_PAGE"),
            contexts: ["all"],
            parentId: contextMenu,
        });

        function addAutofillCredentials (leafs) {

            const entries = [];

            for (let ii = 0; ii < leafs.length; ii++) {
                entries.push({
                    secret_id: leafs[ii].secret_id,
                    name: leafs[ii].name,
                });
            }

            entries.sort(function(a, b){
                let a_name = a.name ? a.name : '';
                let b_name = b.name ? b.name : '';
                if (a_name.toLowerCase() < b_name.toLowerCase())
                    return -1;
                if (a_name.toLowerCase() > b_name.toLowerCase())
                    return 1;
                return 0;
            })

            entries.forEach(function(entry) {
                chrome.contextMenus.create({
                    id: entry.secret_id,
                    title: entry.name,
                    contexts: ["all"],
                    parentId: contextMenuChildAutofillCredential,
                });
            })

            if (entries.length > 0) {
                chrome.contextMenus.update(CM_AUTOFILL_CREDENTIAL_ID, {
                    visible: true,
                });
            }

        }

        function addAutofillCreditCards (leafs) {
            const entries = [];

            for (let ii = 0; ii < leafs.length; ii++) {
                entries.push({
                    secret_id: leafs[ii].secret_id,
                    name: leafs[ii].name,
                });
            }

            entries.sort(function(a, b){
                let a_name = a.name ? a.name : '';
                let b_name = b.name ? b.name : '';
                if (a_name.toLowerCase() < b_name.toLowerCase())
                    return -1;
                if (a_name.toLowerCase() > b_name.toLowerCase())
                    return 1;
                return 0;
            })

            entries.forEach(function(entry) {
                chrome.contextMenus.create({
                    id: entry.secret_id,
                    title: entry.name,
                    contexts: ["all"],
                    parentId: contextMenuChildAutofillCreditCard,
                });
            })

            if (entries.length > 0) {
                chrome.contextMenus.update(CM_AUTOFILL_CREDIT_CARD_ID, {
                    visible: true,
                });
            }

        }

        if (!activeTabUrl) {
            addAutofillCredentials([])
        } else {
            searchWebsitePasswordsByUrlfilter(activeTabUrl, false).then(addAutofillCredentials);
        }
        searchCreditCard().then(addAutofillCreditCards);
    })
}

/**
 * Opens the datastore whenever someone clicks in the context menu the open datastore
 *
 * @param info
 * @param tab
 */
function openDatastore(info, tab) {
    browser.tabs.create({
        url: "/data/index.html",
    });
}

/**
 * Triggers a check for all the forms
 *
 * @param info
 * @param tab
 */
function recheckPage(info, tab) {
    // TODO implement
}

/**
 * Trigger to fill a specific secret on a website
 *
 * @param secretId The secret id
 * @param tab The tab info
 */
function fillSecretTab(secretId, tab) {
    return storage.findKey("datastore-password-leafs", secretId).then(function (leaf) {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (content) {
            if (leaf.type === 'website_password') {
                chrome.tabs.sendMessage(tab.id, {
                    event: "fillpassword",
                    data: {
                        username: content.website_password_username,
                        password: content.website_password_password,
                        url_filter: content.website_password_url_filter,
                        auto_submit: content.website_password_auto_submit,
                    }
                });
            }
            if (leaf.type === 'credit_card') {
                console.log("chrome.tabs.sendMessage: fillcreditcard")
                chrome.tabs.sendMessage(tab.id, {
                    event: "fillcreditcard",
                    data: {
                        credit_card_number: content.credit_card_number,
                        credit_card_cvc: content.credit_card_cvc,
                        credit_card_name: content.credit_card_name,
                        credit_card_valid_through: content.credit_card_valid_through,
                    }
                });
            }
        };

        return secretService.readSecret(secretId, leaf.secret_key).then(onSuccess, onError);
    });

}

// Start helper functions

/**
 * Main function to deal with messages
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onMessage(request, sender, sendResponse) {
    const eventFunctions = {
        fillpassword: onFillpassword,
        ready: onReady,
        "fillpassword-active-tab": onFillpasswordActiveTab,
        "save-password-active-tab": savePasswordActiveTab,
        "bookmark-active-tab": bookmarkActiveTab,
        login: onLogin,
        logout: onLogout,
        "is-logged-in": onIsLoggedIn,
        "storage-reload": onStorageReload,
        "website-password-refresh": onWebsitePasswordRefresh,
        "request-secret": onRequestSecret,
        "open-tab": onOpenTab,
        "generate-password": onGeneratePassword,
        "login-form-submit": loginFormSubmit,
        "oidc-saml-redirect-detected": oidcSamlRedirectDetected,
        "decrypt-gpg": decryptPgp,
        "encrypt-gpg": encryptPgp,
        "read-gpg": readGpg,
        "write-gpg": writeGpg,
        "write-gpg-complete": writeGpgComplete,
        "secrets-changed": secretChanged,
        "set-offline-cache-encryption-key": setOfflineCacheEncryptionKey,
        "launch-web-auth-flow-in-background": launchWebAuthFlowInBackground,
        "language-changed": languageChanged,
        "get-offline-cache-encryption-key-offscreen": () => {}, // dummy as these are handled offscreen
        "set-offline-cache-encryption-key-offscreen": () => {}, // dummy as these are handled offscreen
    };

    if (eventFunctions.hasOwnProperty(request.event)) {
        return eventFunctions[request.event](request, sender, sendResponse);
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
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onReady(request, sender, sendResponse) {
    if (sender.tab) {
        const url = sender.tab.url;
        const parsedUrl = helper.parseUrl(url);
        let sentResponse = false;
        let found = false;

        for (let i = fillpassword.length - 1; i >= 0; i--) {

            if (fillpassword[i].url_filter) {
                const urlFilters = fillpassword[i].url_filter.split(/\s+|,|;/);
                for (let i = 0; i < urlFilters.length; i++) {
                    if (helper.isUrlFilterMatch(parsedUrl.authority, urlFilters[i])) {
                        fillpassword[i].submit = parsedUrl.scheme === "https";
                        sentResponse = true;
                        sendResponse({ event: "fillpassword", data: fillpassword[i] });
                        found = true;
                        break;
                    }
                }
            }
            if (found) {
                break;
            }
        }
        clearFillPasswordTimeout = setTimeout(function () {
            fillpassword = [];
        }, 3000);

        if (!sentResponse) {
            sendResponse({ event: "status", data: "ok" });
        }
    }
}

/**
 * we received a fillpassword event
 * lets remember it
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onFillpassword(request, sender, sendResponse) {
    clearTimeout(clearFillPasswordTimeout)
    fillpassword.push(request.data);
}

/**
 * we received a fillpassword active tab event
 * lets send a fillpassword event to the to the active tab
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onFillpasswordActiveTab(request, sender, sendResponse) {
    if (typeof activeTabId === "undefined") {
        return;
    }
    browser.tabs.sendMessage(activeTabId, { event: "fillpassword", data: request.data });
}

/**
 * we received a save-password-active-tab event
 * lets save the password for the current active tab
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function savePasswordActiveTab(request, sender, sendResponse) {
    if (typeof activeTabId === "undefined") {
        return;
    }
    chrome.tabs.sendMessage(activeTabId, { event: "get-username", data: {} }, function (response) {
        const onError = function (data) {
            console.log(data);
        };

        const onSuccess = function (datastore_object) {
            setTimeout(function () {
                chrome.tabs.sendMessage(activeTabId, { event: "secrets-changed", data: {} }, function (response) {
                    // don't do anything
                });
            }, 500); // delay 500 ms to give the storage a chance to be stored
            browserClient.openTabBg(
                "/data/index.html#!/datastore/edit/" + datastore_object.type + "/" + datastore_object.secret_id
            );
        };

        datastorePasswordService.savePasswordActiveTab(response.username, request.data.password).then(onSuccess, onError);
    });
}

/**
 * we received a bookmark-active-tab event
 * lets bookmark the current active tab
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function bookmarkActiveTab(request, sender, sendResponse) {
    if (typeof activeTabId === "undefined") {
        return;
    }

    const onError = function (data) {
        console.log(data);
    };

    const onSuccess = function (datastore_object) {
        setTimeout(function () {
            chrome.tabs.sendMessage(activeTabId, { event: "secrets-changed", data: {} }, function (response) {
                // don't do anything
            });
        }, 500); // delay 500 ms to give the storage a chance to be stored

        browserClient.openTabBg(
            "/data/index.html#!/datastore/edit/" + datastore_object.type + "/" + datastore_object.secret_id
        );
    };
    datastorePasswordService.bookmarkActiveTab().then(onSuccess, onError);
}

/**
 * we received a logout event
 * lets close all extension tabs
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onLogout(request, sender, sendResponse) {
    chrome.tabs.query({ url: "chrome-extension://" + chrome.runtime.id + "/*" }, function (tabs) {
        const tabids = [];

        if (typeof tabs !== "undefined") {
            for (let i = 0; i < tabs.length; i++) {
                tabids.push(tabs[i].id);
            }
        }

        chrome.tabs.remove(tabids);
    });
    browserClient.setIcon({
        path : "/data/img/icon-32-disabled.png"
    });
}

/**
 * check whether the user is logged in or not
 * 
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function
    onIsLoggedIn(request, sender, sendResponse) {
    sendResponse(store.getState().user.isLoggedIn);
}

/**
 * Reloads the storage
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onStorageReload(request, sender, sendResponse) {
    storage.reload();
}

/**
 * we received a login event
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onLogin(request, sender, sendResponse) {
    // pass
    browserClient.setIcon({
        path : "/data/img/icon-32.png"
    });
}

/**
 * Returns the function that returns whether a certain leaf entry should be considered a possible condidate
 * for a provided url
 *
 * @param {string} url The url to match
 * @param {boolean} onlyAutoSubmit Only entries with autosubmit
 *
 * @returns {(function(*): (boolean|*))|*}
 */
const getSearchWebsitePasswordsByUrlfilter = function (url, onlyAutoSubmit) {
    const parsedUrl = helper.parseUrl(url);

    const filter = function (leaf) {
        if (leaf.type !== "website_password") {
            return false;
        }

        if (typeof leaf.urlfilter === "undefined") {
            return false;
        }

        if (leaf.urlfilter) {
            const urlFilters = leaf.urlfilter.split(/\s+|,|;/);
            for (let i = 0; i < urlFilters.length; i++) {
                if (!helper.isUrlFilterMatch(parsedUrl.authority, urlFilters[i])) {
                    continue;
                }
                return !onlyAutoSubmit || (leaf.hasOwnProperty("autosubmit") && leaf["autosubmit"]);
            }
        }

        return false;
    };

    return filter;
};

/**
 * Returns all website passwords where the specified url matches the url filter
 *
 * @param {string} url The url to match
 * @param {boolean} onlyAutoSubmit Only entries with autosubmit
 *
 * @returns {Promise} The database objects where the url filter match the url
 */
function searchWebsitePasswordsByUrlfilter(url, onlyAutoSubmit) {
    const filter = getSearchWebsitePasswordsByUrlfilter(url, onlyAutoSubmit);

    return storage.where("datastore-password-leafs", filter);
}

/**
 * Returns all credit cards
 *
 * @returns {Promise} The database objects
 */
function searchCreditCard() {
    const filter = (leaf) => leaf.type === "credit_card";

    return storage.where("datastore-password-leafs", filter);
}

/**
 * a page finished loading, and wants to know if we have passwords for this page to display to the customer
 * in the input popup menu
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onWebsitePasswordRefresh(request, sender, sendResponse) {
    if (!sender.tab) {
        sendResponse({ event: "status", data: "ok" });
        return;
    }
    searchWebsitePasswordsByUrlfilter(sender.tab.url, false).then(function (leafs) {
        const update = [];

        for (let ii = 0; ii < leafs.length; ii++) {
            update.push({
                secret_id: leafs[ii].secret_id,
                name: leafs[ii].name,
            });
        }

        update.sort(function(a, b){
            let a_name = a.name ? a.name : '';
            let b_name = b.name ? b.name : '';
            if (a_name.toLowerCase() < b_name.toLowerCase())
                return -1;
            if (a_name.toLowerCase() > b_name.toLowerCase())
                return 1;
            return 0;
        })

        sendResponse({ event: "website-password-update", data: update });
    });

    return true; // Important, do not remove! Otherwise Async return wont work
}

/**
 * Reads the specified secret of the server, decrypts it and returns a promise
 *
 * @param {uuid} secretId The id of the secret
 *
 * @returns {promise} Returns a promise with the decrypted secret content
 */
function requestSecret(secretId) {
    return storage.findKey("datastore-password-leafs", secretId).then(function (leaf) {
        return secretService.readSecret(secretId, leaf.secret_key);
    });
}

/**
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
function onRequestSecret(request, sender, sendResponse) {
    requestSecret(request.data.secret_id).then(
        function (data) {
            sendResponse({ event: "return-secret", data: data });
        },
        function (value) {
            console.log(value);
            // failed
            sendResponse({ event: "return-secret", data: "fail" });
        }
    );

    return true; // Important, do not remove! Otherwise Async password fill will not work.
}

/**
 * Opens a new tab
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onOpenTab(request, sender, sendResponse) {
    browser.tabs.create({
        url: request.data.url,
    });
}

/**
 * Generates a password
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onGeneratePassword(request, sender, sendResponse) {
    let password = datastorePasswordService.generate();

    const onError = function (data) {
        console.log(data);
    };

    const onSuccess = function (datastore_object) {
        setTimeout(function () {
            chrome.tabs.sendMessage(activeTabId, { event: "secrets-changed", data: {} }, function (response) {
                // don't do anything
            });
        }, 500); // delay 500 ms to give the storage a chance to be stored
        browserClient.openTabBg(
            "/data/index.html#!/datastore/edit/" + datastore_object.type + "/" + datastore_object.secret_id
        );
    };

    datastorePasswordService.savePassword(request.data.url, request.data.username, password).then(onSuccess, onError);

    sendResponse({ event: "return-secret", data: {
            website_password_password: password
    }});
}

/**
 * Receives the messages with the parsed data once someone clicks on the green "DECRYPT" symbol in a mail
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function decryptPgp(request, sender, sendResponse) {
    const messageId = cryptoLibrary.generateUuid();
    gpgMessages[messageId] = {
        message: request.data.message,
        sender: request.data.sender,
    };

    // Delete the message after 60 minutes
    setTimeout(function () {
        delete gpgMessages[messageId];
    }, 60000);

    browserClient.openPopup("/data/popup_pgp.html#!/gpg/read/" + messageId);
}

/**
 * Receives a message from a content script to get some encrypted data back
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function encryptPgp(request, sender, sendResponse) {
    const messageId = cryptoLibrary.generateUuid();
    gpgMessages[messageId] = {
        receiver: request.data.receiver,
        sendResponse: sendResponse,
    };
    browserClient.openPopup("/data/popup_pgp.html#!/gpg/write/" + messageId, function (window) {
        gpgMessages[messageId]["window_id"] = window.id;
    });

    return true; // Important, do not remove! Otherwise Async return wont work
}

/**
 * Triggered upon the request of popup_pgp.html when it finished loading and wants to have the decrypted content
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function readGpg(request, sender, sendResponse) {
    const messageId = request.data;
    if (!gpgMessages.hasOwnProperty(messageId)) {
        return sendResponse({
            error: "Message not found",
        });
    }

    const pgpMessage = gpgMessages[messageId]["message"];
    const pgpSender = gpgMessages[messageId]["sender"];

    function decrypt(publicKey) {
        return datastorePasswordService.getAllOwnPgpKeys().then(async function (privateKeys) {
            const privateKeysArray = [];

            for (let i = 0; i < privateKeys.length; i++) {
                const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeys[i] });
                privateKeysArray.push(privateKey);
            }

            const message = await openpgp.readMessage({
                armoredMessage: pgpMessage, // parse armored message
            });

            let options;
            if (publicKey) {
                options = {
                    message: message, // parse armored message
                    verificationKeys: await openpgp.readKey({ armoredKey: publicKey }),
                    decryptionKeys: privateKeysArray,
                };
            } else {
                options = {
                    message: message, // parse armored message
                    decryptionKeys: privateKeysArray,
                };
            }

            openpgp.decrypt(options).then(
                function (plaintext) {
                    return sendResponse({
                        public_key: publicKey,
                        sender: pgpSender,
                        plaintext: plaintext,
                    });
                },
                function (error) {
                    console.log(error);
                    return sendResponse({
                        public_key: publicKey,
                        sender: pgpSender,
                        message: error.message,
                    });
                }
            );
        });
    }

    const gpgHkpSearch = store.getState().settingsDatastore.gpgHkpSearch;

    if (gpgHkpSearch && pgpSender && pgpSender.length) {
        const hkp = new HKP(store.getState().settingsDatastore.gpgHkpKeyServer);
        const options = {
            query: pgpSender,
        };
        hkp.lookup(options).then(
            function (public_key) {
                decrypt(public_key);
            },
            function (error) {
                console.log(error);
                console.log(error.message);
                decrypt();
            }
        );
    } else {
        decrypt();
    }

    return true; // Important, do not remove! Otherwise Async return wont work
}

/**
 * Triggered upon the request of popup_pgp.html when it finished loading and wants to have the receiver
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function writeGpg(request, sender, sendResponse) {
    const messageId = request.data;
    if (!gpgMessages.hasOwnProperty(messageId)) {
        return sendResponse({
            error: "Message not found",
        });
    }
    const pgp_receiver = gpgMessages[messageId]["receiver"];

    return sendResponse({
        receiver: pgp_receiver,
    });
}

/**
 * Triggered whenever a secret changed / updated
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function secretChanged(request, sender, sendResponse) {
    setTimeout(function () {
        let url_filter = "";
        const url_filter_fields = ["website_password_url_filter", "bookmark_url_filter"];
        for (let i = 0; i < url_filter_fields.length; i++) {
            if (request.data.hasOwnProperty(url_filter_fields[i])) {
                url_filter = request.data[url_filter_fields[i]];
                break;
            }
        }
        if (url_filter) {
            chrome.tabs.query({ url: "*://" + url_filter + "/*" }, function (tabs) {
                for (let i = 0; i < tabs.length; i++) {
                    chrome.tabs.sendMessage(tabs[i].id, { event: "secrets-changed", data: {} }, function (response) {
                        // don't do anything
                    });
                }
            });
            chrome.tabs.query({ url: "*://*." + url_filter + "/*" }, function (tabs) {
                for (let i = 0; i < tabs.length; i++) {
                    chrome.tabs.sendMessage(tabs[i].id, { event: "secrets-changed", data: {} }, function (response) {
                        // don't do anything
                    });
                }
            });
        }
    }, 300); // delay 300 ms to give the storage a chance to be stored
}

/**
 * Triggered from the encryption popup once a user clicks "encrypt". Contains the encrypted message and the
 * origininal messageId. Will close the corresponding window and return the message
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
async function writeGpgComplete(request, sender, sendResponse) {
    const messageId = request.data.message_id;
    const decryptedMessage = request.data.message;
    const receivers = request.data.receivers;
    const publicKeys = request.data.public_keys;
    const privateKey = request.data.private_key;
    const signMessage = request.data.sign_message;
    let options;

    if (!gpgMessages.hasOwnProperty(messageId)) {
        return sendResponse({
            error: "Message not found",
        });
    }

    const publicKeysArray = await Promise.all(publicKeys.map((armoredKey) => openpgp.readKey({ armoredKey })));

    function finaliseEncryption(options) {
        openpgp.encrypt(options).then(function (ciphertext) {
            const originalSendResponse = gpgMessages[messageId]["sendResponse"];
            const windowId = gpgMessages[messageId]["window_id"];

            delete gpgMessages[messageId];

            browserClient.closeOpenedPopup(windowId);
            return originalSendResponse({
                message: ciphertext,
                receivers: receivers,
            });
        });
    }

    if (signMessage) {
        const onSuccess = async function (data) {
            options = {
                message: await openpgp.createMessage({ text: decryptedMessage }),
                encryptionKeys: publicKeysArray,
                signingKeys: await openpgp.readPrivateKey({ armoredKey: data["mail_gpg_own_key_private"] }),
            };

            finaliseEncryption(options);
        };

        const onError = function () {};

        secretService.readSecret(privateKey.secret_id, privateKey.secret_key).then(onSuccess, onError);
    } else {
        options = {
            message: await openpgp.createMessage({ text: decryptedMessage }),
            encryptionKeys: publicKeysArray,
        };
        finaliseEncryption(options);
    }
}

/**
 * Triggered once the user goes into offline mode
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function setOfflineCacheEncryptionKey(request, sender, sendResponse) {
    const encryptionKey = request.data.encryption_key;
    offlineCache.setEncryptionKey(encryptionKey);
}

/**
 * Triggers the web auth flow in the background of an extension
 * used in the firefox extension, as the panel collapses and wont allow the processing
 * of the rest of the authentication flow.
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function launchWebAuthFlowInBackground(request, sender, sendResponse) {
    browserClient.openTabBg(request.data.url);
    // browser.identity.launchWebAuthFlow(
    //     {
    //         url: request.data.url,
    //         interactive: true,
    //     },
    //     function (response_url) {
    //         if (response_url.indexOf(browserClient.getOidcReturnToUrl()) !== -1) {
    //             const oidc_token_id = response_url.replace(browserClient.getOidcReturnToUrl(), "");
    //             browserClient.replaceTabUrl("/data/index.html#!/oidc/token/" + oidc_token_id);
    //         } else {
    //             const saml_token_id = response_url.replace(browserClient.getSamlReturnToUrl(), "");
    //             browserClient.replaceTabUrl("/data/index.html#!/saml/token/" + saml_token_id);
    //         }
    //     }
    // );
}

/**
 * Triggers when someone changes the language
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function languageChanged(request, sender, sendResponse) {
    i18n.changeLanguage(request.data).then(() => {
        updateContextMenu();
    });
}

/**
 * Catches login form submits
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function loginFormSubmit(request, sender, sendResponse) {
    lastLoginCredentials = request.data;
    lastLoginCredentials["url"] = sender.url;

    if (!user.isLoggedIn()) {
        return;
    }

    return searchWebsitePasswordsByUrlfilter(sender.url, false).then(function (existingPasswords) {
        if (existingPasswords.length > 0) {
            return;
        }

        browser.notifications.create("new-password-detected-" + cryptoLibrary.generateUuid(), {
            type: "basic",
            iconUrl: "img/icon-64.png",
            title: i18n.t("NEW_PASSWORD_DETECTED"),
            message: i18n.t("DO_YOU_WANT_TO_SAVE_THIS_PASSWORD"),
            contextMessage: i18n.t("PSONO_WILL_STORE_THE_PASSWORD_ENCRYPTED"),
            buttons: [{ title: i18n.t("YES") }, { title: i18n.t("NO") }],
            eventTime: Date.now() + 4 * 1000,
        });
    });
}

/**
 * Catches login form submits
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function oidcSamlRedirectDetected(request, sender, sendResponse) {
    if (request.data.url.indexOf("#") !== -1) {
        const split = request.data.url.split("#");
        browserClient.replaceTabUrl("/data/index.html#" + split[1]);
    }

}

/**
 * Omnibox feauture
 */

/**
 * searches the datastore for all entries that either match the searched text either with their urlfilter or name
 * and returns the found results
 *
 * @param {string} text The text to search
 *
 * @returns {Promise} The entries found
 */
function searchDatastore(text) {
    const password_filter = helper.getPasswordFilter(text);
    return storage.where("datastore-password-leafs", password_filter).then(function (leafs) {
        const entries = [];
        let datastore_entry;
        for (let i = 0; i < leafs.length; i++) {
            datastore_entry = leafs[i];
            entries.push({
                content: datastore_entry.name + " [Secret: " + datastore_entry.key + "]",
                description: datastore_entry.name,
            });

            entryExtraInfo[datastore_entry.key] = { type: datastore_entry.type };
        }

        return entries;
    });
}

/**
 * Triggered once the input in the omnibox changes. Searches the datastore for the input and provides the
 * suggestions for the omnibox
 *
 * @param {string} text The text to search
 * @param {function} suggest The callback function to execute with the suggestions
 */
function onInputChanged(text, suggest) {
    searchDatastore(text).then(suggest);
}

/**
 * Triggered once someone selected a proposal in the omnibox and opens a new tab with either the selected website
 * or the datastore with a pre-filled search
 *
 * @param {string} text The text entered
 */
function onInputEntered(text) {
    let toOpen = "";

    try {
        toOpen = text
            .split(/Secret: /)
            .pop()
            .split("]")[0];
    } catch (err) {
        return;
    }

    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(toOpen)) {
        browserClient.openTabBg("/data/open-secret.html#!/secret/" + entryExtraInfo[toOpen]["type"] + "/" + toOpen);
    } else {
        browserClient.openTabBg("/data/index.html#!/datastore/search/" + encodeURIComponent(toOpen));
    }
}

// const fp_nonces = {
//     'b6251e77-ac4f-443b-b4d9-00771a38c0ec': 'OtherPassword'
// };
//
// function get_redirect_url(details) {
//     let find_me;
//     for (let nonce in fp_nonces) {
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
//     let return_value = {};
//     if (details.tabId < 0 || details.url.startsWith('chrome-extension://')) {
//         // request of an extension
//         return return_value;
//     }
//     console.log("on_before_request:");
//     const redirect_url = get_redirect_url(details);
//     if (redirect_url) {
//         return_value.redirectUrl = redirect_url;
//     }
//     const request_body = get_new_request_body(details.requestBody);
//     if (request_body) {
//         return_value.requestBody = request_body;
//     }
//     console.log(details);
//     console.log(return_value);
//     return return_value;
// }
//
// function replace_in_request_headers(request_headers) {
//     let find_me;
//     for (let nonce in fp_nonces) {
//         if (!fp_nonces.hasOwnProperty(nonce)) {
//             continue;
//         }
//         find_me = 'psono-fp-' + nonce;
//         for (let i = 0; i < request_headers.length; i++) {
//
//             if (request_headers[i].value.indexOf(find_me) !== -1) {
//                 request_headers[i].value = request_headers[i].value.replace(find_me, fp_nonces[nonce]);
//             }
//         }
//     }
//     return request_headers;
// }
// function on_before_send_headers(details) {
//     const return_value = {};
//     if (details.tabId < 0) {
//         // request of an extension
//         return return_value;
//     }
//     console.log("on_before_send_headers:");
//     const new_request_headers = replace_in_request_headers(details.requestHeaders);
//     if (new_request_headers) {
//         return_value.requestHeaders = new_request_headers;
//     }
//     console.log(details);
//     console.log(return_value);
//     return return_value;
// }

/**
 * Triggered once a website loads that requires authentication (e.g. basic auth)
 * More infos can be found here: https://developer.chrome.com/extensions/webRequest
 *
 * @param {object} details An object with the details of the request
 * @param {function} callbackFn The callback function to call once the secret has been returned
 */
function onAuthRequired(details, callbackFn) {
    return searchWebsitePasswordsByUrlfilter(details.url, true).then(function (entries) {
        let returnValue = {};

        if (entries.length < 1) {
            callbackFn(returnValue);
            return;
        }

        if (
            alreadyFilledMaxAllowed.hasOwnProperty(details.requestId) &&
            alreadyFilledMaxAllowed[details.requestId] < 1
        ) {
            callbackFn(returnValue);
            return;
        }

        if (!alreadyFilledMaxAllowed.hasOwnProperty(details.requestId)) {
            alreadyFilledMaxAllowed[details.requestId] = Math.min(entries.length, 2);
        }

        alreadyFilledMaxAllowed[details.requestId]--;
        requestSecret(entries[alreadyFilledMaxAllowed[details.requestId]]["secret_id"]).then(
            function (data) {
                returnValue = {
                    authCredentials: {
                        username: data["website_password_username"],
                        password: data["website_password_password"],
                    },
                };
                callbackFn(returnValue);
                return; // unnecessary but we leave it
            },
            function (value) {
                callbackFn(returnValue);
                return; // unnecessary but we leave it
            }
        );
    });
}

/**
 * Saves the last login credentials in the datastore
 *
 * @returns {promise} Returns a promise with the password
 */
function saveLastLoginCredentials() {
    return datastorePasswordService.savePassword(
        lastLoginCredentials["url"],
        lastLoginCredentials["username"],
        lastLoginCredentials["password"]
    );
}

const backgroundService = {
    activate,
    getSearchWebsitePasswordsByUrlfilter,
};

export default backgroundService;
