/**
 * Google authenticator and all the functions to create / edit / delete it ...
 */

import apiClientService from "./api-client";
import helperService from "./helper";
import { getStore } from "./store";
import action from "../actions/bound-action-creators";

/**
 * creates a google authenticator
 *
 * @param {string} title The title of the TOTP
 *
 * @returns {Promise} Returns a promise with the user information
 */
function createGa(title) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        const backend = getStore().getState().server.url;
        const parsedUrl = helperService.parseUrl(backend);

        return {
            id: request.data["id"],
            uri:
                "otpauth://totp/" +
                parsedUrl["full_domain_without_www"] +
                ":" +
                getStore().getState().user.username +
                "?secret=" +
                request.data["secret"],
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
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
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
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        action().setHasTwoFactor(true);
        return true;
    };
    const onError = function () {
        return false;
    };
    return apiClientService
        .activateGa(token, sessionSecretKey, googleAuthenticatorId, googleAuthenticatorToken)
        .then(onSuccess, onError);
}

/**
 * Deletes a given Google authenticator
 *
 * @param {uuid} googleAuthenticatorId The google authenticator ID
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteGa(googleAuthenticatorId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
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
