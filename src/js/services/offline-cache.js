/**
 * Service to talk to the psono REST api
 */

import cryptoLibrary from "./crypto-library";
import browserClient from "./browser-client";
import storage from "./storage";
import action from "../actions/bound-action-creators";
import store from "./store";

let encryptionKey = "";
const onSetEncryptionKeyRegistrations = [];

activate();

function activate() {
    if (window.psono_offline_cache_encryption_key) {
        setEncryptionKey(window.psono_offline_cache_encryption_key);
    }
    browserClient.getOfflineCacheEncryptionKey(function (new_encryption_key) {
        setEncryptionKey(new_encryption_key);
    });
}

/**
 * returns weather the cache is active or not
 *
 * @returns {boolean} promise
 */
function isActive() {
    const offline_mode = store.getState().client.offlineMode;

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
    return store.getState().client.offlineCacheEncryptionKey !== null;
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
    const encryptionKeyEncrypted = store.getState().client.offlineCacheEncryptionKey;
    const encryptionKeySalt = store.getState().client.offlineCacheEncryptionSalt;
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
    window.psono_offline_cache_encryption_key = newEncryptionKey;
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
    action.setOfflineCacheEncryptionInfo(offlineCacheEncryptionKey, offlineCacheEncryptionSalt);
    browserClient.emitSec("set-offline-cache-encryption-key", { encryption_key: new_encryption_key });
}

/**
 * Sets the request data in cache
 *
 * @param {object} request the request
 * @param {object} data the data
 *
 * @returns {Promise} promise
 */
function set(request, data) {
    if (request.method !== "GET" || !isActive()) {
        return;
    }

    let value = JSON.stringify(data);

    if (encryptionKey) {
        value = cryptoLibrary.encryptData(value, encryptionKey);
    }

    storage.upsert("offline-cache", { key: request.url.toLowerCase(), value: value });
}

/**
 * Returns the cached request
 *
 * @param {object} request the request
 *
 * @returns {Promise} our original request
 */
function get(request) {
    if (!isActive()) {
        return Promise.resolve(null);
    }
    if (request.method !== "GET") {
        return Promise.resolve({
            data: {
                error: ["Leave the offline mode before creating / modifying any content."],
            },
        });
    }

    return storage.findKey("offline-cache", request.url.toLowerCase()).then((storageEntry) => {
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
    action.enableOfflineMode();

    //$rootScope.$broadcast("offline_mode_enabled", "");
}

/**
 * Disables the offline cache
 */
function disable() {
    action.disableOfflineMode();
    // $rootScope.$broadcast("offline_mode_disabled", "");
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
