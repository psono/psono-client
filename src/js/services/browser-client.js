/**
 * The browser interface, responsible for the cross browser / platform compatibility.
 */

import axios from "axios";
import helperService from "./helper";
import store from "./store";
import deviceService from "./device";

const registrations = {};
let config = {};
const events = ["login", "logout"];

if (TARGET === "chrome") {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        for (let i = 0; registrations.hasOwnProperty(request.event) && i < registrations[request.event].length; i++) {
            registrations[request.event][i](request.data);
        }
    });
}

/**
 * Registers a listener with browser.webRequest.onAuthRequired.addListener
 */
function getRemoteConfigJson() {
    return store.getState().persistent.remoteConfigJson;
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
function loadVersion() {
    return axios({
        method: "get",
        url: "VERSION.txt",
    })
        .then((result) => {
            return result.data;
        })
        .catch((error) => {
            console.error(error);
        });
}

/**
 * returns a promise with the version string
 *
 * @returns {Promise} promise
 */
function loadConfig() {
    return new Promise((resolve, reject) => {
        const remoteConfigJson = getRemoteConfigJson();

        const standardizeConfig = function (newConfig, url) {
            const parsed_url = helperService.parseUrl(url);

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

            if (!newConfig.hasOwnProperty("authentication_methods")) {
                newConfig["authentication_methods"] = ["AUTHKEY", "LDAP", "SAML", "OIDC"];
            }
            if (!newConfig.hasOwnProperty("saml_provider")) {
                newConfig["saml_provider"] = [];
            }
            if (!newConfig.hasOwnProperty("disable_download_bar")) {
                newConfig["disable_download_bar"] = false;
            }
            if (!newConfig.hasOwnProperty("allow_custom_server")) {
                newConfig["allow_custom_server"] = true;
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
            return axios.get("config.json").then((response) => {
                onSuccess(response);
            });
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
 * Dummy function to see if the background page works
 */
function testBackgroundPage() {
    if (TARGET === "firefox" || TARGET === "chrome") {
        return backgroundPage.bg.test();
    } else {
        return false;
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
        //$rootScope.$broadcast(event, "");
    } else if (TARGET === "chrome") {
        chrome.runtime.sendMessage({ event: event, data: data }, function (response) {
            //console.log(response);
        });
        //$rootScope.$broadcast(event, "");
    } else {
        //$rootScope.$broadcast(event, "");
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

/**
 * registers for an event with a function
 *
 * @param {string} event The event
 * @param {function} myFunction The callback function
 *
 * @returns {boolean} Returns if the registration was successful
 */
function on(event, myFunction) {
    if (TARGET === "firefox") {
        //$rootScope.$on(event, myFunction);

        if (!registrations.hasOwnProperty(event)) {
            registrations[event] = [];
        }
        registrations[event].push(myFunction);
    } else if (TARGET === "chrome") {
        //$rootScope.$on(event, myFunction);

        if (!registrations.hasOwnProperty(event)) {
            registrations[event] = [];
        }
        registrations[event].push(myFunction);
    } else {
        if (events.indexOf(event) === -1) return false;

        if (!registrations.hasOwnProperty(event)) {
            registrations[event] = [];
        }
        registrations[event].push(myFunction);
        return true;
    }
}

/**
 * helper function to return either the config itself or if key has been specified only the config part for the key
 *
 * @param {string} key The config "key" one wants to have
 * @returns {*} The config value
 * @private
 */
function _getConfig(key) {
    if (typeof key === "undefined") {
        return config;
    }
    if (config.hasOwnProperty(key)) {
        return config[key];
    }

    return null;
}

/**
 * Loads the config (or only the part specified by the "key") fresh or from "cache"
 *
 * @param {string} [key] The config "key" one wants to have
 *
 * @returns {Promise} A promise with the config value
 */
function getConfig(key) {
    return new Promise((resolve, reject) => {
        if (Object.keys(config).length === 0) {
            const onSuccess = function (new_config) {
                config = new_config;
                return resolve(_getConfig(key));
            };

            const onError = function (data) {
                reject(data);
            };

            loadConfig().then(onSuccess, onError);
        } else {
            return resolve(_getConfig(key));
        }
    });
}

/**
 * Clears the config cache
 */
function clearConfigCache() {
    config = {};
}

/**
 * Closes the popup
 */
function closePopup() {
    if (TARGET === "firefox") {
        window.close();
    } else if (TARGET === "chrome") {
        window.close();
    } else {
        // pass
    }
}

/**
 * Disables the password saving function in the browser
 *
 * @returns {Promise} A promise with the success or failure state
 */
function disableBrowserPasswordSaving(value) {
    let oldPMValue;
    if (TARGET === "firefox") {
        oldPMValue = store.getState().client.disableBrowserPm;
        value = value !== undefined ? value : oldPMValue;
        return new Promise(function (resolve, reject) {
            function onSet(result) {
                if (result) {
                    resolve("Hooray, it worked!");
                } else {
                    reject("Sadness!");
                }
            }

            const getting = browser.privacy.services.passwordSavingEnabled.get({});
            getting.then(function (details) {
                if (
                    details.levelOfControl === "controlled_by_this_extension" ||
                    details.levelOfControl === "controllable_by_this_extension"
                ) {
                    const setting = browser.privacy.services.passwordSavingEnabled.set({
                        value: !value,
                    });
                    setting.then(onSet);
                } else {
                    reject("Sadness!");
                }
            });
        });
    } else if (TARGET === "chrome") {
        oldPMValue = store.getState().client.disableBrowserPm;
        value = value !== undefined ? value : oldPMValue;
        return new Promise(function (resolve, reject) {
            chrome.privacy.services.passwordSavingEnabled.get({}, function (details) {
                if (
                    details.levelOfControl === "controlled_by_this_extension" ||
                    details.levelOfControl === "controllable_by_this_extension"
                ) {
                    chrome.privacy.services.passwordSavingEnabled.set({ value: !value }, function () {
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
    } else {
        return Promise.resolve("nothing done");
    }
}

/**
 * Copies some content to the clipboard
 *
 * @param {function} fetchContent The content to copy
 */
function copyToClipboard(fetchContent) {

    if (deviceService.isSafari()) {
        // Safari
        return navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": fetchContent(),
            }),
        ]);
    } else {
        // Firefox & Chrome and everything else
        return fetchContent().then((content) => navigator.clipboard.writeText(content))
    }
    // let copy;
    // if (TARGET === "firefox") {
    //     copy = function (e) {
    //         e.preventDefault();
    //         if (e.clipboardData) {
    //             e.clipboardData.setData("text/plain", content);
    //         } else if (window.clipboardData) {
    //             window.clipboardData.setData("Text", content);
    //         }
    //     };
    //     document.addEventListener("copy", copy);
    //     document.execCommand("copy");
    //     document.removeEventListener("copy", copy);
    // } else if (TARGET === "chrome") {
    //     copy = function (e) {
    //         e.preventDefault();
    //         if (e.clipboardData) {
    //             e.clipboardData.setData("text/plain", content);
    //         } else if (window.clipboardData) {
    //             window.clipboardData.setData("Text", content);
    //         }
    //     };
    //     document.addEventListener("copy", copy);
    //     document.execCommand("copy");
    //     document.removeEventListener("copy", copy);
    // } else {
    //     navigator.clipboard.writeText(content);
    //     // let input = document.createElement("input");
    //     // input.type = 'text';
    //     // input.value = content;
    //     // document.body.appendChild(input);
    //     // input.select();
    //     // document.execCommand("Copy");
    //     // document.body.removeChild(input);
    // }
}

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
            iconUrl: "img/icon-32.png",
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
                iconUrl: "img/icon-32.png",
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
 * Asks the background page for the offline cache encryption key
 *
 * @param {function} fnc The callback function
 */
function getOfflineCacheEncryptionKey(fnc) {
    if (TARGET === "firefox") {
        browser.runtime.getBackgroundPage().then(function (bg) {
            fnc(bg.psono_offline_cache_encryption_key);
        });
    } else if (TARGET === "chrome") {
        chrome.runtime.getBackgroundPage(function (bg) {
            fnc(bg.psono_offline_cache_encryption_key);
        });
    } else {
        //pass, no background page on the website
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
    loadConfig: loadConfig,
    getActiveTab: getActiveTab,
    getActiveTabUrl: getActiveTabUrl,
    testBackgroundPage: testBackgroundPage,
    emit: emit,
    emitSec: emitSec,
    on: on,
    getConfig: getConfig,
    disableBrowserPasswordSaving: disableBrowserPasswordSaving,
    copyToClipboard: copyToClipboard,
    notify: notify,
    getOfflineCacheEncryptionKey: getOfflineCacheEncryptionKey,
};

export default browserClientService;
