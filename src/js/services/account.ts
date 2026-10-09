import localforage from "localforage";
import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import storage from "./storage";
import type {
	PersistentState,
	ServerState,
	UserState,
} from "../../types/state";

export interface AccountInfo {
	isLoggedIn?: boolean;
	username?: string;
	server?: string;
	avatar?: string;
	serverUrl?: string;
	userId?: string;
	[metadata: string]: unknown;
}

export interface Account {
	id: string;
	info: AccountInfo;
	active: boolean;
}

type PersistedAccount = Record<"user" | "server" | "persistent", string>;

const channel = new BroadcastChannel("account");

const defaultId = "client";
const activeAccountKey = "activeAccount";

const activeAccountStorageDb = localforage.createInstance({
	name: "activeaccount", // Database name
});

// Create a specific instance for Redux state persistence settings
const allAccountsDb = localforage.createInstance({
	name: "allAccounts", // Database name
});

/**
 * Returns the id of the current active account
 * @returns {Promise<unknown>}
 */
async function getCurrentId() {
	try {
		const persistKey =
			await activeAccountStorageDb.getItem<string>(activeAccountKey);
		return persistKey || defaultId;
	} catch (error) {
		return defaultId;
	}
}

function listAccounts(): Promise<Account[]> {
	return new Promise<Account[]>(async (resolve, reject) => {
		const currentActiveId = await getCurrentId();
		const allAccountsList: Account[] = [];
		let currentAccountFound: boolean | undefined;
		allAccountsDb
			.iterate<AccountInfo, void>((info, id, iterationNumber) => {
				allAccountsList.push({
					id: id,
					info: info,
					active: id === currentActiveId,
				});
				if (id === currentActiveId) {
					currentAccountFound = true;
				}
			})
			.then(() => {
				if (!currentAccountFound) {
					allAccountsList.push({
						id: currentActiveId,
						info: {},
						active: true,
					});
				}
				resolve(allAccountsList);
			})
			.catch((err) => {
				console.log(err);
			});
	});
}

async function updateInfoCurrent(info: AccountInfo) {
	const currentActiveId = await getCurrentId();
	await allAccountsDb.setItem(currentActiveId, info);
}

async function isCurrentSession(token: string) {
	try {
		const currentActiveId = await getCurrentId();
		const state: PersistedAccount = JSON.parse(
			(await storage.findKey("state", `persist:${currentActiveId}`)) ?? "null",
		);
		const stateUser: UserState = JSON.parse(state.user);

		return stateUser.token === token;
	} catch {
		return false;
	}
}

async function clearUnused() {
	const currentActiveId = await getCurrentId();
	const usedList: string[] = [];
	const toDelete: string[] = [];
	allAccountsDb
		.iterate<AccountInfo, void>((info, id, iterationNumber) => {
			if (id === currentActiveId) {
				usedList.push(id);
				return;
			}
			if (Object.hasOwn(info, "isLoggedIn") && info.isLoggedIn) {
				usedList.push(id);
				return;
			}
			toDelete.push(id);
		})
		.then(async (result) => {
			for (let i = 0; i < toDelete.length; i++) {
				await allAccountsDb.removeItem(toDelete[i]);
			}
			const usedSet = new Set(usedList);

			const stateKeys = await storage.keys("state");
			for (const key of stateKeys) {
				if (usedSet.has(key.split(":").pop()!)) {
					continue;
				}
				storage.remove("state", key);
			}
		});
}

function broadcastReinitializeAppEvent() {
	channel.postMessage({
		event: "reinitialize-app",
		data: null,
	});
}

function broadcastReinitializeBackgroundEvent() {
	channel.postMessage({
		event: "reinitialize-background",
		data: null,
	});
}

async function updateCurrentId(id: string) {
	action().disableOfflineMode();
	storage.removeAll();
	storage.save();

	await activeAccountStorageDb.setItem(activeAccountKey, id);
	await clearUnused();

	broadcastReinitializeAppEvent();
	broadcastReinitializeBackgroundEvent();
}

async function addAccount() {
	await updateCurrentId(cryptoLibrary.generateUuid());
}

/**
 * Deletes an account from the local storage
 *
 * @param accountId
 * @returns {Promise<void>}
 */
async function deleteAccount(accountId: string) {
	await allAccountsDb.removeItem(accountId);
	return await storage.remove("state", "persist:" + accountId);
}

async function logoutUser(accountId: string) {
	let state: PersistedAccount;
	try {
		state = JSON.parse(
			(await storage.findKey("state", "persist:" + accountId)) ?? "null",
		);
	} catch (error) {
		return;
	}

	let stateUser: UserState;
	try {
		stateUser = JSON.parse(state.user);
	} catch (error) {
		return;
	}

	let stateServer: ServerState;
	try {
		stateServer = JSON.parse(state.server);
	} catch (error) {
		return;
	}
	let statePersistent: PersistentState;
	try {
		statePersistent = JSON.parse(state.persistent);
	} catch (error) {
		return;
	}
	const token = stateUser.token;
	const sessionSecretKey = stateUser.sessionSecretKey;
	const serverUrl = stateServer.url;
	const deviceFingerprint = statePersistent.fingerprint!;

	try {
		await apiClient.statelessLogout(
			token,
			sessionSecretKey,
			undefined,
			undefined,
			serverUrl,
			deviceFingerprint,
		);
	} catch (error) {
		console.log(error);
		return;
	}
}

/**
 * Logs a user out on the server and deletes all its locally stored state
 * @param accountId
 * @returns {Promise<void>}
 */
async function logout(accountId: string) {
	const currentActiveId = await getCurrentId();
	if (currentActiveId === accountId) {
		return;
	}
	await logoutUser(accountId);
	await deleteAccount(accountId);
}

/**
 * Logs out a user on all sessions except the current active one.
 *
 * @returns {Promise<void>}
 */
async function logoutAll() {
	const currentActiveId = await getCurrentId();
	const toLogout: string[] = [];
	allAccountsDb
		.iterate<AccountInfo, void>((info, id, iterationNumber) => {
			if (id === currentActiveId) {
				return;
			}
			toLogout.push(id);
		})
		.then(async (result) => {
			for (const accountId of toLogout) {
				await logoutUser(accountId);
				await deleteAccount(accountId);
			}
		});
}

const accountService = {
	getCurrentId: getCurrentId,
	listAccounts: listAccounts,
	updateCurrentId: updateCurrentId,
	updateInfoCurrent: updateInfoCurrent,
	isCurrentSession: isCurrentSession,
	addAccount: addAccount,
	broadcastReinitializeAppEvent: broadcastReinitializeAppEvent,
	broadcastReinitializeBackgroundEvent: broadcastReinitializeBackgroundEvent,
	logout: logout,
	logoutAll: logoutAll,
};

export default accountService;
