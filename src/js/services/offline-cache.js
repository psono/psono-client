/**
 * Service to talk to the psono REST api
 */

import cryptoLibrary from "./crypto-library";
import browserClient from "./browser-client";
import action from "../actions/bound-action-creators";
import store from "./store";

let encryption_key = "";
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
    return storage.find_key("config", "offline-cache-encryption-key") !== null;
}

/**
 * returns the encryption key
 *
 * @returns {string} The hex representation of the encryption key
 */
function getEncryptionKey() {
    return encryption_key;
}

/**
 * returns weather the store is locked or not
 *
 * @returns {boolean} locked status
 */
function isLocked() {
    return isEncrypted() && !encryption_key;
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
    const encryption_key_encrypted = storage.find_key("config", "offline-cache-encryption-key");
    const encryption_key_salt = storage.find_key("config", "offline-cache-encryption-salt");
    if (encryption_key_encrypted === null || encryption_key_salt === null) {
        return true;
    }
    let newEncryptionKey;
    try {
        newEncryptionKey = cryptoLibrary.decryptSecret(
            encryption_key_encrypted.value.text,
            encryption_key_encrypted.value.nonce,
            password,
            encryption_key_salt.value
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
 * @param {string} new_encryption_key The new key
 */
function setEncryptionKey(new_encryption_key) {
    if (typeof new_encryption_key === "undefined") {
        return;
    }
    encryption_key = new_encryption_key;
    window.psono_offline_cache_encryption_key = new_encryption_key;
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
    const new_encryption_key_salt = cryptoLibrary.generateSecretKey();
    const new_encryption_key_encrypted = cryptoLibrary.encryptSecret(new_encryption_key, password, new_encryption_key_salt);
    storage.upsert("config", { key: "offline-cache-encryption-key", value: new_encryption_key_encrypted });
    storage.upsert("config", { key: "offline-cache-encryption-salt", value: new_encryption_key_salt });
    storage.save();
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

    if (encryption_key) {
        value = cryptoLibrary.encryptData(value, encryption_key);
    }

    storage.upsert("offline-cache", { key: request.url.toLowerCase(), value: value });
}

/**
 * Returns the cached request
 *
 * @param {object} request the request
 *
 * @returns {object} our original request
 */
function get(request) {
    if (!isActive()) {
        return null;
    }
    if (request.method !== "GET") {
        return {
            data: {
                error: ["Leave the offline mode before creating / modifying any content."],
            },
        };
    }

    const storage_entry = storage.find_key("offline-cache", request.url.toLowerCase());

    if (storage_entry === null) {
        return null;
    }

    let value = storage_entry.value;

    if (encryption_key) {
        value = cryptoLibrary.decryptData(value.text, value.nonce, encryption_key);
    }

    return JSON.parse(value);
}

/**
 * Enables the offline cache
 */
function enable() {
    action.enableOfflineMode();

    $rootScope.$broadcast("offline_mode_enabled", "");
}

/**
 * Disables the offline cache
 */
function disable() {
    action.disableOfflineMode();
    $rootScope.$broadcast("offline_mode_disabled", "");
}

/**
 * Clears the cache
 */
function clear() {
    storage.remove_all("offline-cache");
    storage.save();
}

/**
 * Saves teh cache
 *
 * @returns {Promise} promise
 */
function save() {
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
