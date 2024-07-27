/**
 * Duo and all the functions to create / edit / delete it ...
 */

import apiClient from "./api-client";
import { getStore } from "./store";
import action from "../actions/bound-action-creators";

/**
 * creates a duo
 *
 * @param {boolean} useSystemWideDuo Wether to use the system wide duo or not
 * @param {string} title The title of the duo
 * @param {string} integration_key The integration_key of the duo
 * @param {string} secret_key The secret_key of the duo
 * @param {string} host The host of the duo
 *
 * @returns {Promise} Returns a promise with the user information
 */
function createDuo(useSystemWideDuo, title, integration_key, secret_key, host) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        return {
            id: request.data["id"],
            uri: request.data["activation_code"],
        };
    };
    const onError = async function (request) {
        request = await request;
        return Promise.reject(request.data);
    };
    return apiClient
        .createDuo(token, sessionSecretKey, useSystemWideDuo, title, integration_key, secret_key, host)
        .then(onSuccess, onError);
}

/**
 * Gets a list of all active duos
 *
 * @returns {Promise} Returns a promise with a list of all duos
 */
function readDuo() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        return request.data["duos"];
    };
    const onError = function () {
        // pass
    };
    return apiClient.readDuo(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Activates a given Google authenticator
 *
 * @param {uuid} duoId The duo ID
 * @param {string} [duoToken] (optional) One Duo token
 *
 * @returns {Promise} Returns a promise with true or false
 */
function activateDuo(duoId, duoToken) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        action().setHasTwoFactor(true);
        return true;
    };
    const onError = function () {
        return false;
    };
    return apiClient.activateDuo(token, sessionSecretKey, duoId, duoToken).then(onSuccess, onError);
}

/**
 * Deletes a given Google authenticator
 *
 * @param {uuid} duoId The duo ID
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteDuo(duoId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        return true;
    };
    const onError = async function (data) {
        data = await data;
        return Promise.reject(data.data);
    };
    return apiClient.deleteDuo(token, sessionSecretKey, duoId).then(onSuccess, onError);
}

const duoService = {
    createDuo,
    readDuo,
    activateDuo,
    deleteDuo,
};

export default duoService;
