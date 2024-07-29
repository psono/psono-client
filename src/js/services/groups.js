/**
 * Service to manage the groups and group related functions
 */
import cryptoLibraryService from "./crypto-library";
import apiClient from "./api-client";
import datastorePasswordService from "./datastore-password";
import helper from "./helper";
import { getStore } from "./store";
import shareService from "./share";

let groups_cache = [];
const group_secret_key_cache = {};
const group_private_key_cache = {};

/**
 * Returns the secret key of a group
 *
 * @param {uuid} groupId The group id
 * @param {string} groupSecretKey The group's secret key (encrypted)
 * @param {string} groupSecretKeyNonce The nonce for the decryption of the group's secret key
 * @param {string} groupSecretKeyType The type of the encryption
 * @param {string} groupPublicKey The group's public key (necessary if the encryption is asymmetric)
 *
 * @returns {Promise<String>} Returns the secret key of a group
 */
async function getGroupSecretKey(groupId, groupSecretKey, groupSecretKeyNonce, groupSecretKeyType, groupPublicKey) {
    if (group_secret_key_cache.hasOwnProperty(groupId)) {
        return group_secret_key_cache[groupId];
    }
    if (typeof groupSecretKey === "undefined") {
        for (let i = 0; i < groups_cache.length; i++) {
            if (groups_cache[i]["group_id"] !== groupId) {
                continue;
            }

            groupSecretKey = groups_cache[i]["secret_key"];
            groupSecretKeyNonce = groups_cache[i]["secret_key_nonce"];
            groupSecretKeyType = groups_cache[i]["secret_key_type"];
            groupPublicKey = groups_cache[i]["public_key"];

            break;
        }
    }
    if (groupSecretKeyType === "symmetric") {
        group_secret_key_cache[groupId] = await cryptoLibraryService.decryptSecretKey(groupSecretKey, groupSecretKeyNonce);
    } else {
        group_secret_key_cache[groupId] = await cryptoLibraryService.decryptPrivateKey(
            groupSecretKey,
            groupSecretKeyNonce,
            groupPublicKey
        );
    }

    return group_secret_key_cache[groupId];
}

/**
 * Returns the private key of a group. Uses a temporary cache to reduce the encryption effort.
 *
 * @param {uuid} groupId The group id
 * @param {string} groupPrivateKey The group's private key (encrypted)
 * @param {string} groupPrivateKeyNonce The nonce for the decryption of the group's private key
 * @param {string} groupPrivateKeyType The type of the encryption
 * @param {string} groupPublicKey The group's public key (necessary if the encryption is asymmetric)
 *
 * @returns {Promise<String>} Returns the private key of a group
 */
async function getGroupPrivateKey(groupId, groupPrivateKey, groupPrivateKeyNonce, groupPrivateKeyType, groupPublicKey) {
    if (group_private_key_cache.hasOwnProperty(groupId)) {
        return group_private_key_cache[groupId];
    }
    if (groupPrivateKeyType === "symmetric") {
        group_private_key_cache[groupId] = await cryptoLibraryService.decryptSecretKey(groupPrivateKey, groupPrivateKeyNonce);
    } else {
        group_private_key_cache[groupId] = await cryptoLibraryService.decryptPrivateKey(
            groupPrivateKey,
            groupPrivateKeyNonce,
            groupPublicKey
        );
    }

    return group_private_key_cache[groupId];
}

/**
 * Looks up the secret key of the group in the local cache and decrypts the provided encrypted message together
 * with the nonce
 *
 * @param {uuid} groupId The group id
 * @param {string} encryptedMessage The encrypted message
 * @param {string} encryptedMessageNonce The nonce of the encrypted message
 *
 * @returns {Promise<String>} Returns the decrypted message
 */
async function decryptSecretKey(groupId, encryptedMessage, encryptedMessageNonce) {
    const secretKey = await getGroupSecretKey(groupId);
    return await cryptoLibraryService.decryptData(encryptedMessage, encryptedMessageNonce, secretKey);
}

/**
 * Looks up the secret key of the group in the local cache and decrypts the provided encrypted message together
 * with the nonce
 *
 * @param {uuid} groupId The group id
 * @param {string} encryptedMessage The encrypted message
 * @param {string} encryptedMessageNonce The nonce of the encrypted message
 * @param {string} publicKey The corresponding public key
 *
 * @returns {Promise<String>} Returns the decrypted secret
 */
async function decrypt_private_key(groupId, encryptedMessage, encryptedMessageNonce, publicKey) {
    const private_key = await getGroupPrivateKey(groupId);
    return await cryptoLibraryService.decryptDataPublicKey(encryptedMessage, encryptedMessageNonce, publicKey, private_key);
}

/**
 * Fetches the details of one group
 *
 * @param {uuid} groupId the group id
 *
 * @returns {Promise} Returns the details of a group
 */
function readGroup(groupId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.readGroup(token, sessionSecretKey, groupId).then(onSuccess, onError);
}

/**
 * Fetches the list of all groups this user belongs to and updates the local cache
 *
 * @param {boolean} forceFresh Force fresh call to the backend
 *
 * @returns {Promise} Returns a list of groups
 */
function readGroups(forceFresh) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    if ((typeof forceFresh === "undefined" || forceFresh === false) && groups_cache.length > 0) {
        return Promise.resolve(helper.duplicateObject(groups_cache));
    }

    const onSuccess = function (data) {
        groups_cache = helper.duplicateObject(data.data.groups);
        return data.data.groups;
    };

    const onError = function () {
        //pass
    };

    return apiClient.readGroup(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Creates a new group and updates the local cache
 *
 * @param {string} name the name for the new group
 *
 * @returns {Promise} Returns whether the creation was successful or not
 */
async function createGroup(name) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        groups_cache.push(helper.duplicateObject(data.data));
        return data.data;
    };

    const onError = function () {
        //pass
    };

    const group_secret_key = cryptoLibraryService.generateSecretKey();
    const group_secret_key_enc = await cryptoLibraryService.encryptSecretKey(group_secret_key);
    const group_key_pair = await cryptoLibraryService.generatePublicPrivateKeypair();
    const group_private_key_enc = await cryptoLibraryService.encryptSecretKey(group_key_pair["private_key"]);
    const group_public_key = group_key_pair["public_key"];

    return apiClient
        .createGroup(
            token,
            sessionSecretKey,
            name,
            group_secret_key_enc.text,
            group_secret_key_enc.nonce,
            group_private_key_enc.text,
            group_private_key_enc.nonce,
            group_public_key
        )
        .then(onSuccess, onError);
}

/**
 * Updates a given group and updates the local cache
 *
 * @param {uuid} groupId the group id
 * @param {string} name the new name of the group
 *
 * @returns {Promise} Returns whether the update was successful or not
 */
function updateGroup(groupId, name) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        for (let i = 0; i < groups_cache.length; i++) {
            if (groups_cache[i].group_id !== groupId) {
                continue;
            }
            groups_cache[i] = name;
        }

        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.updateGroup(token, sessionSecretKey, groupId, name).then(onSuccess, onError);
}

/**
 * Deletes a given group
 *
 * @param {uuid} groupId the group id and updates the local cache
 *
 * @returns {Promise} Returns whether the delete was successful or not
 */
function deleteGroup(groupId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        helper.removeFromArray(groups_cache, groupId, function (a, b) {
            return a["group_id"] === b;
        });
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.deleteGroup(token, sessionSecretKey, groupId).then(onSuccess, onError);
}

/**
 * Reads the all group rights of the user or the group rights of a specific group
 *
 * @param {uuid|undefined} [groupId] (optional) group ID
 *
 * @returns {Promise} Returns a list of groups rights
 */
function readGroupRights(groupId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.readGroupRights(token, sessionSecretKey, groupId).then(onSuccess, onError);
}

/**
 * Gets all group rights and compares it the accessible rights in the current password datastore.
 * Will return a list of share rights not yet in the datastore.
 *
 * @returns {Promise} Returns a dict with the inaccessible group shares, grouped by group_id
 */
function getOutstandingGroupShares() {
    const onSuccess = async function (data) {
        const inaccessibleShareList = await datastorePasswordService.getInaccessibleShares(data.group_rights);
        const inaccessibleShareByGroupDict = {};

        for (let i = 0; i < inaccessibleShareList.length; i++) {
            const inaccessibleShare = inaccessibleShareList[i];

            if (!inaccessibleShareByGroupDict.hasOwnProperty(inaccessibleShare.group_id)) {
                inaccessibleShareByGroupDict[inaccessibleShare.group_id] = {};
            }
            inaccessibleShareByGroupDict[inaccessibleShare.group_id][inaccessibleShare.share_id] = inaccessibleShare;
        }

        return inaccessibleShareByGroupDict;
    };

    const onError = function () {
        //pass
    };

    return readGroupRights().then(onSuccess, onError);
}

/**
 * Creates a new group membership. Encrypts the group secrets (secret and private key) asymmetric with the the
 * groups private key and the users public key and sends everything to the server.
 *
 * @param {object} user The user for the new membership
 * @param {object} group The group for the new membership
 * @param {boolean} groupAdmin If the new group member should get group admin rights or not
 * @param {boolean} shareAdmin If the new group member should get share admin rights or not
 *
 * @returns {Promise} Returns whether the creation was successful or not
 */
async function createMembership(user, group, groupAdmin, shareAdmin) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        return request.data;
    };

    const onError = async function (request) {
        request = await request;
        return Promise.reject(request);
    };

    const groupSecretKey = await getGroupSecretKey(
        group.group_id,
        group.secret_key,
        group.secret_key_nonce,
        group.secret_key_type,
        group.public_key
    );

    const groupPrivateKey = await getGroupPrivateKey(
        group.group_id,
        group.private_key,
        group.private_key_nonce,
        group.private_key_type,
        group.public_key
    );

    const groupSecretKeyEncrypted = await cryptoLibraryService.encryptDataPublicKey(
        groupSecretKey,
        user.public_key,
        groupPrivateKey
    );
    const groupPrivateKeyEncrypted = await cryptoLibraryService.encryptDataPublicKey(
        groupPrivateKey,
        user.public_key,
        groupPrivateKey
    );

    return apiClient
        .createMembership(
            token,
            sessionSecretKey,
            group.group_id,
            user.id,
            groupSecretKeyEncrypted.text,
            groupSecretKeyEncrypted.nonce,
            "asymmetric",
            groupPrivateKeyEncrypted.text,
            groupPrivateKeyEncrypted.nonce,
            "asymmetric",
            groupAdmin,
            shareAdmin
        )
        .then(onSuccess, onError);
}

/**
 * Updates a group membership
 *
 * @param {uuid} membershipId The membershipId to delete
 * @param {boolean} groupAdmin If the group member should get group admin rights or not
 * @param {boolean} shareAdmin If the group member should get share admin rights or not
 *
 * @returns {Promise} Returns whether the deletion was successful or not
 */
function updateMembership(membershipId, groupAdmin, shareAdmin) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient
        .updateMembership(token, sessionSecretKey, membershipId, groupAdmin, shareAdmin)
        .then(onSuccess, onError);
}

/**
 * Deletes a group membership
 *
 * @param {uuid} membershipId The membershipId to delete
 *
 * @returns {Promise} Returns whether the deletion was successful or not
 */
function deleteMembership(membershipId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.deleteMembership(token, sessionSecretKey, membershipId).then(onSuccess, onError);
}

/**
 * Decrypts for a given group a share
 *
 * @param {uuid} groupId The group id
 * @param {object} share The encrypted share
 *
 * @returns {Promise<object>} The decrypted sahre
 */
async function decryptGroupShare(groupId, share) {
    const share_secret_key = await decryptSecretKey(groupId, share.share_key, share.share_key_nonce);
    const decrypted_share = shareService.decryptShare(share, share_secret_key);

    if (typeof decrypted_share.name === "undefined") {
        decrypted_share.name = await decryptSecretKey(groupId, share.share_title, share.share_title_nonce);
    }

    if (typeof decrypted_share.type === "undefined" && typeof share.share_type !== "undefined") {
        const type = await decryptSecretKey(groupId, share.share_type, share.share_type_nonce);

        if (type !== "folder") {
            decrypted_share.type = type;
        }
    }

    return decrypted_share;
}

/**
 * Decrypts for a given group a list of shares
 *
 * @param {uuid} groupId The group id
 * @param {Array} shares A list of encrypted shares
 *
 * @returns {Promise<Array>} A list of decrypted shares
 */
function decryptGroupShares(groupId, shares) {
    const decrypted_shares = [];
    for (let i = 0; i < shares.length; i++) {
        const decrypted_share = decryptGroupShare(groupId, shares[i]);
        decrypted_shares.push(decrypted_share);
    }

    return Promise.all(decrypted_shares);
}

/**
 * Accepts a group membership request and decrypts the secrets so they can later be added to the datastore
 *
 * @param {uuid} membershipId The membershipId to accept
 *
 * @returns {Promise} Returns the decrypted share
 */
function acceptMembership(membershipId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        let group_id;
        let public_key;
        for (let i = 0; i < groups_cache.length; i++) {
            if (groups_cache[i]["membership_id"] !== membershipId) {
                continue;
            }

            group_id = groups_cache[i]["group_id"];
            groups_cache[i]["accepted"] = true;
            groups_cache[i]["secret_key"] = data.data.secret_key;
            groups_cache[i]["secret_key_nonce"] = data.data.secret_key_nonce;
            groups_cache[i]["secret_key_type"] = data.data.secret_key_type;
            groups_cache[i]["private_key"] = data.data.private_key;
            groups_cache[i]["private_key_nonce"] = data.data.private_key_nonce;
            groups_cache[i]["private_key_type"] = data.data.private_key_type;

            public_key = groups_cache[i]["public_key"];

            delete groups_cache[i]["share_right_grant"];
            delete groups_cache[i]["user_id"];
            delete groups_cache[i]["user_username"];

            break;
        }

        return decryptGroupShares(group_id, data.data.shares);
    };

    const onError = function () {
        //pass
    };

    return apiClient.acceptMembership(token, sessionSecretKey, membershipId).then(onSuccess, onError);
}

/**
 * Declines a group membership request
 *
 * @param {uuid} membershipId The membershipId to decline
 *
 * @returns {Promise} Returns whether the declination was successful or not
 */
function declineMembership(membershipId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (data) {
        return data.data;
    };

    const onError = function () {
        //pass
    };

    return apiClient.declineMembership(token, sessionSecretKey, membershipId).then(onSuccess, onError);
}

//itemBlueprint.register('getGroupSecretKey', getGroupSecretKey);

const groupsService = {
    getGroupSecretKey: getGroupSecretKey,
    getGroupPrivateKey: getGroupPrivateKey,
    decryptSecretKey: decryptSecretKey,
    readGroup: readGroup,
    readGroups: readGroups,
    createGroup: createGroup,
    updateGroup: updateGroup,
    deleteGroup: deleteGroup,
    readGroupRights: readGroupRights,
    getOutstandingGroupShares: getOutstandingGroupShares,
    createMembership: createMembership,
    updateMembership: updateMembership,
    deleteMembership: deleteMembership,
    decryptGroupShare: decryptGroupShare,
    decryptGroupShares: decryptGroupShares,
    acceptMembership: acceptMembership,
    declineMembership: declineMembership,
};
export default groupsService;
