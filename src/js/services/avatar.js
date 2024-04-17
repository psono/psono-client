/**
 * Service to manage the avatars and avatar related functions
 */
import apiClient from "./api-client";
import store from "./store";


/**
 * Fetches the details of one avatar including the base64 encoded data and mime type
 *
 * @param {uuid} avatarId the avatar id
 *
 * @returns {Promise} Returns the details of a avatar
 */
function readAvatar(userId, avatarId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.readAvatar(token, sessionSecretKey, userId, avatarId).then(onSuccess, onError);
}

/**
 * Fetches the list of all avatars of this user (eather one or none) so that one can check if one already cached the avatar
 * or if one need to download the binary from the server
 *
 * @returns {Promise} Returns a list of avatars
 */
function readAvatars() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data.avatars;
    };

    const onError = function (error) {
        return Promise.reject();
    };

    return apiClient.readAvatar(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Creates a new avatar
 *
 * @param {string} mimeType the mime type
 * @param {string} dataBase64 the base64 encoded image
 *
 * @returns {Promise} Returns whether the creation was successful or not
 */
function createAvatar(mimeType, dataBase64) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient
        .createAvatar(
            token,
            sessionSecretKey,
            dataBase64,
        )
        .then(onSuccess, onError);
}

/**
 * Deletes a given avatar
 *
 * @param {uuid} avatarId the avatar id
 *
 * @returns {Promise} Returns whether the delete was successful or not
 */
function deleteAvatar(avatarId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.deleteAvatar(token, sessionSecretKey, avatarId).then(onSuccess, onError);
}


const avatarService = {
    readAvatar: readAvatar,
    readAvatars: readAvatars,
    createAvatar: createAvatar,
    deleteAvatar: deleteAvatar,
};
export default avatarService;
