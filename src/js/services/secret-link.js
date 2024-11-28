/**
 * Service to handle all secret links related tasks
 */

import apiClientService from "./api-client";
import { getStore } from "./store";
import secretService from "./secret";

let timeout = 0;

/**
 * Searches a datastore object and moves all links to the new target
 * Won't look into shares nor move them
 *
 * @param {object} datastore The datastore object
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no new_parent_datastore_id is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no new_parent_share_id is provided
 * @param {function|undefined} [onOpenRequest] (optional) callback function that is called whenever a request to the backend is fired
 * @param {function|undefined} [onClosedRequest] (optional) callback function that is called whenever a request to the backend finishes
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveSecretLinks(datastore, newParentShareId, newParentDatastoreId, onOpenRequest, onClosedRequest) {
    let i;

    function moveSecretLinkTimed(linkId, newParentShareId, newParentDatastoreId) {
        if (onOpenRequest) {
            onOpenRequest();
        }
        timeout = timeout + 50;
        setTimeout(function () {
            moveSecretLink(linkId, newParentShareId, newParentDatastoreId, undefined, onClosedRequest);
        }, timeout);
    }

    for (i = 0; datastore.hasOwnProperty("folders") && i < datastore["folders"].length; i++) {
        if (datastore["folders"][i].hasOwnProperty("share_id")) {
            continue;
        }
        moveSecretLinks(datastore["folders"][i], newParentShareId, newParentDatastoreId, onOpenRequest, onClosedRequest);
    }
    for (i = 0; datastore.hasOwnProperty("items") && i < datastore["items"].length; i++) {
        if (!datastore["items"][i].hasOwnProperty("secret_id")) {
            continue;
        }
        if (datastore["items"][i].hasOwnProperty("share_id")) {
            continue;
        }
        moveSecretLinkTimed(datastore["items"][i]["id"], newParentShareId, newParentDatastoreId);
    }
}

/**
 * Resets the timeout for secret links. need to be called before running moveSecretLinks
 */
function resetSecretLinkTimeout() {
    timeout = 0;
}

/**
 * Moves a secret to a new parent share or datastore
 *
 * @param {uuid} linkId The id of the link that should be moved
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no newParentShareId is provided
 * @param {function|undefined} [onOpenRequest] (optional) callback function that is called whenever a request to the backend is fired
 * @param {function|undefined} [onClosedRequest] (optional) callback function that is called whenever a request to the backend finishes
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveSecretLink(linkId, newParentShareId, newParentDatastoreId, onOpenRequest, onClosedRequest) {
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

    return apiClientService
        .moveSecretLink(token, sessionSecretKey, linkId, newParentShareId, newParentDatastoreId)
        .then(onSuccess, onError);
}

/**
 * Deletes a link to a secret
 *
 * @param {uuid} linkId The id of the link that should be deleted
 * @param {string} logAuditTitle The title for the audit log
 *
 * @returns {Promise} Returns a promise with the status of the delete operation
 */
function deleteSecretLink(linkId, logAuditTitle) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        // pass
    };

    return apiClientService.deleteSecretLink(token, sessionSecretKey, linkId, logAuditTitle).then(onSuccess, onError);
}

/**
 * triggered once a secret moved. handles the update of links
 *
 * @param {uuid} linkId The id of the link
 * @param {object} parent The new parent (share or datastore)
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function onSecretMoved(linkId, parent) {
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

    return moveSecretLink(linkId, new_parent_share_id, new_parent_datastore_id);
}

const secretLinkService = {
    moveSecretLinks: moveSecretLinks,
    resetSecretLinkTimeout: resetSecretLinkTimeout,
    moveSecretLink: moveSecretLink,
    deleteSecretLink: deleteSecretLink,
    onSecretMoved: onSecretMoved,
};
export default secretLinkService;
