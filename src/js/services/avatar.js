/**
 * Service to manage the avatars and avatar related functions
 */
import apiClient from "./api-client";
import { getStore } from "./store";


let avatarSingleton;

/**
 * Helper function that acts as a singleton to load the avatar data url.
 * @returns {Promise}
 * @private
 */
function readAvatarCached() {
    if (!avatarSingleton) {
        avatarSingleton = _readAvatarCached();
    }
    return avatarSingleton;
}

/**
 * Converts an image url ot a data url
 *
 * @param imageUrl
 * @returns {Promise<unknown>}
 */
async function imageUrlToDataUrl(imageUrl) {
    let response;
    try {
        response = await fetch(imageUrl);
    } catch (error) {
        return;
    }
    if (!response.ok) {
        return;
    }

    let blob;
    try {
        blob = await response.blob();
    } catch (error) {
        return;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve();
        reader.readAsDataURL(blob);
    });
}

/**
 * Returns the data url of the avatar of the current user
 *
 * @returns {Promise} Returns a list of avatars
 */
async function _readAvatarCached() {
    let avatars;
    try {
        avatars = await avatarService.readAvatars();
    } catch (error) {
        return
    }
    if (!avatars || avatars.length <= 0) {
        return;
    }
    const path = "/avatar-image/" + getStore().getState().user.userId + "/" + avatars[0].id + "/";
    return imageUrlToDataUrl(getStore().getState().server.url + path);
}

/**
 * Fetches the list of all avatars of this user (eather one or none) so that one can check if one already cached the avatar
 * or if one need to download the binary from the server
 *
 * @returns {Promise} Returns a list of avatars
 */
function readAvatars() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

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
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        avatarSingleton = undefined;
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
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        avatarSingleton = undefined;
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.deleteAvatar(token, sessionSecretKey, avatarId).then(onSuccess, onError);
}


const avatarService = {
    readAvatarCached: readAvatarCached,
    readAvatars: readAvatars,
    createAvatar: createAvatar,
    deleteAvatar: deleteAvatar,
};
export default avatarService;
