import localforage from "localforage";
import vaultLock, { seal, unseal } from "./vault-lock";
import type { EncryptedValue } from "../../types/crypto";
import { normalizeTimeoutAction } from "../../types/locking";
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
			(await vaultLock.persistence.getItem(`persist:${currentActiveId}`)) ??
				"null",
		);
		const stateUser: UserState = JSON.parse(state.user);

		return stateUser.token === token;
	} catch {
		return false;
	}
}

async function clearUnused() {
	const { default: storage } = await import(
		/* webpackMode: "eager" */ "./storage"
	);
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
	await vaultLock.flush();

	await activeAccountStorageDb.setItem(activeAccountKey, id);
	await clearUnused();

	broadcastReinitializeAppEvent();
	broadcastReinitializeBackgroundEvent();
}

async function addAccount() {
	const { default: cryptoLibrary } = await import(
		/* webpackMode: "eager" */ "./crypto-library"
	);
	await updateCurrentId(cryptoLibrary.generateUuid());
}

/**
 * Deletes an account from the local storage
 *
 * @param accountId
 * @returns {Promise<void>}
 */
async function deleteAccount(accountId: string) {
	const { default: storage } = await import(
		/* webpackMode: "eager" */ "./storage"
	);
	await vaultLock.forget(accountId);
	await allAccountsDb.removeItem(accountId);
	return await storage.remove("state", "persist:" + accountId);
}

async function logoutUser(accountId: string) {
	let state: PersistedAccount;
	try {
		state = JSON.parse((await vaultLock.readAccount(accountId)) ?? "null");
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
		// Keep UI-only dependencies out of offscreen initialization. Eager bundling
		// also avoids loading script chunks from a suspended MV3 worker.
		const { default: apiClient } = await import(
			/* webpackMode: "eager" */ "./api-client"
		);
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
	await allAccountsDb
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

// Timeout logout also runs in the offscreen key host, without a Redux store.
const timeoutStateDb = localforage.createInstance({ name: "state" });
const timeoutChannel = new BroadcastChannel("psono-vault-control-v1");
const pendingTimeoutLogouts = new Map<string, Promise<void>>();
const timeoutLogoutListeners = new Set<
	(accountId: string, keyId: string) => void
>();
const markerPrefix = "psono:timeout-logout:";
interface LogoutMarker {
	accountId: string;
	keyId: string;
}
interface TimeoutRecord {
	format: string;
	configuration: { enabled: boolean; keyId: string; timeoutAction?: unknown };
	state: EncryptedValue;
}
interface ServerSession {
	token: string;
	key: string;
	server: string;
	fingerprint: string;
}

function markerKey(accountId: string, keyId: string) {
	return `${markerPrefix}${encodeURIComponent(accountId)}:${encodeURIComponent(keyId)}`;
}
function writeMarker(accountId: string, keyId: string) {
	try {
		localStorage.setItem(
			markerKey(accountId, keyId),
			JSON.stringify({ accountId, keyId }),
		);
	} catch {
		/* Service workers have no localStorage; the offscreen host handles expiry too. */
	}
}
function removeMarker(accountId: string, keyId: string) {
	try {
		localStorage.removeItem(markerKey(accountId, keyId));
	} catch {
		/* No DOM storage in MV3 workers. */
	}
}
export function hasPendingTimeoutLogout(accountId: string, keyId: string) {
	try {
		return localStorage.getItem(markerKey(accountId, keyId)) !== null;
	} catch {
		return false;
	}
}
function serverSession(
	record: TimeoutRecord,
	key?: string,
): ServerSession | undefined {
	if (!key) return;
	try {
		const snapshot = JSON.parse(unseal(record.state, key)) as Record<
			string,
			string
		>;
		const user = JSON.parse(snapshot.user || "{}");
		const server = JSON.parse(snapshot.server || "{}");
		const persistent = JSON.parse(snapshot.persistent || "{}");
		if (
			typeof user.token !== "string" ||
			!user.token ||
			typeof user.sessionSecretKey !== "string" ||
			!/^[0-9a-f]{64}$/i.test(user.sessionSecretKey) ||
			typeof server.url !== "string" ||
			!server.url ||
			typeof persistent.fingerprint !== "string"
		)
			return;
		return {
			token: user.token,
			key: user.sessionSecretKey,
			server: server.url,
			fingerprint: persistent.fingerprint,
		};
	} catch {
		/* Local logout must succeed even if the saved snapshot is incomplete. */
	}
}
async function revokeSession(session: ServerSession) {
	// Use the stateless logout protocol without loading the application in the key host.
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);
	try {
		const url = `${session.server.replace(/\/$/, "")}/authentication/logout/`;
		const request: RequestInit = {
			method: "POST",
			keepalive: true,
			signal: controller.signal,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Token ${session.token}`,
				"Authorization-Validator": JSON.stringify(
					seal(
						JSON.stringify({
							request_time: new Date().toISOString(),
							request_device_fingerprint: session.fingerprint,
						}),
						session.key,
					),
				),
			},
			body: JSON.stringify(seal("{}", session.key)),
		};
		session.key = "";
		session.token = "";
		await fetch(url, request);
	} catch {
		/* Offline logout still clears the local session and every key copy. */
	} finally {
		clearTimeout(timeout);
	}
}
export function logoutTimedOutSession(
	accountId: string,
	keyId: string,
	key?: string,
): Promise<void> {
	const id = markerKey(accountId, keyId);
	const existing = pendingTimeoutLogouts.get(id);
	if (existing) return existing;
	writeMarker(accountId, keyId);
	const work = Promise.resolve()
		.then(async () => {
			const cleanup = async () => {
				const raw = await timeoutStateDb.getItem<string>(
					`persist:${accountId}`,
				);
				const record = raw ? (JSON.parse(raw) as TimeoutRecord) : undefined;
				if (
					record &&
					(record.format !== "psono-vault-v1" ||
						record.configuration?.keyId !== keyId ||
						!record.configuration.enabled ||
						normalizeTimeoutAction(record.configuration.timeoutAction) !==
							"LOGOUT")
				)
					return { removed: false };
				const session = record ? serverSession(record, key) : undefined;
				key = undefined;
				await timeoutStateDb.removeItem(`persist:${accountId}`);
				await vaultLock.clearAccountData(accountId);
				const info = await allAccountsDb.getItem<AccountInfo>(accountId);
				if (info)
					await allAccountsDb.setItem(accountId, {
						...info,
						isLoggedIn: false,
					});
				return { removed: true, session };
			};
			const result = navigator.locks
				? await navigator.locks.request("psono-vault-persistence-v1", cleanup)
				: await cleanup();
			removeMarker(accountId, keyId);
			if (result.removed) {
				if (result.session) void revokeSession(result.session);
				timeoutChannel.postMessage({
					event: "timeout-logout",
					accountId,
					keyId,
				});
			}
		})
		.finally(() => {
			pendingTimeoutLogouts.delete(id);
		});
	pendingTimeoutLogouts.set(id, work);
	vaultLock.beginTimeoutLogout(accountId, keyId);
	for (const listener of timeoutLogoutListeners) listener(accountId, keyId);
	return work;
}
export function onTimeoutLogoutStarted(
	listener: (accountId: string, keyId: string) => void,
) {
	timeoutLogoutListeners.add(listener);
	return () => {
		timeoutLogoutListeners.delete(listener);
	};
}
/** Recover interrupted deletion without requiring the user to unlock. */
export async function finishPendingTimeoutLogouts() {
	const markers: LogoutMarker[] = [];
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith(markerPrefix)) continue;
			try {
				const marker = JSON.parse(
					localStorage.getItem(key) || "null",
				) as LogoutMarker | null;
				if (
					typeof marker?.accountId === "string" &&
					typeof marker.keyId === "string"
				)
					markers.push(marker);
			} catch {
				/* Ignore corrupt public metadata. */
			}
		}
	} catch {
		/* MV3 workers finish their in-memory pending work instead. */
	}
	await Promise.all([
		...pendingTimeoutLogouts.values(),
		...markers.map((marker) =>
			logoutTimedOutSession(marker.accountId, marker.keyId),
		),
	]);
}

const accountService = {
	logoutTimedOutSession,
	hasPendingTimeoutLogout,
	finishPendingTimeoutLogouts,
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
