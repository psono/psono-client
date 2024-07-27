/**
 * linkShare collects all functions to edit / update / create link shares and to work with them.
 */

import { getStore } from "./store";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import fileTransfer from "./file-transfer";
import helper from "./helper";

// /**
//  * Returns one link share of this user
//  *
//  * @param {string} linkShareId The encrypted secret
//  *
//  * @returns {Promise} Promise with the link shares
//  */
// function readLinkShare(linkShareId) {
//     const token = getStore().getState().user.token;
//     const sessionSecretKey = getStore().getState().user.sessionSecretKey;
//
//     const onSuccess = function (result) {
//         result.data.private_key = await cryptoLibrary.decryptSecretKey(result.data.private_key, result.data.private_key_nonce);
//         delete result.data.private_key_nonce;
//         result.data.secret_key = await cryptoLibrary.decryptSecretKey(result.data.secret_key, result.data.secret_key_nonce);
//         delete result.data.secret_key_nonce;
//
//         return result.data;
//     };
//     const onError = function () {
//         // pass
//     };
//
//     return apiClient.readLinkShare(token, sessionSecretKey, linkShareId).then(onSuccess, onError);
// }

/**
 * Returns all link shares of this user
 *
 * @returns {Promise} Promise with the link shares
 */
function readLinkShares() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function () {
        // pass
    };

    return apiClient.readLinkShare(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Takes an ecrypted secret and the share link data object. Decrypt ths encrypted secret and returns int.
 *
 * @param {object} encryptedSecret The encrypted secret
 * @param {object} item The decrypted share link data object
 *
 * @returns {Object} Promise with the secret
 */
async function readSecretWithLinkShare(encryptedSecret, item) {
    // normal secret
    const data = JSON.parse(
        await cryptoLibrary.decryptData(encryptedSecret.secret_data, encryptedSecret.secret_data_nonce, item.secret_key)
    );

    const newItem = helper.duplicateObject(item);

    let write = false;
    if (encryptedSecret.hasOwnProperty('allow_write') && encryptedSecret.allow_write) {
        write = true;
    }
    newItem["share_rights"] = {
        read: true,
        write: write,
        grant: false,
        delete: false,
    };
    return {
        item: newItem,
        data: data,
    };
}

/**
 * Takes an ecrypted secret and the share link data object. Decrypt ths encrypted secret and displays the information.
 *
 * @param {object} encryptedFileMeta The encrypted secret
 * @param {object} shareLinkData The decrypted share link data object
 *
 * @returns {Promise} Promise with the secret
 */
function readFileWithLinkShare(encryptedFileMeta, shareLinkData) {
    return fileTransfer.downloadFile(shareLinkData, encryptedFileMeta["shards"], encryptedFileMeta);
}

/**
 * Reads a secret belonging to a link share
 *
 * @param {uuid} linkShareId The id of the link share
 * @param {string} linkShareSecret The secret to decrypt the share link secret
 * @param {string|null} passphrase The passphrase that protects the link share
 *
 * @returns {Promise} Promise with the secret
 */
function linkShareAccessRead(linkShareId, linkShareSecret, passphrase) {
    const onSuccess = async function (result) {
        const share_link_data = JSON.parse(
            await cryptoLibrary.decryptData(result.data.node, result.data.node_nonce, linkShareSecret)
        );

        if (share_link_data.type === "file") {
            return readFileWithLinkShare(result.data, share_link_data);
        } else {
            // normal secret
            return readSecretWithLinkShare(result.data, share_link_data);
        }
    };
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    return apiClient.linkShareAccessRead(linkShareId, passphrase).then(onSuccess, onError);
}

/**
 * Updates a secret belonging to a link share
 *
 * @param {uuid} linkShareId The id of the link share
 * @param {string} linkShareSecret The secret to decrypt the share link secret
 * @param {string} secretKey The secret key of the secret
 * @param {object} content The new content for the given secret
 * @param {string|null} passphrase The passphrase that protects the link share
 *
 * @returns {Promise} Promise with the secret
 */
async function linkShareAccessWrite(linkShareId, linkShareSecret, secretKey, content, passphrase) {

    const jsonContent = JSON.stringify(content);

    const c = await cryptoLibrary.encryptData(jsonContent, secretKey);

    const onSuccess = function (result) {
        return result.data
    };
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    return apiClient.linkShareAccessWrite(linkShareId, c.text, c.nonce, passphrase).then(onSuccess, onError);
}

/**
 * Creates a link share
 *
 * @param {uuid} secretId The id of the secret
 * @param {uuid} fileId The id of the file
 * @param {string} node The encrypted node in hex format
 * @param {string} nodeNonce The nonce of the encrypted node in hex format
 * @param {string} publicTitle The public title of the link share
 * @param {int|null} allowedReads The amount of allowed access requests before this link secret becomes invalid
 * @param {string|null} passphrase The passphrase to protect the link secret
 * @param {string|null} validTill The valid till time in iso format
 * @param {boolean} allowWrite Specifies whether a link user can modify the content
 *
 * @returns {Promise} Promise with the new link_secret_id
 */
function createLinkShare(secretId, fileId, node, nodeNonce, publicTitle, allowedReads, passphrase, validTill, allowWrite) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result);
    };

    return apiClient
        .createLinkShare(
            token,
            sessionSecretKey,
            secretId,
            fileId,
            node,
            nodeNonce,
            publicTitle,
            allowedReads,
            passphrase,
            validTill,
            allowWrite,
        )
        .then(onSuccess, onError);
}

/**
 * Updates a link share
 *
 * @param {uuid} linkShareId The id of the link share
 * @param {string} publicTitle The new publicTitle of the link share
 * @param {int|null} allowedReads The amount of allowed access requests before this link secret becomes invalid
 * @param {string|null} passphrase The passphrase to protect the link secret
 * @param {string|null} validTill The valid till time in iso format
 *
 * @returns {Promise} Promise with the new id
 */
function updateLinkShare(linkShareId, publicTitle, allowedReads, passphrase, validTill) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    return apiClient
        .updateLinkShare(token, sessionSecretKey, linkShareId, publicTitle, allowedReads, passphrase, validTill)
        .then(onSuccess, onError);
}

/**
 * Deletes a link share
 *
 * @param {uuid} linkShareId The id of the link share to delete
 *
 * @returns {Promise} Promise
 */
function deleteLinkShare(linkShareId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function (result) {
        // pass
    };

    return apiClient.deleteLinkShare(token, sessionSecretKey, linkShareId).then(onSuccess, onError);
}

const linkShareService = {
    //readLinkShare: readLinkShare,
    readLinkShares: readLinkShares,
    linkShareAccessRead: linkShareAccessRead,
    linkShareAccessWrite: linkShareAccessWrite,
    createLinkShare: createLinkShare,
    updateLinkShare: updateLinkShare,
    deleteLinkShare: deleteLinkShare,
};
export default linkShareService;
