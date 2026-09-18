/**
 * Service to manage the history of a secret
 */

import apiClient from "./api-client";
import cryptoLibraryService from "./crypto-library";
import { getStore } from "./store";
import type { DataResponse, SecretData } from "../../types/datastore";

export interface SecretHistoryEntry {
	id: string;
	create_date: string;
	write_date: string;
	username?: string;
	user_id?: string;
	[field: string]: unknown;
}

interface HistoryDetail {
	data: string;
	data_nonce: string;
	create_date: string;
	write_date: string;
	callback_url?: string | null;
	callback_user?: string | null;
	callback_pass?: string | null;
}

/**
 * Reads the history of a secret from the server
 *
 * @param {uuid} secretId The secretId to read the history from
 *
 * @returns {Promise} Returns a list of history items
 */
function readSecretHistory(secretId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (response: DataResponse<unknown>) => {
		const data = response.data as { history: SecretHistoryEntry[] };
		return data.history;
	};

	const onError = () => {
		return undefined;
	};

	return apiClient
		.readSecretHistory(token, sessionSecretKey, secretId)
		.then(onSuccess, onError);
}

/**
 * Reads the the details of a history entry
 *
 * @param {uuid} secretHistoryId The id of the history list entry
 * @param {string} secretKey The secret key to decrypt the content of the history entry
 *
 * @returns {Promise} Returns a list of history items
 */
function readHistory<T extends SecretData = SecretData>(
	secretHistoryId: string,
	secretKey: string,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (response: DataResponse<unknown>) => {
		// History is a versioned encrypted endpoint; only its metadata is inspected here.
		const content = response as DataResponse<HistoryDetail>;
		const secret: T & Omit<HistoryDetail, "data" | "data_nonce"> = JSON.parse(
			cryptoLibraryService.decryptData(
				content.data.data,
				content.data.data_nonce,
				secretKey,
			),
		);
		secret["create_date"] = content.data["create_date"];
		secret["write_date"] = content.data["write_date"];
		secret["callback_url"] = content.data["callback_url"];
		secret["callback_user"] = content.data["callback_user"];
		secret["callback_pass"] = content.data["callback_pass"];
		return secret;
	};

	const onError = () => {
		return undefined;
	};

	return apiClient
		.readHistory(token, sessionSecretKey, secretHistoryId)
		.then(onSuccess, onError);
}

const historyService = {
	readSecretHistory: readSecretHistory,
	readHistory: readHistory,
};
export default historyService;
