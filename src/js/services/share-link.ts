/**
 * Service to handle all share links related tasks
 */

import apiClient from "./api-client";
import { getStore } from "./store";
import type { LinkTree } from "../../types/vault";

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
function createShareLink(
	linkId: string,
	shareId: string,
	parentShareId?: string,
	parentDatastoreId?: string,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onError = () => {
		// pass
	};

	const onSuccess = <T>(result: T): T => result;

	return apiClient
		.createShareLink(
			token,
			sessionSecretKey,
			linkId,
			shareId,
			parentShareId,
			parentDatastoreId,
		)
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
function moveShareLink(
	linkId: string,
	newParentShareId?: string,
	newParentDatastoreId?: string,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onError = () => {
		// pass
	};

	const onSuccess = <T>(result: T): T => result;

	return apiClient
		.moveShareLink(
			token,
			sessionSecretKey,
			linkId,
			newParentShareId,
			newParentDatastoreId,
		)
		.then(onSuccess, onError);
}

/**
 * Delete a share link
 *
 * @param {uuid} linkId The link id one wants to delete
 * @returns {promise} Returns a promise with the status of the delete operation
 */
function deleteShareLink(linkId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onError = () => {
		// pass
	};

	const onSuccess = <T>(result: T): T => result;

	return apiClient
		.deleteShareLink(token, sessionSecretKey, linkId)
		.then(onSuccess, onError);
}

/**
 * triggered once a share moved. handles the update of links
 *
 * @param {uuid} linkId The link id that has moved
 * @param {TreeObject} parent The parent (either a share or a datastore)
 *
 * @returns {promise} Returns a promise with the status of the move
 */
function onShareMoved(linkId: string, parent: LinkTree) {
	let new_parent_share_id, new_parent_datastore_id;

	if (Object.hasOwn(parent, "share_id")) {
		new_parent_share_id = parent.share_id;
	} else if (Object.hasOwn(parent, "datastore_id")) {
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
function onShareDeleted(link_id: string) {
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
