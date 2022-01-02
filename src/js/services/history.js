/**
 * Service to manage the history of a secret
 */

import store from "./store";
import apiClient from "./api-client";
import cryptoLibraryService from "./crypto-library";

/**
 * Reads the history of a secret from the server
 *
 * @param {uuid} secretId The secretId to read the history from
 *
 * @returns {Promise} Returns a list of history items
 */
function readSecretHistory(secretId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data.history;
    };

    const onError = function () {
        //pass
    };

    return apiClient.readSecretHistory(token, sessionSecretKey, secretId).then(onSuccess, onError);
}

/**
 * Reads the the details of a history entry
 *
 * @param {uuid} secretHistoryId The id of the history list entry
 * @param {string} secretKey The secret key to decrypt the content of the history entry
 *
 * @returns {Promise} Returns a list of history items
 */
function readHistory(secretHistoryId, secretKey) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (content) {
        const secret = JSON.parse(cryptoLibraryService.decryptData(content.data.data, content.data.data_nonce, secretKey));
        secret["create_date"] = content.data["create_date"];
        secret["write_date"] = content.data["write_date"];
        secret["callback_url"] = content.data["callback_url"];
        secret["callback_user"] = content.data["callback_user"];
        secret["callback_pass"] = content.data["callback_pass"];
        return secret;
    };

    const onError = function () {
        //pass
    };

    return apiClient.readHistory(token, sessionSecretKey, secretHistoryId).then(onSuccess, onError);
}

const historyService = {
    readSecretHistory: readSecretHistory,
    readHistory: readHistory,
};
export default historyService;
