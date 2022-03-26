/**
 * Service to handle all share links related tasks
 */

import apiClient from "./api-client";
import store from "./store";

/**
 * Create a link between a share and a datastore or another (parent-)share
 *
 * @param {uuid} linkId the link id
 * @param {uuid} shareId the share ID
 * @param {uuid|undefined} [parentShareId=null] (optional) parent share ID, necessary if no datastore_id is provided
 * @param {uuid|undefined} [parentDatastoreId=null] (optional) datastore ID, necessary if no parentShareId is provided
 *
 * @returns {promise} Returns a promise withe the new share link id
 */
function createShareLink(linkId, shareId, parentShareId, parentDatastoreId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        return result;
    };

    return apiClient
        .createShareLink(token, sessionSecretKey, linkId, shareId, parentShareId, parentDatastoreId)
        .then(onSuccess, onError);
}

/**
 * Moves a link between a share and a datastore or another (parent-)share
 *
 * @param {uuid} linkId The link id
 * @param {uuid|undefined} [newParentShareId] (optional) new parent share ID, necessary if no new_datastore_id is provided
 * @param {uuid|undefined} [newParentDatastoreId] (optional) new datastore ID, necessary if no newParentShareId is provided
 *
 * @returns {promise} Returns a promise with the status of the move
 */
function moveShareLink(linkId, newParentShareId, newParentDatastoreId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        return result;
    };

    return apiClient
        .moveShareLink(token, sessionSecretKey, linkId, newParentShareId, newParentDatastoreId)
        .then(onSuccess, onError);
}

/**
 * Delete a share link
 *
 * @param {uuid} linkId The link id one wants to delete
 * @returns {promise} Returns a promise with the status of the delete operation
 */
function deleteShareLink(linkId) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        return result;
    };

    return apiClient.deleteShareLink(token, sessionSecretKey, linkId).then(onSuccess, onError);
}

/**
 * triggered once a share moved. handles the update of links
 *
 * @param {uuid} linkId The link id that has moved
 * @param {TreeObject} parent The parent (either a share or a datastore)
 *
 * @returns {promise} Returns a promise with the status of the move
 */
function onShareMoved(linkId, parent) {
    let new_parent_share_id = undefined,
        new_parent_datastore_id = undefined;

    if (parent.hasOwnProperty("share_id")) {
        new_parent_share_id = parent.share_id;
    } else if (parent.hasOwnProperty("datastore_id")) {
        new_parent_datastore_id = parent.datastore_id;
    } else {
        return Promise.reject({
            response: "error",
            error_data: "Could not determine if its a share or datastore parent",
        });
    }

    return moveShareLink(linkId, new_parent_share_id, new_parent_datastore_id);
}

/**
 * triggered once a share is deleted.
 *
 * @param {uuid} link_id the link_id to delete
 */
function onShareDeleted(link_id) {
    return deleteShareLink(link_id);
}

const shareLinkService = {
    createShareLink: createShareLink,
    moveShareLink: moveShareLink,
    deleteShareLink: deleteShareLink,
    onShareMoved: onShareMoved,
    onShareDeleted: onShareDeleted,
};
export default shareLinkService;
