/**
 * Service to manage the setting datastore
 */

import * as openpgp from "openpgp";
import datastoreService from "./datastore";
import helper from "./helper";
import type { Datastore, GpgUser } from "../../types/datastore";

/**
 * Returns the settings datastore.
 *
 * @returns {Promise} Returns the settings datastore
 */
function getGpgUserDatastore() {
	const type = "gpg-user";
	const description = "default";

	const onSuccess = (datastore: Datastore | undefined) => {
		datastoreService.updatePathsRecursive(datastore!, []);
		return datastore;
	};
	const onError = () => {
		return undefined;
	};

	return datastoreService.getDatastore(type).then(onSuccess, onError);
}

/**
 * Updates the local storage and triggers the 'saveDatastoreContent' to reflect the changes
 *
 * @param {TreeObject} datastore The datastore tree
 */
function handleDatastoreContentChanged(datastore: Datastore) {
	// don't do anything
}

/**
 * Saves the gpg user datastore with given content
 *
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 * @returns {Promise} Promise with the status of the save
 */
function saveDatastoreContent(content: Datastore) {
	const type = "gpg-user";
	const description = "default";

	return datastoreService.saveDatastoreContent(type, description, content);
}

function _searchForEmail(datastore: Datastore | undefined, email: string) {
	let searched_user: GpgUser | undefined;

	datastoreService.filter(datastore, (user) => {
		if (user.email === email) {
			// This datastore contains GPG contacts, rather than password items.
			searched_user = user as GpgUser;
		}
	});

	return searched_user;
}

/**
 * Adds a user to the datastore
 *
 * @param {object} user The user object to add
 *
 * @returns {Promise} Promise with the status of the save
 */
async function addUser(user: GpgUser) {
	if (!Object.hasOwn(user, "email")) {
		return Promise.reject({
			error: "User has no email address.",
		});
	}

	if (!Object.hasOwn(user, "id")) {
		return Promise.reject({
			error: "User has no id.",
		});
	}
	for (let i = 0; i < user.public_keys.length; i++) {
		try {
			await openpgp.readKey({ armoredKey: user.public_keys[i] });
		} catch (e) {
			return Promise.reject({
				error: "Invalid Fingerprint.",
			});
		}
	}

	user.email = user.email.toLowerCase();

	const onSuccess = async (result: Datastore | undefined) => {
		const datastore = result!;
		let need_write = false;
		let ds_user = _searchForEmail(datastore, user.email);
		if (ds_user) {
			need_write = await _addPublicKey(ds_user, user.public_keys);
		} else {
			if (!datastore.items) {
				datastore["items"] = [];
			}
			need_write = true;

			ds_user = {
				id: user.id,
				email: user.email,
				public_keys: user.public_keys,
				default_public_key: user.default_public_key || "",
			};

			datastore["items"].push(ds_user);
		}

		if (need_write) {
			_updateDefaultPublicKey(ds_user);
			saveDatastoreContent(datastore);
		}

		return ds_user;
	};
	const onError = () => {
		return undefined;
	};

	return getGpgUserDatastore().then(onSuccess, onError);
}

/**
 * Updates the default public key
 *
 * @param {object} user The user object to add
 *
 * @returns {boolean} whether the user was changed or not
 */
async function _updateDefaultPublicKey(user: GpgUser) {
	if (user.public_keys.length > 0) {
		if (user.default_public_key) {
			const key1 = await openpgp.readKey({
				armoredKey: user.default_public_key,
			});
			let found = false;
			for (let k = 0; k < user.public_keys.length; k++) {
				const key2 = await openpgp.readKey({ armoredKey: user.public_keys[k] });
				if (key1.getFingerprint() !== key2.getFingerprint()) {
					found = true;
				}
			}
			if (!found) {
				user.default_public_key = user.public_keys[0];
			}
		} else {
			user.default_public_key = user.public_keys[0];
		}
	} else {
		user.default_public_key = "";
	}
}

/**
 * Adds public keys to a user
 *
 * @param {object} user The user object to add
 * @param {array} public_keys The list of public keys to add
 *
 * @returns {Promise} whether the user was changed or not
 */
async function _addPublicKey(user: GpgUser, public_keys: string[]) {
	let need_write = false;

	for (let j = 0; j < public_keys.length; j++) {
		let found = false;
		const key = await openpgp.readKey({ armoredKey: public_keys[j] });
		for (let i = 0; i < user.public_keys.length; i++) {
			const ds_key = await openpgp.readKey({ armoredKey: user.public_keys[i] });
			if (ds_key.getFingerprint() !== key.getFingerprint()) {
				continue;
			}
			found = true;
			break;
		}
		if (!found) {
			need_write = true;
			user.public_keys.push(public_keys[j]);
		}
	}

	if (need_write) {
		_updateDefaultPublicKey(user);
	}

	return need_write;
}

/**
 * Adds public keys to a user
 *
 * @param {object} user The user object to add
 * @param {array} public_keys The list of public keys to add
 *
 * @returns {Promise} Promise weather the user object has been modified or not
 */
function addPublicKey(user: Pick<GpgUser, "email">, public_keys: string[]) {
	const onSuccess = async (datastore: Datastore | undefined) => {
		const ds_user = _searchForEmail(datastore, user.email);

		if (!ds_user) {
			return {
				error: "User not found.",
			};
		}

		const need_write = await _addPublicKey(ds_user, public_keys);

		if (need_write) {
			saveDatastoreContent(datastore!);
		}
		return ds_user;
	};
	const onError = () => {
		return undefined;
	};

	return getGpgUserDatastore().then(onSuccess, onError);
}

/**
 * Removes public keys of a user
 *
 * @param {object} user The user object
 * @param {array} public_keys The list of public keys to remove
 *
 * @returns {Promise} whether the user was changed or not
 */
async function _removePublicKey(user: GpgUser, public_keys: string[]) {
	let need_write = false;

	for (let j = 0; j < public_keys.length; j++) {
		const key = await openpgp.readKey({ armoredKey: public_keys[j] });
		for (let i = user.public_keys.length - 1; i >= 0; i--) {
			const ds_key = await openpgp.readKey({ armoredKey: user.public_keys[i] });
			if (ds_key.getFingerprint() !== key.getFingerprint()) {
				continue;
			}
			user.public_keys.splice(i, 1);
			need_write = true;
		}
	}

	if (need_write) {
		_updateDefaultPublicKey(user);
	}

	return need_write;
}

/**
 * Removes public keys of a user
 *
 * @param {object} user The user object to add
 * @param {array} publicKeys The list of public keys to add
 *
 * @returns {Promise} Promise weather the user object has been modified or not
 */
function removePublicKey(user: Pick<GpgUser, "email">, publicKeys: string[]) {
	const onSuccess = async (datastore: Datastore | undefined) => {
		const ds_user = _searchForEmail(datastore, user.email);

		if (!ds_user) {
			return Promise.reject({
				error: "User not found.",
			});
		}

		const need_write = await _removePublicKey(ds_user, publicKeys);
		if (need_write) {
			saveDatastoreContent(datastore!);
		}
		return ds_user;
	};
	const onError = () => {
		return undefined;
	};

	return getGpgUserDatastore().then(onSuccess, onError);
}

/**
 * Deöete a user from the datastore
 *
 * @param {object} user The user object to delete
 *
 * @returns {Promise} Promise with the status of the save
 */
function deleteUser(user: Pick<GpgUser, "id">) {
	const onSuccess = (result: Datastore | undefined) => {
		const datastore = result!;
		function deleteItemRecursive(datastore: Datastore, id: string): void {
			let n, l;
			if (datastore.items) {
				helper.removeFromArray(datastore.items, id, (a, b) => a.id === id);
			}

			if (datastore.folders) {
				for (n = 0, l = datastore.folders.length; n < l; n++) {
					deleteItemRecursive(datastore.folders[n], id);
				}
			}
		}

		deleteItemRecursive(datastore, user.id);
		return saveDatastoreContent(datastore);
	};
	const onError = () => {
		return undefined;
	};

	return getGpgUserDatastore().then(onSuccess, onError);
}

/**
 * Deletes a user from the datastore
 *
 * @param {object} user The user object to delete
 * @param {string} public_key The public key
 *
 * @returns {Promise} Promise with the status of the save
 */
function chooseAsDefaultKey(user: Pick<GpgUser, "email">, public_key: string) {
	const onSuccess = async (datastore: Datastore | undefined) => {
		const ds_user = _searchForEmail(datastore, user.email)!;

		await _addPublicKey(ds_user, [public_key]);
		ds_user.default_public_key = public_key;

		saveDatastoreContent(datastore!);
		return ds_user;
	};
	const onError = () => {
		return undefined;
	};

	return getGpgUserDatastore().then(onSuccess, onError);
}

/**
 * Calculates the fingerprint in the "XXXX XXXX ..." hexformat or an empty string
 *
 * @param {string} [publicKeyArmored] The public key
 *
 * @returns {Promise} Promise with the status of the save
 */
async function getGpgFingerprint(publicKeyArmored?: string): Promise<string> {
	let fingerprint = "";

	if (!publicKeyArmored) {
		return fingerprint;
	}

	if (publicKeyArmored.indexOf("-----") !== -1) {
		let key;
		try {
			key = await openpgp.readKey({ armoredKey: publicKeyArmored });
		} catch (e) {
			return fingerprint;
		}
		fingerprint = key.getFingerprint();
	}

	const cleaned = fingerprint.toUpperCase().replace(/\s/g, "");
	const parts = [];

	for (let i = 0; i < cleaned.length; i += 4) {
		parts.push(cleaned.substr(i, 4));
	}

	return parts.join(" ");
}

const datastoreGpgUserService = {
	getGpgUserDatastore: getGpgUserDatastore,
	handleDatastoreContentChanged: handleDatastoreContentChanged,
	saveDatastoreContent: saveDatastoreContent,
	addUser: addUser,
	deleteUser: deleteUser,
	addPublicKey: addPublicKey,
	removePublicKey: removePublicKey,
	chooseAsDefaultKey: chooseAsDefaultKey,
	getGpgFingerprint: getGpgFingerprint,
};
export default datastoreGpgUserService;
