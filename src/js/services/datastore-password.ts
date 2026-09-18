/**
 * Service to manage the password datastore
 */

import i18n from "../i18n";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import datastoreService from "./datastore";
import domainSynonymsService from "./domain-synonyms";
import helperService from "./helper";
import notificationBarService from "./notification-bar";
import secretService from "./secret";
import shareService from "./share";
import shareLinkService from "./share-link";
import { getStore } from "./store";
import urlSynonymsService from "./url-synonyms";
import type {
	ChildShare,
	Datastore,
	DatastoreItem,
	DatastorePath,
	SecretData,
	ShareContent,
	ShareIndex,
	ShareRights,
} from "../../types/datastore";
import type { ClosestParentShare, ShareRightsOverview } from "./share";

const registrations: Record<string, ((value: unknown) => void)[]> = {};
const _shareIndex: Record<string, string> = {};

interface ElementLink {
	id: string;
	name: string;
	path: DatastorePath;
}

export interface Breadcrumbs {
	id_breadcrumbs?: DatastorePath;
}

type ShareAccess = { rights: ShareRights; data?: Datastore };

/**
 * checks if the given password complies with the minimal complexity
 *
 * @param password
 * @param characters
 * @param length
 * @returns {*}
 */
function isStrongEnough(
	password: string,
	characters: string,
	length: number | string,
) {
	if (characters.length === 0) {
		return true;
	}

	const hasUppercaseCharacters = /[A-Z]/.test(characters); // check if characters contain uppercase characters
	const hasLowercaseCharacters = /[a-z]/.test(characters); // check if characters contain lowercase characters
	const hasNumbers = /[0-9]/.test(characters); // check if characters contain numbers
	const hasSpecialCharacters = /[!§@#$%^&*()_+\-=[\]{};:'",<>.?/\\|`~]/.test(
		characters,
	); // check if characters contain special chars

	let minLength = 0;

	if (hasUppercaseCharacters) {
		minLength += 1;
	}
	if (hasLowercaseCharacters) {
		minLength += 1;
	}
	if (hasNumbers) {
		minLength += 1;
	}
	if (hasSpecialCharacters) {
		minLength += 1;
	}

	// The assertion is erased: form strings retain JS numeric comparison semantics.
	if (minLength > (length as number)) {
		// password can never comply, so we skip check as user asked for length=3 character password.
		return true;
	}

	const passwordHasUppercaseCharacters = /[A-Z]/.test(password); // check if password contains uppercase characters
	const passwordHasLowercaseCharacters = /[a-z]/.test(password); // check if password contains lowercase characters
	const passwordHasNumbers = /[0-9]/.test(password); // check if password contains numbers
	const passwordHasSpecialCharacters =
		/[!§@#$%^&*()_+\-=[\]{};:'",<>.?/\\|`~]/.test(password); // check if password contains special chars

	const ucTestResult =
		!hasUppercaseCharacters || passwordHasUppercaseCharacters;
	const lcTestResult =
		!hasLowercaseCharacters || passwordHasLowercaseCharacters;
	const nTestResult = !hasNumbers || passwordHasNumbers;
	const scTestResult = !hasSpecialCharacters || passwordHasSpecialCharacters;

	return ucTestResult && lcTestResult && nTestResult && scTestResult;
}

/**
 * escapes regex string
 *
 * @param str
 * @returns {*}
 */
function escapeRegExp(str: string) {
	// from sindresorhus/escape-string-regexp under MIT License

	if (typeof str !== "string") {
		throw new TypeError("Expected a string");
	}

	return str.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}

/**
 * generates a password based on the length requirement and a string with all allowed characters
 *
 * @param {number|string} length The length of the password, including form input
 * @param {string}  allowedCharacters A string containing all allowed characters
 *
 * @returns {string} Returns the password
 */
function generatePassword(length: number | string, allowedCharacters: string) {
	const allowed_characters_length = allowedCharacters.length;
	let password = "";

	// Keep coercion in the comparison; parsing first would change fractional inputs.
	for (let i = 0; i < (length as number); i++) {
		const pos = Math.floor(cryptoLibrary.random() * allowed_characters_length);
		password = password + allowedCharacters.charAt(pos);
	}

	return password;
}

/**
 *
 * Main function to generate a random password based on the specified settings.
 *
 * @param [passwordLength]
 * @param [passwordLettersUppercase]
 * @param [passwordLettersLowercase]
 * @param [passwordNumbers]
 * @param [passwordSpecialChars]
 *
 * @returns {string} Returns the generated random password
 */
function generate(
	passwordLength?: number | string,
	passwordLettersUppercase?: string,
	passwordLettersLowercase?: string,
	passwordNumbers?: string,
	passwordSpecialChars?: string,
) {
	let password = "";

	if (typeof passwordLength === "undefined") {
		passwordLength = getStore().getState().settingsDatastore.passwordLength;
	}

	if (typeof passwordLettersUppercase === "undefined") {
		passwordLettersUppercase =
			getStore().getState().settingsDatastore.passwordLettersUppercase;
	}

	if (typeof passwordLettersLowercase === "undefined") {
		passwordLettersLowercase =
			getStore().getState().settingsDatastore.passwordLettersLowercase;
	}

	if (typeof passwordNumbers === "undefined") {
		passwordNumbers = getStore().getState().settingsDatastore.passwordNumbers;
	}

	if (typeof passwordSpecialChars === "undefined") {
		passwordSpecialChars =
			getStore().getState().settingsDatastore.passwordSpecialChars;
	}

	const characters =
		passwordLettersUppercase +
		passwordLettersLowercase +
		passwordNumbers +
		passwordSpecialChars;

	while (!isStrongEnough(password, characters, passwordLength)) {
		password = generatePassword(passwordLength, characters);
	}
	return password;
}

/**
 * Sets the parent for folders and items, based on the obj and obj parents.
 * Calls recursive itself for all folders and skips nested shares
 *
 * @param {TreeObject} obj The tree object to update
 * @param {uuid} parentShareId The id of the parent share
 * @param {uuid} parentDatastoreId The id of the parent datastore
 */
function updateParents(
	obj: Datastore,
	parentShareId?: string,
	parentDatastoreId?: string,
): void {
	let n;

	let new_parent_share_id = parentShareId;
	let new_parent_datastore_id = parentDatastoreId;

	if (Object.hasOwn(obj, "datastore_id")) {
		obj["parent_share_id"] = undefined;
		obj["parent_datastore_id"] = undefined;
		new_parent_share_id = undefined;
		new_parent_datastore_id = obj.datastore_id;
	} else if (Object.hasOwn(obj, "share_id")) {
		obj["parent_share_id"] = parentShareId;
		obj["parent_datastore_id"] = parentDatastoreId;
		new_parent_share_id = obj.share_id;
		new_parent_datastore_id = undefined;
	}

	// check all folders recursive
	if (obj.folders) {
		for (n = 0; n < obj.folders.length; n++) {
			obj.folders[n]["parent_share_id"] = new_parent_share_id;
			obj.folders[n]["parent_datastore_id"] = new_parent_datastore_id;

			// lets not go inside of a new share, and dont touch the parents there
			if (Object.hasOwn(obj.folders[n], "share_id")) {
				continue;
			}
			updateParents(
				obj.folders[n],
				new_parent_share_id,
				new_parent_datastore_id,
			);
		}
	}
	// check all items
	if (obj.items) {
		for (n = 0; n < obj.items.length; n++) {
			if (Object.hasOwn(obj.items[n], "share_id")) {
				continue;
			}
			obj.items[n]["parent_share_id"] = new_parent_share_id;
			obj.items[n]["parent_datastore_id"] = new_parent_datastore_id;
		}
	}
}

/**
 * Updates some datastore folders or share folders with content.
 * Will calculate the delete property in the right object.
 *
 * @param {TreeObject} datastore The current datastore to update
 * @param {Array} path The location of the new subtree
 * @param {TreeObject} content The actual data for this path
 * @param {RightObject} parentShareRights The parental rights
 * @param {uuid} parentShareId The parent's share id
 * @param {uuid} parentDatastoreId THe parent's datastore id
 */
function updatePathsWithData(
	datastore: Datastore,
	path: DatastorePath,
	content: ShareAccess,
	parentShareRights: ShareRights,
	parentShareId?: string,
	parentDatastoreId?: string,
) {
	const path_copy = path.slice();
	const search = datastoreService.findInDatastore(path_copy, datastore);
	const obj = search[0][search[1]];

	// update share_rights in share object
	obj["share_rights"] = content.rights;
	obj["share_rights"]["delete"] = parentShareRights["write"];

	// update data (folder and items) in share object
	for (const prop in content.data) {
		if (!Object.hasOwn(content.data, prop)) {
			continue;
		}
		if (prop == "share_rights") {
			continue;
		}
		obj[prop] = content.data[prop];
	}

	// update share_rights in folders and items
	updateParents(obj, parentShareId, parentDatastoreId);
	datastoreService.updateShareRightsOfFoldersAndItems(obj, {
		read: true,
		write: true,
		grant: true,
		delete: true,
	});
}

/**
 * Queries shares recursive
 *
 * @param {TreeObject} datastore The datastore tree
 * @param {object} shareRightsDict Dictionary of shares and their share rights
 * @returns {Promise} Returns promise that resolves either when the initial datastore is loaded or when all shares with subshares are loaded
 */
function _readShares(
	datastore: Datastore,
	shareRightsDict: Record<string, ShareRights>,
): Promise<Datastore> {
	return new Promise<Datastore>((resolve) => {
		let open_calls = 0;
		const all_calls: Promise<void>[] = [];
		const all_share_data: Record<string, ShareContent> = {};
		let content: ShareAccess;
		// Reads repair indexes in memory only; a later user write persists them.
		repairShareIndex(datastore);
		const share_index = datastore.share_index;

		let localResolve = () => {};

		const parent_share_rights = {
			read: true,
			write: true,
			grant: false,
			delete: false,
		};

		const readSharesRecursive = (
			datastore: Datastore,
			share_rights_dict: Record<string, ShareRights>,
			share_index: ShareIndex | undefined,
			all_share_data: Record<string, ShareContent>,
			parent_share_rights: ShareRights,
			parent_share_id: string | undefined,
			parent_datastore_id: string | undefined,
			parent_share_stack: string[],
		): Datastore | undefined => {
			if (typeof share_index === "undefined") {
				return datastore;
			}

			const readShareHelper = (
				share_id: string,
				sub_datastore: Datastore,
				path: DatastorePath,
				parent_share_id: string | undefined,
				parent_datastore_id: string | undefined,
				parent_share_stack: string[],
			) => {
				const onSuccess = (content: ShareContent | undefined) => {
					if (typeof content === "undefined") {
						open_calls--;
						localResolve();
						return;
					}
					repairShareIndex(content.data);
					all_share_data[share_id] = content;

					updatePathsWithData(
						datastore,
						path,
						content,
						parent_share_rights,
						parent_share_id,
						parent_datastore_id,
					);

					readSharesRecursive(
						sub_datastore,
						share_rights_dict,
						content.data.share_index,
						all_share_data,
						content.rights,
						share_id,
						undefined,
						parent_share_stack,
					);
					open_calls--;
					localResolve();
				};

				const onError = () => {
					open_calls--;
					localResolve();
				};
				open_calls++;
				return shareService
					.readShare(share_id, _shareIndex[share_id])
					.then(onSuccess, onError);
			};

			for (const share_id in share_index) {
				if (!Object.hasOwn(share_index, share_id)) {
					continue;
				}
				_shareIndex[share_id] = share_index[share_id].secret_key;
				const new_parent_share_stack =
					helperService.duplicateObject(parent_share_stack);
				new_parent_share_stack.push(share_id);

				for (let i = share_index[share_id].paths.length - 1; i >= 0; i--) {
					const path_copy = share_index[share_id].paths[i].slice();
					const search = datastoreService.findInDatastore(path_copy, datastore);
					const sub_datastore = search[0][search[1]];

					// Break potential loops
					if (parent_share_stack.indexOf(share_id) !== -1) {
						content = {
							rights: {
								read: false,
								write: false,
								grant: false,
							},
						};
						updatePathsWithData(
							datastore,
							share_index[share_id].paths[i],
							content,
							parent_share_rights,
							parent_share_id,
							undefined,
						);
						continue;
					}

					// Test if we already have it cached
					if (Object.hasOwn(all_share_data, share_id)) {
						updatePathsWithData(
							datastore,
							share_index[share_id].paths[i],
							all_share_data[share_id],
							parent_share_rights,
							parent_share_id,
							undefined,
						);
						continue;
					}

					// Let's check if we have read writes for this share, and skip it if we don't have read rights
					if (
						Object.hasOwn(share_rights_dict, share_id) &&
						!share_rights_dict[share_id].read
					) {
						content = {
							rights: {
								read: share_rights_dict[share_id].read,
								write: share_rights_dict[share_id].write,
								grant: share_rights_dict[share_id].grant,
							},
						};

						updatePathsWithData(
							datastore,
							share_index[share_id].paths[i],
							content,
							parent_share_rights,
							parent_share_id,
							undefined,
						);
						continue;
					}

					// No specific share rights for this share, lets assume inherited rights and check if we have parent read rights
					if (
						!Object.hasOwn(share_rights_dict, share_id) &&
						!parent_share_rights.read
					) {
						content = {
							rights: helperService.duplicateObject(parent_share_rights),
						};

						updatePathsWithData(
							datastore,
							share_index[share_id].paths[i],
							content,
							parent_share_rights,
							parent_share_id,
							undefined,
						);
						continue;
					}

					// No specific share rights for this share and datastore as parent (no inheritance possible) we a assume a share where we lost access rights
					if (
						!Object.hasOwn(share_rights_dict, share_id) &&
						typeof parent_datastore_id !== "undefined"
					) {
						continue;
					}

					all_calls.push(
						readShareHelper(
							share_id,
							sub_datastore,
							share_index[share_id].paths[i],
							parent_share_id,
							parent_datastore_id,
							new_parent_share_stack,
						),
					);
				}
			}
		};

		// Read shares recursive. We start from the datastore, so delete is allowed in the datastore
		readSharesRecursive(
			datastore,
			shareRightsDict,
			share_index,
			all_share_data,
			parent_share_rights,
			undefined,
			datastore.datastore_id,
			[],
		);
		updateParents(datastore, undefined, datastore.datastore_id);
		datastoreService.updateShareRightsOfFoldersAndItems(datastore, {
			read: true,
			write: true,
			grant: true,
			delete: true,
		});

		return Promise.all(all_calls).then((ret) => {
			localResolve = () => {
				if (open_calls === 0) {
					resolve(datastore);
				}
			};
			localResolve();
		});
	});
}

function pathsEqual(first: DatastorePath, second: DatastorePath) {
	if (first.length !== second.length) {
		return false;
	}
	for (let i = 0; i < first.length; i++) {
		if (first[i] !== second[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Rebuilds missing share index entries from embedded share placeholders and
 * removes paths that no longer resolve to the indexed share.
 *
 * @param {TreeObject} container The datastore or share content to repair
 * @returns {boolean} Whether the share index changed
 */
function repairShareIndex(container: Datastore) {
	const discovered: Record<
		string,
		{ secret_key?: string; paths: DatastorePath[] }
	> = {};

	const addDiscoveredShare = (
		shareId: string,
		secretKey: string | undefined,
		path: DatastorePath,
	) => {
		if (!Object.hasOwn(discovered, shareId)) {
			discovered[shareId] = {
				secret_key: secretKey,
				paths: [],
			};
		}
		if (!discovered[shareId].secret_key && secretKey) {
			discovered[shareId].secret_key = secretKey;
		}
		if (
			!discovered[shareId].paths.some((existing) => pathsEqual(existing, path))
		) {
			discovered[shareId].paths.push(path.slice());
		}
	};

	const childShares: ChildShare[] = [];
	getAllChildShares(container, 1, childShares);
	for (const { share, path } of childShares) {
		if (!share.share_id || path.some((id) => !id)) {
			continue;
		}
		addDiscoveredShare(share.share_id, share.share_secret_key, path);
	}

	const repaired: ShareIndex = {};
	let changed = false;
	for (const [shareId, location] of Object.entries(
		container.share_index || {},
	)) {
		if (!location || !Array.isArray(location.paths)) {
			changed = true;
			continue;
		}

		const validPaths: DatastorePath[] = [];
		for (const path of location.paths) {
			if (
				!Array.isArray(path) ||
				validPaths.some((existing) => pathsEqual(existing, path))
			) {
				changed = true;
				continue;
			}

			try {
				const search = datastoreService.findInDatastore(
					path.slice(),
					container,
				);
				const node = search[0][search[1]];
				if (node.share_id !== shareId) {
					changed = true;
					continue;
				}
			} catch (error) {
				if (error instanceof RangeError && error.message === "ObjectNotFound") {
					changed = true;
					continue;
				}
				throw error;
			}

			validPaths.push(path.slice());
		}

		if (validPaths.length === 0) {
			changed = true;
			continue;
		}
		repaired[shareId] = {
			secret_key: location.secret_key,
			paths: validPaths,
		};
	}

	for (const [shareId, discoveredLocation] of Object.entries(discovered)) {
		if (!Object.hasOwn(repaired, shareId)) {
			if (!discoveredLocation.secret_key) {
				continue;
			}
			repaired[shareId] = {
				secret_key: discoveredLocation.secret_key,
				paths: [],
			};
		}
		if (
			discoveredLocation.secret_key &&
			repaired[shareId].secret_key !== discoveredLocation.secret_key
		) {
			repaired[shareId].secret_key = discoveredLocation.secret_key;
			changed = true;
		}
		for (const path of discoveredLocation.paths) {
			if (
				repaired[shareId].paths.some((existing) => pathsEqual(existing, path))
			) {
				continue;
			}
			repaired[shareId].paths.push(path.slice());
			changed = true;
		}
	}

	if (!container.share_index && Object.keys(repaired).length > 0) {
		changed = true;
	}
	if (changed) {
		if (Object.keys(repaired).length > 0) {
			container.share_index = repaired;
		} else {
			delete container.share_index;
		}
	}
	return changed;
}

/**
 * Sets the "path" attribute for all folders and items
 *
 * @param datastore
 * @param parentPath
 */
function updatePathsRecursive(datastore: Datastore, parentPath: DatastorePath) {
	return datastoreService.updatePathsRecursive(datastore, parentPath);
}

/**
 * Returns the display path of the folder containing the object at path.
 *
 * @param {Array} path The id path to an item or folder
 * @param {TreeObject} datastore The datastore tree
 * @returns {string} The slash-delimited parent folder path
 */
function getFolderPath(path: DatastorePath, datastore: Datastore) {
	let folder = datastore;
	let folderPath = "/";

	for (const folderId of path.slice(0, -1)) {
		const childFolder = (folder.folders || []).find(
			(child) => child.id === folderId,
		);
		if (!childFolder) {
			throw new RangeError("ObjectNotFound");
		}
		folderPath += `${childFolder.name || ""}/`;
		folder = childFolder;
	}

	return folderPath;
}

/**
 * Shortens a folder path while keeping its beginning and end visible.
 *
 * @param {string} folderPath The folder path to abbreviate
 * @param {number} [maxLength=90] The maximum displayed length
 * @returns {string} The abbreviated folder path
 */
function abbreviateFolderPath(folderPath: string, maxLength = 90) {
	if (folderPath.length <= maxLength) {
		return folderPath;
	}

	const availableLength = maxLength - 3;
	const startLength = Math.ceil(availableLength / 2);
	const endLength = Math.floor(availableLength / 2);
	return `${folderPath.slice(0, startLength)}...${folderPath.slice(-endLength)}`;
}

/**
 * Returns the password datastore. In addition this function triggers the generation of the local datastore
 * storage to.
 *
 * @param {uuid} [id] The id of the datastore
 *
 * @returns {Promise} Returns a promise with the datastore
 */
function getPasswordDatastore(id?: string): Promise<Datastore | undefined> {
	const type = "password";
	const description = "default";

	const onSuccess = (datastore: Datastore | undefined) => {
		const onSuccess = (data: ShareRightsOverview | undefined) => {
			if (typeof data === "undefined") {
				return;
			}

			const share_rights_dict: Record<string, ShareRights> = {};
			for (let i = data.share_rights.length - 1; i >= 0; i--) {
				share_rights_dict[data.share_rights[i].share_id] = data.share_rights[i];
			}

			const onSuccess = (datastore: Datastore) => {
				updatePathsRecursive(datastore, []);

				fillStorage(datastore);

				return datastore;
			};
			const onError = (datastore: unknown) => {
				// pass
				console.log(datastore);
				return Promise.reject(datastore);
			};

			return _readShares(datastore!, share_rights_dict).then(
				onSuccess,
				onError,
			);
		};

		const onError = (data: unknown) => {
			// pass
			console.log(data);
			return Promise.reject(data);
		};

		return shareService.readShareRightsOverview().then(onSuccess, onError);
	};
	const onError = (data: unknown) => {
		// pass
		console.log(data);
		return Promise.reject(data);
	};

	return datastoreService.getDatastore(type, id).then(onSuccess, onError);
}

/**
 * Alias for getPasswordDatastore
 *
 * @param {uuid} id The id of the datastore
 *
 * @returns {Promise} Returns a promise with the datastore
 */
function getDatastoreWithId(id: string) {
	return getPasswordDatastore(id);
}

/**
 * Adds folder_path string to all items recursively
 *
 * @param {TreeObject} folder The folder node
 * @param {string} path The accumulated path string
 */
function addFolderPathRecursive(
	folder: Datastore | undefined,
	path: string,
): void {
	if (!folder) {
		return;
	}
	if (folder.folders) {
		for (let i = 0; i < folder.folders.length; i++) {
			if (
				Object.hasOwn(folder.folders[i], "deleted") &&
				folder.folders[i].deleted
			) {
				continue;
			}
			addFolderPathRecursive(
				folder.folders[i],
				path + folder.folders[i].name + "/",
			);
		}
	}
	if (folder.items) {
		for (let i = 0; i < folder.items.length; i++) {
			if (
				Object.hasOwn(folder.items[i], "deleted") &&
				folder.items[i].deleted
			) {
				continue;
			}
			folder.items[i].folder_path = path;
		}
	}
}

/**
 * Fills the datastore-password-leafs and datastore-file-leafs storage
 *
 * @param {TreeObject} datastore The datastore tree
 */
function fillStorage(datastore: Datastore | undefined) {
	addFolderPathRecursive(datastore, "/");

	datastoreService.fillStorage(
		"datastore-password-leafs",
		datastore,
		[
			["key", "secret_id"],
			["secret_id", "secret_id"],
			["secret_key", "secret_key"],
			["name", "name"],
			["description", "description"],
			[
				"urlfilter",
				(item) =>
					domainSynonymsService.expandUrlFilterWithSynonyms(
						item.urlfilter || "",
					),
			],
			["autosubmit", "autosubmit"],
			["password_hash", "password_hash"],
			["allow_http", "allow_http"],
			[
				"search",
				(item) =>
					domainSynonymsService.expandUrlFilterWithSynonyms(
						item.urlfilter || "",
					),
			],
			["type", "type"],
			["folder_path", "folder_path"],
		],
		(item) => !item.type || item.type !== "file",
	);

	datastoreService.fillStorage(
		"datastore-file-leafs",
		datastore,
		[
			["key", "id"],
			["file_id", "file_id"],
			["file_shard_id", "file_shard_id"],
			["file_repository_id", "file_repository_id"],
			["file_size", "file_size"],
			["file_secret_key", "file_secret_key"],
			["file_chunks", "file_chunks"],
			["file_title", "file_title"],
		],
		(item) => item.type && item.type === "file",
	);
}

/**
 * Updates the local storage and triggers the 'saveDatastoreContent' to reflect the changes
 *
 * @param {TreeObject} datastore The datastore tree
 */
function handleDatastoreContentChanged(datastore: Datastore) {
	const datastore_copy = helperService.duplicateObject(datastore);

	updatePathsRecursive(datastore_copy, []);

	// datastore has changed, so lets regenerate local lookup
	fillStorage(datastore);
}

/**
 * Saves the password datastore with given content (including shares) based on the "paths" of all changed
 * elements
 *
 * Responsible for hiding content that doesn't belong into the datastore (like the content of secrets).
 *
 * @param {TreeObject} datastore The real tree object you want to encrypt in the datastore
 * @param {Array} paths The list of paths to the changed elements
 */
function saveDatastoreContent(datastore: Datastore, paths: DatastorePath[]) {
	const type = "password";
	const description = "default";

	datastore = helperService.duplicateObject(datastore);
	datastoreService.normalizeShareContent(datastore);

	const closest_shares: Record<string, Datastore> = {};

	for (let i = paths.length - 1; i >= 0; i--) {
		const closest_share_info = shareService.getClosestParentShare(
			paths[i],
			datastore,
			datastore,
			0,
		);
		const closest_share = (closest_share_info as ClosestParentShare)[
			"closest_share"
		];
		if (typeof closest_share.id === "undefined") {
			// its the datastore
			closest_shares["datastore"] = datastore;
		} else {
			closest_shares[closest_share.id] = closest_share;
		}
	}

	const promises = [];
	for (const prop in closest_shares) {
		if (!Object.hasOwn(closest_shares, prop)) {
			continue;
		}

		const duplicate = helperService.duplicateObject(closest_shares[prop]);
		if (prop === "datastore") {
			promises.push(
				datastoreService.saveDatastoreContent(type, description, duplicate),
			);
		} else {
			const share_id = duplicate.share_id;
			const share_secret_key = duplicate.share_secret_key;

			delete duplicate.share_id;
			delete duplicate.share_secret_key;
			delete duplicate.share_rights;

			promises.push(
				shareService.writeShare(share_id!, duplicate, share_secret_key!),
			);
		}
	}

	return Promise.all(promises);
}

/**
 * Generates a new password for a given url and saves the password in the datastore.
 *
 * @param {object} secretObject The constructed secret object
 * @param {object} datastoreObject The constructed datastore object
 *
 * @returns {Promise} Returns a promise with the status
 */
function saveInDatastore(secretObject: SecretData, datastoreObject: Datastore) {
	const link_id = cryptoLibrary.generateUuid();

	const onError = () => {
		return undefined;
	};

	const onSuccess = (result: Datastore | undefined) => {
		const datastore = result!;
		return secretService
			.createSecret(secretObject, link_id, datastore.datastore_id, undefined)
			.then(async (data) => {
				if (!datastore.items) {
					datastore["items"] = [];
				}

				datastoreObject["id"] = link_id;
				datastoreObject["secret_id"] = data!.secret_id;
				datastoreObject["secret_key"] = data!.secret_key;
				datastore.items.push(datastoreObject as DatastoreItem);

				await saveDatastoreContent(datastore, [[]]);
				handleDatastoreContentChanged(datastore);

				return datastoreObject;
			}, onError);
	};

	return getPasswordDatastore().then(onSuccess, onError);
}

/**
 * Stores credential for a given url, username and password in the datastore
 *
 * @param {string} url The URL of the site for which the password has been generated
 * @param {string} username The username to store
 * @param {string} password The password to store
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function savePassword(url: string, username?: string, password?: string) {
	const parsed_url = helperService.parseUrl(url);

	const secret_object = {
		website_password_title:
			parsed_url.authority_without_www || i18n.t("UNKNOWN"),
		website_password_url: url,
		website_password_username: username || "",
		website_password_password: password || "",
		website_password_notes: "",
		website_password_auto_submit: false,
		website_password_url_filter: parsed_url.authority || "",
		website_password_allow_http:
			parsed_url.scheme && parsed_url.scheme === "http",
	};

	const datastore_object: Datastore = {
		type: "website_password",
		name: parsed_url.authority_without_www || i18n.t("UNKNOWN"),
		urlfilter: parsed_url.authority || "",
		allow_http: parsed_url.scheme && parsed_url.scheme === "http",
	};
	if (username) {
		datastore_object["description"] = username;
	}

	const onError = (data: unknown) => {
		console.log(data);
		return undefined;
	};

	const onSuccess = (datastoreObject: Datastore | undefined) => {
		// we return a promise. We do not yet have a proper error handling and returning
		// a promise might make it easier later to wait or fix errors
		return new Promise<Datastore | undefined>((resolve) => {
			resolve(datastoreObject);
		});
	};

	return saveInDatastore(secret_object, datastore_object).then(
		onSuccess,
		onError,
	);
}

/**
 * Updates password for a given url, username and password in the datastore
 *
 * @param {string} url The URL of the site for which the password has been generated
 * @param {string} username The username to store
 * @param {string} password The password to store
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function updatePassword(url: string, username: string, password: string) {
	const parsed_url = helperService.parseUrl(url);
	const authority = parsed_url.authority || "";

	const onError = (result: unknown) => {
		console.log("Error updating password:", result);
		return Promise.reject(result);
	};

	const onSuccess = (result: Datastore | undefined) => {
		const datastore = result!;
		const matchingEntries: DatastoreItem[] = [];

		const searchForMatches = (obj: Datastore): void => {
			if (obj.items) {
				for (let i = 0; i < obj.items.length; i++) {
					const item = obj.items[i];
					if (item.type !== "website_password") {
						continue;
					}
					if (!Object.hasOwn(item, "urlfilter")) {
						continue;
					}
					const urlFilters = item.urlfilter!.split(/\s+|,|;/);
					let found = false;
					for (let j = 0; j < urlFilters.length; j++) {
						if (helperService.isUrlFilterMatch(authority, urlFilters[j])) {
							found = true;
							break;
						}
					}
					if (!found) {
						continue;
					}
					matchingEntries.push(item);
				}
			}

			if (obj.folders) {
				for (let i = 0; i < obj.folders.length; i++) {
					searchForMatches(obj.folders[i]);
				}
			}
		};

		searchForMatches(datastore);

		if (matchingEntries.length !== 1) {
			return Promise.reject({
				error:
					"Expected exactly one matching entry, found " +
					matchingEntries.length,
			});
		}

		const entry = matchingEntries[0];

		if (entry.type !== "website_password") {
			return Promise.reject({
				error: "Entry type is not website_password",
			});
		}

		const onSecretReadSuccess = (secretData: SecretData) => {
			secretData.website_password_password = password;

			const passwordSha1 = cryptoLibrary.sha1(password);
			entry.password_hash = passwordSha1.substring(0, 5).toLowerCase();

			const onSecretWriteSuccess = () =>
				saveDatastoreContent(datastore, [entry.path || []]).then(() => {
					handleDatastoreContentChanged(datastore);
					return entry;
				});

			return secretService
				.writeSecret(entry.secret_id!, entry.secret_key!, secretData)
				.then(onSecretWriteSuccess, onError);
		};

		return secretService
			.readSecret(entry.secret_id!, entry.secret_key!)
			.then(onSecretReadSuccess, onError);
	};

	return getPasswordDatastore().then(onSuccess, onError);
}

/**
 * Stores a passkey in the datastore
 *
 * @param {string} passkey_id The id of the passkey in Hex notation
 * @param {string} passkey_rp_id The RPID e.g. a domain or ip address
 * @param {string} passkey_public_key The public key in jwk format
 * @param {string} passkey_private_key The private key in jwk format
 * @param {string} passkey_user_handle The user handle
 * @param {string} username The username
 * @param {object} passkey_algorithm The algorithm object e.g { 'name': "ECDSA", 'namedCurve': "P-256" }
 * @param {boolean} [passkey_auto_submit=false] Whether the passkey is discoverable (can be used for autofill)
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function savePasskey(
	passkey_id: string,
	passkey_rp_id: string,
	passkey_public_key: string | JsonWebKey,
	passkey_private_key: string | JsonWebKey,
	passkey_user_handle: string,
	username: string,
	passkey_algorithm: EcKeyGenParams | RsaHashedKeyGenParams | Algorithm,
	passkey_auto_submit = false,
) {
	const title = (passkey_rp_id + " " + username).trim() || i18n.t("UNKNOWN");
	const urlfilter = passkey_rp_id + "#" + passkey_id;

	const secret_object = {
		passkey_title: title,
		passkey_rp_id: passkey_rp_id,
		passkey_id: passkey_id,
		passkey_public_key: passkey_public_key,
		passkey_private_key: passkey_private_key,
		passkey_user_handle: passkey_user_handle,
		passkey_algorithm: passkey_algorithm,
		passkey_url_filter: urlfilter,
		passkey_auto_submit: passkey_auto_submit,
	};

	const datastore_object: Datastore = {
		type: "passkey",
		name: title,
		urlfilter: urlfilter,
	};

	if (passkey_auto_submit) {
		datastore_object["autosubmit"] = true;
	}

	const onError = (data: unknown) => {
		console.log(data);
		return undefined;
	};

	const onSuccess = (datastoreObject: Datastore | undefined) => {
		// we return a promise. We do not yet have a proper error handling and returning
		// a promise might make it easier later to wait or fix errors
		return new Promise<Datastore | undefined>((resolve) => {
			resolve(datastoreObject);
		});
	};

	return saveInDatastore(secret_object, datastore_object).then(
		onSuccess,
		onError,
	);
}

/**
 * Generates a password for the active tab
 *
 * @param {string} password The password to store
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function savePasswordActiveTab(username?: string, password?: string) {
	const onError = () => {
		console.log("could not find out the url of the active tab");
		return undefined;
	};

	const onSuccess = (activeUrl: string | undefined) => {
		let url = activeUrl!;
		const onError = () => {
			return undefined;
		};
		const onSuccess = (datastore_object: Datastore | undefined) =>
			datastore_object;

		// Resolve URL synonym to canonical form
		url = urlSynonymsService.resolveUrlSynonym(url);

		return savePassword(url, username, password).then(onSuccess, onError);
	};

	return browserClient.getActiveTabUrl().then(onSuccess, onError);
}

/**
 * Bookmarks the active tab
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function bookmarkActiveTab() {
	const onError = () => {
		console.log("could not find out the url of the active tab");
		return undefined;
	};

	const onSuccess = (activeUrl: string | undefined) => {
		const url = activeUrl!;
		const parsed_url = helperService.parseUrl(url);

		const secret_object = {
			bookmark_title: parsed_url.authority_without_www || i18n.t("UNKNOWN"),
			bookmark_url: url,
			bookmark_notes: "",
			bookmark_url_filter: parsed_url.authority || "",
		};

		const datastore_object = {
			type: "bookmark",
			name: parsed_url.authority_without_www || i18n.t("UNKNOWN")!,
			urlfilter: parsed_url.authority || "",
		};

		const onError = () => {
			return undefined;
		};

		const onSuccess = (datastoreObject: Datastore | undefined) => {
			// we return a promise. We do not yet have a proper error handling and returning
			// a promise might make it easier later to wait or fix errors
			return new Promise<Datastore | undefined>((resolve) => {
				resolve(datastoreObject);
			});
		};

		return saveInDatastore(secret_object, datastore_object).then(
			onSuccess,
			onError,
		);
	};

	return browserClient.getActiveTabUrl().then(onSuccess, onError);
}

/**
 * Searches a datastore and returns the paths
 *
 * @param {*} toSearch The thing to search
 * @param {TreeObject} datastore The datastore object tree
 * @param {function} cmpFct The compare function
 *
 * @returns {Array} a list of the paths
 */
function searchInDatastore<T>(
	toSearch: T,
	datastore: Datastore,
	cmpFct: (search: T, item: DatastoreItem) => unknown,
): DatastorePath[] {
	let i, n, l;
	const paths: DatastorePath[] = [];
	let tmpPaths;

	if (datastore.items) {
		for (n = 0, l = datastore.items.length; n < l; n++) {
			if (!cmpFct(toSearch, datastore.items[n])) {
				continue;
			}
			paths.push([datastore.items[n].id]);
		}
	}

	if (datastore.folders) {
		for (n = 0, l = datastore.folders.length; n < l; n++) {
			tmpPaths = searchInDatastore(toSearch, datastore.folders[n], cmpFct);
			for (i = 0; i < tmpPaths.length; i++) {
				tmpPaths[i].unshift(datastore.folders[n].id);
				paths.push(tmpPaths[i]);
			}
			if (!cmpFct(toSearch, datastore.folders[n])) {
				continue;
			}
			paths.push([datastore.folders[n].id]);
		}
	}
	return paths;
}

/**
 * Searches a datastore and returns all tags
 *
 * @param {TreeObject} datastore The datastore object tree
 *
 * @returns {Array} a list of the paths
 */
function getTags(datastore?: Datastore | null): string[] {
	let n;
	const tags: string[] = [];
	let tmpTags;

	if (!datastore) {
		return tags;
	}

	if (datastore.items) {
		for (n = 0; n < datastore.items.length; n++) {
			if (
				!Object.hasOwn(datastore.items[n], "tags") ||
				!datastore.items[n].tags
			) {
				continue;
			}
			tags.push(...datastore.items[n].tags!);
		}
	}

	if (datastore.folders) {
		for (n = 0; n < datastore.folders.length; n++) {
			tmpTags = getTags(datastore.folders[n]);
			tags.push(...tmpTags);
		}
	}
	return [...new Set(tags)];
}

/**
 * fills otherChildren with all child shares of a given path
 *
 * @param {TreeObject|undefined} obj the object to search
 * @param {int|undefined} shareDistance hare_distance the distance in shares to search (-1 = unlimited search, 0 stop search)
 * @param {Array} otherChildren The list of found children that will be updated with new findings
 * @param {Array} [path] (optional)  The path to prepend, if not provided an empty path will be assumed.
 */
function getAllChildShares(
	obj: Datastore,
	shareDistance: number | undefined,
	otherChildren: ChildShare[],
	path?: DatastorePath,
): void {
	if (typeof path === "undefined") {
		path = [];
	}

	let n, l, new_path;
	if (shareDistance === 0) {
		return;
	}
	//search in folders
	if (obj.folders) {
		for (n = 0, l = obj.folders.length; n < l; n++) {
			new_path = path.slice();
			new_path.push(obj.folders[n].id);
			if (typeof obj.folders[n].share_id !== "undefined") {
				otherChildren.push({
					share: obj.folders[n],
					path: new_path,
				});
				getAllChildShares(
					obj.folders[n],
					(shareDistance ?? NaN) - 1,
					otherChildren,
					new_path,
				);
			} else {
				getAllChildShares(
					obj.folders[n],
					shareDistance,
					otherChildren,
					new_path,
				);
			}
		}
	}
	// search in items
	if (obj.items) {
		for (n = 0, l = obj.items.length; n < l; n++) {
			new_path = path.slice();
			new_path.push(obj.items[n].id);
			if (typeof obj.items[n].share_id !== "undefined") {
				otherChildren.push({
					share: obj.items[n],
					path: new_path,
				});
			}
		}
	}
}

/**
 * fills otherChildren with all child shares of a given path
 *
 * @param {Array} path The path to search for child shares
 * @param {TreeObject|undefined} [datastore] (optional) if obj provided
 * @param {Array} otherChildren The list of found children that will be updated with new findings
 * @param {TreeObject|undefined} [obj] (optional)  if not provided we will search it in the datastore according to the provided path first
 */
function getAllChildSharesByPath(
	path: DatastorePath,
	datastore: Datastore | undefined,
	otherChildren: ChildShare[],
	obj?: Datastore | false,
) {
	if (typeof obj === "undefined") {
		const path_copy = path.slice();
		const search = datastoreService.findInDatastore(path_copy, datastore!);
		obj = search[0][search[1]];
		return getAllChildShares(obj, 1, otherChildren, path);
	} else if (obj === false) {
		// TODO Handle not found
		console.log("HANDLE not found!");
	} else {
		getAllChildShares(obj, 1, otherChildren, path);
	}
}

/**
 * returns searches an element recursive for items with a property. Doesn't cross share borders.
 *
 * @param {object} element the tree structure with shares to search
 * @param {string} property the property to search for
 * @returns {Array} List of element ids and the paths
 */
function getAllElementsWithProperty(element: Datastore, property: string) {
	const links: ElementLink[] = [];

	/**
	 * helper function, that searches an element recursive for secret links. Doesn't cross share borders.
	 *
	 * @param {object} element the element to search
	 * @param {Array} links
	 * @param {Array} path
	 */
	function get_all_elements_with_property_recursive(
		element: Datastore,
		links: ElementLink[],
		path: DatastorePath,
	): void {
		let n, l;
		const new_path = path.slice();
		new_path.push(element.id!);

		if (Object.hasOwn(element, "share_id")) {
			return;
		}

		// check if the element itself has the property
		if (Object.hasOwn(element, property)) {
			links.push({
				id: element.id!,
				name: element.name || "",
				path: new_path,
			});
		}

		// search items recursive, skip shares
		if (element.items) {
			for (n = 0, l = element.items.length; n < l; n++) {
				if (Object.hasOwn(element.items[n], "share_id")) {
					continue;
				}
				get_all_elements_with_property_recursive(
					element.items[n],
					links,
					new_path,
				);
			}
		}

		// search folders recursive, skip shares
		if (element.folders) {
			for (n = 0, l = element.folders.length; n < l; n++) {
				if (Object.hasOwn(element.folders[n], "share_id")) {
					continue;
				}
				get_all_elements_with_property_recursive(
					element.folders[n],
					links,
					new_path,
				);
			}
		}
	}

	get_all_elements_with_property_recursive(element, links, []);

	return links;
}

/**
 * returns all secret links in element. Doesn't cross share borders.
 *
 * @param {object} element the element to search
 * @returns {Array} List of secret links
 */
function getAllSecretLinks(element: Datastore) {
	if (Object.hasOwn(element, "share_id")) {
		return [];
	}
	return getAllElementsWithProperty(element, "secret_id");
}

/**
 * returns all file links in element. Doesn't cross share borders.
 *
 * @param {object} element the element to search
 * @returns {Array} List of secret links
 */
function getAllFileLinks(element: Datastore) {
	if (Object.hasOwn(element, "share_id")) {
		return [];
	}
	return getAllElementsWithProperty(element, "file_id");
}

/**
 * Translates the absolute path to a relative path
 *
 * @param {TreeObject} share The share to search in the absolute path
 * @param {Array} absolutePath The absolute path
 * @returns {Array} Returns the relative path
 */
function getRelativePath(share: Datastore, absolutePath: DatastorePath) {
	const path_copy = absolutePath.slice();

	// lets create the relative path in the share
	let relative_path: DatastorePath = [];

	if (typeof share.id === "undefined") {
		// we have the datastore, so we need the complete path
		relative_path = path_copy;
	} else {
		let passed = false;
		for (let i = 0, l = path_copy.length; i < l; i++) {
			if (passed) {
				relative_path.push(path_copy[i]);
			} else if (share.id === path_copy[i]) {
				passed = true;
			}
		}
	}

	return relative_path;
}

/**
 * triggered once a new share is added. Searches the datastore for the closest share (or the datastore if no
 * share) and adds it to the share_index
 *
 * @param {uuid} shareId The share id that was added
 * @param {Array} path The path to the new share
 * @param {TreeObject} datastore The datastore it was added to
 * @param {int} distance Some logic to get the correct parent share to update
 *
 * @returns {Array} Returns the paths to update
 */
function onShareAdded(
	shareId: string,
	path: DatastorePath,
	datastore: Datastore,
	distance: number,
) {
	const changed_paths: DatastorePath[] = [];
	let i, l;

	const path_copy = path.slice();
	const path_copy2 = path.slice();
	const path_copy3 = path.slice();
	const path_copy4 = path.slice();

	const closest_share_info = shareService.getClosestParentShare(
		path_copy,
		datastore,
		datastore,
		distance,
	);
	const parent_share = (closest_share_info as ClosestParentShare)[
		"closest_share"
	];

	if (!parent_share) {
		console.log(path_copy);
		console.log(datastore);
		console.log(distance);
	}

	// create share_index object if not exists
	if (typeof parent_share.share_index === "undefined") {
		parent_share.share_index = {};
	}
	let share: Datastore;
	// add the the entry for the share in the share_index if not yet exists
	if (typeof parent_share.share_index[shareId] === "undefined") {
		const search = datastoreService.findInDatastore(path_copy2, datastore);
		share = search[0][search[1]];

		parent_share.share_index[shareId] = {
			paths: [],
			secret_key: share.share_secret_key!,
		};
	}

	const parent_share_path: DatastorePath = [];
	for (i = 0, l = path_copy3.length; i < l; i++) {
		if (
			typeof parent_share.id === "undefined" ||
			path_copy3[i] === parent_share.id
		) {
			break;
		}
		parent_share_path.push(path_copy3[i]);
	}
	changed_paths.push(parent_share_path);

	// lets create the relative path in the share
	const relative_path = getRelativePath(parent_share, path_copy3);

	parent_share.share_index[shareId].paths.push(relative_path);

	let share_changed = false;
	const shareIndex = parent_share.share_index;

	for (const old_share_id in shareIndex) {
		if (!Object.hasOwn(parent_share, "share_index")) {
			break;
		}
		if (!Object.hasOwn(shareIndex, old_share_id)) {
			continue;
		}
		if (old_share_id === shareId) {
			continue;
		}

		for (i = shareIndex[old_share_id].paths.length - 1; i >= 0; i--) {
			if (
				!helperService.arrayStartsWith(
					shareIndex[old_share_id].paths[i],
					relative_path,
				)
			) {
				continue;
			}
			const new_relative_path = shareIndex[old_share_id].paths[i].slice(
				relative_path.length,
			);

			shareIndex[old_share_id].paths.splice(i, 1);

			if (typeof share!.share_index === "undefined") {
				share!.share_index = {};
			}

			if (typeof share!.share_index![old_share_id] === "undefined") {
				share!.share_index![old_share_id] = {
					paths: [],
					secret_key: shareIndex[old_share_id].secret_key,
				};
			}
			share!.share_index![old_share_id].paths.push(new_relative_path);

			if (shareIndex[old_share_id].paths.length === 0) {
				delete shareIndex[old_share_id];
			}

			if (Object.keys(shareIndex).length === 0) {
				delete parent_share.share_index;
			}
			share_changed = true;

			if (
				!Object.hasOwn(parent_share, "share_index") ||
				!Object.hasOwn(shareIndex, old_share_id)
			) {
				break;
			}
		}
	}

	if (share_changed) {
		changed_paths.push(path_copy4);
	}

	return changed_paths;
}

/**
 * The function that actually adjusts the share_index object and deletes the shares
 *
 * @param share the share holding the share_index
 * @param shareId the shareId of the share, that we want to remove from the share_index
 * @param relativePath the relative path inside the share
 */
function deleteFromShareIndex(
	share: Datastore,
	shareId: string,
	relativePath: DatastorePath,
) {
	if (!share.share_index || !Object.hasOwn(share.share_index, shareId)) {
		return;
	}

	const paths = share.share_index[shareId].paths;

	for (let i = paths.length - 1; i >= 0; i--) {
		// delete the path from the share index entry
		if (helperService.arrayStartsWith(paths[i], relativePath)) {
			paths.splice(i, 1);
		}
	}

	// if no paths are empty, we delete the whole share_index entry
	if (paths.length === 0) {
		delete share.share_index[shareId];
	}
	// if the share_index holds no entries anymore, we delete the share_index
	if (Object.keys(share.share_index).length === 0) {
		delete share.share_index;
	}
}

/**
 * triggered once a share is deleted. Searches the datastore for the closest share (or the datastore if no
 * share) and removes it from the share_index
 *
 * @param {uuid} shareId the shareId to delete
 * @param {Array} path The path to the deleted share
 * @param {TreeObject} datastore The datastore it was deleted from
 * @param {int} distance Some logic to get the correct parent share to update
 *
 * @returns {Array} Returns the paths to update
 */
function onShareDeleted(
	shareId: string,
	path: DatastorePath,
	datastore: Datastore,
	distance: number,
) {
	const path_copy = path.slice();
	const closest_share_info = shareService.getClosestParentShare(
		path_copy,
		datastore,
		datastore,
		distance,
	);
	const parent_share = (closest_share_info as ClosestParentShare)[
		"closest_share"
	];
	const relative_path = getRelativePath(parent_share, path.slice());

	// Share_id specified, so lets delete the specified one
	deleteFromShareIndex(parent_share, shareId, relative_path);

	return [path];
}

/**
 * triggered once a share moved. handles the update of the share_index
 *
 * @param {uuid} shareId The id of the share that moved
 * @param {Array} oldPath The old path
 * @param {Array} newPath The new path
 * @param {TreeObject} datastore The affected datastore
 * @param {int} addDistance Some logic to get the correct parent share to update in on_share_added()
 * @param {int} deleteDistance Some logic to get the correct parent share to update in on_share_deleted()
 * @returns {Array} Returns the paths to update
 */
function onShareMoved(
	shareId: string,
	oldPath: DatastorePath,
	newPath: DatastorePath,
	datastore: Datastore,
	addDistance: number,
	deleteDistance: number,
) {
	const paths_updated1 = onShareAdded(shareId, newPath, datastore, addDistance);
	const paths_updated2 = onShareDeleted(
		shareId,
		oldPath,
		datastore,
		deleteDistance,
	);

	return paths_updated1.concat(paths_updated2);
}

/**
 * used to trigger all registered functions on event
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} value The value with which to call the function
 */
function triggerRegistration(key: string, value: unknown) {
	if (!Object.hasOwn(registrations, key)) {
		registrations[key] = [];
	}
	for (let i = registrations[key].length - 1; i >= 0; i--) {
		registrations[key][i](value);
	}
}

/**
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key: string, func: (value: unknown) => void) {
	if (!Object.hasOwn(registrations, key)) {
		registrations[key] = [];
	}
	registrations[key].push(func);
}

/**
 * used to unregister functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function unregister(key: string, func: (value: unknown) => void) {
	if (!Object.hasOwn(registrations, key)) {
		registrations[key] = [];
	}
	for (let i = registrations[key].length - 1; i >= 0; i--) {
		if (registrations[key][i] !== func) {
			continue;
		}
		registrations[key].splice(i, 1);
	}
}

/**
 * Analyzes the breadcrumbs and returns some info about them like e.g parent_share_id
 *
 * @param {object} breadcrumbs The breadcrumbs to follow
 * @param {TreeObject} datastore The corresponding datastore to analyze
 *
 * @returns {object} The info about the object
 */
function analyzeBreadcrumbs(breadcrumbs: Breadcrumbs, datastore: Datastore) {
	let path: DatastorePath;
	let parent_path: DatastorePath;
	let parent_share;

	let target;
	let parent_share_id;
	let parent_datastore_id;

	if (
		typeof breadcrumbs.id_breadcrumbs !== "undefined" &&
		breadcrumbs.id_breadcrumbs.length > 0
	) {
		path = breadcrumbs.id_breadcrumbs.slice();
		const path_copy = breadcrumbs.id_breadcrumbs.slice();
		parent_path = breadcrumbs.id_breadcrumbs.slice();
		// find drop zone
		const val1 = datastoreService.findInDatastore(
			breadcrumbs.id_breadcrumbs,
			datastore,
		);
		target = val1[0][val1[1]];

		// get the parent (share or datastore)
		const closest_share_info = shareService.getClosestParentShare(
			path_copy,
			datastore,
			datastore,
			0,
		);
		parent_share = (closest_share_info as ClosestParentShare)["closest_share"];
		if (Object.hasOwn(parent_share, "datastore_id")) {
			parent_datastore_id = parent_share.datastore_id;
		} else if (Object.hasOwn(parent_share, "share_id")) {
			parent_share_id = parent_share.share_id;
		} else {
			alert(
				"Wupsi, that should not happen: d6da43af-e0f5-46ba-ae5b-d7e5ccd2fa92",
			);
		}
	} else {
		path = [];
		parent_path = [];
		target = datastore;
		parent_share = datastore;
		parent_datastore_id = target.datastore_id;
	}

	return {
		path: path,
		parent_path: parent_path,
		parent_share: parent_share,
		target: target,
		parent_share_id: parent_share_id,
		parent_datastore_id: parent_datastore_id,
	};
}

/**
 * Adds a single share to the password datastore, triggers the creation of the necessary share links and returns
 * changed paths
 *
 * @param {object} share The share to add
 * @param {object} target The target folder to add the share to
 * @param {array} path The path of the target folder
 * @param {uuid} parentShareId The parent Share ID (if the parent is a share)
 * @param {uuid} parentDatastoreId The parent Datastore ID (if the parent is a datastore)
 * @param {TreeObject} datastore The complete password datastore
 * @param {TreeObject} parentShare The target share or datastore
 *
 * @returns {Array} The paths of changes
 */
function createShareLinkInDatastore(
	share: Datastore & { share_id: string },
	target: Datastore,
	path: DatastorePath,
	parentShareId: string | undefined,
	parentDatastoreId: string | undefined,
	datastore: Datastore,
	parentShare: Datastore,
) {
	if (
		parentShare.share_index &&
		Object.hasOwn(parentShare["share_index"], share.share_id) &&
		Object.hasOwn(parentShare["share_index"][share.share_id], "paths") &&
		parentShare["share_index"][share.share_id]["paths"].length > 0
	) {
		// share already exists in this parent share / datastore, so we prevent creation of duplicates
		return [];
	}

	const link_id = cryptoLibrary.generateUuid();

	share.id = link_id;

	if (typeof share.type === "undefined") {
		//its a folder, lets add it to folders
		if (typeof target.folders === "undefined") {
			target.folders = [];
		}
		target.folders.push(share as DatastoreItem);
	} else {
		// its an item, lets add it to items
		if (typeof target.items === "undefined") {
			target.items = [];
		}
		target.items.push(share as DatastoreItem);
	}

	shareLinkService.createShareLink(
		link_id,
		share.share_id,
		parentShareId,
		parentDatastoreId,
	);

	path.push(share.id);

	return onShareAdded(share.share_id, path, datastore, 1);
}

/**
 * Adds multiple shares to the password datastore and triggers the save of the password datastore
 *
 * @param {array} shares An array of shares to add to the datastore
 * @param {object} target The target folder to add the shares to
 * @param {array} parentPath The path to the parent datastore or share
 * @param {array} path The path to the target
 * @param {uuid} parentShareId The parent Share ID (if the parent is a share)
 * @param {uuid} parentDatastoreId The parent Datastore ID (if the parent is a datastore)
 * @param {TreeObject} datastore The complete password datastore
 * @param {TreeObject} parentShare The target share or datastore
 *
 * @returns {Promise} Returns a promise with the success of the action
 */
function createShareLinksInDatastore(
	shares: (Datastore & { share_id: string })[],
	target: Datastore,
	parentPath: DatastorePath,
	path: DatastorePath,
	parentShareId: string | undefined,
	parentDatastoreId: string | undefined,
	datastore: Datastore,
	parentShare: Datastore,
) {
	const changedPaths = [parentPath];

	for (let i = 0; i < shares.length; i++) {
		const share = shares[i];

		changedPaths.push(
			...createShareLinkInDatastore(
				share,
				target,
				helperService.duplicateObject(path),
				parentShareId,
				parentDatastoreId,
				datastore,
				parentShare,
			),
		);
	}

	return saveDatastoreContent(datastore, changedPaths);
}

/**
 * Walks through the folder structure and sets "hidden" to false
 *
 * @param {TreeObject} searchTree The part of the datastore to show recursive
 */
function showFolderContentRecursive(searchTree: Datastore): void {
	let i;
	if (searchTree.folders) {
		for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
			showFolderContentRecursive(searchTree.folders[i]);
		}
	}
	if (searchTree.items) {
		for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
			searchTree.items[i].hidden = false;
		}
	}
	searchTree.hidden = false;
}

/**
 * searches a tree and marks all folders / items as invisible, only leaving nodes with search
 *
 * @param {string} newValue The new string from the search box
 * @param {TreeObject} searchTree The part of the datastore to search
 * @param {string} folderPath The path to the current folder (used for folder name search)
 */
function modifyTreeForSearch(
	newValue: string | undefined,
	searchTree: Datastore | null | undefined,
	folderPath = "/",
): boolean | undefined {
	if (
		typeof newValue === "undefined" ||
		typeof searchTree === "undefined" ||
		searchTree === null
	) {
		return;
	}

	if (newValue.length < 3) {
		newValue = "";
	}

	let show = false;

	let i;
	if (searchTree.folders) {
		for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
			const childFolderPath = folderPath + searchTree.folders[i].name + "/";
			show =
				modifyTreeForSearch(newValue, searchTree.folders[i], childFolderPath) ||
				show;
		}
	}

	const password_filter = helperService.getPasswordFilter(newValue);

	// Test title of the items (include folder path in search)
	if (searchTree.items) {
		for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
			if (password_filter(searchTree.items[i], folderPath)) {
				searchTree.items[i].hidden = false;
				show = true;
			} else {
				searchTree.items[i].hidden = true;
			}
		}
	}
	// Test title of the folder
	if (typeof searchTree.name !== "undefined") {
		if (password_filter(searchTree)) {
			show = true;
			showFolderContentRecursive(searchTree);
		}
	}
	searchTree.hidden = !show;
	searchTree.expanded_temporary = newValue !== "";
	searchTree.is_expanded = searchTree.expanded_temporary || searchTree.expanded;

	return show;
}

/**
 * Takes a list of shares and will check which ones are accessible or not.
 * It will return a list of shares that are not accessible.
 *
 * @param {Array} shareList The list of shares (objects with share_id attribute)
 *
 * @returns {Array} A list of the objects that are not accessible
 */
async function getInaccessibleShares<T extends { share_id: string }>(
	shareList: T[],
): Promise<T[]> {
	// returns an empty list if the password datastore hasn't been read yet
	await getPasswordDatastore();

	const inaccessibleShares = [];

	for (let i = 0; i < shareList.length; i++) {
		if (Object.hasOwn(_shareIndex, shareList[i].share_id)) {
			continue;
		}
		inaccessibleShares.push(shareList[i]);
	}

	return inaccessibleShares;
}

/**
 * Reads the password datastore and returns all own pgp private keys as array
 *
 * @returns {Promise} A list of all own pgp keys
 */
function getAllOwnPgpKeys(): Promise<string[]> {
	return new Promise<string[]>((resolve) => {
		getPasswordDatastore().then((datastore) => {
			const ownPgpSecrets: DatastoreItem[] = [];
			const ownPgpKeys: string[] = [];
			let failed = 0;

			datastoreService.filter(datastore, (item) => {
				if (
					!Object.hasOwn(item, "type") ||
					item["type"] !== "mail_gpg_own_key"
				) {
					return;
				}
				ownPgpSecrets.push(item);
			});

			if (ownPgpSecrets.length === 0) {
				resolve(ownPgpKeys);
			}

			const trigger_potential_return = () => {
				if (ownPgpKeys.length + failed === ownPgpSecrets.length) {
					resolve(ownPgpKeys);
				}
			};

			const onError = () => {
				failed = failed + 1;
				trigger_potential_return();
			};

			const onSuccess = (secret: SecretData) => {
				ownPgpKeys.push(secret["mail_gpg_own_key_private"] as string);
				trigger_potential_return();
			};

			for (let i = 0; i < ownPgpSecrets.length; i++) {
				secretService
					.readSecret(ownPgpSecrets[i].secret_id!, ownPgpSecrets[i].secret_key!)
					.then(onSuccess, onError);
			}
		});
	});
}

/**
 * Collapse all the folders in datastore.
 * Calls recursive itself for all folders
 *
 * @param {TreeObject} obj The tree object
 * @returns {TreeObject} Returns an immutable datastore
 */
function collapseFoldersRecursive<T extends Datastore>(obj: T): T {
	if (obj.folders) {
		return {
			...obj,
			expanded: undefined,
			folders: obj.folders.map((item) => collapseFoldersRecursive(item)),
		};
	}

	if (obj.items) {
		return {
			...obj,
			expanded: undefined,
			items: obj.items.map((item) => collapseFoldersRecursive(item)),
		};
	}

	return {
		...obj,
		expanded: undefined,
	};
}

shareService.register("get_all_child_shares", getAllChildShares);

const datastorePasswordService = {
	generatePassword: generatePassword,
	generate: generate,
	escapeRegExp: escapeRegExp,
	getPasswordDatastore: getPasswordDatastore,
	getDatastoreWithId: getDatastoreWithId,
	saveDatastoreContent: saveDatastoreContent,
	handleDatastoreContentChanged: handleDatastoreContentChanged,
	savePassword: savePassword,
	updatePassword: updatePassword,
	savePasswordActiveTab: savePasswordActiveTab,
	savePasskey: savePasskey,
	bookmarkActiveTab: bookmarkActiveTab,
	searchInDatastore: searchInDatastore,
	getTags: getTags,
	getAllChildSharesByPath: getAllChildSharesByPath,
	getAllChildShares: getAllChildShares,
	getAllSecretLinks: getAllSecretLinks,
	getAllFileLinks: getAllFileLinks,
	repairShareIndex: repairShareIndex,
	onShareAdded: onShareAdded,
	onShareMoved: onShareMoved,
	onShareDeleted: onShareDeleted,
	deleteFromShareIndex: deleteFromShareIndex,
	updateParents: updateParents,
	register: register,
	unregister: unregister,
	analyzeBreadcrumbs: analyzeBreadcrumbs,
	createShareLinksInDatastore: createShareLinksInDatastore,
	modifyTreeForSearch: modifyTreeForSearch,
	getInaccessibleShares: getInaccessibleShares,
	getAllOwnPgpKeys: getAllOwnPgpKeys,
	updatePathsRecursive: updatePathsRecursive,
	getFolderPath: getFolderPath,
	abbreviateFolderPath: abbreviateFolderPath,
	collapseFoldersRecursive: collapseFoldersRecursive,
	fillStorage: fillStorage,
};

export default datastorePasswordService;
