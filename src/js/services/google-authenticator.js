/**
 * Google authenticator and all the functions to create / edit / delete it ...
 */

import apiClientService from "./api-client";
import helperService from "./helper";
import store from "./store";
import action from "../actions/bound-action-creators";

/**
 * creates a google authenticator
 *
 * @param {string} title The title of the Google Authenticator
 *
 * @returns {Promise} Returns a promise with the user information
 */
function createGa(title) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        const backend = store.getState().server.url;
        const parsedUrl = helperService.parseUrl(backend);

        return {
            id: request.data["id"],
            uri: "otpauth://totp/" + parsedUrl["top_domain"] + ":" + store.getState().user.username + "?secret=" + request.data["secret"],
        };
    };
    const onError = function () {
        // pass
    };
    return apiClientService.createGa(token, sessionSecretKey, title).then(onSuccess, onError);
}

/**
 * Gets a list of all active google authenticators
 *
 * @returns {Promise} Returns a promise with a list of all google authenticators
 */
function readGa() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        return request.data["google_authenticators"];
    };
    const onError = function () {
        // pass
    };
    return apiClientService.readGa(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Activates a given Google authenticator
 *
 * @param {uuid} googleAuthenticatorId The google authenticator ID
 * @param {string} googleAuthenticatorToken One google authenticator code
 *
 * @returns {Promise} Returns a promise with true or false
 */
function activateGa(googleAuthenticatorId, googleAuthenticatorToken) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onSuccess = function () {
        action.setHasTwoFactor(true);
        return true;
    };
    const onError = function () {
        return false;
    };
    return apiClientService.activateGa(token, sessionSecretKey, googleAuthenticatorId, googleAuthenticatorToken).then(onSuccess, onError);
}

/**
 * Deletes a given Google authenticator
 *
 * @param {uuid} googleAuthenticatorId The google authenticator ID
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteGa(googleAuthenticatorId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onSuccess = function () {
        return true;
    };
    const onError = function (data) {
        return Promise.reject(data.data);
    };
    return apiClientService.deleteGa(token, sessionSecretKey, googleAuthenticatorId).then(onSuccess, onError);
}

const googleAuthenticatorService = {
    createGa,
    readGa,
    activateGa,
    deleteGa,
};

export default googleAuthenticatorService;
