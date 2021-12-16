/**
 * Service to handle all file links related tasks
 */

/**
 * Searches a datastore object and moves all links to the
 *
 * @param {object} datastore The datastore object
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no newParentShareId is provided
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveFileLinks(datastore, newParentShareId, newParentDatastoreId) {
    let i;
    for (i = 0; datastore.hasOwnProperty("folders") && i < datastore["folders"].length; i++) {
        moveFileLinks(datastore["folders"][i], newParentShareId, newParentDatastoreId);
    }
    for (i = 0; datastore.hasOwnProperty("items") && i < datastore["items"].length; i++) {
        if (datastore["items"][i].hasOwnProperty("file_id")) {
            moveFileLink(datastore["items"][i]["id"], newParentShareId, newParentDatastoreId);
        }
    }
}

/**
 * Moves a file to a new parent share or datastore
 *
 * @param {uuid} linkId The id of the link that should be moved
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no newParentShareId is provided
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveFileLink(linkId, newParentShareId, newParentDatastoreId) {
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        // pass
    };

    return apiClient
        .move_file_link(managerBase.get_token(), managerBase.get_session_secret_key(), linkId, newParentShareId, newParentDatastoreId)
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
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (content) {
        // pass
    };

    return apiClient.delete_file_link(managerBase.get_token(), managerBase.get_session_secret_key(), linkId).then(onSuccess, onError);
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
    moveFileLink: moveFileLink,
    deleteFileLink: deleteFileLink,
    onFileMoved: onFileMoved,
    onFileDeleted: onFileDeleted,
};
export default fileLinkService;
