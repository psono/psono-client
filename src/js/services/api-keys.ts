/**
 * managerAPIKeys collects all functions to edit / update / create api keys and to work with them.
 */

import i18n from "../i18n";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import notification from "./notification";
import { getStore } from "./store";
import type {
	ApiKey,
	ApiKeyOverview,
	ApiKeySecret,
	NamedSecretReference,
} from "../../types/vault";

/**
 * Returns one api keys
 *
 * @returns {Promise} Promise with the api keys
 */
function readApiKey(apiKeyId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: { data: ApiKey }) => {
		result.data.private_key = cryptoLibrary.decryptSecretKey(
			result.data.private_key,
			result.data.private_key_nonce!,
		);
		delete result.data.private_key_nonce;
		result.data.secret_key = cryptoLibrary.decryptSecretKey(
			result.data.secret_key,
			result.data.secret_key_nonce!,
		);
		delete result.data.secret_key_nonce;

		return result.data;
	};
	const onError = () => {
		// pass
	};

	return apiClient
		.readApiKey(token, sessionSecretKey, apiKeyId)
		.then(onSuccess, onError);
}

/**
 * Returns all api keys
 *
 * @returns {Promise} Promise with the api keys
 */
function readApiKeys() {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: { data: ApiKeyOverview }) => result.data;
	const onError = () => {
		// pass
	};

	return apiClient.readApiKey(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Returns all secrets of an api key
 *
 * @returns {Promise} Promise with the secrets
 */
function readApiKeySecrets(apiKeyId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: { data: ApiKeySecret[] }) => {
		const secrets = result.data;
		for (let i = 0; i < secrets.length; i++) {
			secrets[i]["name"] = cryptoLibrary.decryptSecretKey(
				secrets[i]["title"],
				secrets[i]["title_nonce"],
			);
		}
		return secrets;
	};
	const onError = () => {
		// pass
	};

	return apiClient
		.readApiKeySecrets(token, sessionSecretKey, apiKeyId)
		.then(onSuccess, onError);
}

/**
 * Adds one secret to an api key
 *
 * @param {uuid} apiKeyId The id of the api key
 * @param {string} apiKeySecretKey The symmetric secret assiciated with the api key
 * @param {array} secret The secret to add
 *
 * @returns {Promise} Promise with the new id
 */
function addSecretToApiKey(
	apiKeyId: string,
	apiKeySecretKey: string,
	secret: NamedSecretReference,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const secret_secret_key_enc = cryptoLibrary.encryptData(
		secret.secret_key,
		apiKeySecretKey,
	);
	const secret_title_enc = cryptoLibrary.encryptSecretKey(secret.name);

	return apiClient.addSecretToApiKey(
		token,
		sessionSecretKey,
		apiKeyId,
		secret.secret_id,
		secret_title_enc.text,
		secret_title_enc.nonce,
		secret_secret_key_enc.text,
		secret_secret_key_enc.nonce,
	);
}

/**
 * True if the server refused a secret because it already is part of the api key (e.g. after a
 * request whose answer got lost), which is as good as added.
 */
function isAlreadyAdded(error: unknown): boolean {
	return JSON.stringify(error ?? "").includes("API_KEY_SECRET_ALREADY_EXIST");
}

/**
 * Adds multiple secrets to an api key
 *
 * @param {uuid} apiKeyId The id of the api key
 * @param {string} apiKeySecretKey The symmetric secret assiciated with the api key
 * @param {array} secrets The array of secrets to add to the api key
 * @param {function} [onProgress] Called after every batch with the percentage (0 to 100) that is done; not called at all when there is nothing to add
 *
 * @returns {Promise} Promise with the secrets that could not be added (the user is told about them)
 */
async function addSecretsToApiKey(
	apiKeyId: string,
	apiKeySecretKey: string,
	secrets: NamedSecretReference[],
	onProgress?: (percentage: number) => void,
) {
	// A secret can be selected more than once (it can sit in several folders): add it only once.
	const seen = new Set<string>();
	let pending = secrets.filter(
		(secret) => !seen.has(secret.secret_id) && seen.add(secret.secret_id),
	);
	const total = pending.length;

	// Send them in small batches. Every request is stamped when it is created and the server
	// rejects (and logs out) requests that are older than a few seconds, so too many requests
	// created at once would fail as soon as the browser queue gets long.
	// One failed request must not stop the others: the failed ones are tried again a few times.
	const batchSize = 10;
	for (let attempt = 0; attempt < 3 && pending.length > 0; attempt++) {
		if (attempt > 0) {
			await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
		}
		const failed: NamedSecretReference[] = [];
		for (let i = 0; i < pending.length; i += batchSize) {
			const batch = pending.slice(i, i + batchSize);
			const results = await Promise.allSettled(
				batch.map((secret) =>
					addSecretToApiKey(apiKeyId, apiKeySecretKey, secret),
				),
			);
			results.forEach((result, index) => {
				if (result.status === "rejected" && !isAlreadyAdded(result.reason)) {
					failed.push(batch[index]!);
				}
			});
			// total is never 0 inside the loop: with nothing to add there is no batch (and no 0 / 0)
			if (attempt === 0) {
				onProgress?.(Math.round(((i + batch.length) * 100) / total));
			}
		}
		pending = failed;
	}

	if (pending.length > 0) {
		notification.errorSend(
			i18n.t("API_KEY_SECRETS_NOT_ADDED", { count: pending.length }),
		);
	}
	return pending;
}

/**
 * Creates an API Key
 *
 * @param {string} title The title of the new api key
 * @param {bool} restrictToSecrets
 * @param {bool} allowInsecureAccess
 * @param {bool} allowApiKeyManagement
 * @param {bool} allowAdminAccess
 * @param {bool} allowRecoveryAccess
 * @param {bool} allowEmergencyAccess
 * @param {bool} allowReadAccess
 * @param {bool} allowWriteAccess
 * @param {array} secrets Array of secrets
 * @param {function} [onProgress] Called while the secrets are added with the percentage (0 to 100) that is done
 *
 * @returns {Promise} Promise with the new id
 */
function createApiKey(
	title: string,
	restrictToSecrets: boolean,
	allowInsecureAccess: boolean,
	allowApiKeyManagement: boolean,
	allowAdminAccess: boolean,
	allowRecoveryAccess: boolean,
	allowEmergencyAccess: boolean,
	allowReadAccess: boolean,
	allowWriteAccess: boolean,
	secrets: NamedSecretReference[],
	onProgress?: (percentage: number) => void,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const apiKeySecretKey = cryptoLibrary.generateSecretKey();
	const api_key_public_private_key_pair =
		cryptoLibrary.generatePublicPrivateKeypair();

	const api_key_private_key_enc = cryptoLibrary.encryptSecretKey(
		api_key_public_private_key_pair.private_key,
	);
	const apiKeySecretKey_enc = cryptoLibrary.encryptSecretKey(apiKeySecretKey);

	const user_private_key_enc = cryptoLibrary.encryptData(
		getStore().getState().user.userPrivateKey,
		apiKeySecretKey,
	);
	const user_secret_key_enc = cryptoLibrary.encryptData(
		getStore().getState().user.userSecretKey,
		apiKeySecretKey,
	);

	const verify_key = cryptoLibrary.getVerifyKey(
		api_key_public_private_key_pair.private_key,
	);

	const onSuccess = (result: { data: { api_key_id: string } }) => {
		const apiKeyId = result.data["api_key_id"];
		return addSecretsToApiKey(
			apiKeyId,
			apiKeySecretKey,
			secrets,
			onProgress,
		).then(() => ({
			api_key_id: apiKeyId,
		}));
	};
	const onError = () => {
		// pass
	};

	return apiClient
		.createApiKey(
			token,
			sessionSecretKey,
			title,
			api_key_public_private_key_pair.public_key,
			api_key_private_key_enc.text,
			api_key_private_key_enc.nonce,
			apiKeySecretKey_enc.text,
			apiKeySecretKey_enc.nonce,
			user_private_key_enc.text,
			user_private_key_enc.nonce,
			user_secret_key_enc.text,
			user_secret_key_enc.nonce,
			restrictToSecrets,
			allowInsecureAccess,
			allowApiKeyManagement,
			allowAdminAccess,
			allowRecoveryAccess,
			allowEmergencyAccess,
			allowReadAccess,
			allowWriteAccess,
			verify_key,
		)
		.then(onSuccess, onError);
}

/**
 * Updates an API Key
 *
 * @param {uuid} apiKeyId The id of the api key
 * @param {string} title The title of the new api key
 * @param {bool} restrictToSecrets
 * @param {bool} allowInsecureAccess
 * @param {bool} allowApiKeyManagement
 * @param {bool} allowAdminAccess
 * @param {bool} allowRecoveryAccess
 * @param {bool} allowEmergencyAccess
 * @param {bool} allowReadAccess
 * @param {bool} allowWriteAccess
 *
 * @returns {Promise} Promise with the new id
 */
function updateApiKey(
	apiKeyId: string,
	title: string,
	restrictToSecrets: boolean,
	allowInsecureAccess: boolean,
	allowApiKeyManagement: boolean,
	allowAdminAccess: boolean,
	allowRecoveryAccess: boolean,
	allowEmergencyAccess: boolean,
	allowReadAccess: boolean,
	allowWriteAccess: boolean,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	return apiClient.updateApiKey(
		token,
		sessionSecretKey,
		apiKeyId,
		title,
		restrictToSecrets,
		allowInsecureAccess,
		allowApiKeyManagement,
		allowAdminAccess,
		allowRecoveryAccess,
		allowEmergencyAccess,
		allowReadAccess,
		allowWriteAccess,
	);
}

/**
 * Deletes an API Key
 *
 * @param {uuid} apiKeyId The id of the api key to delete
 *
 * @returns {Promise} Promise
 */
function deleteApiKey(apiKeyId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClient
		.deleteApiKey(token, sessionSecretKey, apiKeyId)
		.then(onSuccess, onError);
}

/**
 * Deletes an API Key secret
 *
 * @param {uuid} apiKeySecretId The id of the api key secret to delete
 *
 * @returns {Promise} Promise
 */
function deleteApiKeySecret(apiKeySecretId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClient
		.deleteApiKeySecret(token, sessionSecretKey, apiKeySecretId)
		.then(onSuccess, onError);
}

const apiKeysService = {
	readApiKey: readApiKey,
	readApiKeys: readApiKeys,
	readApiKeySecrets: readApiKeySecrets,
	createApiKey: createApiKey,
	updateApiKey: updateApiKey,
	deleteApiKey: deleteApiKey,
	addSecretsToApiKey: addSecretsToApiKey,
	addSecretToApiKey: addSecretToApiKey,
	deleteApiKeySecret: deleteApiKeySecret,
};
export default apiKeysService;
