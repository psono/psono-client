import localforage from "localforage";
import vaultLock, { LOCK_UNAVAILABLE } from "./vault-lock";
import {
	deriveLockKey,
	seal,
	unseal,
	createOffscreenDocument,
} from "./vault-lock";
import storage from "./storage";
import accountService, { finishPendingTimeoutLogouts } from "./account";

const mockDatabases = new Map<string, Map<string, unknown>>();
jest.mock("localforage", () => ({
	__esModule: true,
	default: {
		createInstance: ({ name }: { name: string }) => {
			const db = () => {
				if (!mockDatabases.has(name)) mockDatabases.set(name, new Map());
				return mockDatabases.get(name)!;
			};
			return {
				ready: async () => {},
				driver: () => "mock",
				iterate: async (callback: (value: unknown, key: string) => void) => {
					for (const [key, value] of db()) callback(value, key);
				},
				getItem: async (key: string) => db().get(key) ?? null,
				setItem: async (key: string, value: unknown) => {
					db().set(key, value);
					return value;
				},
				removeItem: async (key: string) => {
					db().delete(key);
				},
				keys: async () => Array.from(db().keys()),
				clear: async () => {
					db().clear();
				},
			};
		},
	},
}));

const stateDb = localforage.createInstance({ name: "state" });
const state = JSON.stringify({
	user: JSON.stringify({ isLoggedIn: true, token: "sensitive-token" }),
	server: "{}",
	persistent: "{}",
});
let account = 0;
let seed = new Uint8Array(32).fill(7);
let verified = true;
let prf = true;
let creationPrfResult = true;

class Attestation {
	getAuthenticatorData() {
		const data = new Uint8Array(37);
		data[32] = verified ? 5 : 1;
		return data.buffer;
	}
}
function credential() {
	return {
		rawId: new Uint8Array([1, 2, 3]).buffer,
		authenticatorAttachment: "platform",
		response: new Attestation(),
		getClientExtensionResults: () => ({
			prf: prf
				? {
						enabled: true,
						...(creationPrfResult
							? { results: { first: seed.slice().buffer } }
							: {}),
					}
				: {},
		}),
	};
}

function assertionCredential(
	attachment: string | null | undefined,
	id = [1, 2, 3],
): PublicKeyCredential {
	return {
		rawId: new Uint8Array(id).buffer,
		authenticatorAttachment: attachment,
		response: { authenticatorData: new Attestation().getAuthenticatorData() },
		// Assertions return results without the enrollment-only `enabled` flag.
		getClientExtensionResults: () => ({
			prf: prf ? { results: { first: seed.slice().buffer } } : {},
		}),
	} as unknown as PublicKeyCredential;
}

describe("vault lock lifecycle", () => {
	beforeEach(async () => {
		mockDatabases.clear();
		verified = true;
		prf = true;
		creationPrfResult = true;
		seed = new Uint8Array(32).fill(7);
		Object.defineProperty(globalThis, "AuthenticatorAttestationResponse", {
			configurable: true,
			value: Attestation,
		});
		Object.defineProperty(globalThis, "PublicKeyCredential", {
			configurable: true,
			value: {
				isUserVerifyingPlatformAuthenticatorAvailable: jest.fn(
					async () => true,
				),
				getClientCapabilities: jest.fn(async () => ({ "extension:prf": true })),
			},
		});
		Object.defineProperty(navigator, "credentials", {
			configurable: true,
			value: {
				create: jest.fn(async () => credential()),
				get: jest.fn(async () => assertionCredential("platform")),
			},
		});
		Object.defineProperty(navigator, "locks", {
			configurable: true,
			value: {
				request: async (_name: string, callback: () => unknown) => callback(),
			},
		});
		await vaultLock.initialize(`account-${++account}`);
		vaultLock.completeInitialization(vaultLock.getAccountId());
		await vaultLock.persistence.setItem(
			`persist:${vaultLock.getAccountId()}`,
			state,
		);
	});
	afterEach(async () => {
		jest.restoreAllMocks();
		await vaultLock.forget();
	});

	it("uses the preserved native platform probe instead of the extension's advertised support", async () => {
		const native = jest.fn(function (this: typeof PublicKeyCredential) {
			expect(this).toBe(PublicKeyCredential);
			return Promise.resolve(false);
		});
		Object.defineProperty(
			PublicKeyCredential,
			"psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable",
			{
				configurable: true,
				value: native,
			},
		);
		await expect(vaultLock.isSupported()).resolves.toBe(false);
		expect(
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable,
		).not.toHaveBeenCalled();
		native.mockResolvedValue(true);
		await expect(vaultLock.isSupported()).resolves.toBe(true);
		expect(native).toHaveBeenCalledTimes(2);
	});

	it("falls back to the browser probe when the bridge has not been injected", async () => {
		jest
			.mocked(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)
			.mockResolvedValue(false);
		await expect(vaultLock.isSupported()).resolves.toBe(false);
		expect(
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable,
		).toHaveBeenCalledTimes(1);
	});

	it("does not mistake an absent native probe for the extension's emulated support", async () => {
		Object.defineProperty(
			PublicKeyCredential,
			"psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable",
			{
				configurable: true,
				value: undefined,
			},
		);
		await expect(vaultLock.isSupported()).resolves.toBe(false);
		expect(
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable,
		).not.toHaveBeenCalled();
	});

	it("reports a failing platform probe while still checking PRF", async () => {
		jest
			.mocked(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)
			.mockRejectedValue(
				new DOMException("Blocked in this context", "SecurityError"),
			);
		const support = await vaultLock.getSupport();
		expect(support.supported).toBe(false);
		expect(support.checks).toContainEqual({
			name: "LOCK_CHECK_PLATFORM",
			status: "error",
			error: "SecurityError: Blocked in this context",
		});
		expect(support.checks).toContainEqual({
			name: "LOCK_CHECK_PRF",
			status: "available",
		});
	});

	it("encrypts the whole state, derives account-separated keys, and erases the seed buffer", async () => {
		const input = new Uint8Array(32).fill(7);
		const key = deriveLockKey(input.buffer, "11".repeat(32), "one");
		expect(input.every((byte) => byte === 0)).toBe(true);
		expect(
			deriveLockKey(new Uint8Array(32).fill(7).buffer, "11".repeat(32), "two"),
		).not.toBe(key);
		expect(unseal(seal("secret", key), key)).toBe("secret");
		await vaultLock.enable("alice", "example.test", 60);
		const raw = (await stateDb.getItem<string>(
			`persist:${vaultLock.getAccountId()}`,
		))!;
		expect(raw).not.toContain("sensitive-token");
		expect(raw).not.toContain("persistedKey");
		expect(
			await vaultLock.persistence.getItem(
				`persist:${vaultLock.getAccountId()}`,
			),
		).toBe(state);
	});

	it("uses one prompt when registration returns a verified PRF evaluation and derives the same key on unlock", async () => {
		const creationSeed = seed.slice();
		jest.spyOn(navigator.credentials, "create").mockResolvedValue({
			...credential(),
			getClientExtensionResults: () => ({
				prf: { enabled: true, results: { first: creationSeed.buffer } },
			}),
		} as unknown as PublicKeyCredential);
		await vaultLock.enable("alice", "example.test", 60);
		expect(navigator.credentials.create).toHaveBeenCalledTimes(1);
		expect(navigator.credentials.get).not.toHaveBeenCalled();
		expect(creationSeed.every((byte) => byte === 0)).toBe(true);
		const key = vaultLock.getKey();
		vaultLock.lock();
		jest
			.spyOn(navigator.credentials, "get")
			.mockResolvedValue(assertionCredential(null));
		await vaultLock.unlock();
		expect(navigator.credentials.get).toHaveBeenCalledTimes(1);
		expect(vaultLock.getKey()).toBe(key);
		expect(
			await vaultLock.persistence.getItem(
				`persist:${vaultLock.getAccountId()}`,
			),
		).toBe(state);
	});

	it("rejects an invalid registration PRF result without a second prompt or changing the working key", async () => {
		const key = vaultLock.getKey();
		seed = new Uint8Array(16).fill(7);
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		expect(navigator.credentials.get).not.toHaveBeenCalled();
		expect(vaultLock.getKey()).toBe(key);
		expect(vaultLock.getConfiguration()?.enabled).toBe(false);
	});

	it("logs registration extension results while redacting PRF bytes", async () => {
		const log = jest.spyOn(console, "info").mockImplementation(() => {});
		await vaultLock.enable("alice", "example.test", 60);
		expect(log).toHaveBeenCalledWith(
			"Psono automatic locking registration response:",
			expect.any(String),
		);
		const output = JSON.parse(log.mock.calls[0][1] as string);
		expect(output).toEqual({
			authenticatorAttachment: "platform",
			extensions: {
				prf: {
					enabled: true,
					results: { first: { redacted: true, byteLength: 32 } },
				},
			},
		});
	});

	it("identifies missing PRF support without exposing credential or key material", async () => {
		prf = false;
		await expect(
			vaultLock.enable("alice", "example.test", 60),
		).rejects.toMatchObject({
			message: LOCK_UNAVAILABLE,
			lockDiagnostic:
				"Registration: PRF extension present: true; PRF enabled: undefined; PRF result present: false.",
		});
	});

	it("requires a platform authenticator, verified user and PRF result before changing the working key", async () => {
		const key = vaultLock.getKey();
		prf = false;
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		prf = true;
		verified = false;
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		expect(vaultLock.getKey()).toBe(key);
		expect(vaultLock.getConfiguration()?.enabled).toBe(false);
	});

	it.each([
		null,
		undefined,
	])("uses assertion-only fallback and unlocks when Firefox omits assertion attachment (%s)", async (attachment) => {
		creationPrfResult = false;
		const get = jest
			.spyOn(navigator.credentials, "get")
			.mockImplementation(async () => assertionCredential(attachment));
		await vaultLock.enable("alice", "example.test", 60);
		expect(vaultLock.getConfiguration()?.enabled).toBe(true);
		expect(get.mock.calls[0][0]?.publicKey).toMatchObject({
			userVerification: "required",
			allowCredentials: [
				{
					type: "public-key",
					id: new Uint8Array([1, 2, 3]).buffer,
					transports: ["internal"],
				},
			],
		});
		vaultLock.lock();
		await vaultLock.unlock();
		expect(vaultLock.isLocked()).toBe(false);
		expect(
			await vaultLock.persistence.getItem(
				`persist:${vaultLock.getAccountId()}`,
			),
		).toBe(state);
		expect(navigator.credentials.create).toHaveBeenCalledTimes(1);
		expect(get).toHaveBeenCalledTimes(2);
	});

	it.each([
		null,
		"cross-platform",
	])("still requires platform attachment during enrollment (%s)", async (attachment) => {
		const key = vaultLock.getKey();
		jest.spyOn(navigator.credentials, "create").mockResolvedValue({
			...credential(),
			authenticatorAttachment: attachment,
		} as unknown as PublicKeyCredential);
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		expect(navigator.credentials.get).not.toHaveBeenCalled();
		expect(vaultLock.getKey()).toBe(key);
	});

	it("rejects an explicitly cross-platform assertion even with UV and PRF", async () => {
		creationPrfResult = false;
		jest
			.spyOn(navigator.credentials, "get")
			.mockResolvedValue(assertionCredential("cross-platform"));
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		expect(vaultLock.getConfiguration()?.enabled).toBe(false);
	});

	it.each([
		"platform",
		null,
	])("rejects assertions for a different credential during enrollment (%s)", async (attachment) => {
		creationPrfResult = false;
		const key = vaultLock.getKey();
		jest
			.spyOn(navigator.credentials, "get")
			.mockResolvedValue(assertionCredential(attachment, [9, 9, 9]));
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		expect(vaultLock.getKey()).toBe(key);
		expect(vaultLock.getConfiguration()?.enabled).toBe(false);
	});

	it("does not unlock with a mismatched credential when attachment is omitted", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		vaultLock.lock();
		jest
			.spyOn(navigator.credentials, "get")
			.mockResolvedValue(assertionCredential(null, [9, 9, 9]));
		await expect(vaultLock.unlock()).rejects.toThrow(LOCK_UNAVAILABLE);
		expect(vaultLock.isLocked()).toBe(true);
	});

	it.each([
		"verification",
		"prf",
		"short-prf",
	])("requires %s on assertions even when attachment is omitted", async (failure) => {
		creationPrfResult = false;
		jest.spyOn(navigator.credentials, "get").mockImplementation(async () => {
			if (failure === "verification") verified = false;
			else if (failure === "prf") prf = false;
			else seed = new Uint8Array(16).fill(7);
			return assertionCredential(null);
		});
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		expect(vaultLock.getConfiguration()?.enabled).toBe(false);
	});

	it("locks after wall-clock inactivity, blocks writes while locked, and verifies the key on unlock", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		const id = `persist:${vaultLock.getAccountId()}`;
		const snapshot = await stateDb.getItem(id);
		const now = Date.now();
		jest.spyOn(Date, "now").mockReturnValue(now + 61000);
		expect(vaultLock.getKey()).toBeUndefined();
		expect(vaultLock.isLocked()).toBe(true);
		await vaultLock.persistence.setItem(id, "{}");
		expect(await stateDb.getItem(id)).toEqual(snapshot);
		seed.fill(8);
		await expect(vaultLock.unlock()).rejects.toBeDefined();
		expect(vaultLock.isLocked()).toBe(true);
		seed.fill(7);
		await vaultLock.unlock();
		expect(await vaultLock.persistence.getItem(id)).toBe(state);
	});

	it("resets the inactivity deadline on interaction and clamps settings to server policy", async () => {
		await vaultLock.enable("alice", "example.test", 600, 60);
		const now = Date.now();
		jest.spyOn(Date, "now").mockReturnValue(now + 50000);
		vaultLock.touch();
		jest.mocked(Date.now).mockReturnValue(now + 80000);
		expect(vaultLock.isLocked()).toBe(false);
		await expect(vaultLock.update(false, 300, true)).rejects.toThrow(
			"LOCKING_REQUIRED",
		);
		expect(vaultLock.getConfiguration()?.timeout).toBe(60);
	});

	it("reports the real remaining time without treating countdown reads as activity", async () => {
		expect(vaultLock.getRemainingSeconds()).toBeNull();
		await vaultLock.enable("alice", "example.test", 600, 60);
		const now = Date.now();
		expect(vaultLock.getRemainingSeconds()).toBe(60);
		jest.spyOn(Date, "now").mockReturnValue(now + 10000);
		expect(vaultLock.getRemainingSeconds()).toBe(50);
		expect(vaultLock.getRemainingSeconds()).toBe(50);
		vaultLock.touch();
		expect(vaultLock.getRemainingSeconds()).toBe(60);
		jest.mocked(Date.now).mockReturnValue(now + 70001);
		expect(vaultLock.getRemainingSeconds()).toBeNull();
		expect(vaultLock.isLocked()).toBe(true);
	});

	it("defaults existing accounts to Lock and retains a chosen timeout action across settings updates and logout", async () => {
		expect(vaultLock.getConfiguration()?.timeoutAction).toBe("LOCK");
		await vaultLock.enable("alice", "example.test", 600, undefined, "LOGOUT");
		expect(vaultLock.getConfiguration()?.timeoutAction).toBe("LOGOUT");
		// Server-policy clamps omit the optional action and must preserve it.
		await vaultLock.update(true, 300, true, 300);
		expect(vaultLock.getConfiguration()).toMatchObject({
			timeout: 300,
			timeoutAction: "LOGOUT",
		});
		const id = vaultLock.getAccountId();
		await vaultLock.forget();
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		expect(vaultLock.getConfiguration()?.timeoutAction).toBe("LOGOUT");
	});

	it("blocks the current vault immediately and removes its session when the countdown expires with Logout selected", async () => {
		// Observe the control signal without navigating jsdom away from this test.
		const post = BroadcastChannel.prototype.postMessage;
		jest
			.spyOn(BroadcastChannel.prototype, "postMessage")
			.mockImplementation(function (
				this: BroadcastChannel,
				data: { event?: string },
			) {
				if (data?.event !== "timeout-logout") return post.call(this, data);
			});
		await vaultLock.enable("alice", "example.test", 60, undefined, "LOGOUT");
		const id = vaultLock.getAccountId();
		jest.spyOn(Date, "now").mockReturnValue(Date.now() + 61000);
		expect(vaultLock.getRemainingSeconds()).toBeNull();
		expect(vaultLock.isBlocked()).toBe(true);
		expect(vaultLock.getKey()).toBeUndefined();
		await finishPendingTimeoutLogouts();
		expect(await stateDb.getItem(`persist:${id}`)).toBeNull();
	});

	it("enables logout-only locking without PRF or WebAuthn and keeps its key off disk", async () => {
		Object.defineProperty(globalThis, "PublicKeyCredential", {
			configurable: true,
			value: undefined,
		});
		await expect(vaultLock.isSupported()).resolves.toBe(false);
		await expect(vaultLock.enable("alice", "example.test", 60)).rejects.toThrow(
			LOCK_UNAVAILABLE,
		);
		await vaultLock.enable("alice", "example.test", 600, 60, "LOGOUT");
		expect(navigator.credentials.create).not.toHaveBeenCalled();
		expect(navigator.credentials.get).not.toHaveBeenCalled();
		expect(vaultLock.getConfiguration()).toMatchObject({
			enabled: true,
			timeout: 60,
			timeoutAction: "LOGOUT",
		});
		expect(vaultLock.getConfiguration()?.credential).toBeUndefined();
		const id = vaultLock.getAccountId();
		const key = vaultLock.getKey()!;
		const raw = (await stateDb.getItem<string>(`persist:${id}`))!;
		expect(raw).not.toContain(key);
		expect(raw).not.toContain("sensitive-token");
		expect(await vaultLock.persistence.getItem(`persist:${id}`)).toBe(state);
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		expect(vaultLock.getKey()).toBe(key);
		await vaultLock.update(true, 30, true);
		expect(vaultLock.getConfiguration()?.timeoutAction).toBe("LOGOUT");
		await expect(
			vaultLock.update(true, 30, true, undefined, "LOCK"),
		).rejects.toThrow("LOCK_CREDENTIAL_REQUIRED");
	});

	it("returns to login when a logout-only session loses its in-memory key", async () => {
		await vaultLock.enable("alice", "example.test", 60, undefined, "LOGOUT");
		const id = vaultLock.getAccountId();
		vaultLock.lock();
		expect(vaultLock.isBlocked()).toBe(true);
		await finishPendingTimeoutLogouts();
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		expect(vaultLock.getConfiguration()).toMatchObject({
			enabled: false,
			requested: true,
			timeoutAction: "LOGOUT",
		});
		expect(await vaultLock.persistence.getItem(`persist:${id}`)).not.toContain(
			"sensitive-token",
		);
	});

	it("discards an unrecoverable logout-only session when reopening the browser", async () => {
		await vaultLock.enable("alice", "example.test", 60, undefined, "LOGOUT");
		const id = vaultLock.getAccountId();
		// Drop the key while another account is active, as if all key hosts closed.
		await vaultLock.initialize("another-account");
		vaultLock.lockAllSessions();
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		expect(vaultLock.getConfiguration()).toMatchObject({
			enabled: false,
			requested: true,
			timeoutAction: "LOGOUT",
		});
		expect(await vaultLock.persistence.getItem(`persist:${id}`)).not.toContain(
			"sensitive-token",
		);
	});

	it("enrolls a recoverable key when switching from logout-only mode to Lock", async () => {
		await vaultLock.enable("alice", "example.test", 60, undefined, "LOGOUT");
		const oldKey = vaultLock.getKey();
		await vaultLock.enable("alice", "example.test", 60, undefined, "LOCK");
		expect(vaultLock.getKey()).not.toBe(oldKey);
		expect(vaultLock.getConfiguration()?.credential).toBeDefined();
		vaultLock.lock();
		expect(vaultLock.isLocked()).toBe(true);
		await vaultLock.unlock();
		expect(
			await vaultLock.persistence.getItem(
				`persist:${vaultLock.getAccountId()}`,
			),
		).toBe(state);
	});

	it("persists the key only when locking is disabled and removes it and the encrypted session on logout", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		await vaultLock.update(false, 60, false);
		const id = `persist:${vaultLock.getAccountId()}`;
		expect(
			JSON.parse((await stateDb.getItem<string>(id))!).configuration
				.persistedKey,
		).toBe(vaultLock.getKey());
		await vaultLock.forget();
		expect(vaultLock.getKey()).toBeUndefined();
		expect(await stateDb.getItem(id)).toBeNull();
	});

	it("removes a locked session without unlocking and returns to an unauthenticated vault", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		const accountId = vaultLock.getAccountId();
		const id = `persist:${accountId}`;
		vaultLock.lock();
		expect(vaultLock.isLocked()).toBe(true);
		expect(await stateDb.getItem(id)).not.toBeNull();

		await vaultLock.forget();
		expect(vaultLock.getKey()).toBeUndefined();
		expect(await stateDb.getItem(id)).toBeNull();

		await vaultLock.initialize(accountId);
		vaultLock.completeInitialization(accountId);
		expect(vaultLock.isLocked()).toBe(false);
		expect(vaultLock.getConfiguration()?.enabled).toBe(false);
	});

	it("does not persist an enforced session before PRF enrollment", async () => {
		const id = `persist:${vaultLock.getAccountId()}`;
		await vaultLock.persistence.setItem(
			id,
			JSON.stringify({
				user: JSON.stringify({ token: "secret" }),
				server: JSON.stringify({ complianceEnforceLocking: true }),
			}),
		);
		expect(await vaultLock.persistence.getItem(id)).not.toContain("secret");
	});

	it("retains the locking preference across logout without retaining the key or authenticated state", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		const id = vaultLock.getAccountId();
		const oldKey = vaultLock.getKey();
		await vaultLock.forget();
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		expect(vaultLock.getConfiguration()?.requested).toBe(true);
		expect(vaultLock.getKey()).not.toBe(oldKey);
		await vaultLock.persistence.setItem(`persist:${id}`, state);
		expect(await vaultLock.persistence.getItem(`persist:${id}`)).not.toContain(
			"sensitive-token",
		);
	});

	it("does not let an old tab overwrite changed lock settings or resurrect a removed session", async () => {
		const id = `persist:${vaultLock.getAccountId()}`;
		const raw = JSON.parse((await stateDb.getItem<string>(id))!);
		raw.configuration.keyId = "new-settings-in-another-tab";
		await stateDb.setItem(id, JSON.stringify(raw));
		await expect(vaultLock.persistence.setItem(id, state)).rejects.toThrow(
			"VAULT_CHANGED_IN_ANOTHER_TAB",
		);
		expect(
			JSON.parse((await stateDb.getItem<string>(id))!).configuration.keyId,
		).toBe("new-settings-in-another-tab");
		await stateDb.removeItem(id);
		await expect(vaultLock.persistence.setItem(id, state)).rejects.toThrow(
			"VAULT_CHANGED_IN_ANOTHER_TAB",
		);
		expect(await stateDb.getItem(id)).toBeNull();
	});

	it("keeps account keys independent while switching between encrypted sessions", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		const alice = vaultLock.getAccountId();
		const aliceKey = vaultLock.getKey();
		await vaultLock.initialize("bob");
		vaultLock.completeInitialization("bob");
		await vaultLock.persistence.setItem("persist:bob", state);
		await vaultLock.enable("bob", "example.test", 60);
		expect(vaultLock.getKey()).not.toBe(aliceKey);
		await vaultLock.initialize(alice);
		vaultLock.completeInitialization(alice);
		expect(vaultLock.getKey()).toBe(aliceKey);
		expect(await vaultLock.persistence.getItem(`persist:${alice}`)).toBe(state);
	});

	it("encrypts autofill indexes and permits neither direct nor search reads while locked", async () => {
		await vaultLock.enable("alice", "example.test", 60);
		const leaf = {
			key: "secret-id",
			secret_key: "sensitive-secret-key",
			name: "Private entry",
		};
		await storage.upsert("datastore-password-leafs", leaf);
		const raw = await localforage
			.createInstance({ name: "datastore-password-leafs" })
			.getItem(`${vaultLock.getAccountId()}:secret-id`);
		expect(JSON.stringify(raw)).not.toContain("sensitive-secret-key");
		expect(await storage.where("datastore-password-leafs", () => true)).toEqual(
			[leaf],
		);
		vaultLock.lock();
		expect(
			await storage.findKey("datastore-password-leafs", "secret-id"),
		).toBeNull();
		expect(await storage.where("datastore-password-leafs", () => true)).toEqual(
			[],
		);
		await vaultLock.unlock();
		expect(
			await storage.findKey("datastore-password-leafs", "secret-id"),
		).toEqual(leaf);
	});

	it("preserves host pins and remembered labels across logout without copying session material to preferences", async () => {
		const snapshot = JSON.stringify({
			persistent: JSON.stringify({
				knownHosts: [{ url: "https://api.test", verify_key: "pin" }],
			}),
			user: JSON.stringify({
				rememberMe: true,
				username: "alice",
				token: "sensitive-token",
			}),
			server: JSON.stringify({ url: "https://api.test" }),
		});
		const id = vaultLock.getAccountId();
		await vaultLock.persistence.setItem(`persist:${id}`, snapshot);
		await vaultLock.enable("alice", "example.test", 60);
		await vaultLock.forget();
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		const publicSnapshot = (await vaultLock.persistence.getItem(
			`persist:${id}`,
		))!;
		expect(publicSnapshot).toContain("pin");
		expect(publicSnapshot).toContain("alice");
		expect(publicSnapshot).not.toContain("sensitive-token");
		await vaultLock.persistence.setItem(`persist:${id}`, publicSnapshot);
		await vaultLock.initialize(id);
		vaultLock.completeInitialization(id);
		expect(await vaultLock.persistence.getItem(`persist:${id}`)).toContain(
			"alice",
		);
	});

	it("wipes legacy sessions for all accounts and old offline data while retaining host pins", async () => {
		await stateDb.setItem(
			"persist:old-one",
			JSON.stringify({
				user: JSON.stringify({ token: "legacy" }),
				persistent: JSON.stringify({ knownHosts: ["pin"] }),
			}),
		);
		await stateDb.setItem(
			"persist:old-two",
			JSON.stringify({
				user: JSON.stringify({ userPrivateKey: "private" }),
				client: JSON.stringify({ offlineMode: true }),
			}),
		);
		await localforage
			.createInstance({ name: "offline-cache" })
			.setItem("old", "secret");
		await vaultLock.initialize("old-one");
		expect(await vaultLock.persistence.getItem("persist:old-one")).toContain(
			"pin",
		);
		expect(await stateDb.getItem("persist:old-two")).not.toContain("private");
		expect(
			await localforage.createInstance({ name: "offline-cache" }).keys(),
		).toEqual([]);
	});
});

describe("cross-context ephemeral lock keys", () => {
	let channels: Set<TestChannel>;
	let messages: unknown[];
	const original = globalThis.BroadcastChannel;
	class TestChannel {
		onmessage: ((event: { data: unknown }) => void) | null = null;
		constructor(public name: string) {
			channels.add(this);
		}
		postMessage(data: unknown) {
			messages.push(data);
			for (const peer of channels)
				if (peer !== this && peer.name === this.name)
					peer.onmessage?.({ data });
		}
		close() {
			channels.delete(this);
		}
	}
	function context(): typeof import("./vault-lock") {
		let result!: typeof import("./vault-lock");
		jest.isolateModules(() => {
			const accounts = require("./account").default as typeof accountService;
			jest
				.spyOn(accounts, "logoutTimedOutSession")
				.mockResolvedValue(undefined);
			result = require("./vault-lock");
		});
		return result;
	}
	beforeEach(() => {
		channels = new Set();
		messages = [];
		globalThis.BroadcastChannel =
			TestChannel as unknown as typeof BroadcastChannel;
		jest.useFakeTimers();
	});
	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
		globalThis.BroadcastChannel = original;
	});

	it("shares keys and activity across tabs and the offscreen host, keeping accounts independent", async () => {
		const tab = context();
		const host = context();
		tab.setSession("alice", {
			key: "key-a",
			keyId: "id-a",
			lastActivity: Date.now(),
			timeout: 60,
		});
		tab.setSession("bob", {
			key: "key-b",
			keyId: "id-b",
			lastActivity: Date.now(),
			timeout: 60,
		});
		jest.advanceTimersByTime(50000);
		host.touchSession("alice", "id-a");
		jest.advanceTimersByTime(20000);
		expect(tab.getSession("alice", "id-a")?.key).toBe("key-a");
		expect(host.getSession("bob", "id-b")).toBeUndefined();
		const newTab = context();
		const request = newTab.requestSession("alice", "id-a");
		jest.advanceTimersByTime(150);
		expect((await request)?.key).toBe("key-a");
		jest.advanceTimersByTime(40000);
		expect(newTab.getSession("alice", "id-a")).toBeUndefined();
	});

	it("rejects late key responses after locking and permits a fresh verified unlock", () => {
		const tab = context();
		const host = context();
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
		});
		const delayed = messages[0];
		tab.lockSession("alice");
		new TestChannel("psono-lock-keys-v1").postMessage(delayed);
		expect(host.getSession("alice", "id")).toBeUndefined();
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
		});
		expect(host.getSession("alice", "id")?.key).toBe("key");
		host.lockAllSessions();
		expect(tab.getSession("alice", "id")).toBeUndefined();
	});

	it("cannot recover a key after all tabs and the browser-memory host have closed", async () => {
		const first = context();
		first.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
		});
		for (const channel of channels) channel.close();
		const reopened = context();
		const request = reopened.requestSession("alice", "id");
		jest.advanceTimersByTime(150);
		expect(await request).toBeUndefined();
	});

	it("populates a late-starting offscreen host and locks accounts not loaded by a restarted worker", () => {
		const tab = context();
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
		});
		const host = context();
		host.announceKeyHost();
		expect(host.getSession("alice", "id")?.key).toBe("key");
		const worker = context(); // no active account has been requested yet
		worker.lockAllSessions();
		expect(host.getSession("alice", "id")).toBeUndefined();
		expect(tab.getSession("alice", "id")).toBeUndefined();
	});

	it("shares the selected logout action with the key host and clears every expired key", () => {
		const tab = context();
		const host = context();
		const expiredInTab = jest.fn();
		const expiredInHost = jest.fn();
		tab.onSessionTimeout(expiredInTab);
		host.onSessionTimeout(expiredInHost);
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
			timeoutAction: "LOGOUT",
		});
		jest.advanceTimersByTime(61000);
		expect(tab.getSession("alice", "id")).toBeUndefined();
		expect(host.getSession("alice", "id")).toBeUndefined();
		expect(expiredInTab).toHaveBeenCalledWith(
			"alice",
			expect.objectContaining({ timeoutAction: "LOGOUT", keyId: "id" }),
		);
		expect(expiredInHost).toHaveBeenCalledWith(
			"alice",
			expect.objectContaining({ timeoutAction: "LOGOUT", keyId: "id" }),
		);
		expect(tab.isSessionTimedOut("alice", "id")).toBe(true);
		// A late unlock/key response cannot revive a logged-out configuration.
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
		});
		expect(tab.getSession("alice", "id")).toBeUndefined();
	});

	it("does not turn explicit Lock now or browser-close locking into logout", () => {
		const tab = context();
		const expired = jest.fn();
		tab.onSessionTimeout(expired);
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
			timeoutAction: "LOGOUT",
		});
		tab.lockAllSessions();
		expect(expired).not.toHaveBeenCalled();
		expect(tab.isSessionTimedOut("alice", "id")).toBe(false);
		tab.setSession("alice", {
			key: "key",
			keyId: "id",
			lastActivity: Date.now(),
			timeout: 60,
		});
		expect(tab.getSession("alice", "id")?.key).toBe("key");
	});

	it("executes a shortened timeout immediately instead of retaining an expired key", () => {
		const tab = context();
		const expired = jest.fn();
		tab.onSessionTimeout(expired);
		tab.setSession("alice", {
			key: "key",
			keyId: "shortened",
			lastActivity: Date.now() - 61000,
			timeout: 60,
			timeoutAction: "LOGOUT",
		});
		expect(expired).toHaveBeenCalledTimes(1);
		expect(tab.getSession("alice", "shortened")).toBeUndefined();
	});
});

describe("Chrome in-memory key host", () => {
	const testGlobals = globalThis as unknown as {
		TARGET: typeof TARGET;
		chrome: typeof chrome;
	};
	const hasDocument = jest.fn<Promise<boolean>, []>();
	const createDocument = jest.fn<Promise<void>, []>();
	const originalTarget = testGlobals.TARGET;
	const originalChrome = testGlobals.chrome;
	beforeEach(() => {
		hasDocument.mockReset().mockResolvedValue(false);
		createDocument.mockReset().mockResolvedValue(undefined);
		testGlobals.TARGET = "chrome";
		testGlobals.chrome = {
			runtime: { getURL: (path: string) => `chrome-extension://id/${path}` },
			offscreen: { hasDocument, createDocument },
		} as unknown as typeof chrome;
	});
	afterEach(() => {
		testGlobals.TARGET = originalTarget;
		testGlobals.chrome = originalChrome;
	});
	it("creates the host once for concurrent requests", async () => {
		await Promise.all([createOffscreenDocument(), createOffscreenDocument()]);
		expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
	});
	it("uses an existing host", async () => {
		hasDocument.mockResolvedValue(true);
		await createOffscreenDocument();
		expect(chrome.offscreen.createDocument).not.toHaveBeenCalled();
	});
	it("propagates creation failures so enrollment cannot silently lose its key", async () => {
		createDocument.mockRejectedValue(new Error("permission denied"));
		await expect(createOffscreenDocument()).rejects.toThrow(
			"permission denied",
		);
	});
	it.each([
		"safari",
		"firefox",
		"webclient",
	] as const)("uses ordinary context memory on %s", async (target) => {
		testGlobals.TARGET = target;
		await createOffscreenDocument();
		expect(chrome.offscreen.createDocument).not.toHaveBeenCalled();
	});
});
