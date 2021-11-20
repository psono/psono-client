/**
 * Service to handle all share links related tasks
 */

import apiClient from "./api-client";

/**
 * Create a link between a share and a datastore or another (parent-)share
 *
 * @param {uuid} link_id the link id
 * @param {uuid} share_id the share ID
 * @param {uuid|undefined} [parent_share_id=null] (optional) parent share ID, necessary if no datastore_id is provided
 * @param {uuid|undefined} [parent_datastore_id=null] (optional) datastore ID, necessary if no parent_share_id is provided
 *
 * @returns {promise} Returns a promise withe the new share link id
 */
function createShareLink(link_id, share_id, parent_share_id, parent_datastore_id) {
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        return result;
    };

    return apiClient
        .createShareLink(managerBase.get_token(), managerBase.get_session_secret_key(), link_id, share_id, parent_share_id, parent_datastore_id)
        .then(onSuccess, onError);
}

/**
 * Moves a link between a share and a datastore or another (parent-)share
 *
 * @param {uuid} link_id The link id
 * @param {uuid|undefined} [new_parent_share_id] (optional) new parent share ID, necessary if no new_datastore_id is provided
 * @param {uuid|undefined} [new_parent_datastore_id] (optional) new datastore ID, necessary if no new_parent_share_id is provided
 *
 * @returns {promise} Returns a promise with the status of the move
 */
function moveShareLink(link_id, new_parent_share_id, new_parent_datastore_id) {
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        return result;
    };

    return apiClient
        .moveShareLink(managerBase.get_token(), managerBase.get_session_secret_key(), link_id, new_parent_share_id, new_parent_datastore_id)
        .then(onSuccess, onError);
}

/**
 * Delete a share link
 *
 * @param {uuid} link_id The link id one wants to delete
 * @returns {promise} Returns a promise with the status of the delete operation
 */
function deleteShareLink(link_id) {
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        return result;
    };

    return apiClient.deleteShareLink(managerBase.get_token(), managerBase.get_session_secret_key(), link_id).then(onSuccess, onError);
}

/**
 * triggered once a share moved. handles the update of links
 *
 * @param {uuid} link_id The link id that has moved
 * @param {TreeObject} parent The parent (either a share or a datastore)
 *
 * @returns {promise} Returns a promise with the status of the move
 */
function onShareMoved(link_id, parent) {
    var new_parent_share_id = undefined,
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

    return moveShareLink(link_id, new_parent_share_id, new_parent_datastore_id);
}

/**
 * triggered once a share is deleted.
 *
 * @param {uuid} link_id the link_id to delete
 */
function onShareDeleted(link_id) {
    return deleteShareLink(link_id);
}

const service = {
    createShareLink: createShareLink,
    moveShareLink: moveShareLink,
    deleteShareLink: deleteShareLink,
    onShareMoved: onShareMoved,
    onShareDeleted: onShareDeleted,
};
export default service;
