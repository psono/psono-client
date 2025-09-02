/**
 * The browser interface, responsible for the cross browser / platform compatibility.
 */
import DOMPurify from "dompurify";

const _ = require('lodash');

import helperService from "./helper";
import { getStore } from "./store";
import deviceService from "./device";
import notification from "./notification";

const theme = {
    "palette": {
        "background": {
            "default": "#0f1118",
            "paper": "#fff"
        },
        "primary": {
            "main": "#2dbb93"
        },
        "secondary": {
            "main": "#0b4a23"
        },
        "action": {
            "disabledBackground": "#2dbb9380"
        },
        "lightGreyText": {
            "main": "#b1b6c1",
            "light": "#b1b6c1",
            "dark": "#b1b6c1",
            "contrastText": "#b1b6c1"
        },
        "greyText": {
            "main": "#666",
            "light": "#666",
            "dark": "#666",
            "contrastText": "#666"
        },
        "checked": {
            "main": "#9c27b0",
            "light": "#9c27b0",
            "dark": "#9c27b0",
            "contrastText": "#9c27b0"
        },
        "blueBackground": {
            "main": "#151f2b",
            "light": "#151f2b",
            "dark": "#151f2b",
            "contrastText": "#151f2b"
        },
        "badgeBackground": {
            "main": "#777",
            "light": "#777",
            "dark": "#777",
            "contrastText": "#777"
        },
        "appBarText": {
            "main": "#777",
            "light": "#777",
            "dark": "#777",
            "contrastText": "#777"
        },
        "appBarReadOnlyText": {
            "main": "#777",
            "light": "#777",
            "dark": "#777",
            "contrastText": "#777"
        },
        "appBarReadOnlyBackground": {
            "main": "#fad8a6",
            "light": "#fad8a6",
            "dark": "#fad8a6",
            "contrastText": "#fad8a6"
        },
        "appBarBackground": {
            "main": "#fff",
            "light": "#fff",
            "dark": "#fff",
            "contrastText": "#fff"
        },
        "baseBackground": {
            "main": "#ebeeef",
            "light": "#ebeeef",
            "dark": "#ebeeef",
            "contrastText": "#ebeeef"
        },
        "lightBackground": {
            "main": "#fff",
            "light": "#fff",
            "dark": "#fff",
            "contrastText": "#fff"
        },
        "baseTitleBackground": {
            "main": "#f2f5f7",
            "light": "#f2f5f7",
            "dark": "#f2f5f7",
            "contrastText": "#f2f5f7"
        }
    },
    "typography": {
        "fontFamily": "\"Open Sans\", sans-serif",
        "fontSize": 13
    },
    "components": {
        "MuiTextField": {
            "defaultProps": {
                "margin": "dense",
                "size": "small"
            }
        },
        "MuiToolbar": {
            "styleOverrides": {
                "regular": {
                    "height": "48px",
                    "minHeight": "48px",
                    "@media(min-width:600px)": {
                        "minHeight": "48px"
                    }
                }
            }
        },
        "MUIDataTable": {
            "styleOverrides": {
                "paper": {
                    "boxShadow": "none"
                }
            }
        },
        "MuiButton": {
            "styleOverrides": {
                "containedPrimary": {
                    "color": "white"
                },
                "root": {
                    "color": "rgba(0, 0, 0, 0.87)"
                }
            }
        }
    }
}



/**
 * Registers a listener with browser.webRequest.onAuthRequired.addListener
 */
function getRemoteConfigJson() {
    return getStore().getState().persistent.remoteConfigJson;
}

/**
 * Registers a listener with browser.webRequest.onAuthRequired.addListener
 */
function registerAuthRequiredListener(callback) {
    if (TARGET === "firefox") {
        if (typeof browser.webRequest !== "undefined") {
            browser.webRequest.onAuthRequired.addListener(
                function (details) {
                    return new Promise(function (resolve, reject) {
                        return callback(details, resolve);
                    });
                },
                { urls: ["<all_urls>"] },
                ["blocking"]
            );
        }
    } else if (TARGET === "chrome") {
        if (typeof chrome.webRequest !== "undefined") {
            chrome.webRequest.onAuthRequired.addListener(callback, { urls: ["<all_urls>"] }, ["asyncBlocking"]);
        }
    } else {
        // else pass don't do anything
    }
}

/**
 * Returns the client type
 */
function getClientType(url) {
    if (TARGET === "firefox") {
        return "firefox_extension";
    } else if (TARGET === "chrome") {
        return "chrome_extension";
    } else if (TARGET === "electron") {
        return "electron";
    } else {
        return "webclient";
    }
}

/**
 * Opens the URL in a new browser tab
 *
 * @param {string} url The url to open
 */
function openTab(url) {
    return new Promise(function (resolve) {
        const new_window = window.open(url, "_blank");
        resolve(new_window);
    });
}

/**
 * cosntructs and returns the "return to" address for SAML
 *
 * @returns {string}
 */
function getSamlReturnToUrl() {
    if (TARGET === "firefox") {
        return 'https://psono.com/redirect#!/saml/token/'
        //return browser.identity.getRedirectURL() + "data/index.html#!/saml/token/";
    } else if (TARGET === "chrome") {
        return 'https://psono.com/redirect#!/saml/token/'
        //return chrome.identity.getRedirectURL() + "data/index.html#!/saml/token/";
    } else if (TARGET === "electron") {
        return 'https://psono.com/redirect#!/saml/token/'
    } else {
        return window.location.href.split("#")[0].split("/").slice(0, -1).join("/") + "/index.html#!/saml/token/";
    }
}

/**
 * cosntructs and returns the "return to" address for OIDC
 *
 * @returns {string}
 */
function getOidcReturnToUrl() {
    if (TARGET === "firefox") {
        return 'https://psono.com/redirect#!/oidc/token/'
        //return browser.identity.getRedirectURL() + "data/index.html#!/oidc/token/";
    } else if (TARGET === "chrome") {
        return 'https://psono.com/redirect#!/oidc/token/'
        //return chrome.identity.getRedirectURL() + "data/index.html#!/oidc/token/";
    } else if (TARGET === "electron") {
        return 'https://psono.com/redirect#!/oidc/token/'
    } else {
        return window.location.href.split("#")[0].split("/").slice(0, -1).join("/") + "/index.html#!/oidc/token/";
    }
}

/**
 * Launches the web authflow
 *
 * @param {string} url The url to open
 */
function launchWebAuthFlow(url) {
    if (TARGET === "firefox") {
        emitSec("launch-web-auth-flow-in-background", { url: url });
        return Promise.resolve();
    } else if (TARGET === "chrome") {
        emitSec("launch-web-auth-flow-in-background", { url: url });
        return Promise.resolve();
        // return new Promise(function (resolve, reject) {
        //     chrome.identity.launchWebAuthFlow(
        //         {
        //             url: url,
        //             interactive: true,
        //         },
        //         function (response_url) {
        //             if (response_url.indexOf(getOidcReturnToUrl()) !== -1) {
        //                 const oidc_token_id = response_url.replace(getOidcReturnToUrl(), "");
        //                 resolve(oidc_token_id);
        //             } else {
        //                 const saml_token_id = response_url.replace(getSamlReturnToUrl(), "");
        //                 resolve(saml_token_id);
        //             }
        //         }
        //     );
        // });
    } else {
        if (!DOMPurify.isValidAttribute('a', 'href', url)) {
            // sanitizes URL to avoid javascript: XSS
            url = 'about:blank'
        }
        window.location.href = url;
        return Promise.resolve();
    }
}

/**
 * Opens the URL in a new browser tab (from the background page)
 *
 * @param url
 * @param callback_function
 */
function openTabBg(url, callback_function) {
    if (TARGET === "firefox") {
        browser.tabs
            .create({
                url: url,
            })
            .then(function (tab) {
                if (!callback_function) {
                    return;
                }
                browser.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (info.status === "complete" && tabId === tab.id) {
                        browser.tabs.onUpdated.removeListener(listener);
                        callback_function(tab);
                    }
                });
            });
    } else if (TARGET === "chrome") {
        chrome.tabs.create(
            {
                url: url,
            },
            function (tab) {
                if (!callback_function) {
                    return;
                }
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (info.status === "complete" && tabId === tab.id) {
                        chrome.tabs.onUpdated.removeListener(listener);
                        callback_function(tab);
                    }
                });
            }
        );
    } else {
        // pass, websites have no background page
    }
}

/**
 * Replaces the URL of the current browser tab (from the background page)
 *
 * @param url
 * @param callback_function
 */
function replaceTabUrl(url, callback_function) {
    if (TARGET === "firefox") {
        browser.tabs
            .update({
                url: url,
            })
            .then(function (tab) {
                if (!callback_function) {
                    return;
                }
                browser.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (info.status === "complete" && tabId === tab.id) {
                        browser.tabs.onUpdated.removeListener(listener);
                        callback_function(tab);
                    }
                });
            });
    } else if (TARGET === "chrome") {
        chrome.tabs.update(
            {
                url: url,
            },
            function (tab) {
                if (!callback_function) {
                    return;
                }
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (info.status === "complete" && tabId === tab.id) {
                        chrome.tabs.onUpdated.removeListener(listener);
                        callback_function(tab);
                    }
                });
            }
        );
    } else {
        // pass, websites have no background page
    }
}

/**
 * Opens the URL in a popup
 *
 * @param url
 * @param callback_function
 */
function openPopup(url, callback_function) {
    if (TARGET === "firefox") {
        return browser.windows.create(
            {
                url: browser.runtime.getURL(url),
                type: "popup",
                width: 1000,
                height: 600,
            },
            callback_function
        );
    } else if (TARGET === "chrome") {
        chrome.windows.create(
            {
                url: url,
                type: "popup",
                width: 1000,
                height: 600,
            },
            callback_function
        );
    } else {
        const win = window.open(url, "_blank", "width=800,height=600");
        win.onload = function () {
            win.RunCallbackFunction = callback_function;
        };
    }
}

/**
 * Closes a popup
 *
 * @param window_id
 */
function closeOpenedPopup(window_id) {
    if (TARGET === "firefox") {
        return browser.windows.remove(window_id);
    } else if (TARGET === "chrome") {
        return chrome.windows.remove(window_id);
    } else {
        // pass
    }
}

/**
 * returns the base url which can be used to generate activation links
 *
 * @returns {Promise} The base url as string
 */
function getBaseUrl() {
    if (TARGET === "firefox") {
        return new Promise(function (resolve) {
            resolve("chrome-extension://" + chrome.runtime.id + "/data/");
        });
    } else if (TARGET === "chrome") {
        return new Promise(function (resolve) {
            resolve("chrome-extension://" + chrome.runtime.id + "/data/");
        });
    } else {
        const onSuccess = function (base_url) {
            return base_url;
        };
        const onError = function () {};

        return getConfig("base_url").then(onSuccess, onError);
    }
}



/**
 * returns a promise with the version string
 *
 * @returns {Promise} promise
 */
async function _loadVersion() {
    const response = await fetch("VERSION.txt");
    return await response.text();
}


let versionSingleton;

/**
 returns a promise with the version string
 * @returns {Promise}
 * @private
 */
function loadVersion() {
    if (!versionSingleton) {
        versionSingleton = _loadVersion();
    }
    return versionSingleton;
}


/**
 * returns a promise with the version string
 *
 * @returns {Promise} promise
 */
function _loadConfig() {
    return new Promise((resolve, reject) => {
        const remoteConfigJson = getRemoteConfigJson();

        const standardizeConfig = function (newConfig, url) {
            const parsed_url = helperService.parseUrl(url);

            if (!newConfig.hasOwnProperty("backend_servers")) {
                newConfig["backend_servers"] = [];
            }
            if (newConfig["backend_servers"].length === 0) {
                newConfig["backend_servers"].push({});
            }

            if (!newConfig.hasOwnProperty("theme")) {
                newConfig["theme"] = theme;
            } else {
                newConfig["theme"] = _.merge({}, theme, newConfig["theme"]);
            }

            if (!newConfig.hasOwnProperty("base_url")) {
                newConfig["base_url"] = parsed_url["base_url"] + "/";
            }

            if (newConfig.hasOwnProperty("backend_servers")) {
                for (let i = 0; i < newConfig["backend_servers"].length; i++) {
                    if (!newConfig["backend_servers"][i].hasOwnProperty("url")) {
                        newConfig["backend_servers"][i]["url"] = parsed_url["base_url"] + "/server";
                    }
                    if (!newConfig["backend_servers"][i].hasOwnProperty("domain")) {
                        newConfig["backend_servers"][i]["domain"] = helperService.getDomainWithoutWww(
                            newConfig["backend_servers"][i]["url"]
                        );
                    }
                }
            }

            if (!newConfig.hasOwnProperty("allow_registration")) {
                newConfig["allow_registration"] = true;
            }
            if (!newConfig.hasOwnProperty("allow_lost_password")) {
                newConfig["allow_lost_password"] = true;
            }
            if (!newConfig.hasOwnProperty("allow_delete_account")) {
                newConfig["allow_delete_account"] = true;
            }
            if (!newConfig.hasOwnProperty("authentication_methods")) {
                newConfig["authentication_methods"] = ["AUTHKEY", "LDAP", "SAML", "OIDC"];
            }
            if (!newConfig.hasOwnProperty("saml_provider")) {
                newConfig["saml_provider"] = [];
            }
            if (!newConfig.hasOwnProperty("oidc_provider")) {
                newConfig["oidc_provider"] = [];
            }
            if (!newConfig.hasOwnProperty("disable_download_bar")) {
                newConfig["disable_download_bar"] = false;
            }
            if (!newConfig.hasOwnProperty("allow_custom_server")) {
                newConfig["allow_custom_server"] = true;
            }
            if (!newConfig.hasOwnProperty("trust_device_default")) {
                newConfig["trust_device_default"] = false;
            }
            if (!newConfig.hasOwnProperty("remember_me_default")) {
                newConfig["remember_me_default"] = false;
            }
            if (!newConfig.hasOwnProperty("more_links")) {
                newConfig["more_links"] = [
                    {
                        href: "https://doc.psono.com/",
                        title: "DOCUMENTATION",
                        class: "fa-book",
                    },
                    {
                        href: "privacy-policy.html",
                        title: "PRIVACY_POLICY",
                        class: "fa-user-secret",
                    },
                    {
                        href: "https://www.psono.com",
                        title: "ABOUT_US",
                        class: "fa-info-circle",
                    },
                ];
            }
            if (!newConfig.hasOwnProperty("footer_links")) {
                newConfig["footer_links"] = [
                    // {
                    //     href: "privacy-policy.html",
                    //     title: "PRIVACY_POLICY",
                    // },
                    // {
                    //     href: "https://psono.com/legal-notice",
                    //     title: "LEGAL_NOTICE",
                    // },
                ];
            }
            return newConfig;
        };

        let onSuccess;
        if (TARGET === "firefox" || TARGET === "chrome") {
            onSuccess = function (origJsonConfig) {
                let newConfig = origJsonConfig.data;

                const onStorageRetrieve = function (storage_item) {
                    try {
                        newConfig = JSON.parse(storage_item.ConfigJson);
                    } catch (e) {
                        // pass
                    }
                    return resolve(standardizeConfig(newConfig, "https://www.psono.pw/"));
                };

                if (TARGET === "firefox") {
                    const storageItem = browser.storage.managed.get("ConfigJson");

                    storageItem.then(onStorageRetrieve, function (reason) {
                        return onStorageRetrieve();
                    });
                } else if (TARGET === "chrome") {
                    chrome.storage.managed.get("ConfigJson", onStorageRetrieve);
                }
            };
        } else if (TARGET === "electron") {
            onSuccess = async function (origJsonConfig) {
                let newConfig = origJsonConfig.data;
                const electronsConfigJson = await window.electronAPI.getConfigJson();
                if (electronsConfigJson) {
                    try {
                        newConfig = JSON.parse(electronsConfigJson);
                    } catch (e) {
                        // pass
                    }
                }
                return resolve(standardizeConfig(newConfig, "https://www.psono.pw/"));
            };
        } else {
            onSuccess = function (origJsonConfig) {
                const newConfig = origJsonConfig.data;
                return resolve(standardizeConfig(newConfig, window.location.href));
            };
        }

        if (remoteConfigJson === null) {
            fetch("config.json").then(async (response) => {

                let configJson;

                try {
                    configJson = await response.json();
                } catch (e) {
                    notification.errorSend("CONFIG_JSON_MALFORMED")
                    return onSuccess({ data: {}});
                }

                return onSuccess({ data: configJson });
            })
        } else {
            return onSuccess({ data: remoteConfigJson });
        }
    });
}

/**
 * returns a promise which will return the active tab
 *
 * @returns {Promise} promise
 */
function getActiveTab() {
    return new Promise((resolve, reject) => {
        if (TARGET === "firefox") {
            browser.tabs.query({ active: true, currentWindow: true }, function (arrayOfTabs) {
                resolve(arrayOfTabs[0]);
            });
        } else if (TARGET === "chrome") {
            chrome.tabs.query({ active: true, currentWindow: true }, function (arrayOfTabs) {
                resolve(arrayOfTabs[0]);
            });
        } else {
            resolve({
                id: 0,
                title: document.title,
                url: window.location.href,
            });
        }
    });
}

/**
 * returns a promise which will return the active tabs url
 *
 * @returns {Promise} promise
 */
function getActiveTabUrl() {
    return getActiveTab().then(function (tab) {
        return tab.url;
    });
}

/**
 * sends an event message to a specific tab
 *
 * @param {string} tabId The id of the tab
 * @param {string} event The event
 * @param {*} data The payload for the event
 * @param {function} [callbackFunction] Ann optional callback function
 */
function emitTab(tabId, event, data, callbackFunction) {
    if (TARGET === "firefox") {
        browser.tabs.sendMessage(tabId, { event: event, data: data }, callbackFunction);
    } else if (TARGET === "chrome") {
        chrome.tabs.sendMessage(tabId, { event: event, data: data }, callbackFunction);
    }
}

/**
 * Returns the absolute path for a given relative path
 *
 * @param {string} path The relative path
 *
 * @returns {string} The absolute path
 */
function getURL(path) {
    if (TARGET === "firefox") {
        return browser.runtime.getURL(path);
    } else if (TARGET === "chrome") {
        return chrome.runtime.getURL(path);
    }
}

/**
 * sends an event message to browser
 *
 * @param {string} event The event
 * @param {*} data The payload for the event
 */
function emit(event, data) {
    if (TARGET === "firefox") {
        browser.runtime.sendMessage({ event: event, data: data }, function (response) {
            //console.log(response);
        });
    } else if (TARGET === "chrome") {
        chrome.runtime.sendMessage({ event: event, data: data }, function (response) {
            //console.log(response);
        });
    }
}

/**
 * emits sensitive data only to secure locations
 *
 *
 * @param {string} event The event
 * @param {*} data The payload for the event
 * @param {function} fnc An optional callback function with the return value
 */
function emitSec(event, data, fnc) {
    if (TARGET === "firefox") {
        browser.runtime.sendMessage({ event: event, data: data }, fnc);
    } else if (TARGET === "chrome") {
        chrome.runtime.sendMessage({ event: event, data: data }, fnc);
    } else {
        // pass
    }
}


let configSingleton = {};

/**
 * Helper function that acts as a singleton to load the config only once.
 * @returns {Promise}
 * @private
 */
function loadConfig() {
    const remoteConfigWebClientUrl = getStore().getState().persistent.remoteConfigWebClientUrl || "";
    if (!configSingleton.hasOwnProperty(remoteConfigWebClientUrl) || !configSingleton[remoteConfigWebClientUrl]) {
        configSingleton[remoteConfigWebClientUrl] = _loadConfig();
    }
    return configSingleton[remoteConfigWebClientUrl];
}

/**
 * Loads the config (or only the part specified by the "key") fresh or from "cache"
 *
 * @param {string} [key] The config "key" one wants to have
 *
 * @returns {Promise} A promise with the config value
 */
async function getConfig(key) {
    const config = await loadConfig();
    if (typeof key === "undefined") {
        return config;
    }
    if (config.hasOwnProperty(key)) {
        return config[key];
    }

    return null;
}

/**
 * Clears the config cache
 */
function clearConfigCache() {
    configSingleton = {};
}

/**
 * Closes the popup
 */
function closePopup() {
    if (TARGET === "firefox") {
        window.close();
    } else if (TARGET === "chrome") {
        // will be automatically closed
        //window.close();
    } else {
        // pass
    }
}

/**
 * Returns whether password savings is controlled (or controllable) by this extension
 *
 * @returns {Promise} A promise with the success or failure
 */
function passwordSavingControlledByThisExtension(value) {

    if (TARGET === "firefox") {
        return new Promise(function (resolve, reject) {
            const getting = browser.privacy.services.passwordSavingEnabled.get({});
            getting.then(function (details) {
                if (
                    details.levelOfControl === "controlled_by_this_extension" ||
                    details.levelOfControl === "controllable_by_this_extension"
                ) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    } else if (TARGET === "chrome") {
        return new Promise(function (resolve, reject) {
            chrome.privacy.services.passwordSavingEnabled.get({}, function (details) {
                if (
                    details.levelOfControl === "controlled_by_this_extension" ||
                    details.levelOfControl === "controllable_by_this_extension"
                ) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    } else {
        return Promise.resolve(false);
    }
}

/**
 * Disables the password saving function in the browser
 *
 * @returns {Promise} A promise with the success or failure state
 */
function disableBrowserPasswordSaving(value) {
    return passwordSavingControlledByThisExtension().then(function (isControllable) {
        if (!isControllable) {
            return false;
        }

        let oldPMValue = getStore().getState().client.disableBrowserPm;
        value = value !== undefined ? value : oldPMValue;
        if (TARGET === "firefox") {
            function onSet(result) {
                if (result) {
                    return true;
                } else {
                    console.log("Sadness!", result);
                    return false;
                }
            }
            const setting = browser.privacy.services.passwordSavingEnabled.set({
                value: !value,
            });
            setting.then(onSet);
        } else if (TARGET === "chrome") {
            chrome.privacy.services.passwordSavingEnabled.set({ value: !value }, function () {
                if (chrome.runtime.lastError !== undefined) {
                    console.log("Sadness!", chrome.runtime.lastError);
                    return false;
                }
                return true;
            });
        }
    })
}

/**
 * Writes some content to the clipboard
 *
 * @param {function} fetchContent The content to copy
 */
function writeToClipboard(fetchContent) {

    if (deviceService.isSafari()) {
        // Safari
        return navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": fetchContent(),
            }),
        ]);
    } else {
        // Firefox & Chrome and everything else
        return fetchContent().then((content) => {
            try {
                return navigator.clipboard.writeText(content);
            } catch (error) {
                console.log(error);
            }
        })
    }
}

/**
 * Copies some content to the clipboard and clears it after a certain time
 *
 * @param {function} fetchContent The content to copy
 */
function copyToClipboard(fetchContent) {
    const clipboardClearDelay = getStore().getState().settingsDatastore.clipboardClearDelay;
    if (clipboardClearDelay) {
        if (TARGET === "chrome" || TARGET === "firefox") {
            emitSec("clear-clipboard", {
                delay: clipboardClearDelay,
            });
        } else {
            writeToClipboard(function () {
                return new Promise(function(resolve, reject) {
                    setTimeout(function () {
                        resolve("")
                    }, clipboardClearDelay*1000);
                });
            })
        }
    }
    return writeToClipboard(fetchContent)
}

/**
 * Initialize extension page message listener for clipboard clearing
 */
function initExtensionPageClipboardListener() {
    if (TARGET === "chrome" || TARGET === "firefox") {
        const messageListener = function(request, sender, sendResponse) {
            if (request.event === "clear-clipboard-content-script") {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText("");
                }
            }
        };
        
        if (TARGET === "chrome") {
            chrome.runtime.onMessage.addListener(messageListener);
        } else if (TARGET === "firefox") {
            browser.runtime.onMessage.addListener(messageListener);
        }
    }
}

// Initialize the extension page listener
initExtensionPageClipboardListener();

/**
 * Create a notification
 *
 * @param {string} content The notification content
 */
function notify(content) {
    if (TARGET === "firefox") {
        browser.notifications.create("", {
            type: "basic",
            title: content,
            message: "",
            iconUrl: "/data/img/icon-32.png",
        });
    } else if (TARGET === "chrome") {
        chrome.notifications.getPermissionLevel(function (permissionLevel) {
            if (permissionLevel === "denied") {
                console.warn("Notification are denied");
                return;
            }

            chrome.notifications.create(undefined, {
                type: "basic",
                title: content,
                message: "",
                iconUrl: "/data/img/icon-32.png",
            });
        });
    } else if (TARGET === "electron") {
        new Notification(content, {
            silent: true,
        })
    } else {
        const options = { silent: true };
        function sendNotification() {
            return new Notification(content, options);
        }

        if (!("Notification" in window)) {
            console.error("This browser does not support desktop notification");
            return;
        }

        if (Notification.permission === "denied") {
            console.warn("Notification are denied");
            return;
        }

        if (Notification.permission === "granted") {
            return new Notification(content, options);
        }

        if (Notification.permission !== "denied") {
            try {
                Notification.requestPermission().then(function (permission) {
                    if (permission === "granted") {
                        return sendNotification();
                    }
                });
            } catch (error) {
                // Safari doesn't return a promise for requestPermissions and it
                // throws a TypeError. It takes a callback as the first argument
                // instead.
                if (error instanceof TypeError) {
                    Notification.requestPermission(() => {
                        sendNotification();
                    });
                } else {
                    throw error;
                }
            }
        }
    }
}

/**
 * Sets an icon
 *
 * @param {object} text The text to overlay
 */
function setBadgeText(text) {
    if (TARGET === "firefox") {
        chrome.browserAction.setBadgeBackgroundColor({color: "#666"});
        chrome.browserAction.setBadgeText({text: text});
    } else if (TARGET === "chrome") {
        chrome.action.setBadgeBackgroundColor({color: "#666"});
        chrome.action.setBadgeText({text: text});
    } else {
        //pass, no badge text for the regular webclient
    }
}

/**
 * Sets an icon
 *
 * @param {object} icon The icon to set
 */
function setIcon(icon) {
    if (TARGET === "firefox") {
        chrome.browserAction.setIcon(icon)
    } else if (TARGET === "chrome") {
        chrome.action.setIcon(icon)
    } else {
        //pass, no icon for the regular webclient
    }
}

const browserClientService = {
    registerAuthRequiredListener: registerAuthRequiredListener,
    getClientType: getClientType,
    openTab: openTab,
    getSamlReturnToUrl: getSamlReturnToUrl,
    getOidcReturnToUrl: getOidcReturnToUrl,
    launchWebAuthFlow: launchWebAuthFlow,
    openTabBg: openTabBg,
    replaceTabUrl: replaceTabUrl,
    openPopup: openPopup,
    closeOpenedPopup: closeOpenedPopup,
    clearConfigCache: clearConfigCache,
    closePopup: closePopup,
    getBaseUrl: getBaseUrl,
    loadVersion: loadVersion,
    getActiveTab: getActiveTab,
    getActiveTabUrl: getActiveTabUrl,
    emit: emit,
    emitTab: emitTab,
    getURL: getURL,
    emitSec: emitSec,
    getConfig: getConfig,
    passwordSavingControlledByThisExtension: passwordSavingControlledByThisExtension,
    disableBrowserPasswordSaving: disableBrowserPasswordSaving,
    copyToClipboard: copyToClipboard,
    writeToClipboard: writeToClipboard,
    notify: notify,
    setIcon: setIcon,
    setBadgeText: setBadgeText,
};

export default browserClientService;
