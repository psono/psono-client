import localforage from "localforage";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import nacl from "ecma-nacl";
import converter from "./converter";
import accountService from "./account";
import type { EncryptedValue } from "../../types/crypto";
import { normalizeTimeoutAction } from "../../types/locking";
import type { TimeoutAction } from "../../types/locking";

export function randomHex(bytes = 32): string {
	return converter.toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Domain-separated, account-bound HKDF-SHA256; the PRF seed is never persisted. */
export function deriveLockKey(
	seed: ArrayBuffer,
	salt: string,
	id: string,
): string {
	const input = new Uint8Array(seed);
	try {
		return converter.toHex(
			hkdf(
				sha256,
				input,
				converter.fromHex(salt),
				converter.encodeUtf8(`psono/LOCK_SECRET_KEY/v1/${id}`),
				32,
			),
		);
	} finally {
		input.fill(0);
	}
}

export function seal(value: string, key: string): EncryptedValue {
	const nonce = converter.fromHex(randomHex(24));
	const bytes = converter.fromHex(key);
	try {
		return {
			nonce: converter.toHex(nonce),
			text: converter.toHex(
				nacl.secret_box.pack(converter.encodeUtf8(value), nonce, bytes),
			),
		};
	} finally {
		bytes.fill(0);
	}
}

export function unseal(value: EncryptedValue, key: string): string {
	const bytes = converter.fromHex(key);
	try {
		return converter.decodeUtf8(
			nacl.secret_box.open(
				converter.fromHex(value.text),
				converter.fromHex(value.nonce),
				bytes,
			),
		);
	} finally {
		bytes.fill(0);
	}
}

/** Ephemeral same-origin keys, also held by Chrome's offscreen page. */
export interface LockSession {
	epoch: string;
	key: string;
	keyId: string;
	lastActivity: number;
	timeout: number;
	timeoutAction?: TimeoutAction;
}
const sessions = new Map<string, LockSession>();
const revoked = new Set<string>();
const loggedOut = new Set<string>();
const sessionListeners = new Set<
	(accountId: string, unlocked: boolean) => void
>();
const timeoutListeners = new Set<
	(accountId: string, session: LockSession) => void
>();
const keyChannel = new BroadcastChannel("psono-lock-keys-v1");

function valid(session: LockSession) {
	return (
		!session.timeout ||
		session.lastActivity + session.timeout * 1000 > Date.now()
	);
}
function drop(id: string) {
	if (sessions.delete(id))
		for (const listener of sessionListeners) listener(id, false);
}
function put(id: string, session: LockSession) {
	if (
		!valid(session) ||
		revoked.has(session.epoch) ||
		isSessionTimedOut(id, session.keyId)
	)
		return false;
	const previous = sessions.get(id);
	if (
		previous?.keyId === session.keyId &&
		previous.lastActivity > session.lastActivity
	)
		return false;
	sessions.set(id, { ...session });
	if (!previous || previous.keyId !== session.keyId)
		for (const listener of sessionListeners) listener(id, true);
	return true;
}
keyChannel.onmessage = ({ data }) => {
	if (data?.event === "host-ready") {
		for (const [id, session] of sessions)
			if (valid(session))
				keyChannel.postMessage({ event: "key", accountId: id, session });
		return;
	}
	if (data?.event === "lock-all") {
		for (const id of Array.from(sessions.keys())) lockSession(id);
		return;
	}
	if (!data || typeof data.accountId !== "string") return;
	if (data.event === "request") {
		const session = getSession(data.accountId, data.keyId);
		if (session)
			keyChannel.postMessage({
				event: "key",
				accountId: data.accountId,
				session,
			});
	} else if (data.event === "key") {
		if (data.replaces) revoked.add(data.replaces);
		put(data.accountId, data.session);
	} else if (data.event === "lock") {
		if (data.epoch) revoked.add(data.epoch);
		if (!data.epoch || sessions.get(data.accountId)?.epoch === data.epoch)
			drop(data.accountId);
	} else if (data.event === "timeout") {
		if (data.timeoutAction === "LOGOUT")
			loggedOut.add(`${data.accountId}:${data.keyId}`);
		revoked.add(data.epoch);
		const session = sessions.get(data.accountId);
		if (
			session &&
			(session.epoch === data.epoch || session.epoch === data.replaces)
		) {
			try {
				for (const listener of timeoutListeners)
					listener(data.accountId, {
						...session,
						keyId: data.keyId,
						timeoutAction: normalizeTimeoutAction(data.timeoutAction),
					});
			} finally {
				drop(data.accountId);
			}
		}
	} else if (data.event === "activity") {
		const session = getSession(data.accountId, data.keyId);
		if (session && data.time <= Date.now() && data.time > session.lastActivity)
			session.lastActivity = data.time;
	}
};

// Wall-clock checks handle sleep/resume and throttled/suspended pages.
setInterval(() => {
	for (const [id, session] of sessions) if (!valid(session)) expireSession(id);
}, 1000);

export function getSession(
	id: string,
	keyId?: string,
): LockSession | undefined {
	const session = sessions.get(id);
	if (!session || (keyId && keyId !== session.keyId)) return undefined;
	if (isSessionTimedOut(id, session.keyId)) {
		lockSession(id);
		return undefined;
	}
	if (!valid(session)) {
		expireSession(id);
		return undefined;
	}
	return session;
}
export async function requestSession(id: string, keyId: string) {
	keyChannel.postMessage({ event: "request", accountId: id, keyId });
	await new Promise((resolve) => setTimeout(resolve, 150));
	return getSession(id, keyId);
}
export function setSession(id: string, value: Omit<LockSession, "epoch">) {
	const replaces = sessions.get(id)?.epoch;
	if (replaces) revoked.add(replaces);
	const session = { ...value, epoch: randomHex(16) };
	if (!valid(session)) {
		finishTimeout(id, session, replaces);
		return;
	}
	if (put(id, session))
		keyChannel.postMessage({ event: "key", accountId: id, session, replaces });
}
export function lockSession(id: string) {
	const epoch = sessions.get(id)?.epoch;
	if (epoch) revoked.add(epoch);
	drop(id);
	keyChannel.postMessage({ event: "lock", accountId: id, epoch });
}
function finishTimeout(id: string, session: LockSession, replaces?: string) {
	const timeoutAction = normalizeTimeoutAction(session.timeoutAction);
	revoked.add(session.epoch);
	if (timeoutAction === "LOGOUT") loggedOut.add(`${id}:${session.keyId}`);
	// Notify the persistent host before UI listeners can reload their page.
	try {
		keyChannel.postMessage({
			event: "timeout",
			accountId: id,
			epoch: session.epoch,
			keyId: session.keyId,
			timeoutAction,
			replaces,
		});
	} catch {
		/* Local expiry must wipe keys even if cross-context messaging fails. */
	}
	try {
		for (const listener of timeoutListeners)
			listener(id, { ...session, timeoutAction });
	} finally {
		drop(id);
	}
}
export function expireSession(id: string, timeout?: number) {
	const session = sessions.get(id);
	if (!session) return;
	const expired = { ...session, timeout: timeout ?? session.timeout };
	if (!valid(expired)) finishTimeout(id, expired);
}
export function isSessionTimedOut(id: string, keyId: string) {
	return loggedOut.has(`${id}:${keyId}`);
}
export function onSessionTimeout(
	listener: (id: string, session: LockSession) => void,
) {
	timeoutListeners.add(listener);
	return () => {
		timeoutListeners.delete(listener);
	};
}
export function lockAllSessions() {
	for (const id of Array.from(sessions.keys())) lockSession(id);
	keyChannel.postMessage({ event: "lock-all" });
}
export function announceKeyHost() {
	keyChannel.postMessage({ event: "host-ready" });
}
export function touchSession(id: string, keyId: string) {
	const session = getSession(id, keyId);
	if (!session || Date.now() - session.lastActivity < 1000) return;
	session.lastActivity = Date.now();
	keyChannel.postMessage({
		event: "activity",
		accountId: id,
		keyId,
		time: session.lastActivity,
	});
}
export function onSessionChange(
	listener: (id: string, unlocked: boolean) => void,
) {
	sessionListeners.add(listener);
	return () => {
		sessionListeners.delete(listener);
	};
}

onSessionTimeout((id, session) => {
	if (normalizeTimeoutAction(session.timeoutAction) !== "LOGOUT") return;
	void accountService
		.logoutTimedOutSession(id, session.keyId, session.key)
		.catch((error) => console.error("Could not finish timeout logout", error));
});

let creatingOffscreen: Promise<void> | undefined;
export async function createOffscreenDocument() {
	if (TARGET !== "chrome") return;
	if (await chrome.offscreen.hasDocument()) return;
	if (!creatingOffscreen) {
		creatingOffscreen = chrome.offscreen
			.createDocument({
				url: chrome.runtime.getURL("data/offscreen.html"),
				reasons: ["USER_MEDIA" as chrome.offscreen.Reason],
				justification:
					"Isolated in-memory storage of vault lock keys, wiped on inactivity and browser close.",
			})
			.catch(async (error: unknown) => {
				if (!(await chrome.offscreen.hasDocument())) throw error;
			})
			.finally(() => {
				creatingOffscreen = undefined;
			});
	}
	await creatingOffscreen;
}

/** Deleting one account must not erase another account's offline data. */
export async function clearAccountData(id: string) {
	for (const name of [
		"offline-cache",
		"datastore-password-leafs",
		"datastore-file-leafs",
		"file-downloads",
		"various",
	]) {
		const db = localforage.createInstance({ name });
		for (const key of await db.keys())
			if (key.startsWith(`${id}:`)) await db.removeItem(key);
	}
}

export const LOCK_UNAVAILABLE = "LOCK_UNAVAILABLE";
export const LOCK_REQUIRED_UNAVAILABLE = "LOCK_REQUIRED_UNAVAILABLE";

export interface LockConfiguration {
	enabled: boolean;
	/** Retained device preference; a fresh login must enroll before use. */
	requested?: boolean;
	timeout: number;
	timeoutAction?: TimeoutAction;
	keyId: string;
	persistedKey?: string;
	credential?: { id: string; rpId: string; prfSalt: string; hkdfSalt: string };
}

interface VaultRecord {
	format: "psono-vault-v1";
	configuration: LockConfiguration;
	state: EncryptedValue;
}

interface LockPreference {
	enabled: boolean;
	timeout: number;
	timeoutAction?: TimeoutAction;
	publicState?: string;
}

const database = localforage.createInstance({ name: "state" });
const migrationDb = localforage.createInstance({ name: "vault-migrations" });
const preferencesDb = localforage.createInstance({
	name: "vault-lock-preferences",
});
const listeners = new Set<() => void>();
let accountId = "";
let configuration: LockConfiguration | undefined;
let serializedState: string | null = null;
let revision = 0;
let writes: Promise<unknown> = Promise.resolve();
let suspended = false;
let transitioning = false;
let hasPersistedState = false;
let initialPublicState: string | null = null;
let timeoutLogoutKeyId: string | undefined;
let canReload = () => true;
const control = new BroadcastChannel("psono-vault-control-v1");
control.onmessage = ({ data }) => {
	if (data?.accountId !== accountId) return;
	if (
		data.event === "timeout-logout" &&
		data.keyId !== configuration?.keyId &&
		data.keyId !== timeoutLogoutKeyId
	)
		return;
	suspended = true;
	serializedState = null;
	revision++;
	if (typeof window !== "undefined") {
		if (canReload()) window.location.reload();
		else notify();
	} else
		new BroadcastChannel("account").postMessage({
			event: "reinitialize-background",
		});
};

function broadcastConfiguration() {
	control.postMessage({ accountId });
}

function notify() {
	for (const listener of listeners) listener();
}

/** Keep host pins/configuration and remembered login labels across logout. */
function publicState(value: string) {
	const state = JSON.parse(value) as Record<string, string>;
	const user = JSON.parse(state.user || "{}");
	const server = JSON.parse(state.server || "{}");
	return JSON.stringify({
		persistent: state.persistent,
		user: JSON.stringify({
			username: user.rememberMe ? user.username : "",
			rememberMe: !!user.rememberMe,
			trustDevice: !!user.rememberMe && !!user.trustDevice,
		}),
		server: JSON.stringify({ url: user.rememberMe ? server.url : "" }),
	});
}

async function savePreference(
	config: LockConfiguration,
	snapshot?: string | null,
	id = accountId,
) {
	await withPersistenceLock(async () => {
		const raw = await database.getItem<string>(`persist:${id}`);
		if (
			!raw ||
			(JSON.parse(raw) as VaultRecord).configuration?.keyId !== config.keyId
		)
			return;
		const previous = await preferencesDb.getItem<LockPreference>(id);
		await preferencesDb.setItem(id, {
			...previous,
			enabled: config.enabled || config.requested === true,
			timeout: config.timeout,
			timeoutAction: normalizeTimeoutAction(config.timeoutAction),
			...(snapshot ? { publicState: publicState(snapshot) } : {}),
		});
	});
}

onSessionChange((id, unlocked) => {
	if (id !== accountId || !configuration?.enabled) return;
	if (!unlocked) {
		serializedState = null;
		revision++;
	}
	notify();
});

function beginTimeoutLogout(id: string, keyId: string) {
	if (id !== accountId || keyId !== configuration?.keyId) return;
	timeoutLogoutKeyId = keyId;
	suspended = true;
	configuration = undefined;
	serializedState = null;
	revision++;
	notify();
}

function getKey() {
	if (!configuration) return undefined;
	if (!configuration.enabled) return configuration.persistedKey;
	const session = getSession(accountId, configuration.keyId);
	if (
		session &&
		session.lastActivity + configuration.timeout * 1000 <= Date.now()
	) {
		expireSession(accountId, configuration.timeout);
		return undefined;
	}
	return session?.key;
}

function isLocked() {
	return !!configuration?.enabled && !getKey();
}

/** Older versions stored session keys and searchable indexes in plaintext.
 * Deliberately discard every legacy session, including inactive accounts. */
async function migrateLegacy() {
	let migrated = !(await migrationDb.getItem("encrypted-state-v1"));
	for (const key of await database.keys()) {
		const value = await database.getItem<string>(key);
		if (!value) continue;
		try {
			const parsed = JSON.parse(value);
			if (parsed.format === "psono-vault-v1") continue;
			if (parsed.user) migrated = true;
			// Only configuration and host pins survive. No token, offline key or tree.
			await database.setItem(
				key,
				JSON.stringify({ persistent: parsed.persistent }),
			);
		} catch {
			await database.removeItem(key);
		}
	}
	if (migrated)
		for (const name of [
			"offline-cache",
			"datastore-password-leafs",
			"datastore-file-leafs",
			"file-downloads",
			"various",
		]) {
			await localforage.createInstance({ name }).clear();
		}
	await migrationDb.setItem("encrypted-state-v1", true);
}

async function initialize(id: string): Promise<void> {
	await writes;
	suspended = true;
	transitioning = false;
	accountId = id;
	configuration = undefined;
	timeoutLogoutKeyId = undefined;
	serializedState = null;
	revision++;
	notify();
	await accountService.finishPendingTimeoutLogouts();
	configuration = await withPersistenceLock(async () => {
		await migrateLegacy();
		let next: LockConfiguration | undefined;
		const raw = await database.getItem<string>(`persist:${id}`);
		const preference = await preferencesDb.getItem<LockPreference>(id);
		initialPublicState = preference?.publicState ?? null;
		if (raw) {
			const record = JSON.parse(raw) as Partial<VaultRecord>;
			if (record.format === "psono-vault-v1") next = record.configuration;
		}
		if (!next) {
			next = {
				enabled: false,
				requested: preference?.enabled === true,
				timeout: preference?.timeout ?? 300,
				timeoutAction: normalizeTimeoutAction(preference?.timeoutAction),
				keyId: randomHex(),
				persistedKey: randomHex(),
			};
			// Establish the initial generation atomically, so a popup and a newly
			// started worker cannot invent different keys for the same account.
			await database.setItem(
				`persist:${id}`,
				JSON.stringify({
					format: "psono-vault-v1",
					configuration: next,
					state: seal(raw ?? initialPublicState ?? "{}", next.persistedKey!),
				}),
			);
		}
		hasPersistedState = true;
		return next;
	});
	if (!configuration) throw new Error("VAULT_INITIALIZATION_FAILED");
	const initializedConfiguration = configuration;
	if (initializedConfiguration.enabled) {
		// Create Chrome's in-memory host before asking the other contexts for keys.
		if (TARGET === "chrome") await createOffscreenDocument();
		if (!getSession(id, initializedConfiguration.keyId))
			await requestSession(id, initializedConfiguration.keyId);
		if (
			isSessionTimedOut(id, initializedConfiguration.keyId) ||
			accountService.hasPendingTimeoutLogout(id, initializedConfiguration.keyId)
		) {
			await accountService.logoutTimedOutSession(
				id,
				initializedConfiguration.keyId,
			);
			await accountService.finishPendingTimeoutLogouts();
			return initialize(id);
		}
	}
}

async function withPersistenceLock<T>(callback: () => Promise<T>): Promise<T> {
	return navigator.locks
		? await navigator.locks.request("psono-vault-persistence-v1", callback)
		: await callback();
}

function queueWrite(
	key: string,
	value: string,
	expectedKeyId = configuration?.keyId,
) {
	const expectedExisting = hasPersistedState;
	const pending = writes.then(() =>
		withPersistenceLock(async () => {
			const current = await database.getItem<string>(key);
			const record = current
				? (JSON.parse(current) as Partial<VaultRecord>)
				: null;
			// Compare-and-swap under a cross-context Web Lock: an old tab may not
			// overwrite a newly enabled lock or resurrect a session after logout.
			if (
				(!current && expectedExisting) ||
				(record?.format === "psono-vault-v1" &&
					record.configuration?.keyId !== expectedKeyId)
			) {
				throw new Error("VAULT_CHANGED_IN_ANOTHER_TAB");
			}
			const result = await database.setItem(key, value);
			hasPersistedState = true;
			return result;
		}),
	);
	writes = pending.catch(() => {});
	return pending;
}

const persistence = {
	async getItem(key: string): Promise<string | null> {
		const raw = await database.getItem<string>(key);
		if (!raw) return initialPublicState;
		const record = JSON.parse(raw) as Partial<VaultRecord>;
		if (record.format !== "psono-vault-v1") {
			const legacy = JSON.parse(raw);
			return JSON.stringify({ persistent: legacy.persistent });
		}
		const secret = getKey();
		if (!secret) return null;
		try {
			serializedState = unseal(record.state!, secret);
		} catch (error) {
			if (configuration?.enabled) lockSession(accountId);
			throw error;
		}
		return serializedState;
	},
	async setItem(key: string, value: string) {
		const id = accountId;
		const secret = getKey();
		if (
			suspended ||
			key !== `persist:${accountId}` ||
			!secret ||
			!configuration ||
			(configuration.enabled && serializedState === null)
		)
			return;
		serializedState = value;
		if (transitioning) return;
		let persistedValue = value;
		const state = JSON.parse(value) as Record<string, string>;
		const server = JSON.parse(state.server || "{}");
		// An enforced session must never reach disk under the disabled-lock key,
		// including the interval between token activation and PRF enrollment.
		if (
			(server.complianceEnforceLocking || configuration.requested) &&
			!configuration.enabled
		) {
			persistedValue = publicState(value);
		}
		const record: VaultRecord = {
			format: "psono-vault-v1",
			configuration,
			state: seal(persistedValue, secret),
		};
		await queueWrite(key, JSON.stringify(record));
		await savePreference(record.configuration, value, id);
	},
	removeItem: (key: string) => database.removeItem(key),
};

export type LockSupport = {
	supported: boolean;
	checks: {
		name: string;
		status: "available" | "unavailable" | "unknown" | "error";
		error?: string;
	}[];
};

async function getSupport(): Promise<LockSupport> {
	const checks: LockSupport["checks"] = [];
	const check = async (
		name: string,
		probe: () => boolean | undefined | Promise<boolean | undefined>,
	) => {
		try {
			const result = await probe();
			checks.push({
				name,
				status:
					result === undefined
						? "unknown"
						: result
							? "available"
							: "unavailable",
			});
		} catch (error) {
			checks.push({
				name,
				status: "error",
				error:
					error instanceof Error
						? `${error.name}: ${error.message}`
						: String(error),
			});
		}
	};
	await check(
		"LOCK_CHECK_WEBAUTHN",
		() => typeof PublicKeyCredential !== "undefined",
	);
	await check("LOCK_CHECK_CREATE", () => !!navigator.credentials?.create);
	await check("LOCK_CHECK_WEB_LOCKS", () => !!navigator.locks);
	await check("LOCK_CHECK_PLATFORM", async () => {
		if (typeof PublicKeyCredential === "undefined") return false;
		const api = PublicKeyCredential as typeof PublicKeyCredential & {
			psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
		};
		const probe = Object.hasOwn(
			api,
			"psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable",
		)
			? api.psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable
			: api.isUserVerifyingPlatformAuthenticatorAvailable;
		return probe ? await probe.call(api) : false;
	});
	await check("LOCK_CHECK_PRF", async () => {
		if (typeof PublicKeyCredential === "undefined") return false;
		const capabilities = await PublicKeyCredential.getClientCapabilities?.();
		return capabilities?.["extension:prf"];
	});
	return {
		supported: checks.every(
			({ status }) => status === "available" || status === "unknown",
		),
		checks,
	};
}

async function isSupported() {
	return (await getSupport()).supported;
}

/** Diagnostic text contains only validation metadata, never credential or key material. */
class LockValidationError extends Error {
	readonly lockDiagnostic: string;
	constructor(detail: string) {
		super(LOCK_UNAVAILABLE);
		this.name = "LockValidationError";
		this.lockDiagnostic = detail;
	}
}

function checkCredential(
	credential: PublicKeyCredential | null,
	expectedCredentialId?: string,
) {
	if (!credential)
		throw new LockValidationError(
			"Credential response: no credential returned.",
		);
	const attachment = credential.authenticatorAttachment;
	const id = converter.toHex(new Uint8Array(credential.rawId));
	if (!id)
		throw new LockValidationError(
			"Credential response: credential ID is empty.",
		);
	if (expectedCredentialId === undefined) {
		// Enrollment must positively establish a platform credential.
		if (attachment !== "platform")
			throw new LockValidationError(
				`Registration: expected platform attachment; received ${JSON.stringify(attachment) ?? "undefined"}.`,
			);
	} else {
		// Firefox can omit attachment on a Windows Hello assertion. Bind it to
		// the platform credential enrolled above instead of requiring that hint
		// to be repeated. An explicitly non-platform result still fails closed.
		if (
			id !== expectedCredentialId.toLowerCase() ||
			(attachment !== "platform" &&
				attachment !== null &&
				attachment !== undefined)
		)
			throw new LockValidationError(
				`Authentication: credential ID matches: ${id === expectedCredentialId.toLowerCase()}; attachment: ${JSON.stringify(attachment) ?? "undefined"}.`,
			);
	}
	const response = credential.response;
	const authData =
		response instanceof AuthenticatorAttestationResponse
			? response.getAuthenticatorData()
			: (response as AuthenticatorAssertionResponse).authenticatorData;
	// Check UV in authenticator data in addition to requesting it in options.
	if (!(new Uint8Array(authData)[32] & 0x04))
		throw new LockValidationError(
			`Credential response: user verification flag is missing; authenticator data length: ${authData.byteLength} bytes.`,
		);
	return credential;
}

function getSeed(result: BufferSource | undefined): ArrayBuffer {
	if (!result || result.byteLength !== 32)
		throw new LockValidationError(
			`PRF evaluation: expected 32 bytes; received ${result ? `${result.byteLength} bytes` : "no result"}.`,
		);
	return result instanceof ArrayBuffer
		? result
		: new Uint8Array(
				result.buffer,
				result.byteOffset,
				result.byteLength,
			).slice().buffer;
}

async function authenticate(
	credential: NonNullable<LockConfiguration["credential"]>,
) {
	const result = checkCredential(
		(await navigator.credentials.get({
			publicKey: {
				challenge: converter.fromHex(randomHex()),
				rpId: credential.rpId,
				allowCredentials: [
					{
						type: "public-key",
						id: converter.fromHex(credential.id),
						transports: ["internal"],
					},
				],
				userVerification: "required",
				extensions: {
					prf: { eval: { first: converter.fromHex(credential.prfSalt) } },
				},
			},
		})) as PublicKeyCredential | null,
		credential.id,
	);
	return deriveLockKey(
		getSeed(result.getClientExtensionResults().prf?.results?.first),
		credential.hkdfSalt,
		accountId,
	);
}

async function enable(
	username: string,
	rpId: string,
	timeout: number,
	maximum?: number,
	timeoutAction: TimeoutAction = normalizeTimeoutAction(
		configuration?.timeoutAction,
	),
) {
	if (!configuration || !(await isSupported()))
		throw new LockValidationError(
			`Enrollment precheck: configuration present: ${!!configuration}. See compatibility checks for browser support.`,
		);
	const lockTimeout = clampTimeout(timeout, maximum);
	const id = accountId;
	const generation = revision;
	const credentialInfo = {
		id: "",
		rpId,
		prfSalt: randomHex(),
		hkdfSalt: randomHex(),
	};
	const credential = checkCredential(
		(await navigator.credentials.create({
			publicKey: {
				challenge: converter.fromHex(randomHex()),
				rp: { name: "Psono local vault lock", id: rpId },
				user: {
					id: converter.fromHex(randomHex()),
					name: username,
					displayName: username,
				},
				pubKeyCredParams: [
					{ type: "public-key", alg: -7 },
					{ type: "public-key", alg: -257 },
				],
				authenticatorSelection: {
					authenticatorAttachment: "platform",
					userVerification: "required",
					residentKey: "discouraged",
				},
				attestation: "none",
				extensions: {
					prf: { eval: { first: converter.fromHex(credentialInfo.prfSalt) } },
				},
			},
		})) as PublicKeyCredential | null,
	);
	const extensions = credential.getClientExtensionResults();
	// Snapshot the browser output rather than logging live objects containing PRF secrets.
	console.info(
		"Psono automatic locking registration response:",
		JSON.stringify(
			{
				authenticatorAttachment: credential.authenticatorAttachment,
				extensions,
			},
			(_key, value) =>
				value instanceof ArrayBuffer || ArrayBuffer.isView(value)
					? { redacted: true, byteLength: value.byteLength }
					: value,
			2,
		),
	);
	const prf = extensions.prf;
	if (prf?.enabled !== true)
		throw new LockValidationError(
			`Registration: PRF extension present: ${prf !== undefined}; PRF enabled: ${JSON.stringify(prf?.enabled) ?? "undefined"}; PRF result present: ${prf?.results?.first !== undefined}.`,
		);
	credentialInfo.id = converter.toHex(new Uint8Array(credential.rawId));
	// Registration already required platform attachment and user verification.
	// Reuse its PRF evaluation rather than prompting for a redundant assertion.
	// Authenticators without creation-time evaluation still need that fallback.
	const secret =
		prf.results?.first !== undefined
			? deriveLockKey(getSeed(prf.results.first), credentialInfo.hkdfSalt, id)
			: await authenticate(credentialInfo);
	if (id !== accountId || generation !== revision)
		throw new Error("VAULT_SESSION_CHANGED");
	const oldState = serializedState;
	if (!oldState) throw new Error("VAULT_SESSION_NOT_READY");
	const next: LockConfiguration = {
		enabled: true,
		requested: true,
		timeout: lockTimeout,
		timeoutAction: normalizeTimeoutAction(timeoutAction),
		keyId: randomHex(),
		credential: credentialInfo,
	};
	if (TARGET === "chrome") await createOffscreenDocument();
	if (id !== accountId || generation !== revision)
		throw new Error("VAULT_SESSION_CHANGED");
	transitioning = true;
	try {
		// Complete old-key cleanup before exposing the new key: background cache
		// refresh may start as soon as the unlock event is broadcast.
		await clearAccountData(id);
		await queueWrite(
			`persist:${id}`,
			JSON.stringify({
				format: "psono-vault-v1",
				configuration: next,
				state: seal(oldState, secret),
			}),
		);
		configuration = next;
	} finally {
		transitioning = false;
	}
	setSession(id, {
		key: secret,
		keyId: next.keyId,
		lastActivity: Date.now(),
		timeout: next.timeout,
		timeoutAction: next.timeoutAction,
	});
	if (serializedState && serializedState !== oldState)
		await persistence.setItem(`persist:${id}`, serializedState);
	await savePreference(next, oldState, id);
	control.postMessage({ accountId: id });
	notify();
}

export function clampTimeout(value: number, maximum?: number) {
	if (!Number.isFinite(value) || value < 1)
		throw new Error("LOCK_TIMEOUT_INVALID");
	return Math.max(
		1,
		Math.floor(Math.min(value, maximum && maximum > 0 ? maximum : 2147483)),
	);
}

async function unlock() {
	if (!(await isSupported())) throw new Error(LOCK_UNAVAILABLE);
	if (!configuration?.credential) throw new Error(LOCK_UNAVAILABLE);
	const id = accountId;
	const generation = revision;
	const config = configuration;
	if (
		isSessionTimedOut(id, config.keyId) ||
		accountService.hasPendingTimeoutLogout(id, config.keyId)
	)
		throw new Error("VAULT_SESSION_LOGGED_OUT");
	const key = await authenticate(config.credential!);
	if (
		isSessionTimedOut(id, config.keyId) ||
		accountService.hasPendingTimeoutLogout(id, config.keyId)
	)
		throw new Error("VAULT_SESSION_LOGGED_OUT");
	if (id !== accountId || generation !== revision)
		throw new Error("VAULT_SESSION_CHANGED");
	const raw = await database.getItem<string>(`persist:${id}`);
	if (id !== accountId || generation !== revision)
		throw new Error("VAULT_SESSION_CHANGED");
	if (!raw) throw new Error("VAULT_SESSION_LOGGED_OUT");
	const record = JSON.parse(raw) as VaultRecord;
	if (record.configuration.keyId !== config.keyId)
		throw new Error("VAULT_SESSION_CHANGED");
	unseal(record.state, key); // Authenticate the state before exposing the key.
	setSession(id, {
		key,
		keyId: config.keyId,
		lastActivity: Date.now(),
		timeout: config.timeout,
		timeoutAction: normalizeTimeoutAction(config.timeoutAction),
	});
}

async function update(
	enabled: boolean,
	timeout: number,
	required: boolean,
	maximum?: number,
	timeoutAction: TimeoutAction = normalizeTimeoutAction(
		configuration?.timeoutAction,
	),
) {
	if (!configuration || isLocked()) throw new Error("VAULT_UNLOCK_REQUIRED");
	if (!enabled && required) throw new Error("LOCKING_REQUIRED");
	if (enabled && !configuration.enabled)
		throw new Error("LOCK_CREDENTIAL_REQUIRED");
	const id = accountId;
	const key = getKey()!;
	const lastActivity =
		getSession(accountId, configuration.keyId)?.lastActivity ?? Date.now();
	const next = {
		...configuration,
		requested: enabled,
		keyId: randomHex(),
		enabled,
		timeout: clampTimeout(timeout, maximum),
		timeoutAction: normalizeTimeoutAction(timeoutAction),
		...(enabled ? { persistedKey: undefined } : { persistedKey: key }),
	};
	const snapshot = serializedState;
	transitioning = true;
	try {
		if (snapshot)
			await queueWrite(
				`persist:${id}`,
				JSON.stringify({
					format: "psono-vault-v1",
					configuration: next,
					state: seal(snapshot, key),
				}),
			);
		if (id !== accountId) throw new Error("VAULT_SESSION_CHANGED");
		configuration = next;
	} finally {
		transitioning = false;
	}
	if (enabled)
		setSession(accountId, {
			key,
			keyId: next.keyId,
			lastActivity,
			timeout: next.timeout,
			timeoutAction: next.timeoutAction,
		});
	else {
		lockSession(accountId);
		await clearAccountData(accountId);
	}
	if (serializedState && serializedState !== snapshot)
		await persistence.setItem(`persist:${accountId}`, serializedState);
	await savePreference(next, snapshot, id);
	broadcastConfiguration();
	notify();
}

async function forget(id = accountId) {
	if (!id) return;
	if (id === accountId) {
		suspended = true;
		configuration = undefined;
		serializedState = null;
		revision++;
	}
	lockSession(id);
	notify();
	await writes;
	await withPersistenceLock(() => database.removeItem(`persist:${id}`));
	await clearAccountData(id);
	control.postMessage({ accountId: id });
	notify();
}

async function readAccount(id: string): Promise<string | null> {
	const raw = await database.getItem<string>(`persist:${id}`);
	if (!raw) return null;
	const record = JSON.parse(raw) as VaultRecord;
	if (record.format !== "psono-vault-v1") return null;
	const config = record.configuration;
	const key = config.enabled
		? (getSession(id, config.keyId) ?? (await requestSession(id, config.keyId)))
				?.key
		: config.persistedKey;
	return key ? unseal(record.state, key) : null;
}

/** Read the active account's deadline without exposing its key or recording activity. */
function getRemainingSeconds(): number | null {
	if (suspended || !configuration?.enabled) return null;
	const session = getSession(accountId, configuration.keyId);
	if (!session) return null;
	const remaining =
		session.lastActivity + configuration.timeout * 1000 - Date.now();
	if (remaining <= 0) {
		expireSession(accountId, configuration.timeout);
		return null;
	}
	return Math.ceil(remaining / 1000);
}

const vaultLock = {
	announceKeyHost,
	createOffscreenDocument,
	lockAllSessions,
	beginTimeoutLogout,
	setReloadGuard: (guard: () => boolean) => {
		canReload = guard;
	},
	initialize,
	persistence,
	getKey,
	isLocked,
	isSupported,
	getSupport,
	enable,
	unlock,
	update,
	forget,
	clearAccountData,
	readAccount,
	readPublicState: async (id: string) =>
		(await preferencesDb.getItem<LockPreference>(id))?.publicState ?? null,
	getAccountId: () => accountId,
	getConfiguration: () => configuration,
	getRemainingSeconds,
	getRevision: () => revision,
	isBlocked: () => suspended || isLocked(),
	completeInitialization: (id: string) => {
		if (id === accountId) {
			suspended = false;
			notify();
		}
	},
	lock: () => {
		if (configuration?.enabled) lockSession(accountId);
	},
	touch: () => {
		if (configuration?.enabled) touchSession(accountId, configuration.keyId);
	},
	subscribe: (listener: () => void) => {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
	flush: () => writes,
};
export default vaultLock;
