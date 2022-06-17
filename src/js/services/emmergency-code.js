/**
 * Emergency codes and all the functions to create / edit / delete them ...
 */

import store from "./store";
import helperService from "./helper";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";

/**
 * Returns a list of configured emergency codes
 *
 * @returns {Promise} Returns a promise with the emergency codes
 */
function readEmergencyCodes() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        return request.data["emegency_codes"];
    };
    const onError = function () {
        // pass
    };
    return apiClient.readEmergencyCodes(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Creates the emergency code. Will
 *
 * @param {string} title The title of the emergency code
 * @param {int} leadTime The lead time till someone can activate this code in seconds
 *
 * @returns {Promise} Returns a promise with the emergency code
 */
function createEmergencyCode(title, leadTime) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const emergencyPassword = cryptoLibrary.generateRecoveryCode();
    const emergencyAuthkey = cryptoLibrary.generateAuthkey(store.getState().user.username, emergencyPassword["base58"]);
    const emergencySauce = cryptoLibrary.generateUserSauce();

    const emergencyDataDec = {
        user_private_key: store.getState().user.userPrivateKey,
        user_secret_key: store.getState().user.userSecretKey,
    };

    const emergency_data = cryptoLibrary.encryptSecret(
        JSON.stringify(emergencyDataDec),
        emergencyPassword["base58"],
        emergencySauce
    );

    const onSuccess = function () {
        return {
            username: store.getState().user.username,
            emergency_password: helperService.splitStringInChunks(emergencyPassword["base58_checksums"], 13).join("-"),
            emergency_words: emergencyPassword["words"].join(" "),
        };
    };
    const onError = function (request) {
        return Promise.reject(request.data);
    };
    return apiClient
        .createEmergencyCode(
            token,
            sessionSecretKey,
            title,
            leadTime,
            emergencyAuthkey,
            emergency_data.text,
            emergency_data.nonce,
            emergencySauce
        )
        .then(onSuccess, onError);
}

/**
 * Deletes an emergency code
 *
 * @param {uuid} emergencyCodeId The id of the emergency code to delete
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteEmergencyCode(emergencyCodeId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        // pass
    };
    const onError = function () {
        // pass
    };
    return apiClient.deleteEmergencyCode(token, sessionSecretKey, emergencyCodeId).then(onSuccess, onError);
}

const emergencyCodeService = {
    readEmergencyCodes,
    createEmergencyCode,
    deleteEmergencyCode,
};

export default emergencyCodeService;
