/**
 * linkShare collects all functions to edit / update / create link shares and to work with them.
 */

import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import fileTransfer from "./file-transfer";
import helper from "./helper";
import { getStore } from "./store";
import type { DownloadFile, FileTransfer, Shard } from "../../types/files";
import type {
	LinkShareOverview,
	LinkShareReadLimitInput,
	SecretContent,
	SecretReference,
	ShareRights,
} from "../../types/vault";

interface EncryptedSharedSecret {
	secret_data: string;
	secret_data_nonce: string;
	allow_write?: boolean;
}

type SharedFileTransfer = FileTransfer & { shards?: Shard[] };
type SharedSecretNode = SecretReference & { share_rights?: ShareRights };
type LinkShareAccessResult = {
	item: SharedSecretNode;
	data: SecretContent;
} | void;
type LinkShareAccessData = { node: string; node_nonce: string } & (
	| EncryptedSharedSecret
	| SharedFileTransfer
);

function errorData(result: unknown): unknown {
	return (result as { data?: unknown }).data;
}

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
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: { data: LinkShareOverview }) => result.data;
	const onError = () => {
		// pass
	};

	return apiClient
		.readLinkShare(token, sessionSecretKey)
		.then(onSuccess, onError);
}

/**
 * Takes an ecrypted secret and the share link data object. Decrypt ths encrypted secret and returns int.
 *
 * @param {object} encryptedSecret The encrypted secret
 * @param {object} item The decrypted share link data object
 *
 * @returns {Object} Promise with the secret
 */
function readSecretWithLinkShare(
	encryptedSecret: EncryptedSharedSecret,
	item: SharedSecretNode,
) {
	// normal secret
	const data: SecretContent = JSON.parse(
		cryptoLibrary.decryptData(
			encryptedSecret.secret_data,
			encryptedSecret.secret_data_nonce,
			item.secret_key,
		),
	);

	const newItem = helper.duplicateObject(item);

	let write = false;
	if (
		Object.hasOwn(encryptedSecret, "allow_write") &&
		encryptedSecret.allow_write
	) {
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
function readFileWithLinkShare(
	encryptedFileMeta: SharedFileTransfer,
	shareLinkData: DownloadFile,
) {
	return fileTransfer.downloadFile(
		shareLinkData,
		// A share must not fall back to the account's cached file-server list.
		encryptedFileMeta["shards"] || [],
		encryptedFileMeta,
	);
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
function linkShareAccessRead(
	linkShareId: string,
	linkShareSecret: string,
	passphrase: string | null,
) {
	const onSuccess = (response: unknown) => {
		const result = response as { data: LinkShareAccessData };
		const share_link_data: { type: string } = JSON.parse(
			cryptoLibrary.decryptData(
				result.data.node,
				result.data.node_nonce,
				linkShareSecret,
			),
		);

		if (share_link_data.type === "file") {
			// The decrypted node type selects the matching server payload schema.
			return readFileWithLinkShare(
				result.data as SharedFileTransfer,
				share_link_data as DownloadFile & { type: string },
			);
		} else {
			// normal secret
			return readSecretWithLinkShare(
				result.data as EncryptedSharedSecret,
				share_link_data as SharedSecretNode,
			);
		}
	};
	const onError = (result: unknown) => {
		console.log(result);
		return Promise.reject(errorData(result));
	};

	return apiClient
		.linkShareAccessRead(linkShareId, passphrase)
		.then<LinkShareAccessResult>(onSuccess, onError);
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
function linkShareAccessWrite(
	linkShareId: string,
	linkShareSecret: string,
	secretKey: string,
	content: object,
	passphrase: string | null,
) {
	const jsonContent = JSON.stringify(content);

	const c = cryptoLibrary.encryptData(jsonContent, secretKey);

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = (result: unknown) => {
		console.log(result);
		return Promise.reject(errorData(result));
	};

	return apiClient
		.linkShareAccessWrite(linkShareId, c.text, c.nonce, passphrase)
		.then(onSuccess, onError);
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
function createLinkShare(
	secretId: string | null | undefined,
	fileId: string | null | undefined,
	node: string,
	nodeNonce: string,
	publicTitle: string,
	allowedReads: number | null,
	passphrase: string | null,
	validTill: string | null,
	allowWrite: boolean,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: unknown) =>
		(result as { data: { link_share_id: string } }).data;
	const onError = (result: unknown) => Promise.reject(result);

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
function updateLinkShare(
	linkShareId: string,
	publicTitle: string,
	allowedReads: LinkShareReadLimitInput,
	passphrase: string | null,
	validTill: string | null,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = (result: unknown) => Promise.reject(errorData(result));

	return apiClient
		.updateLinkShare(
			token,
			sessionSecretKey,
			linkShareId,
			publicTitle,
			allowedReads,
			passphrase,
			validTill,
		)
		.then(onSuccess, onError);
}

/**
 * Deletes a link share
 *
 * @param {uuid} linkShareId The id of the link share to delete
 *
 * @returns {Promise} Promise
 */
function deleteLinkShare(linkShareId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClient
		.deleteLinkShare(token, sessionSecretKey, linkShareId)
		.then(onSuccess, onError);
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
