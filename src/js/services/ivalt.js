/**
 * Ivalt and all the functions to create / edit / delete it ...
 */

import apiClient from "./api-client";
import {getStore} from "./store";
import action from "../actions/bound-action-creators";


function createIvalt(mobile) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        return {
            id: request.data["id"],
            uri: request.data["activation_code"],
        };
    };
    const onError = function (request) {
        return Promise.reject(request.data);
    };
    return apiClient
        .createIvalt(token, sessionSecretKey, mobile)
        .then(onSuccess, onError);
}


function validateIvalt(mobile) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        return true;
    };
    const onError = function (request) {
        return Promise.reject(request.data);
    };
    return apiClient
        .validateIvalt(token, sessionSecretKey, mobile)
        .then(onSuccess, onError);
}

/**
 * Gets a list of all active ivalts
 *
 * @returns {Promise} Returns a promise with a list of all ivalts
 */
function readIvalt() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (request) {
        // console.log("reading ivalts success...:", request.data)
        return request.data["ivalt"];
    };
    const onError = function (err) {
        // pass
        // console.error(err)
    };
    return apiClient.readIvalt(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Activates a given Ivalt
 *
 * @param {uuid} ivaltId The ivalt ID
 * @param {string} [ivaltToken] (optional) One ivalt token
 *
 * @returns {Promise} Returns a promise with true or false
 */
function activateIvalt(ivaltId, ivaltToken) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        action.setHasTwoFactor(true);
        return true;
    };
    const onError = function () {
        return false;
    };
    return apiClient.activateIvalt(token, sessionSecretKey, ivaltId, ivaltToken).then(onSuccess, onError);
}

/**
 * Deletes a given Ivalt
 *
 * @param {uuid} ivaltId The ivalt ID
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteIvalt(ivaltId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        return true;
    };
    const onError = function (data) {
        return Promise.reject(data.data);
    };
    return apiClient.deleteIvalt(token, sessionSecretKey, ivaltId).then(onSuccess, onError);
}

function sendTwoFactorNotification() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function () {
        return true;
    };
    const onError = function () {
        return false;
    };
    return apiClient.validateIvaltTwoFactor(token, sessionSecretKey,'notification').then(onSuccess, onError);
}

function validateIvaltTwoFactor() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onSuccess = function (res) {
        return res;
    };
    const onError = function (res) {
        return res;
    };
    return apiClient.validateIvaltTwoFactor(token, sessionSecretKey,'verification').then(onSuccess, onError);
}

const ivaltService = {
    createIvalt,
    readIvalt,
    activateIvalt,
    deleteIvalt,
    validateIvalt,
    sendTwoFactorNotification,
    validateIvaltTwoFactor
};

export default ivaltService;
