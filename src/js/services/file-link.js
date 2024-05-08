/**
 * Service to handle all file links related tasks
 */

import apiClient from "../services/api-client";
import { getStore } from "./store";

let timeout = 0;
/**
 * Searches a datastore object and moves all links to the
 *
 * @param {object} datastore The datastore object
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no newParentShareId is provided
 * @param {function|undefined} [onOpenRequest] (optional) callback function that is called whenever a request to the backend is fired
 * @param {function|undefined} [onClosedRequest] (optional) callback function that is called whenever a request to the backend finishes
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveFileLinks(datastore, newParentShareId, newParentDatastoreId, onOpenRequest, onClosedRequest) {
    let i;
    function moveFileLinkTimed(linkId, newParentShareId, newParentDatastoreId) {
        onOpenRequest()
        timeout = timeout + 50;
        setTimeout(function () {
            moveFileLink(linkId, newParentShareId, newParentDatastoreId, undefined, onClosedRequest);
        }, timeout);
    }
    for (i = 0; datastore.hasOwnProperty("folders") && i < datastore["folders"].length; i++) {
        if (datastore["folders"][i].hasOwnProperty("share_id")) {
            continue;
        }
        moveFileLinks(datastore["folders"][i], newParentShareId, newParentDatastoreId, onOpenRequest, onClosedRequest);
    }
    for (i = 0; datastore.hasOwnProperty("items") && i < datastore["items"].length; i++) {
        if (datastore["items"][i].hasOwnProperty("share_id")) {
            continue;
        }
        if (datastore["items"][i].hasOwnProperty("file_id")) {
            moveFileLinkTimed(datastore["items"][i]["id"], newParentShareId, newParentDatastoreId);
        }
    }
}

/**
 * Resets the timeout for file links. need to be called before running moveFileLinks
 */
function resetFileLinkTimeout() {
    timeout = 0;
}

/**
 * Moves a file to a new parent share or datastore
 *
 * @param {uuid} linkId The id of the link that should be moved
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no newParentShareId is provided
 * @param {function|undefined} [onOpenRequest] (optional) callback function that is called whenever a request to the backend is fired
 * @param {function|undefined} [onClosedRequest] (optional) callback function that is called whenever a request to the backend finishes
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveFileLink(linkId, newParentShareId, newParentDatastoreId, onOpenRequest, onClosedRequest) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    if (onOpenRequest) {
        onOpenRequest()
    }

    const onError = function (result) {
        if (onClosedRequest) {
            onClosedRequest()
        }
    };

    const onSuccess = function (content) {
        if (onClosedRequest) {
            onClosedRequest()
        }
    };

    return apiClient
        .moveFileLink(token, sessionSecretKey, linkId, newParentShareId, newParentDatastoreId)
        .then(onSuccess, onError);
}

/**
 * Deletes a link to a file
 *
 * @param {uuid} linkId The id of the link that should be deleted
 *
 * @returns {Promise} Returns a promise with the status of the delete operation
 */
function deleteFileLink(linkId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        // pass
    };

    return apiClient.deleteFileLink(token, sessionSecretKey, linkId).then(onSuccess, onError);
}

/**
 * triggered once a file moved. handles the update of links
 *
 * @param {uuid} linkId The id of the link
 * @param {object} parent The new parent (share or datastore)
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function onFileMoved(linkId, parent) {
    let new_parent_share_id, new_parent_datastore_id;

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

    return moveFileLink(linkId, new_parent_share_id, new_parent_datastore_id);
}

/**
 * triggered once a file is deleted.
 *
 * @param {uuid} linkId The linkId to delete
 *
 * @returns {Promise} Returns a promise with the status of the delete operation
 */
function onFileDeleted(linkId) {
    return deleteFileLink(linkId);
}

const fileLinkService = {
    moveFileLinks: moveFileLinks,
    resetFileLinkTimeout: resetFileLinkTimeout,
    moveFileLink: moveFileLink,
    deleteFileLink: deleteFileLink,
    onFileMoved: onFileMoved,
    onFileDeleted: onFileDeleted,
};
export default fileLinkService;
