import localforage from "localforage";
import { persistStore } from "redux-persist";
import type { Persistor } from "redux-persist";
import type { AppStore } from "../../types/state";
import { SET_USER_INFO_2, SET_USER_INFO_3 } from "../actions/action-types";
import { initStore, registerPersistor } from "./store";
import vaultLock from "./vault-lock";

let mockAccountId = "alice";
const mockDatabases = new Map<string, Map<string, unknown>>();
jest.mock("./account", () => ({
	__esModule: true,
	default: {
		getCurrentId: async () => mockAccountId,
		finishPendingTimeoutLogouts: () =>
			jest.requireActual("./account").finishPendingTimeoutLogouts(),
		hasPendingTimeoutLogout: (id: string, keyId: string) =>
			jest.requireActual("./account").hasPendingTimeoutLogout(id, keyId),
		logoutTimedOutSession: (id: string, keyId: string, key?: string) =>
			jest.requireActual("./account").logoutTimedOutSession(id, keyId, key),
	},
}));
jest.mock("redux-state-sync", () => ({
	createStateSyncMiddleware: () => () => (next: (action: unknown) => unknown) =>
		next,
	initMessageListener: () => {},
}));
jest.mock("localforage", () => ({
	__esModule: true,
	default: {
		createInstance: ({ name }: { name: string }) => {
			const db = () => {
				if (!mockDatabases.has(name)) mockDatabases.set(name, new Map());
				return mockDatabases.get(name)!;
			};
			return {
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

class Attestation {
	getAuthenticatorData() {
		const bytes = new Uint8Array(37);
		bytes[32] = 5;
		return bytes.buffer;
	}
}
function credential() {
	return {
		rawId: new Uint8Array([1]).buffer,
		authenticatorAttachment: "platform",
		response: new Attestation(),
		getClientExtensionResults: () => ({
			prf: {
				enabled: true,
				results: { first: new Uint8Array(32).fill(7).buffer },
			},
		}),
	};
}

describe("Service: store encrypted Redux lifecycle", () => {
	const persistors: Persistor[] = [];
	beforeEach(() => {
		mockDatabases.clear();
		mockAccountId = "alice";
		Object.defineProperty(globalThis, "AuthenticatorAttestationResponse", {
			configurable: true,
			value: Attestation,
		});
		Object.defineProperty(globalThis, "PublicKeyCredential", {
			configurable: true,
			value: {
				isUserVerifyingPlatformAuthenticatorAvailable: async () => true,
			},
		});
		Object.defineProperty(navigator, "credentials", {
			configurable: true,
			value: {
				create: async () => credential(),
				get: async () => credential(),
			},
		});
		Object.defineProperty(navigator, "locks", {
			configurable: true,
			value: {
				request: async (_name: string, callback: () => unknown) => callback(),
			},
		});
	});
	afterEach(async () => {
		for (const persistor of persistors) {
			persistor.pause();
			await persistor.flush();
		}
		await vaultLock.forget();
	});

	async function boot() {
		const store = await initStore();
		const id = mockAccountId;
		let ready!: () => void;
		const complete = new Promise<void>((resolve) => {
			ready = resolve;
		});
		const persistor = persistStore(store, undefined, () => {
			vaultLock.completeInitialization(id);
			ready();
		});
		persistors.push(persistor);
		registerPersistor(persistor);
		await complete;
		await persistor.flush();
		return { store, persistor };
	}
	async function login(store: AppStore, persistor: Persistor) {
		store.dispatch({
			type: SET_USER_INFO_2,
			userPrivateKey: "private-key",
			userPublicKey: "public-key",
			sessionSecretKey: "session-key",
			token: "alice-token",
			userSauce: "sauce",
			authentication: "AUTHKEY",
			passwordSha1Prefix: "",
		});
		store.dispatch({
			type: SET_USER_INFO_3,
			userId: "alice-id",
			userEmail: "alice@test",
			userSecretKey: "sensitive-user-key",
			serverSecretExists: false,
			requirePasswordChange: false,
		});
		await persistor.flush();
	}

	it("rehydrates a locked session without exposing it and restores it only after a verified unlock", async () => {
		const first = await boot();
		await login(first.store, first.persistor);
		await vaultLock.enable("alice", "example.test", 60);
		vaultLock.lock();
		expect(first.store.getState().user.token).toBe("");
		const reopened = await boot();
		expect(vaultLock.isLocked()).toBe(true);
		expect(reopened.store.getState().user.isLoggedIn).toBe(false);
		expect(reopened.store.getState().user.userPrivateKey).toBe("");
		const restored = new Promise<void>((resolve) => {
			const unsubscribe = reopened.store.subscribe(() => {
				if (reopened.store.getState().user.isLoggedIn) {
					unsubscribe();
					resolve();
				}
			});
		});
		await vaultLock.unlock();
		await restored;
		expect(reopened.store.getState().user.token).toBe("alice-token");
		await reopened.persistor.flush();
		const raw = await localforage
			.createInstance({ name: "state" })
			.getItem<string>("persist:alice");
		expect(raw).not.toContain("alice-token");
	});

	it("clears retired account stores permanently, including after switching back to the same account", async () => {
		const first = await boot();
		await login(first.store, first.persistor);
		await vaultLock.enable("alice", "example.test", 60);
		mockAccountId = "bob";
		await boot();
		expect(first.store.getState().user.userPrivateKey).toBe("");
		mockAccountId = "alice";
		const current = await boot();
		expect(current.store.getState().user.token).toBe("alice-token");
		first.store.dispatch({
			type: SET_USER_INFO_3,
			userId: "stale",
			userEmail: "stale",
			userSecretKey: "revived-key",
			serverSecretExists: false,
			requirePasswordChange: false,
		});
		expect(first.store.getState().user.userSecretKey).toBe("");
		vaultLock.lock();
		expect(current.store.getState().user.userSecretKey).toBe("");
	});
});
