/**
 * linkShare collects all functions to edit / update / create link shares and to work with them.
 */

import store from "./store";
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
//     const token = store.getState().user.token;
//     const sessionSecretKey = store.getState().user.sessionSecretKey;
//
//     const onSuccess = function (result) {
//         result.data.private_key = cryptoLibrary.decryptSecretKey(result.data.private_key, result.data.private_key_nonce);
//         delete result.data.private_key_nonce;
//         result.data.secret_key = cryptoLibrary.decryptSecretKey(result.data.secret_key, result.data.secret_key_nonce);
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

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
function readSecretWithLinkShare(encryptedSecret, item) {
    // normal secret
    const data = JSON.parse(
        cryptoLibrary.decryptData(encryptedSecret.secret_data, encryptedSecret.secret_data_nonce, item.secret_key)
    );

    const newItem = helper.duplicateObject(item);
    newItem["share_rights"] = {
        read: true,
        write: false,
        grant: false,
        delete: false,
    };
    return {
        item: newItem,
        data: data,
    };
    // const modalInstance = $uibModal.open({
    //     templateUrl: "view/modal/show-entry.html",
    //     controller: "ModalEditEntryCtrl",
    //     backdrop: "static",
    //     resolve: {
    //         node: function () {
    //             return item;
    //         },
    //         path: function () {
    //             return "";
    //         },
    //         data: function () {
    //             return secretData;
    //         },
    //     },
    // });
    //
    // modalInstance.result.then(
    //     function () {
    //         // should never happen
    //     },
    //     function () {
    //         // cancel triggered
    //     }
    // );
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
function linkShareAccess(linkShareId, linkShareSecret, passphrase) {
    const onSuccess = function (result) {
        const share_link_data = JSON.parse(
            cryptoLibrary.decryptData(result.data.node, result.data.node_nonce, linkShareSecret)
        );

        if (share_link_data.type === "file") {
            return readFileWithLinkShare(result.data, share_link_data);
        } else {
            // normal secret
            return readSecretWithLinkShare(result.data, share_link_data);
        }
    };
    const onError = function (result) {
        console.log(result);
        return Promise.reject(result.data);
    };

    return apiClient.linkShareAccess(linkShareId, passphrase).then(onSuccess, onError);
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
 *
 * @returns {Promise} Promise with the new link_secret_id
 */
function createLinkShare(secretId, fileId, node, nodeNonce, publicTitle, allowedReads, passphrase, validTill) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function (result) {
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
            validTill
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onSuccess = function (result) {
        return result.data;
    };
    const onError = function (result) {
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

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
    linkShareAccess: linkShareAccess,
    createLinkShare: createLinkShare,
    updateLinkShare: updateLinkShare,
    deleteLinkShare: deleteLinkShare,
};
export default linkShareService;
