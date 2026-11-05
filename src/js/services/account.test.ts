import localforage from "localforage";
import accountService, {
	finishPendingTimeoutLogouts,
	logoutTimedOutSession,
	onTimeoutLogoutStarted,
} from "./account";
import vaultLock, {
	getSession,
	lockAllSessions,
	onSessionChange,
	setSession,
} from "./vault-lock";
import { seal, unseal } from "./vault-lock";

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

const lockKey = "11".repeat(32);
const sessionKey = "22".repeat(32);
const stateDb = localforage.createInstance({ name: "state" });
const accountsDb = localforage.createInstance({ name: "allAccounts" });
const cacheDb = localforage.createInstance({ name: "offline-cache" });
const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalLocks = Object.getOwnPropertyDescriptor(navigator, "locks");

async function savedAccount(
	id = "alice",
	action = "LOGOUT",
	keyId = `${id}-config`,
) {
	const snapshot = JSON.stringify({
		user: JSON.stringify({
			token: `${id}-token`,
			sessionSecretKey: sessionKey,
		}),
		server: JSON.stringify({ url: "https://api.test" }),
		persistent: JSON.stringify({ fingerprint: "device" }),
	});
	await stateDb.setItem(
		`persist:${id}`,
		JSON.stringify({
			format: "psono-vault-v1",
			configuration: { enabled: true, keyId, timeoutAction: action },
			state: seal(snapshot, lockKey),
		}),
	);
	await accountsDb.setItem(id, { username: id, isLoggedIn: true });
	await cacheDb.setItem(`${id}:secret`, "encrypted-cache");
}

describe("coordinated timeout logout", () => {
	beforeEach(() => {
		mockDatabases.clear();
		localStorage.clear();
		fetchMock.mockReset();
		fetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
		globalThis.fetch = fetchMock;
		let queue: Promise<unknown> = Promise.resolve();
		Object.defineProperty(navigator, "locks", {
			configurable: true,
			value: {
				request: (_name: string, callback: () => Promise<unknown>) => {
					const result = queue.then(callback);
					queue = result.catch(() => {});
					return result;
				},
			},
		});
	});
	afterEach(() => {
		lockAllSessions();
		jest.restoreAllMocks();
		localStorage.clear();
		globalThis.fetch = originalFetch;
		if (originalLocks) Object.defineProperty(navigator, "locks", originalLocks);
		else Reflect.deleteProperty(navigator, "locks");
	});

	it("deletes only the expired account and revokes its server session before UI reload", async () => {
		await savedAccount();
		await savedAccount("bob", "LOCK");
		const order: string[] = [];
		const started = onTimeoutLogoutStarted(() => order.push("logout-start"));
		const changed = onSessionChange((id, unlocked) => {
			if (id === "alice" && !unlocked) order.push("key-cleared");
		});
		try {
			setSession("alice", {
				key: lockKey,
				keyId: "alice-config",
				timeout: 1,
				lastActivity: Date.now(),
				timeoutAction: "LOGOUT",
			});
			setSession("bob", {
				key: lockKey,
				keyId: "bob-config",
				timeout: 60,
				lastActivity: Date.now(),
			});
			const now = Date.now();
			jest.spyOn(Date, "now").mockReturnValue(now + 1001);
			expect(getSession("alice", "alice-config")).toBeUndefined();
			expect(order).toEqual(["logout-start", "key-cleared"]);
			await finishPendingTimeoutLogouts();
			expect(await stateDb.getItem("persist:alice")).toBeNull();
			expect(await stateDb.getItem("persist:bob")).not.toBeNull();
			expect(await cacheDb.keys()).toEqual(["bob:secret"]);
			expect(getSession("bob", "bob-config")?.key).toBe(lockKey);
			expect(await accountsDb.getItem("alice")).toMatchObject({
				isLoggedIn: false,
			});
			expect(await accountsDb.getItem("bob")).toMatchObject({
				isLoggedIn: true,
			});
			expect(fetchMock).toHaveBeenCalledTimes(1);
			const [url, request] = fetchMock.mock.calls[0];
			expect(url).toBe("https://api.test/authentication/logout/");
			expect(request).toMatchObject({
				method: "POST",
				keepalive: true,
				headers: { Authorization: "Token alice-token" },
			});
			const validator = JSON.parse(
				(request!.headers as Record<string, string>)["Authorization-Validator"],
			);
			expect(JSON.parse(unseal(validator, sessionKey))).toMatchObject({
				request_device_fingerprint: "device",
			});
			expect(unseal(JSON.parse(request!.body as string), sessionKey)).toBe(
				"{}",
			);
		} finally {
			started();
			changed();
		}
	});

	it("keeps the encrypted session when the default timeout action is Lock", async () => {
		await savedAccount("alice", "LOCK");
		const before = await stateDb.getItem("persist:alice");
		setSession("alice", {
			key: lockKey,
			keyId: "alice-config",
			timeout: 1,
			lastActivity: Date.now(),
		});
		jest.spyOn(Date, "now").mockReturnValue(Date.now() + 1001);
		expect(getSession("alice")).toBeUndefined();
		await finishPendingTimeoutLogouts();
		expect(await stateDb.getItem("persist:alice")).toBe(before);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("clears local state even if server logout fails offline", async () => {
		await savedAccount();
		fetchMock.mockRejectedValue(new TypeError("offline"));
		await logoutTimedOutSession("alice", "alice-config", lockKey);
		expect(await stateDb.getItem("persist:alice")).toBeNull();
		expect(await cacheDb.keys()).toEqual([]);
	});

	it("deduplicates expiry across independent tabs/key hosts", async () => {
		await savedAccount();
		let peer!: typeof import("./account");
		jest.isolateModules(() => {
			peer = require("./account");
		});
		await Promise.all([
			logoutTimedOutSession("alice", "alice-config", lockKey),
			peer.logoutTimedOutSession("alice", "alice-config", lockKey),
		]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("does not delete a newer login or settings generation", async () => {
		await savedAccount("alice", "LOGOUT", "new-config");
		await logoutTimedOutSession("alice", "old-config", lockKey);
		expect(await stateDb.getItem("persist:alice")).not.toBeNull();
		expect(await cacheDb.keys()).toEqual(["alice:secret"]);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("recovers interrupted deletion after a page closes without persisting any key", async () => {
		await savedAccount();
		localStorage.setItem(
			"psono:timeout-logout:alice:alice-config",
			JSON.stringify({ accountId: "alice", keyId: "alice-config" }),
		);
		await finishPendingTimeoutLogouts();
		expect(await stateDb.getItem("persist:alice")).toBeNull();
		expect(localStorage.length).toBe(0);
		expect(fetchMock).not.toHaveBeenCalled(); // Recovery has no retained key to reveal the old token.
	});

	it("finishes cache cleanup if the previous page deleted the snapshot before closing", async () => {
		await savedAccount();
		await stateDb.removeItem("persist:alice");
		localStorage.setItem(
			"psono:timeout-logout:alice:alice-config",
			JSON.stringify({ accountId: "alice", keyId: "alice-config" }),
		);
		await finishPendingTimeoutLogouts();
		expect(await cacheDb.keys()).toEqual([]);
		expect(await accountsDb.getItem("alice")).toMatchObject({
			isLoggedIn: false,
		});
		expect(localStorage.length).toBe(0);
	});
});

describe("Service: account session", () => {
	let findKeyMock: jest.SpyInstance<Promise<string | null>, [string]>;
	beforeEach(() => {
		mockDatabases.clear();
		findKeyMock = jest.spyOn(vaultLock.persistence, "getItem");
	});
	afterEach(() => jest.restoreAllMocks());

	it("recognizes the session persisted for the active account", async () => {
		findKeyMock.mockResolvedValue(
			JSON.stringify({
				user: JSON.stringify({
					token: "current-token",
					sessionSecretKey: "current-session-key",
				}),
			}),
		);
		await expect(
			accountService.isCurrentSession("current-token"),
		).resolves.toBe(true);
		expect(vaultLock.persistence.getItem).toHaveBeenCalledWith(
			"persist:client",
		);
	});

	it("rejects credentials from a stale session", async () => {
		findKeyMock.mockResolvedValue(
			JSON.stringify({
				user: JSON.stringify({
					token: "new-token",
					sessionSecretKey: "new-session-key",
				}),
			}),
		);
		await expect(accountService.isCurrentSession("old-token")).resolves.toBe(
			false,
		);
	});

	it("fails closed when persisted session state is unavailable", async () => {
		findKeyMock.mockResolvedValue(null);
		await expect(accountService.isCurrentSession("token")).resolves.toBe(false);
	});
});
