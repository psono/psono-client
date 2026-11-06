import localforage from "localforage";
import { persistStore } from "redux-persist";
import type { Persistor } from "redux-persist";
import type { AppStore } from "../../types/state";
import {
	LOGOUT,
	SET_USER_INFO_2,
	SET_USER_INFO_3,
} from "../actions/action-types";
import { initStore, registerPersistor } from "./store";
import vaultLock from "./vault-lock";
import backgroundService from "./background";
import browserClient from "./browser-client";
import datastorePassword from "./datastore-password";
import storage from "./storage";
import offlineCache from "./offline-cache";
import type { Datastore } from "../../types/datastore";

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
		jest.spyOn(browserClient, "getActiveTab").mockResolvedValue({ id: 42 });
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
		jest.restoreAllMocks();
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

	it("initializes a development worker without a window", async () => {
		jest
			.spyOn(require("redux-logger"), "createLogger")
			.mockReturnValue(() => (next: (action: unknown) => unknown) => next);
		const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window")!;
		const environment = process.env.NODE_ENV;
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: undefined,
		});
		process.env.NODE_ENV = "development";
		try {
			await expect(initStore()).resolves.toBeDefined();
		} finally {
			Object.defineProperty(globalThis, "window", descriptor);
			process.env.NODE_ENV = environment;
		}
	});

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

	it("keeps the injected menu's index readable after rebuilding and unlocking", async () => {
		jest.spyOn(offlineCache, "incrementalUpdate").mockResolvedValue(undefined);
		const { store, persistor } = await boot();
		await login(store, persistor);
		await vaultLock.enable("alice", "example.test", 60);
		const datastore: Datastore = {
			items: [
				{
					id: "entry",
					type: "website_password",
					secret_id: "secret",
					secret_key: "key",
					name: "Example",
					urlfilter: "example.com",
				},
			],
		};
		await datastorePassword.fillStorage(datastore);
		expect(await storage.keys("datastore-password-leafs")).toEqual(["secret"]);
		await datastorePassword.fillStorage(datastore);
		vaultLock.lock();
		await vaultLock.unlock();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(store.getState().user.isLoggedIn).toBe(true);
		expect(await storage.where("datastore-password-leafs", () => true)).toEqual(
			[expect.objectContaining({ secret_id: "secret" })],
		);
		const response = jest.fn();
		backgroundService.onMessage(
			{ event: "website-password-refresh", data: "https://example.com/" },
			{ tab: { id: 42, url: "https://example.com/" } },
			response,
		);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(response).toHaveBeenCalledWith({
			event: "website-password-update",
			data: [{ secret_id: "secret", name: "Example", description: "" }],
		});
	});

	it("updates the toolbar icon on lock, asynchronous unlock restoration, and logout", async () => {
		jest.spyOn(offlineCache, "incrementalUpdate").mockResolvedValue(undefined);
		const icon = jest
			.spyOn(browserClient, "setIcon")
			.mockImplementation(() => {});
		const badge = jest
			.spyOn(browserClient, "setBadgeText")
			.mockImplementation(() => {});
		const { store, persistor } = await boot();
		backgroundService.watchBrowserActionState();
		expect(icon).toHaveBeenLastCalledWith({
			path: "/data/img/icon-32-disabled.png",
		});

		await login(store, persistor);
		expect(icon).toHaveBeenLastCalledWith({ path: "/data/img/icon-32.png" });
		await vaultLock.enable("alice", "example.test", 60);
		vaultLock.lock();
		expect(icon).toHaveBeenLastCalledWith({
			path: "/data/img/icon-32-disabled.png",
		});
		expect(badge).toHaveBeenLastCalledWith("");

		const readState = vaultLock.persistence.getItem;
		let restoreState!: () => void;
		jest.spyOn(vaultLock.persistence, "getItem").mockImplementationOnce(
			(key) =>
				new Promise((resolve) => {
					restoreState = () => resolve(readState(key));
				}),
		);
		await vaultLock.unlock();
		expect(vaultLock.isBlocked()).toBe(false);
		expect(store.getState().user.isLoggedIn).toBe(false);
		expect(icon).toHaveBeenLastCalledWith({
			path: "/data/img/icon-32-disabled.png",
		});
		restoreState();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(store.getState().user.isLoggedIn).toBe(true);
		expect(icon).toHaveBeenLastCalledWith({ path: "/data/img/icon-32.png" });

		store.dispatch({ type: LOGOUT, rememberMe: false });
		expect(icon).toHaveBeenLastCalledWith({
			path: "/data/img/icon-32-disabled.png",
		});
	});

	it("restores the toolbar indicator after starting with a locked replacement store", async () => {
		jest.spyOn(offlineCache, "incrementalUpdate").mockResolvedValue(undefined);
		const icon = jest
			.spyOn(browserClient, "setIcon")
			.mockImplementation(() => {});
		jest.spyOn(browserClient, "setBadgeText").mockImplementation(() => {});
		const first = await boot();
		backgroundService.watchBrowserActionState();
		await login(first.store, first.persistor);
		await vaultLock.enable("alice", "example.test", 60);
		vaultLock.lock();

		const reopened = await boot();
		backgroundService.watchBrowserActionState();
		expect(icon).toHaveBeenLastCalledWith({
			path: "/data/img/icon-32-disabled.png",
		});
		await vaultLock.unlock();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(reopened.store.getState().user.isLoggedIn).toBe(true);
		expect(icon).toHaveBeenLastCalledWith({ path: "/data/img/icon-32.png" });
	});

	async function seedWebsitePasswords(count: number) {
		await storage.upsert(
			"datastore-password-leafs",
			Array.from({ length: count + 1 }, (_, index) => ({
				key: `secret-${index}`,
				secret_id: `secret-${index}`,
				secret_key: "key",
				type: "website_password",
				urlfilter: index < count ? "example.com" : "unrelated.example",
			})),
		);
	}

	it.each<[number, string]>([
		[0, ""],
		[3, "3"],
		[12, "9+"],
	])("shows the active website's %i matching entries on the badge at startup", async (count, expected) => {
		const badge = jest
			.spyOn(browserClient, "setBadgeText")
			.mockImplementation(() => {});
		const { store, persistor } = await boot();
		await login(store, persistor);
		await seedWebsitePasswords(count);
		jest.mocked(browserClient.getActiveTab).mockResolvedValue({
			id: 42,
			url: "https://example.com/login",
		});

		backgroundService.watchBrowserActionState();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(browserClient.getActiveTab).toHaveBeenCalled();
		expect(badge).toHaveBeenLastCalledWith(expected);
	});

	it("restores the website entry count after unlock without switching tabs", async () => {
		jest.spyOn(offlineCache, "incrementalUpdate").mockResolvedValue(undefined);
		const badge = jest
			.spyOn(browserClient, "setBadgeText")
			.mockImplementation(() => {});
		const { store, persistor } = await boot();
		await login(store, persistor);
		await vaultLock.enable("alice", "example.test", 60);
		await seedWebsitePasswords(3);
		jest.mocked(browserClient.getActiveTab).mockResolvedValue({
			id: 42,
			url: "https://example.com/login",
		});
		backgroundService.watchBrowserActionState();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(badge).toHaveBeenLastCalledWith("3");

		vaultLock.lock();
		expect(badge).toHaveBeenLastCalledWith("");
		await vaultLock.unlock();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(badge).toHaveBeenLastCalledWith("3");
	});

	it("ignores an active-tab lookup from before locking once the count is restored", async () => {
		jest.spyOn(offlineCache, "incrementalUpdate").mockResolvedValue(undefined);
		const badge = jest
			.spyOn(browserClient, "setBadgeText")
			.mockImplementation(() => {});
		const { store, persistor } = await boot();
		await login(store, persistor);
		await vaultLock.enable("alice", "example.test", 60);
		await seedWebsitePasswords(3);
		let finishOldTabLookup!: (tab: { id: number; url: string }) => void;
		jest
			.mocked(browserClient.getActiveTab)
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishOldTabLookup = resolve;
					}),
			)
			.mockResolvedValue({ id: 42, url: "https://example.com/login" });
		backgroundService.watchBrowserActionState();
		await new Promise((resolve) => setTimeout(resolve, 0));
		vaultLock.lock();
		await vaultLock.unlock();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(badge).toHaveBeenLastCalledWith("3");

		finishOldTabLookup({ id: 99, url: "https://no-matches.example/login" });
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(badge).toHaveBeenLastCalledWith("3");
	});

	it("retries menu index initialization when an old build finishes after unlocking", async () => {
		jest.spyOn(offlineCache, "incrementalUpdate").mockResolvedValue(undefined);
		const { store, persistor } = await boot();
		await login(store, persistor);
		await vaultLock.enable("alice", "example.test", 60);
		let finishOldBuild!: (value: undefined) => void;
		const datastore: Datastore = {
			items: [
				{
					id: "entry",
					type: "website_password",
					secret_id: "secret",
					secret_key: "key",
					name: "Example",
					urlfilter: "example.com",
				},
			],
		};
		const load = jest
			.spyOn(datastorePassword, "getPasswordDatastore")
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishOldBuild = resolve;
					}),
			)
			.mockImplementation(async () => {
				await datastorePassword.fillStorage(datastore);
				return datastore;
			});
		const request = {
			event: "website-password-refresh",
			data: "https://example.com/",
		};
		const sender = { tab: { id: 42, url: "https://example.com/" } };
		const oldResponse = jest.fn();
		backgroundService.onMessage(request, sender, oldResponse);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(load).toHaveBeenCalledTimes(1);

		vaultLock.lock();
		await vaultLock.unlock();
		await new Promise((resolve) => setTimeout(resolve, 0));
		finishOldBuild(undefined);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(oldResponse).toHaveBeenCalledWith({
			event: "status",
			data: "locked",
		});

		const response = jest.fn();
		backgroundService.onMessage(request, sender, response);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(load).toHaveBeenCalledTimes(2);
		expect(response).toHaveBeenCalledWith({
			event: "website-password-update",
			data: [{ secret_id: "secret", name: "Example", description: "" }],
		});
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
