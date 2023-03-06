/**
 * managerAPIKeys collects all functions to edit / update / create api keys and to work with them.
 */

import store from "./store";
import cryptoLibrary from "./crypto-library";
import apiClient from "./api-client";

/**
 * Returns one api keys
 *
 * @returns {Promise} Promise with the api keys
 */
function readApiKey(apiKeyId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        result.data.private_key = cryptoLibrary.decryptSecretKey(
            result.data.private_key,
            result.data.private_key_nonce
        );
        delete result.data.private_key_nonce;
        result.data.secret_key = cryptoLibrary.decryptSecretKey(result.data.secret_key, result.data.secret_key_nonce);
        delete result.data.secret_key_nonce;

        return result.data;
    };
    const onError = function () {
        // pass
    };

    return apiClient.readApiKey(token, sessionSecretKey, apiKeyId).then(onSuccess, onError);
}

/**
 * Returns all api keys
 *
 * @returns {Promise} Promise with the api keys
 */
function readApiKeys() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function () {
        // pass
    };

    return apiClient.readApiKey(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Returns all secrets of an api key
 *
 * @returns {Promise} Promise with the secrets
 */
function readApiKeySecrets(apiKeyId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        const secrets = result.data;
        for (let i = 0; i < secrets.length; i++) {
            secrets[i]["name"] = cryptoLibrary.decryptSecretKey(secrets[i]["title"], secrets[i]["title_nonce"]);
        }
        return secrets;
    };
    const onError = function () {
        // pass
    };

    return apiClient.readApiKeySecrets(token, sessionSecretKey, apiKeyId).then(onSuccess, onError);
}

/**
 * Adds one secret to an api key
 *
 * @param {uuid} apiKeyId The id of the api key
 * @param {string} apiKeySecretKey The symmetric secret assiciated with the api key
 * @param {array} secret The secret to add
 *
 * @returns {Promise} Promise with the new id
 */
function addSecretToApiKey(apiKeyId, apiKeySecretKey, secret) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const secret_secret_key_enc = cryptoLibrary.encryptData(secret.secret_key, apiKeySecretKey);
    const secret_title_enc = cryptoLibrary.encryptSecretKey(secret.name);

    return apiClient.addSecretToApiKey(
        token,
        sessionSecretKey,
        apiKeyId,
        secret.secret_id,
        secret_title_enc.text,
        secret_title_enc.nonce,
        secret_secret_key_enc.text,
        secret_secret_key_enc.nonce
    );
}

/**
 * Adds multiple secrets to an api key
 *
 * @param {uuid} apiKeyId The id of the api key
 * @param {string} apiKeySecretKey The symmetric secret assiciated with the api key
 * @param {array} secrets The array of secrets to add to the api key
 *
 * @returns {Promise} Promise with the new id
 */
function addSecretsToApiKey(apiKeyId, apiKeySecretKey, secrets) {
    return new Promise(function (resolve, reject) {
        const secret_promise_array = [];

        for (let i = 0; i < secrets.length; i++) {
            const promise = addSecretToApiKey(apiKeyId, apiKeySecretKey, secrets[i]);
            secret_promise_array.push(promise);
        }

        Promise.all(secret_promise_array).then(function () {
            resolve();
        });
    });
}

/**
 * Creates an API Key
 *
 * @param {string} title The title of the new api key
 * @param {bool} restrictToSecrets
 * @param {bool} allowInsecureAccess
 * @param {bool} allowReadAccess
 * @param {bool} allowWriteAccess
 * @param {array} secrets Array of secrets
 *
 * @returns {Promise} Promise with the new id
 */
function createApiKey(title, restrictToSecrets, allowInsecureAccess, allowReadAccess, allowWriteAccess, secrets) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const apiKeySecretKey = cryptoLibrary.generateSecretKey();
    const api_key_public_private_key_pair = cryptoLibrary.generatePublicPrivateKeypair();

    const api_key_private_key_enc = cryptoLibrary.encryptSecretKey(api_key_public_private_key_pair.private_key);
    const apiKeySecretKey_enc = cryptoLibrary.encryptSecretKey(apiKeySecretKey);

    const user_private_key_enc = cryptoLibrary.encryptData(store.getState().user.userPrivateKey, apiKeySecretKey);
    const user_secret_key_enc = cryptoLibrary.encryptData(store.getState().user.userSecretKey, apiKeySecretKey);

    const verify_key = cryptoLibrary.getVerifyKey(api_key_public_private_key_pair.private_key);

    const onSuccess = function (result) {
        const apiKeyId = result.data["api_key_id"];
        return addSecretsToApiKey(apiKeyId, apiKeySecretKey, secrets).then(function () {
            return {
                api_key_id: apiKeyId,
            };
        });
    };
    const onError = function () {
        // pass
    };

    return apiClient
        .createApiKey(
            token,
            sessionSecretKey,
            title,
            api_key_public_private_key_pair.public_key,
            api_key_private_key_enc.text,
            api_key_private_key_enc.nonce,
            apiKeySecretKey_enc.text,
            apiKeySecretKey_enc.nonce,
            user_private_key_enc.text,
            user_private_key_enc.nonce,
            user_secret_key_enc.text,
            user_secret_key_enc.nonce,
            restrictToSecrets,
            allowInsecureAccess,
            allowReadAccess,
            allowWriteAccess,
            verify_key
        )
        .then(onSuccess, onError);
}

/**
 * Updates an API Key
 *
 * @param {uuid} apiKeyId The id of the api key
 * @param {string} title The title of the new api key
 * @param {bool} restrictToSecrets
 * @param {bool} allowInsecureAccess
 * @param {bool} allowReadAccess
 * @param {bool} allowWriteAccess
 *
 * @returns {Promise} Promise with the new id
 */
function updateApiKey(apiKeyId, title, restrictToSecrets, allowInsecureAccess, allowReadAccess, allowWriteAccess) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    return apiClient.updateApiKey(
        token,
        sessionSecretKey,
        apiKeyId,
        title,
        restrictToSecrets,
        allowInsecureAccess,
        allowReadAccess,
        allowWriteAccess
    );
}

/**
 * Deletes an API Key
 *
 * @param {uuid} apiKeyId The id of the api key to delete
 *
 * @returns {Promise} Promise
 */
function deleteApiKey(apiKeyId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function (result) {
        // pass
    };

    return apiClient.deleteApiKey(token, sessionSecretKey, apiKeyId).then(onSuccess, onError);
}

/**
 * Deletes an API Key secret
 *
 * @param {uuid} apiKeySecretId The id of the api key secret to delete
 *
 * @returns {Promise} Promise
 */
function deleteApiKeySecret(apiKeySecretId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function (result) {
        // pass
    };

    return apiClient.deleteApiKeySecret(token, sessionSecretKey, apiKeySecretId).then(onSuccess, onError);
}

const apiKeysService = {
    readApiKey: readApiKey,
    readApiKeys: readApiKeys,
    readApiKeySecrets: readApiKeySecrets,
    createApiKey: createApiKey,
    updateApiKey: updateApiKey,
    deleteApiKey: deleteApiKey,
    addSecretsToApiKey: addSecretsToApiKey,
    addSecretToApiKey: addSecretToApiKey,
    deleteApiKeySecret: deleteApiKeySecret,
};
export default apiKeysService;
