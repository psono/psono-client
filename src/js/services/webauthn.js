/**
 * Fido / Webauthn and all the functions to create / edit / delete it ...
 */

import apiClientService from "./api-client";
import { getStore } from "./store";
import action from "../actions/bound-action-creators";
import helperService from "./helper";


/**
 * Returns the current origin
 *
 * @returns {string} Returns the current origin
 */
function getOrigin() {
    const parsedUrl = helperService.parseUrl(window.location.href)
    return parsedUrl.base_url;
}

/**
 * Creates a webauthn
 *
 * @param {string} title The title of the Webauthn
 *
 * @returns {Promise} Returns a promise with the user information
 */
function createWebauthn(title) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        return request.data;
    };
    const onError = function () {
        // pass
    };
    return apiClientService.createWebauthn(token, sessionSecretKey, title, getOrigin()).then(onSuccess, onError);
}

/**
 * Gets a list of all active webauthns
 *
 * @returns {Promise} Returns a promise with a list of all webauthns
 */
function readWebauthn() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        return request.data["webauthns"];
    };
    const onError = function () {
        // pass
    };
    return apiClientService.readWebauthn(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Activates a given webauthn
 *
 * @param {uuid} webauthnId The webauthn ID
 * @param {string} credential The credentials passed by the browser
 *
 * @returns {Promise} Returns a promise with true or false
 */
function activateWebauthn(webauthnId, credential) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        action().setHasTwoFactor(true);
        return true;
    };
    const onError = function (data) {
        console.log(data)
        return false;
    };
    return apiClientService
        .activateWebauthn(token, sessionSecretKey, webauthnId, credential)
        .then(onSuccess, onError);
}

/**
 * Deletes a given webauthn
 *
 * @param {uuid} webauthnId The webauthn ID
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteWebauthn(webauthnId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        return true;
    };
    const onError = async function (data) {
        data = await data;
        return Promise.reject(data.data);
    };
    return apiClientService.deleteWebauthn(token, sessionSecretKey, webauthnId).then(onSuccess, onError);
}

/**
 * Initiate the second factor authentication with webauthn
 *
 * @returns {Promise} Returns a promise with the user information
 */
function verifyWebauthnInit() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        return request.data;
    };
    const onError = async function (request) {
        request = await request;
        return Promise.reject(request.data);
    };
    return apiClientService.webauthnVerifyInit(token, sessionSecretKey, getOrigin()).then(onSuccess, onError);
}

/**
 * Solve the second factor webauthn authentication
 *
 * @param {string} credential The credentials passed by the browser
 *
 * @returns {Promise} Returns a promise with the user information
 */
function verifyWebauthn(credential) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        return request.data;
    };
    const onError = async function (request) {
        request = await request;
        return Promise.reject(request.data);
    };
    return apiClientService.webauthnVerify(token, sessionSecretKey, credential).then(onSuccess, onError);
}

const webauthnService = {
    createWebauthn,
    readWebauthn,
    activateWebauthn,
    deleteWebauthn,
    verifyWebauthnInit,
    verifyWebauthn,
};

export default webauthnService;
