/**
 * Service to handle all secret related tasks
 */

import i18n from "../i18n";
import cryptoLibrary from "../services/crypto-library";
import apiClient from "../services/api-client";
import browserClient from "../services/browser-client";
import offlineCache from "../services/offline-cache";
import store from "./store";

/**
 * Encrypts the content and creates a new secret out of it.
 *
 * @param {object} content The content of the new secret
 * @param {uuid} linkId the local id of the share in the data structure
 * @param {uuid|undefined} [parentDatastoreId] (optional) The id of the parent datastore, may be left empty if the share resides in a share
 * @param {uuid|undefined} [parentShareId] (optional) The id of the parent share, may be left empty if the share resides in the datastore
 * @param {string} callbackUrl The callback ULR
 * @param {string} callbackUser The callback user
 * @param {string} callbackPass The callback password
 *
 * @returns {Promise} Returns a promise with the new secret_id
 */
function createSecret(content, linkId, parentDatastoreId, parentShareId, callbackUrl, callbackUser, callbackPass) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const secretKey = cryptoLibrary.generateSecretKey();

    const jsonContent = JSON.stringify(content);

    const c = cryptoLibrary.encryptData(jsonContent, secretKey);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (response) {
        browserClient.emit("secrets-changed", content);
        return { secret_id: response.data.secret_id, secret_key: secretKey };
    };

    return apiClient
        .createSecret(token, sessionSecretKey, c.text, c.nonce, linkId, parentDatastoreId, parentShareId, callbackUrl, callbackUser, callbackPass)
        .then(onSuccess, onError);
}

/**
 * Reads a secret and decrypts it. Returns the decrypted object
 *
 * @param {uuid} secretId The secret id one wants to fetch
 * @param {string} secretKey The secret key to decrypt the content
 * @param {boolean|undefined} [synchronous] (optional) Synchronous or Asynchronous
 *
 * @returns {Promise} Returns a promise withe decrypted content of the secret
 */
function readSecret(secretId, secretKey, synchronous) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
        return new Promise.reject(result);
    };

    const onSuccess = function (content) {
        const secret = JSON.parse(cryptoLibrary.decryptData(content.data.data, content.data.data_nonce, secretKey));
        secret["create_date"] = content.data["create_date"];
        secret["write_date"] = content.data["write_date"];
        secret["callback_url"] = content.data["callback_url"];
        secret["callback_user"] = content.data["callback_user"];
        secret["callback_pass"] = content.data["callback_pass"];
        return secret;
    };

    if (synchronous) {
        return onSuccess(apiClient.readSecret(token, sessionSecretKey, secretId, synchronous));
    } else {
        return apiClient.readSecret(token, sessionSecretKey, secretId, synchronous).then(onSuccess, onError);
    }
}

/**
 * Encrypts some content and updates a secret with it. returns the secret id
 *
 * @param {uuid} secretId The id of the secret
 * @param {string} secretKey The secret key of the secret
 * @param {object} content The new content for the given secret
 * @param {string} callbackUrl The callback ULR
 * @param {string} callbackUser The callback user
 * @param {string} callbackPass The callback password
 *
 * @returns {Promise} Returns a promise with the secret id
 */
function writeSecret(secretId, secretKey, content, callbackUrl, callbackUser, callbackPass) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const jsonContent = JSON.stringify(content);

    const c = cryptoLibrary.encryptData(jsonContent, secretKey);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (response) {
        browserClient.emit("secrets-changed", content);
        return { secret_id: response.data.secret_id };
    };

    return apiClient.writeSecret(token, sessionSecretKey, secretId, c.text, c.nonce, callbackUrl, callbackUser, callbackPass).then(onSuccess, onError);
}

/**
 * Fetches and decrypts a secret and initiates the redirect for the secret
 *
 * @param {string} type The type of the secret
 * @param {uuid} secretId The id of the secret to read
 */
function redirectSecret(type, secretId) {
    function redirect() {
        const secretKey = managerBase.find_key_nolimit("datastore-password-leafs", secretId);

        const onError = function (result) {
            // pass
        };

        const onSuccess = function (decryptedSecret) {
            const msg = itemBlueprint.blueprint_msg_before_open_secret(type, decryptedSecret);
            if (typeof msg !== "undefined") {
                browserClient.emitSec(msg.key, msg.content);
            }

            itemBlueprint.blueprint_on_open_secret(type, secretId, decryptedSecret);
        };

        readSecret(secretId, secretKey).then(onSuccess, onError);
    }

    if (!offlineCache.isActive() || !offlineCache.isLocked()) {
        redirect();
    } else {
        const modalInstance = $uibModal.open({
            templateUrl: "view/modal/unlock-offline-cache.html",
            controller: "ModalUnlockOfflineCacheCtrl",
            backdrop: "static",
            resolve: {},
        });

        modalInstance.result.then(
            function () {
                // pass, will be catched later with the on_set_encryption_key event
            },
            function () {
                $rootScope.$broadcast("force_logout", "");
            }
        );

        offlineCache.onSetEncryptionKey(function () {
            modalInstance.close();
            redirect();
        });
    }
}

/**
 * Handles item clicks and triggers behaviour
 *
 * @param {object} item The item one has clicked on
 */
function onItemClick(item) {
    if (item.hasOwnProperty("urlfilter") && item["urlfilter"] !== "" && itemBlueprint.blueprint_has_on_click_new_tab(item.type)) {
        browserClient.openTab("open-secret.html#!/secret/" + item.type + "/" + item.secret_id).then(function (window) {
            window.psono_offline_cache_encryption_key = offlineCache.getEncryptionKey();
        });
    }
}

/**
 * Copies the username of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the username into our clipboard
 */
function copyUsername(item) {
    const secretKey = managerBase.find_key_nolimit("datastore-password-leafs", item.secret_id);

    const decryptedSecret = readSecret(item.secret_id, secretKey, true);

    if (item["type"] === "application_password") {
        browserClient.copyToClipboard(decryptedSecret["application_password_username"]);
    } else if (item["type"] === "website_password") {
        browserClient.copyToClipboard(decryptedSecret["website_password_username"]);
    }

    notification.push("username_copy", i18n.t("USERNAME_COPY_NOTIFICATION"));
}

/**
 * Copies the password of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the password into our clipboard
 */
function copyPassword(item) {
    const secretKey = managerBase.find_key_nolimit("datastore-password-leafs", item.secret_id);

    const decryptedSecret = readSecret(item.secret_id, secretKey, true);

    if (item["type"] === "application_password") {
        browserClient.copyToClipboard(decryptedSecret["application_password_password"]);
    } else if (item["type"] === "website_password") {
        browserClient.copyToClipboard(decryptedSecret["website_password_password"]);
    }

    notification.push("password_copy", i18n.t("PASSWORD_COPY_NOTIFICATION"));
}

/**
 * Copies the TOTP token of a given secret to the clipboard
 *
 * @param {object} item The item of which we want to load the TOTP token into our clipboard
 */
function copyTotpToken(item) {
    const secretKey = managerBase.find_key_nolimit("datastore-password-leafs", item.secret_id);

    const decryptedSecret = readSecret(item.secret_id, secretKey, true);

    const totpCode = decryptedSecret["totp_code"];
    let totpPeriod, totpAlgorithm, totpDigits;
    if (decryptedSecret.hasOwnProperty("totp_period")) {
        totpPeriod = decryptedSecret["totp_period"];
    }
    if (decryptedSecret.hasOwnProperty("totp_algorithm")) {
        totpAlgorithm = decryptedSecret["totp_algorithm"];
    }
    if (decryptedSecret.hasOwnProperty("totp_digits")) {
        totpDigits = decryptedSecret["totp_digits"];
    }
    browserClient.copyToClipboard(cryptoLibrary.getTotpToken(totpCode, totpPeriod, totpAlgorithm, totpDigits));

    notification.push("totp_token_copy", i18n.t("TOTP_TOKEN_COPY_NOTIFICATION"));
}

// registrations

// itemBlueprint.register('copy_username', copyUsername);
// itemBlueprint.register('copy_password', copyPassword);
// itemBlueprint.register('copy_totp_token', copyTotpToken);

const service = {
    createSecret: createSecret,
    readSecret: readSecret,
    writeSecret: writeSecret,
    redirectSecret: redirectSecret,
    onItemClick: onItemClick,
    copyUsername: copyUsername,
    copyPassword: copyPassword,
    copyTotpToken: copyTotpToken,
};

export default service;
