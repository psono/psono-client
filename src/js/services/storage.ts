/**
 * Service that handles local storage access
 */

import localforage from "localforage";
import { seal, unseal } from "./vault-lock";
import vaultLock from "./vault-lock";
import type {
	EncryptedValue,
	FileLeaf,
	PasswordLeaf,
} from "../../types/datastore";

const registrations: Record<string, ((payload: unknown) => void)[]> = {};

export interface StorageEntry<T = unknown> {
	key: string;
	value: T;
}

interface StorageValues {
	state: string;
	"datastore-password-leafs": PasswordLeaf;
	"datastore-file-leafs": FileLeaf;
	"offline-cache": StorageEntry<string | EncryptedValue>;
	"file-downloads": { key: string; [field: string]: unknown };
	various: { key: string; [field: string]: unknown };
}

export type StorageDb = keyof StorageValues;

const dbConfig = {
	state: localforage.createInstance({
		name: "state", // that's redux persist storage.
	}),
	"file-downloads": localforage.createInstance({
		name: "file-downloads",
	}),
	"datastore-password-leafs": localforage.createInstance({
		name: "datastore-password-leafs",
	}),
	"datastore-file-leafs": localforage.createInstance({
		name: "datastore-file-leafs",
	}),
	"offline-cache": localforage.createInstance({
		name: "offline-cache",
	}),
	various: localforage.createInstance({
		name: "various",
	}),
};

activate();

function activate() {
	reload();
}

/**
 * sets one or more items in the specified db
 *
 * @param {string} db The database
 * @param {object|Array} items One or multiple items to put into the database
 */
function insert<T>(db: StorageDb, items: StorageEntry<T>) {
	return writeEntry(db, items.key, items.value);
}

const protectedDbs = new Set<StorageDb>([
	"offline-cache",
	"datastore-password-leafs",
	"datastore-file-leafs",
	"file-downloads",
	"various",
]);

function scopedKey(db: StorageDb, key: string) {
	return protectedDbs.has(db) ? `${vaultLock.getAccountId()}:${key}` : key;
}

async function writeEntry(db: StorageDb, key: string, value: unknown) {
	if (!protectedDbs.has(db)) return dbConfig[db].setItem(key, value);
	if (vaultLock.isBlocked()) return;
	const secret = vaultLock.getKey();
	if (!secret) return;
	return dbConfig[db].setItem(
		scopedKey(db, key),
		seal(JSON.stringify(value), secret),
	);
}

/**
 * updates one or more items in the specified db
 *
 * @param {string} db The database
 * @param {object|Array} items One or multiple items to update in the database
 */
function update(db: StorageDb, items: unknown) {
	//return dbs[db].update(items);
}

/**
 * inserts or updates one or more items in the specified db.
 * CAUTION: Poor performance. Use direct insert and update wherever possible, especially if you big arrays of items
 *
 * @param {string} db The database
 * @param {object|Array} items One or multiple items to update in the database
 */
function upsert<T extends { key: string }>(db: StorageDb, items: T | T[]) {
	let localItems;

	if (!(items instanceof Array)) {
		localItems = [items];
	} else {
		localItems = items;
	}
	return Promise.all(localItems.map((item) => writeEntry(db, item.key, item)));
}

/**
 * Searches for multiple entries and filter according to a function
 *
 * @param {string} db The database
 * @param {function} filterFunction The filter function
 */
function where<D extends StorageDb>(
	db: D,
	filterFunction: (value: StorageValues[D], key?: string) => unknown,
): Promise<StorageValues[D][]>;
function where<T>(
	db: StorageDb,
	filterFunction: (value: T, key?: string) => unknown,
): Promise<T[]>;
async function where<T>(
	db: StorageDb,
	filterFunction: (value: T, key?: string) => unknown,
): Promise<T[]> {
	const result: T[] = [];
	const id = vaultLock.getAccountId();
	const generation = vaultLock.getRevision();
	for (const key of await keys(db)) {
		const value = await findKey<T>(db, key);
		if (
			id !== vaultLock.getAccountId() ||
			generation !== vaultLock.getRevision()
		)
			return [];
		if (value !== null && (await filterFunction(value, key)))
			result.push(value);
	}
	return result;
}

/**
 * Get the list of all keys in the database.
 *
 * @param {string} db The database
 *
 * @returns {Promise} Returns the list of all keys
 */
async function keys(db: StorageDb) {
	const id = vaultLock.getAccountId();
	const generation = vaultLock.getRevision();
	const all = await dbConfig[db].keys();
	if (!protectedDbs.has(db)) return all;
	if (id !== vaultLock.getAccountId() || generation !== vaultLock.getRevision())
		return [];
	const prefix = `${id}:`;
	return all
		.filter((key) => key.startsWith(prefix))
		.map((key) => key.slice(prefix.length));
}

/**
 * returns the result matching the key
 *
 * @param {string} db The database
 * @param {object} key The key of the object
 *
 * @returns {Promise} Returns the data object
 */
function findKey<D extends StorageDb>(
	db: D,
	key: string,
): Promise<StorageValues[D] | null>;
function findKey<T>(db: StorageDb, key: string): Promise<T | null>;
async function findKey<T>(db: StorageDb, key: string): Promise<T | null> {
	if (!protectedDbs.has(db)) return dbConfig[db].getItem<T>(key);
	if (vaultLock.isBlocked()) return null;
	const secret = vaultLock.getKey();
	if (!secret) return null;
	const generation = vaultLock.getRevision();
	const value = await dbConfig[db].getItem<EncryptedValue>(scopedKey(db, key));
	if (
		!value ||
		generation !== vaultLock.getRevision() ||
		secret !== vaultLock.getKey()
	)
		return null;
	try {
		return JSON.parse(unseal(value, secret)) as T;
	} catch {
		return null;
	}
}

/**
 * removes the specified object or object_id
 *
 * @param {string} db The database
 * @param {string} key
 */
function remove(db: StorageDb, key: string) {
	return dbConfig[db].removeItem(scopedKey(db, key));
}

/**
 * removes all objects in all dbs (excluding the persistent one) or only in the specified one
 *
 * @param {string} [db] (optional) The database
 */
async function removeAll(db?: StorageDb) {
	if (typeof db !== "undefined") {
		if (protectedDbs.has(db)) {
			await Promise.all((await keys(db)).map((key) => remove(db, key)));
		} else await dbConfig[db].clear();
	} else {
		for (const dbName of Object.keys(dbConfig) as StorageDb[]) {
			if (!Object.hasOwn(dbConfig, dbName)) {
				continue;
			}
			if (dbName === "state") {
				//state contains data that potentially be persisted
				continue;
			}
			await removeAll(dbName);
		}
	}
}

/**
 * removes all objects in all dbs (excluding the persistent one) or only in the specified one
 *
 * @param {string} [db] (optional) The database
 */
function get(db: StorageDb): ReturnType<typeof localforage.createInstance>;
function get(db?: undefined): undefined;
function get(db?: StorageDb) {
	return db === undefined ? undefined : dbConfig[db];
}

/**
 * setups an event listener on an event
 *
 * @param {string} db The database
 * @param {string} event The event to listen to
 * @param {function} callback The callback function
 */
function on(
	db: StorageDb,
	event: string,
	callback: (payload: unknown) => void,
) {
	// if (!db_config.hasOwnProperty(db)) {
	//     return;
	// }
	// if (db_config[db].hasOwnProperty('subscribers') &&
	//     db_config[db]['subscribers'].hasOwnProperty(event) &&
	//     db_config[db]['subscribers'] &&
	//     db_config[db]['subscribers']['current'] >= db_config[db]['subscribers']['max']) {
	//
	//     console.log("already reached maximum subscribers");
	//     return;
	// }
	//
	// dbs[db].on(event, callback);
}

/**
 * saves the database, needs to be triggered once some changes are meant to be made persistent
 */
function save() {
	//loki_storage.save();
	emit("storage-reload", null);
}

/**
 * Reloads the storage
 */
function reload() {
	// loki_storage.loadDatabase({}, function () {
	//
	//     for (let db_name in db_config) {
	//         if (!db_config.hasOwnProperty(db_name)) {
	//             continue;
	//         }
	//
	//         dbs[db_name] = loki_storage.getCollection(db_name);
	//
	//         if (dbs[db_name] === null) {
	//             dbs[db_name] = loki_storage.addCollection(db_name, { indices: db_config[db_name].indices});
	//             for (let t = 0; t < db_config[db_name].uniques.length; t++) {
	//                 dbs[db_name].ensureUniqueIndex(db_config[db_name].uniques[t]);
	//             }
	//         }
	//     }
	// });
}

/**
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key: string, func: (payload: unknown) => void) {
	if (!Object.hasOwn(registrations, key)) {
		registrations[key] = [];
	}
	registrations[key].push(func);
}

/**
 * Small wrapper to execute all functions that have been registered for an event once the event is triggered
 *
 * @param {string} key The key of the event
 * @param {*} payload The payload of the event
 */
function emit(key: string, payload: unknown) {
	if (Object.hasOwn(registrations, key)) {
		for (let i = 0; i < registrations[key].length; i++) {
			registrations[key][i](payload);
		}
	}
}

const storageService = {
	insert: insert,
	update: update,
	upsert: upsert,
	where: where,
	keys: keys,
	findKey: findKey,
	remove: remove,
	removeAll: removeAll,
	get: get,
	on: on,
	save: save,
	reload: reload,
	register: register,
	emit: emit,
};
export default storageService;
