/**
 * Service to handle the offline cache
 */

import cryptoLibrary from "./crypto-library";
import browserClient from "./browser-client";
import offscreenDocument from "./offscreen-document";
import storage from "./storage";
import action from "../actions/bound-action-creators";
import { getStore } from "./store";

let encryptionKey = "";
const onSetEncryptionKeyRegistrations = [];

activate();

function activate() {
    if (typeof window !== "undefined" && window.psono_offline_cache_encryption_key) {
        setEncryptionKey(window.psono_offline_cache_encryption_key);
    }
    offscreenDocument.getOfflineCacheEncryptionKey(function (newEncryptionKey) {
        setEncryptionKey(newEncryptionKey);
    });
}

/**
 * returns weather the cache is active or not
 *
 * @returns {boolean} promise
 */
function isActive() {
    const offline_mode = getStore().getState().client.offlineMode;

    if (offline_mode === null) {
        return false;
    }

    return offline_mode;
}

/**
 * returns weather the cache is encrypted or not
 *
 * @returns {boolean} promise
 */
function isEncrypted() {
    return getStore().getState().client.offlineCacheEncryptionKey !== null;
}

/**
 * returns the encryption key
 *
 * @returns {string} The hex representation of the encryption key
 */
function getEncryptionKey() {
    return encryptionKey;
}

/**
 * returns weather the store is locked or not
 *
 * @returns {boolean} locked status
 */
function isLocked() {
    return isEncrypted() && !encryptionKey;
}

/**
 * returns weather the store is locked or not
 *
 * @returns {boolean} locked status
 */
function unlock(password) {
    if (typeof password === "undefined") {
        password = "";
    }
    const encryptionKeyEncrypted = getStore().getState().client.offlineCacheEncryptionKey;
    const encryptionKeySalt = getStore().getState().client.offlineCacheEncryptionSalt;
    if (!encryptionKeyEncrypted || !encryptionKeySalt) {
        return true;
    }
    let newEncryptionKey;
    try {
        newEncryptionKey = cryptoLibrary.decryptSecret(
            encryptionKeyEncrypted.text,
            encryptionKeyEncrypted.nonce,
            password,
            encryptionKeySalt
        );
    } catch (e) {
        return false;
    }
    setEncryptionKey(newEncryptionKey);
    browserClient.emitSec("set-offline-cache-encryption-key", { encryption_key: newEncryptionKey });

    return true;
}

/**
 * Sets the encryption key
 *
 * @param {string} newEncryptionKey The new key
 */
function setEncryptionKey(newEncryptionKey) {
    if (typeof newEncryptionKey === "undefined") {
        return;
    }
    encryptionKey = newEncryptionKey;
    if (typeof window !== "undefined") {
        window.psono_offline_cache_encryption_key = newEncryptionKey;
    } else {
        // we are in a chrome extension in background service worker, so we store it in offscreen document
        offscreenDocument.setOfflineCacheEncryptionKey(newEncryptionKey);
    }
    for (let i = 0; i < onSetEncryptionKeyRegistrations.length; i++) {
        onSetEncryptionKeyRegistrations[i]();
    }
}

/**
 * Sets the encryption password
 *
 * @param {string} password The password
 */
function setEncryptionPassword(password) {
    const new_encryption_key = cryptoLibrary.generateSecretKey();
    setEncryptionKey(new_encryption_key);
    const offlineCacheEncryptionSalt = cryptoLibrary.generateSecretKey();
    const offlineCacheEncryptionKey = cryptoLibrary.encryptSecret(
        new_encryption_key,
        password,
        offlineCacheEncryptionSalt
    );
    action().setOfflineCacheEncryptionInfo(offlineCacheEncryptionKey, offlineCacheEncryptionSalt);
    browserClient.emitSec("set-offline-cache-encryption-key", { encryption_key: new_encryption_key });
}

/**
 * Sets the request data in cache
 *
 * @param {string} url the url of the request
 * @param {string} method the request method
 * @param {object} data the data
 *
 * @returns {Promise} promise
 */
function set(url, method, data) {
    if (method !== "GET" || !isActive()) {
        return;
    }

    let value = JSON.stringify(data);

    if (encryptionKey) {
        value = cryptoLibrary.encryptData(value, encryptionKey);
    }

    storage.upsert("offline-cache", { key: url.toLowerCase(), value: value });
}

/**
 * Returns the cached request
 *
 * @param {string} url the request url
 * @param {string} method the request method
 *
 * @returns {Promise} our original request
 */
function get(url, method) {
    if (!isActive()) {
        return Promise.resolve(null);
    }
    if (method !== "GET") {
        return Promise.resolve({
            data: {
                error: ["Leave the offline mode before creating / modifying any content."],
            },
        });
    }

    return storage.findKey("offline-cache", url.toLowerCase()).then((storageEntry) => {
        if (storageEntry === null) {
            return null;
        }

        let value = storageEntry.value;

        if (encryptionKey) {
            value = cryptoLibrary.decryptData(value.text, value.nonce, encryptionKey);
        }

        return JSON.parse(value);
    });
}

/**
 * Enables the offline cache
 */
function enable() {
    action().enableOfflineMode();
}

/**
 * Disables the offline cache
 */
function disable() {
    action().disableOfflineMode();
}

/**
 * Clears the cache
 */
function clear() {
    storage.removeAll("offline-cache");
    storage.save();
}

/**
 * Saves the cache
 *
 * @returns {Promise} promise
 */
function save() {
    // TODO
    storage.save();
}

/**
 * Registers for unlock events
 *
 * @param {function} fnc The callback function
 */
function onSetEncryptionKey(fnc) {
    onSetEncryptionKeyRegistrations.push(fnc);
}

const offlineCacheService = {
    isActive: isActive,
    get: get,
    set: set,
    getEncryptionKey: getEncryptionKey,
    isLocked: isLocked,
    unlock: unlock,
    setEncryptionKey: setEncryptionKey,
    setEncryptionPassword: setEncryptionPassword,
    enable: enable,
    disable: disable,
    clear: clear,
    save: save,
    onSetEncryptionKey: onSetEncryptionKey,
};
export default offlineCacheService;
