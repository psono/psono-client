/**
 * Service to handle the offline cache
 */

import action from "../actions/bound-action-creators";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import offscreenDocument from "./offscreen-document";
import secretService from "./secret";
import storage from "./storage";
import { addOfflineCacheHashingParameters, getStore } from "./store";
import type {
	Datastore,
	DatastoreFolder,
	DatastoreItem,
	EncryptedValue,
	SecretData,
} from "../../types/datastore";

let timeout = 0;
let encryptionKey: string | null = "";
const onSetEncryptionKeyRegistrations: (() => void)[] = [];

const registrations: Record<string, ((data: unknown) => void)[]> = {};
type OfflineWindow = Window & {
	psono_offline_cache_encryption_key?: string | null;
};

export interface OfflineWriteError {
	data: { error: string[] };
}

activate();

function activate() {
	if (
		typeof window !== "undefined" &&
		(window as OfflineWindow).psono_offline_cache_encryption_key
	) {
		setEncryptionKey(
			(window as OfflineWindow).psono_offline_cache_encryption_key,
		);
	}
	offscreenDocument.getOfflineCacheEncryptionKey(
		(newEncryptionKey: string | null | undefined) => {
			setEncryptionKey(newEncryptionKey);
		},
	);
}

/**
 * used to register functions for specific events
 *
 * @param {string} event The event to subscribe to
 * @param {function} func The callback function to subscribe
 */
function on(event: string, func: (data: unknown) => void) {
	if (!Object.hasOwn(registrations, event)) {
		registrations[event] = [];
	}

	registrations[event].push(func);
}

/**
 * sends an event message to the export service
 *
 * @param {string} event The event to trigger
 * @param {*} data The payload data to send to the subscribed callback functions
 */
function emit(event: string, data: unknown) {
	if (!Object.hasOwn(registrations, event)) {
		return;
	}
	for (let i = registrations[event].length - 1; i >= 0; i--) {
		registrations[event][i](data);
	}
}

/**
 * returns weather the cache is active or not
 *
 * @returns {boolean} promise
 */
function isActive() {
	const offline_mode = getStore().getState().client.offlineMode;

	if (offline_mode === null) {
		return false;
	}

	return offline_mode;
}

/**
 * returns weather the cache is encrypted or not
 *
 * @returns {boolean} promise
 */
function isEncrypted() {
	return getStore().getState().client.offlineCacheEncryptionKey !== null;
}

/**
 * returns the encryption key
 *
 * @returns {string} The hex representation of the encryption key
 */
function getEncryptionKey() {
	return encryptionKey;
}

/**
 * returns weather the store is locked or not
 *
 * @returns {boolean} locked status
 */
function isLocked() {
	return isEncrypted() && !encryptionKey;
}

/**
 * returns weather the store is locked or not
 *
 * @returns {boolean} locked status
 */
function unlock(password?: string) {
	if (typeof password === "undefined") {
		password = "";
	}
	const encryptionKeyEncrypted =
		getStore().getState().client.offlineCacheEncryptionKey;
	const encryptionKeySalt =
		getStore().getState().client.offlineCacheEncryptionSalt;
	if (!encryptionKeyEncrypted || !encryptionKeySalt) {
		return true;
	}
	const encryptionInfo = addOfflineCacheHashingParameters(
		encryptionKeyEncrypted,
		getStore().getState().user.hashingAlgorithm,
		getStore().getState().user.hashingParameters,
	);
	let newEncryptionKey;
	try {
		newEncryptionKey = cryptoLibrary.decryptSecret(
			encryptionKeyEncrypted.text,
			encryptionKeyEncrypted.nonce,
			password,
			encryptionKeySalt,
			encryptionInfo.hashingAlgorithm,
			encryptionInfo.hashingParameters,
		);
	} catch (e) {
		return false;
	}
	if (encryptionInfo !== encryptionKeyEncrypted) {
		action().setOfflineCacheEncryptionInfo(encryptionInfo, encryptionKeySalt);
	}
	setEncryptionKey(newEncryptionKey);
	browserClient.emitSec("set-offline-cache-encryption-key", {
		encryption_key: newEncryptionKey,
	});

	return true;
}

/**
 * Sets the encryption key
 *
 * @param {string} newEncryptionKey The new key
 */
function setEncryptionKey(newEncryptionKey?: string | null) {
	if (typeof newEncryptionKey === "undefined") {
		return;
	}
	encryptionKey = newEncryptionKey;
	if (typeof window !== "undefined") {
		(window as OfflineWindow).psono_offline_cache_encryption_key =
			newEncryptionKey;
	} else {
		// we are in a chrome extension in background service worker, so we store it in offscreen document
		offscreenDocument.setOfflineCacheEncryptionKey(newEncryptionKey);
	}
	for (let i = 0; i < onSetEncryptionKeyRegistrations.length; i++) {
		onSetEncryptionKeyRegistrations[i]();
	}
}

/**
 * Sets the encryption password
 *
 * @param {string} password The password
 */
function setEncryptionPassword(password: string) {
	const hashingAlgorithm = getStore().getState().user.hashingAlgorithm;
	const hashingParameters = getStore().getState().user.hashingParameters;
	const new_encryption_key = cryptoLibrary.generateSecretKey();
	const offlineCacheEncryptionSalt = cryptoLibrary.generateSecretKey();
	const offlineCacheEncryptionKey = addOfflineCacheHashingParameters(
		cryptoLibrary.encryptSecret(
			new_encryption_key,
			password,
			offlineCacheEncryptionSalt,
			hashingAlgorithm,
			hashingParameters,
		),
		hashingAlgorithm,
		hashingParameters,
	);
	action().setOfflineCacheEncryptionInfo(
		offlineCacheEncryptionKey,
		offlineCacheEncryptionSalt,
	);
	setEncryptionKey(new_encryption_key);
	browserClient.emitSec("set-offline-cache-encryption-key", {
		encryption_key: new_encryption_key,
	});
}

/**
 * Sets the request data in cache
 *
 * @param {string} url the url of the request
 * @param {string} method the request method
 * @param {object} data the data
 *
 * @returns {Promise} promise
 */
function set(url: string, method: string, data: unknown) {
	if (method !== "GET" || !isActive()) {
		return;
	}

	let value: string | EncryptedValue = JSON.stringify(data);

	if (encryptionKey) {
		value = cryptoLibrary.encryptData(value, encryptionKey);
	}

	storage.upsert("offline-cache", { key: url.toLowerCase(), value: value });
}

/**
 * Requests all secrets in our datastore and fills the datastore with the content
 *
 * @param {object} datastore The datastore structure with secrets
 * @param {boolean} includeTrashBinItems Should the items of the trash bin be included in the export
 * @param {boolean} includeSharedItems Should shared items be included in the export
 *
 * @returns {*} The datastore structure where all secrets have been filled
 */
function getAllSecrets<T extends Datastore>(
	datastore: T,
	includeTrashBinItems?: boolean,
	includeSharedItems?: boolean,
): Promise<T> {
	let open_secret_requests = 0;

	let resolver: (value: T) => void;

	const handle_items = (items: DatastoreItem[]) => {
		const fill_secret = (
			item: DatastoreItem,
			secret_id: string,
			secret_key: string,
		) => {
			const onSuccess = (data: SecretData) => {
				for (const property in data) {
					if (!Object.hasOwn(data, property)) {
						continue;
					}
					item[property] = data[property];
				}

				open_secret_requests = open_secret_requests - 1;
				emit("get-secret-complete", {});
				if (open_secret_requests === 0) {
					resolver(datastore);
				}
			};

			const onError = () => {
				open_secret_requests = open_secret_requests - 1;
			};

			open_secret_requests = open_secret_requests + 1;
			emit("get-secret-started", {});

			timeout = timeout + 100;
			setTimeout(() => {
				secretService
					.readSecret(secret_id, secret_key)
					.then(onSuccess, onError);
			}, timeout);
		};
		for (let i = 0; i < items.length; i++) {
			if (Object.hasOwn(items[i], "share_id") && !includeSharedItems) {
				continue;
			}
			if (
				Object.hasOwn(items[i], "secret_id") &&
				Object.hasOwn(items[i], "secret_key")
			) {
				if (
					!includeTrashBinItems &&
					Object.hasOwn(items[i], "deleted") &&
					items[i]["deleted"]
				) {
					continue;
				}
				fill_secret(items[i], items[i]["secret_id"]!, items[i]["secret_key"]!);
			}
		}
	};

	const handle_folders = (folders: DatastoreFolder[]) => {
		for (let i = 0; i < folders.length; i++) {
			if (Object.hasOwn(folders[i], "share_id") && !includeSharedItems) {
				continue;
			}
			if (folders[i].folders) {
				handle_folders(folders[i]["folders"]!);
			}

			if (folders[i].items) {
				handle_items(folders[i]["items"]!);
			}
		}
	};

	return new Promise<T>((resolve, reject) => {
		resolver = resolve;
		timeout = 0;

		if (datastore.folders) {
			handle_folders(datastore["folders"]);
		}

		if (datastore.items) {
			handle_items(datastore["items"]);
		}

		if (open_secret_requests === 0) {
			resolve(datastore);
		}
	});
}

/**
 * Returns the cached request
 *
 * @param {string} url the request url
 * @param {string} method the request method
 *
 * @returns {Promise} our original request
 */
function get<T = Record<string, unknown>>(
	url: string,
	method: string,
): Promise<T | OfflineWriteError | null> {
	if (!isActive()) {
		return Promise.resolve(null);
	}
	if (method !== "GET") {
		return Promise.resolve({
			data: {
				error: [
					"Leave the offline mode before creating / modifying any content.",
				],
			},
		});
	}

	return storage
		.findKey("offline-cache", url.toLowerCase())
		.then((storageEntry) => {
			if (storageEntry === null) {
				return null;
			}

			let value = storageEntry.value;

			if (encryptionKey) {
				const encrypted = value as EncryptedValue;
				value = cryptoLibrary.decryptData(
					encrypted.text,
					encrypted.nonce,
					encryptionKey,
				);
			}

			// The cache stores the original response schema, selected by its caller.
			return JSON.parse(value as string) as T;
		});
}

/**
 * Enables the offline cache
 */
function enable() {
	action().enableOfflineMode();
}

/**
 * Disables the offline cache
 */
function disable() {
	action().disableOfflineMode();
}

/**
 * Clears the cache
 */
function clear() {
	storage.removeAll("offline-cache");
	storage.save();
}

/**
 * Saves the cache
 *
 * @returns {Promise} promise
 */
function save() {
	// TODO
	storage.save();
}

/**
 * Registers for unlock events
 *
 * @param {function} fnc The callback function
 */
function onSetEncryptionKey(fnc: () => void) {
	onSetEncryptionKeyRegistrations.push(fnc);
}

const offlineCacheService = {
	on: on,
	emit: emit,
	isActive: isActive,
	getAllSecrets: getAllSecrets,
	get: get,
	set: set,
	getEncryptionKey: getEncryptionKey,
	isLocked: isLocked,
	unlock: unlock,
	setEncryptionKey: setEncryptionKey,
	setEncryptionPassword: setEncryptionPassword,
	enable: enable,
	disable: disable,
	clear: clear,
	save: save,
	onSetEncryptionKey: onSetEncryptionKey,
};
export default offlineCacheService;
