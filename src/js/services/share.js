/**
 * Service to handle all share related tasks
 */

import cryptoLibrary from "../services/crypto-library";
import apiClient from "../services/api-client";
import store from "./store";
import datastoreService from "./datastore";
import secretLinkService from "./secret-link";
import fileLinkService from "./file-link";
import shareLinkService from "./share-link";

const registrations = {};

/**
 * Returns a share object with decrypted data
 *
 * @param {uuid} shareId The id of the share
 * @param {string} secretKey The secret key of the share
 *
 * @returns {Promise} Returns a promise with the decrypted content of the share
 */
function readShare(shareId, secretKey) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        return {
            data: JSON.parse(cryptoLibrary.decryptData(content.data.data, content.data.data_nonce, secretKey)),
            rights: content.data.rights,
        };
    };

    return apiClient.readShare(token, sessionSecretKey, shareId).then(onSuccess, onError);
}

/**
 * Fetches an overview of all shares
 *
 * @returns {Promise} Returns a list of all shares
 */
function readShares() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        for (let i = content.data.shares.length - 1; i >= 0; i--) {
            if (content.data.shares[i].share_right_title !== "" && content.data.shares[i].share_right_create_user_public_key) {
                content.data.shares[i].share_right_title = cryptoLibrary.decryptPrivateKey(
                    content.data.shares[i].share_right_title,
                    content.data.shares[i].share_right_title_nonce,
                    content.data.shares[i].share_right_create_user_public_key
                );
            }
        }

        return content.data;
    };

    return apiClient.readShares(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * updates a share
 *
 * @param {uuid} shareId The id of the share
 * @param {object} content The content that the share should be updated with
 * @param {string} secretKey The secret key of the share
 *
 * @returns {Promise} Returns a promise with the status of the update
 */
function writeShare(shareId, content, secretKey) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    if (content.hasOwnProperty("id")) {
        delete content.id;
    }

    const jsonContent = JSON.stringify(content);

    const encryptedData = cryptoLibrary.encryptData(jsonContent, secretKey);
    return apiClient.writeShare(token, sessionSecretKey, shareId, encryptedData.text, encryptedData.nonce);
}

/**
 * Creates a share for the given content and returns the id and the secret to decrypt the share secret
 *
 * @param {object} content The content of the new share
 * @param {uuid|undefined} [parentShareId] (optional) The parent share's id
 * @param {uuid|undefined} [parentDatastoreId] (optional) The parent datastore's id
 * @param {uuid} linkId The link id in the parent
 *
 * @returns {Promise} Returns a promise with the status and the new share id
 */
function createShare(content, parentShareId, parentDatastoreId, linkId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const child_shares = [];
    registrations["get_all_child_shares"](content, 1, child_shares, []);

    const filtered_content = datastoreService.filterDatastoreContent(content);
    let old_link_id;

    if (filtered_content.hasOwnProperty("id")) {
        old_link_id = filtered_content.id;
        delete filtered_content.id;
    }

    const secret_key = cryptoLibrary.generateSecretKey();

    const json_content = JSON.stringify(filtered_content);

    const encrypted_data = cryptoLibrary.encryptData(json_content, secret_key);
    const encrypted_key = cryptoLibrary.encryptSecretKey(secret_key);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        if (filtered_content.hasOwnProperty("secret_id")) {
            secretLinkService.moveSecretLink(old_link_id, content.data.share_id);
        } else {
            secretLinkService.resetSecretLinkTimeout();
            secretLinkService.moveSecretLinks(filtered_content, content.data.share_id);
        }

        if (filtered_content.hasOwnProperty("file_id")) {
            fileLinkService.moveFileLink(old_link_id, content.data.share_id);
        } else {
            fileLinkService.moveFileLinks(filtered_content, content.data.share_id);
        }

        // Update all child shares to be now a child of this share.
        for (let i = 0; i < child_shares.length; i++) {
            shareLinkService.moveShareLink(child_shares[i]["share"]["id"], content.data.share_id, undefined);
        }

        return { share_id: content.data.share_id, secret_key: secret_key };
    };

    return apiClient
        .createShare(
            token,
            sessionSecretKey,
            encrypted_data.text,
            encrypted_data.nonce,
            encrypted_key.text,
            encrypted_key.nonce,
            parentShareId,
            parentDatastoreId,
            linkId
        )
        .then(onSuccess, onError);
}

/**
 * Returns share rights for a specific share
 *
 * @param {uuid} shareId The id of the share
 *
 * @returns {Promise} Returns a promise with all the specific rights
 */
function readShareRights(shareId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        return content.data;
    };

    return apiClient.readShareRights(token, sessionSecretKey, shareId).then(onSuccess, onError);
}

/**
 * Returns all the share rights of the current user
 *
 * @returns {Promise} Returns a promise with the share rights overview
 */
function readShareRightsOverview() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        return content.data;
    };

    return apiClient.readShareRightsOverview(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * creates the rights for a specified share and user
 *
 * @param {string} title The title of the share right
 * @param {string} type The type of the share right
 * @param {uuid} shareId The share id
 * @param {uuid} userId The user id
 * @param {uuid} groupId The group id
 * @param {string} publicKey The other user's / group's public key
 * @param {string} secretKey The other user's / group's public key
 * @param {string} key the key of the share
 * @param {boolean} read The read right
 * @param {boolean} write The write right
 * @param {boolean} grant The grant right
 *
 * @returns {Promise} Returns a promise with the new share right id
 */
function createShareRight(title, type, shareId, userId, groupId, publicKey, secretKey, key, read, write, grant) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    let encrypted_key, encrypted_title, encrypted_type;

    const onError = function (result) {
        return Promise.reject(result);
    };

    const onSuccess = function (content) {
        return { share_right_id: content.data.share_right_id };
    };

    if (typeof publicKey !== "undefined") {
        encrypted_key = cryptoLibrary.encryptPrivateKey(key, publicKey);
        encrypted_title = cryptoLibrary.encryptPrivateKey(title, publicKey);
        encrypted_type = cryptoLibrary.encryptPrivateKey(type, publicKey);
    } else {
        encrypted_key = cryptoLibrary.encryptData(key, secretKey);
        encrypted_title = cryptoLibrary.encryptData(title, secretKey);
        encrypted_type = cryptoLibrary.encryptData(type, secretKey);
    }

    return apiClient
        .createShareRight(
            token,
            sessionSecretKey,
            encrypted_title.text,
            encrypted_title.nonce,
            encrypted_type.text,
            encrypted_type.nonce,
            shareId,
            userId,
            groupId,
            encrypted_key.text,
            encrypted_key.nonce,
            read,
            write,
            grant
        )
        .then(onSuccess, onError);
}

/**
 * updates the rights for a specified share and user
 *
 * @param {uuid} shareId The share id
 * @param {uuid} userId The user id
 * @param {uuid} groupId The group id
 * @param {boolean} read The read right
 * @param {boolean} write The write right
 * @param {boolean} grant The grant right
 *
 * @returns {Promise} Returns a promise with the update status
 */
function updateShareRight(shareId, userId, groupId, read, write, grant) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
        return Promise.reject(result.data);
    };

    const onSuccess = function (content) {
        return { share_right_id: content.data.share_right_id };
    };

    return apiClient.updateShareRight(token, sessionSecretKey, shareId, userId, groupId, read, write, grant).then(onSuccess, onError);
}

/**
 * deletes a specific share right
 *
 * @param {uuid} userShareRightId The user share right id
 * @param {uuid} groupShareRightId The user share right id
 *
 * @returns {Promise} Returns a promise with the status of the delete
 */
function deleteShareRight(userShareRightId, groupShareRightId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        return { share_right_id: content.data.share_right_id };
    };

    return apiClient.deleteShareRight(token, sessionSecretKey, userShareRightId, groupShareRightId).then(onSuccess, onError);
}

/**
 * Takes an encrypted share and decrypts the data (if present) with the provided secret_key
 *
 * @param {object} encryptedShare The encrypted share
 * @param {string} secretKey The secret key to decrypt the share
 *
 * @returns {object} The decrypted share
 */
function decryptShare(encryptedShare, secretKey) {
    let share = {};

    if (typeof encryptedShare.share_data !== "undefined") {
        share = JSON.parse(cryptoLibrary.decryptData(encryptedShare.share_data, encryptedShare.share_data_nonce, secretKey));
    }

    share.share_id = encryptedShare.share_id;
    share.share_secret_key = secretKey;

    return share;
}

/**
 * accepts a specific share right
 *
 * @param {uuid} shareRightId The share right id that one wants to accept
 * @param {string} text The encrypted share secret key
 * @param {string} nonce The nonce of the share secret key
 * @param {string} publicKey The public key of the other user
 *
 * @returns {Promise} Returns a promise with the share content
 */
function acceptShareRight(shareRightId, text, nonce, publicKey) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const secret_key = cryptoLibrary.decryptPrivateKey(text, nonce, publicKey);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        const decrypted_share = decryptShare(content.data, secret_key);

        if (typeof decrypted_share.type === "undefined" && typeof content.data.share_type !== "undefined") {
            const type = cryptoLibrary.decryptPrivateKey(content.data.share_type, content.data.share_type_nonce, publicKey);

            if (type !== "folder") {
                decrypted_share.type = type;
            }
        }

        return decrypted_share;
    };

    const encrypted_key = cryptoLibrary.encryptSecretKey(secret_key);

    return apiClient.acceptShareRight(token, sessionSecretKey, shareRightId, encrypted_key.text, encrypted_key.nonce).then(onSuccess, onError);
}

/**
 * declines a specific share right
 *
 * @param {uuid} shareRightId The share right id of the share right one wants to decline
 *
 * @returns {Promise} Returns a promise with the status of the decline
 */
function declineShareRight(shareRightId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        // pass
    };

    return apiClient.declineShareRight(token, sessionSecretKey, shareRightId).then(onSuccess, onError);
}

/**
 * returns the closest share. if no share exists for the specified path, the initially specified closest_share
 * is returned.
 *
 * @param {Array} path The path of the item we want the closest parent of
 * @param {TreeObject} datastore The datastore to search
 * @param {TreeObject} closestShare The closest parent (so far)
 * @param {int} distance The distance to keep to the actual objects path
 *
 * @returns {false|TreeObject} Returns the closest parent or false
 */
function getClosestParentShare(path, datastore, closestShare, distance) {
    const original_path = path.slice();

    const get_closest_parent_share_helper = function (path, datastore, closest_share, relative_path, distance) {
        let n, l;

        if (path.length === distance) {
            return {
                closest_share: closest_share,
                relative_path: relative_path, //relative path inside of the share to the item
                path_to_share: original_path.slice(0, original_path.length - relative_path.length), //path to the share itself
            };
        }

        const to_search = path.shift();

        if (datastore.hasOwnProperty("folders")) {
            for (n = 0, l = datastore.folders.length; n < l; n++) {
                if (datastore.folders[n].id === to_search) {
                    if (typeof datastore.folders[n].share_id !== "undefined") {
                        return get_closest_parent_share_helper(path.slice(), datastore.folders[n], datastore.folders[n], path.slice(), distance);
                    } else {
                        return get_closest_parent_share_helper(path.slice(), datastore.folders[n], closest_share, relative_path, distance);
                    }
                }
            }
        }

        if (datastore.hasOwnProperty("items")) {
            for (n = 0, l = datastore.items.length; n < l; n++) {
                if (datastore.items[n].id === to_search) {
                    return {
                        closest_share: closest_share,
                        relative_path: relative_path,
                        path_to_share: original_path.slice(0, original_path.length - relative_path.length),
                    };
                }
            }
        }

        return false;
    };

    return get_closest_parent_share_helper(path, datastore, closestShare, path.slice(), distance);
}

/**
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key, func) {
    registrations[key] = func;
}

// registrations
//
// itemBlueprint.register('read_share_rights', read_share_rights);
// itemBlueprint.register('create_share', create_share);
// itemBlueprint.register('create_share_right', create_share_right);
// itemBlueprint.register('get_closest_parent_share', get_closest_parent_share);

const shareService = {
    readShare: readShare,
    readShares: readShares,
    writeShare: writeShare,
    createShare: createShare,
    readShareRights: readShareRights,
    readShareRightsOverview: readShareRightsOverview,
    createShareRight: createShareRight,
    updateShareRight: updateShareRight,
    deleteShareRight: deleteShareRight,
    decryptShare: decryptShare,
    acceptShareRight: acceptShareRight,
    declineShareRight: declineShareRight,
    getClosestParentShare: getClosestParentShare,
    register: register,
};
export default shareService;
