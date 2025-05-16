/**
 * Service to manage the history of a secret
 */

import { getStore } from "./store";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import action from "../actions/bound-action-creators";

/**
 * Reads the history of a secret from the server
 *
 * @returns {Promise} Returns a list of history items
 */
function createServerSecret() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const userSecretKey = getStore().getState().user.userSecretKey;
    const userPrivateKey = getStore().getState().user.userPrivateKey;

    const onSuccess = function (data) {
        action().setServerSecretExists(true);
        return data.data;
    };

    const onError = function (error) {
        //pass
        console.log(error)
        return Promise.reject(error);
    };

    return apiClient.createServerSecret(token, sessionSecretKey, userSecretKey, userPrivateKey).then(onSuccess, onError);
}

/**
 * Deletes the stored server secrets of a user
 *
 * @param {string} password The password to encrypt the secret key with
 *
 * @returns {Promise} Returns a list of history items
 */
function deleteServerSecret(password) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const username = getStore().getState().user.username;
    const userSecretKey = getStore().getState().user.userSecretKey;
    const userPrivateKey = getStore().getState().user.userPrivateKey;
    const userSauce = getStore().getState().user.userSauce;
    const hashingAlgorithm = getStore().getState().user.hashingAlgorithm;
    const hashingParameters = getStore().getState().user.hashingParameters;

    const privateKeyEnc = cryptoLibrary.encryptSecret(userPrivateKey, password, userSauce, hashingAlgorithm, hashingParameters);
    const secretKeyEnc = cryptoLibrary.encryptSecret(userSecretKey, password, userSauce, hashingAlgorithm, hashingParameters);
    const authkey = cryptoLibrary.generateAuthkey(username, password, hashingAlgorithm, hashingParameters);

    const onSuccess = function (content) {
        action().setServerSecretExists(false);
        return content.data;
    };

    const onError = function (error) {
        //pass
        console.log(error)
        return Promise.reject(error);
    };

    return apiClient.deleteServerSecret(token, sessionSecretKey, authkey, privateKeyEnc.text, privateKeyEnc.nonce, secretKeyEnc.text, secretKeyEnc.nonce, userSauce, hashingAlgorithm, hashingParameters).then(onSuccess, onError);
}

const serverSecretService = {
    createServerSecret: createServerSecret,
    deleteServerSecret: deleteServerSecret,
};
export default serverSecretService;
