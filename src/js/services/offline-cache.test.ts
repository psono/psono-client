import offlineCache from "./offline-cache";
import apiClient from "./api-client";
import vaultLock from "./vault-lock";
import storage from "./storage";
import {
	cacheStatus,
	CachedResource,
	CACHE_REFRESH_DELAY,
} from "./offline-cache";
import type { CacheMode } from "../../types/cache";

let mockState = {
	user: { isLoggedIn: true, token: "token", sessionSecretKey: "key" },
	client: { offlineMode: false },
	server: {
		url: "https://api.test",
		complianceDisableOfflineMode: false,
		complianceMaxOfflineCacheTimeValid: 3600,
	},
};
let mockEntries = new Map<
	string,
	{ key: string; value: unknown; validatedAt: number }
>();
jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({
		enableOfflineMode: () => {
			mockState.client.offlineMode = true;
		},
		disableOfflineMode: () => {
			mockState.client.offlineMode = false;
		},
	}),
}));
jest.mock("./vault-lock", () => ({
	__esModule: true,
	default: {
		getConfiguration: jest.fn(() => ({ enabled: true })),
		getKey: jest.fn(() => "lock-key"),
		getAccountId: () => "account",
		getRevision: () => 1,
		subscribe: jest.fn(),
		isLocked: () => false,
		isBlocked: () => false,
	},
}));
jest.mock("./storage", () => ({
	__esModule: true,
	default: {
		upsert: jest.fn(async (_db, entry) => {
			mockEntries.set(entry.key, entry);
		}),
		findKey: jest.fn(async (_db, key) => mockEntries.get(key) ?? null),
		keys: jest.fn(async () => Array.from(mockEntries.keys())),
		remove: jest.fn(async (_db, key) => {
			mockEntries.delete(key);
		}),
		removeAll: jest.fn(async () => {
			mockEntries.clear();
		}),
	},
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		readDatastore: jest.fn(),
		readShare: jest.fn(),
		readSecret: jest.fn(),
		readShareRightsOverview: jest.fn(),
		readCacheMetadata: jest.fn(),
		refreshOfflineCacheEntry: jest.fn(),
	},
}));

describe("encrypted offline cache policy", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockEntries.clear();
		mockState.client.offlineMode = false;
		mockState.server.complianceDisableOfflineMode = false;
		mockState.server.complianceMaxOfflineCacheTimeValid = 3600;
		jest
			.mocked(vaultLock.getConfiguration)
			.mockReturnValue({ enabled: true, timeout: 300, keyId: "id" });
		jest.mocked(vaultLock.getKey).mockReturnValue("lock-key");
	});

	it("never caches without automatic locking or when server policy forbids it", async () => {
		jest
			.mocked(vaultLock.getConfiguration)
			.mockReturnValue({ enabled: false, timeout: 300, keyId: "id" });
		await offlineCache.set("https://api.test/secret/id/", "GET", { data: {} });
		expect(storage.upsert).not.toHaveBeenCalled();
		jest
			.mocked(vaultLock.getConfiguration)
			.mockReturnValue({ enabled: true, timeout: 300, keyId: "id" });
		mockState.server.complianceDisableOfflineMode = true;
		await offlineCache.set("https://api.test/secret/id/", "GET", { data: {} });
		expect(
			await offlineCache.get("https://api.test/secret/id/", "GET"),
		).toBeNull();
		expect(storage.upsert).not.toHaveBeenCalled();
	});

	it("expires cached responses and refuses writes and authentication endpoints", async () => {
		const url = "https://api.test/secret/id/";
		await offlineCache.set(url, "GET", { data: { id: "id" } });
		expect(await offlineCache.get(url, "GET")).toEqual({ data: { id: "id" } });
		expect(await offlineCache.get(url, "PUT")).toBeNull();
		await offlineCache.set("https://api.test/authentication/login/", "GET", {
			data: {},
		});
		expect(mockEntries.size).toBe(1);
		mockEntries.get(url)!.validatedAt -= 3600001;
		expect(await offlineCache.get(url, "GET")).toBeNull();
	});

	it("does not return cached data after key removal", async () => {
		await offlineCache.set("https://api.test/secret/id/", "GET", { data: {} });
		jest.mocked(vaultLock.getKey).mockReturnValue(undefined);
		expect(
			await offlineCache.get("https://api.test/secret/id/", "GET"),
		).toBeNull();
	});

	it("keeps cached snapshots read-only until every live verification finishes", () => {
		mockState.client.offlineMode = true;
		const first = cacheStatus.register("datastore");
		const second = cacheStatus.register("entry");
		try {
			first.update({ refreshing: true, cached: true, offline: false });
			second.update({ refreshing: true, cached: true, offline: false });
			offlineCache.markOnline();
			expect(mockState.client.offlineMode).toBe(true);
			first.update({ refreshing: false, cached: false, offline: false });
			offlineCache.markOnline();
			expect(mockState.client.offlineMode).toBe(true);
			second.update({ refreshing: false, cached: false, offline: false });
			offlineCache.markOnline();
			expect(mockState.client.offlineMode).toBe(false);
		} finally {
			first.dispose();
			second.dispose();
		}
	});

	it("does not call a cached preview offline or leave the client offline after that preview closes", () => {
		offlineCache.markOnline();
		const preview = cacheStatus.register("entry");
		preview.update({ refreshing: true, cached: true, offline: false });
		offlineCache.markOffline(false);
		expect(offlineCache.isActive()).toBe(true);
		expect(mockState.client.offlineMode).toBe(false);
		preview.dispose();
		offlineCache.releaseCacheDisplay();
		expect(offlineCache.isActive()).toBe(false);
		offlineCache.markOffline();
		offlineCache.releaseCacheDisplay();
		expect(offlineCache.isActive()).toBe(true);
	});

	it("postpones automatic prefetch until visible content has finished loading", async () => {
		jest.useFakeTimers();
		offlineCache.markOnline();
		jest
			.mocked(apiClient.readDatastore)
			.mockResolvedValue({ data: { datastores: [] } });
		const foreground = cacheStatus.register("datastore");
		try {
			foreground.update({ refreshing: true, cached: true, offline: false });
			await offlineCache.incrementalUpdate();
			expect(apiClient.readShareRightsOverview).not.toHaveBeenCalled();
			foreground.update({ refreshing: false, cached: false, offline: false });
			jest.advanceTimersByTime(300);
			for (let i = 0; i < 10; i++) await Promise.resolve();
			expect(apiClient.readDatastore).toHaveBeenCalledTimes(1);
		} finally {
			foreground.dispose();
			await offlineCache.clear();
			jest.useRealTimers();
		}
	});

	it("invalidates cached descendants when share permissions change", async () => {
		await offlineCache.set("https://api.test/share/right/", "GET", {
			data: { grants: ["old"] },
		});
		await offlineCache.set("https://api.test/secret/id/", "GET", { data: {} });
		await offlineCache.set("https://api.test/share/right/", "GET", {
			data: { grants: [] },
		});
		expect(mockEntries.has("https://api.test/secret/id/")).toBe(false);
	});

	it("lists only current-server endpoint names without decrypting cached responses", async () => {
		await offlineCache.set("https://api.test/secret/s/", "GET", { data: {} });
		await offlineCache.set("https://api.test/datastore/", "GET", { data: {} });
		mockEntries.set("https://other.test/secret/s/", {
			key: "https://other.test/secret/s/",
			value: {},
			validatedAt: Date.now(),
		});
		expect(await offlineCache.listEndpoints()).toEqual([
			"/datastore/",
			"/secret/s/",
		]);
		expect(storage.findKey).not.toHaveBeenCalled();
		mockState.server.complianceDisableOfflineMode = true;
		expect(await offlineCache.listEndpoints()).toEqual([]);
	});

	it("refreshes an existing endpoint but refuses uncached URLs and disabled caching", async () => {
		await offlineCache.set("https://api.test/secret/s/", "GET", { data: {} });
		await offlineCache.refreshEndpoint("/secret/s/");
		expect(apiClient.refreshOfflineCacheEntry).toHaveBeenCalledWith(
			"token",
			"key",
			"/secret/s/",
		);
		await expect(
			offlineCache.refreshEndpoint("https://other.test/secret/s/"),
		).rejects.toThrow("OFFLINE_CACHE_ENTRY_UNAVAILABLE");
		await expect(
			offlineCache.refreshEndpoint("/secret/missing/"),
		).rejects.toThrow("OFFLINE_CACHE_ENTRY_UNAVAILABLE");
		mockState.server.complianceDisableOfflineMode = true;
		await expect(offlineCache.refreshEndpoint("/secret/s/")).rejects.toThrow(
			"OFFLINE_CACHE_UNAVAILABLE",
		);
		expect(apiClient.refreshOfflineCacheEntry).toHaveBeenCalledTimes(1);
	});

	it("uses nested metadata to refresh changed secrets, revalidate unchanged entries and prune removed resources", async () => {
		const date = "2026-01-01T00:00:00Z";
		await offlineCache.set("https://api.test/datastore/d/", "GET", {
			data: { write_date: date },
		});
		await offlineCache.set("https://api.test/secret/removed/", "GET", {
			data: {},
		});
		jest
			.mocked(apiClient.readDatastore)
			.mockResolvedValue({ data: { datastores: [{ id: "d" }] } } as never);
		jest
			.mocked(apiClient.readCacheMetadata)
			.mockImplementation(async (kind) => ({
				data:
					kind === "datastore"
						? { write_date: date, shares: [{ id: "s" }] }
						: {
								write_date: date,
								secrets: [{ id: "secret", write_date: date }],
							},
			}));
		await offlineCache.incrementalUpdate(true);
		expect(apiClient.readDatastore).toHaveBeenCalledTimes(1); // overview only
		expect(apiClient.readShare).toHaveBeenCalledWith("token", "key", "s");
		expect(apiClient.readSecret).toHaveBeenCalledWith("token", "key", "secret");
		expect(mockEntries.has("https://api.test/secret/removed/")).toBe(false);
		await offlineCache.clear();
		await offlineCache.incrementalUpdate();
		expect(apiClient.readCacheMetadata).toHaveBeenCalledTimes(4);
	});
});

describe("cache-first display loading", () => {
	let scope: string;
	let allowed: boolean;
	let resources: CachedResource<string>[];
	beforeEach(() => {
		jest.useFakeTimers();
		scope = "alice";
		allowed = true;
		resources = [];
	});
	afterEach(() => {
		for (const resource of resources) resource.dispose();
		jest.useRealTimers();
	});
	function create(read: (mode: CacheMode) => Promise<string>) {
		const onData = jest.fn();
		const onError = jest.fn();
		const setCacheActive = jest.fn();
		const resource = new CachedResource({
			kind: "datastore",
			read,
			onData,
			onError,
			setCacheActive,
			scope: () => scope,
			canReadCache: () => allowed,
		});
		resources.push(resource);
		return { resource, onData, onError, setCacheActive };
	}

	it("publishes cache before starting the delayed live read and tracks verification separately", async () => {
		let complete!: (data: string) => void;
		const read = jest.fn((mode: CacheMode) =>
			mode === "cache-only"
				? Promise.resolve("cached")
				: new Promise<string>((resolve) => {
						complete = resolve;
					}),
		);
		const { resource, onData, setCacheActive } = create(read);
		await resource.load();
		expect(onData).toHaveBeenCalledWith("cached", "cache");
		expect(read).toHaveBeenCalledTimes(1);
		expect(cacheStatus.getSnapshot()).toMatchObject({
			refreshing: true,
			usingCache: true,
			offline: false,
		});
		jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		await Promise.resolve();
		expect(read).toHaveBeenLastCalledWith("refresh");
		complete("fresh");
		await resource.refreshComplete;
		expect(onData).toHaveBeenLastCalledWith("fresh", "server");
		expect(cacheStatus.getSnapshot()).toMatchObject({
			refreshing: false,
			usingCache: false,
			offline: false,
		});
		expect(setCacheActive).toHaveBeenLastCalledWith(false);
	});

	it("does not delay a live read for missing, incomplete or corrupt cache", async () => {
		const read = jest.fn(async (mode: CacheMode) => {
			if (mode === "cache-only") throw new Error("corrupt");
			return "fresh";
		});
		const { resource, onData } = create(read);
		await resource.load();
		await resource.refreshComplete;
		expect(onData).toHaveBeenCalledTimes(1);
		expect(onData).toHaveBeenCalledWith("fresh", "server");
		expect(jest.getTimerCount()).toBe(0);
	});

	it("retains valid cached data offline and supports retry after reconnection", async () => {
		let offline = true;
		const { resource, onData, onError } = create(async (mode) => {
			if (mode === "cache-only") return "cached";
			if (offline) throw { errors: ["SERVER_OFFLINE"] };
			return "fresh";
		});
		await resource.load();
		jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		await resource.refreshComplete;
		expect(resource.data).toBe("cached");
		expect(onError).toHaveBeenCalledWith({ errors: ["SERVER_OFFLINE"] }, true);
		expect(cacheStatus.getSnapshot()).toMatchObject({
			offline: true,
			refreshing: false,
			usingCache: true,
		});
		offline = false;
		cacheStatus.retryOffline();
		await Promise.resolve();
		jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		await resource.refreshComplete;
		expect(onData).toHaveBeenLastCalledWith("fresh", "server");
	});

	it("discards cache on access denial rather than presenting revoked data as offline", async () => {
		const error = { status: 403 };
		const { resource, onError } = create(async (mode) => {
			if (mode === "cache-only") return "cached";
			throw error;
		});
		await resource.load();
		jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		await resource.refreshComplete;
		expect(resource.data).toBeUndefined();
		expect(onError).toHaveBeenCalledWith(error, false);
		expect(cacheStatus.getSnapshot()).toMatchObject({
			usingCache: false,
			offline: false,
		});
	});

	it("rechecks cache expiry before retaining it after a network failure", async () => {
		let reads = 0;
		const { resource, onError } = create(async (mode) => {
			if (mode === "cache-only" && ++reads === 1) return "cached";
			if (mode === "cache-only") throw new Error("expired");
			throw { errors: ["SERVER_OFFLINE"] };
		});
		await resource.load();
		jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		await resource.refreshComplete;
		expect(resource.data).toBeUndefined();
		expect(onError).toHaveBeenCalledWith({ errors: ["SERVER_OFFLINE"] }, false);
	});

	it("does not use cache when policy prohibits it", async () => {
		allowed = false;
		const read = jest.fn(async () => "fresh");
		const { resource } = create(read);
		await resource.load();
		await resource.refreshComplete;
		expect(read).toHaveBeenCalledTimes(1);
		expect(read).toHaveBeenCalledWith("refresh");
	});

	it("ignores late responses after account changes or disposal and releases indicators", async () => {
		let complete!: (data: string) => void;
		const { resource, onData } = create((mode) =>
			mode === "cache-only"
				? Promise.resolve("cached")
				: new Promise((resolve) => {
						complete = resolve;
					}),
		);
		await resource.load();
		jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		await Promise.resolve();
		scope = "bob";
		complete("alice-private-data");
		await resource.refreshComplete;
		expect(onData).toHaveBeenCalledTimes(1);
		expect(resource.data).toBeUndefined();
		resource.dispose();
		expect(cacheStatus.getSnapshot().refreshing).toBe(false);
	});
});
