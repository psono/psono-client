import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import offlineCache, { CachedResource } from "./offline-cache";
import vaultLock from "./vault-lock";
import { CacheMissError } from "../../types/cache";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import type { ReducerAction } from "../../types/actions";
import userReducer from "../reducers/user";

function createTestStore() {
	const initialState = {
		server: { url: "https://api.test" },
		user: {
			...userReducer(undefined, { type: "@@INIT" }),
			isLoggedIn: true,
			token: "token",
			sessionSecretKey: "key",
		},
	};
	return createStore(
		(state: typeof initialState = initialState, action: ReducerAction) => ({
			...state,
			user: userReducer(state.user, action),
		}),
		applyMiddleware(thunk),
	);
}
let mockStore: ReturnType<typeof createTestStore>;

jest.mock("./store", () => ({
	getStore: () => mockStore,
}));
jest.mock("./device", () => ({
	__esModule: true,
	default: { getDeviceFingerprint: () => "fingerprint" },
}));
jest.mock("./offline-cache", () => ({
	...jest.requireActual("./offline-cache"),
	__esModule: true,
	default: {
		get: jest.fn(),
		set: jest.fn(),
		isActive: jest.fn(() => false),
		canUse: jest.fn(() => false),
		markOffline: jest.fn(),
		markOnline: jest.fn(),
		clear: jest.fn(),
	},
}));
jest.mock("./user", () => ({
	__esModule: true,
	default: { isLoggedIn: () => false, logout: jest.fn() },
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		encryptData: jest.fn(() => ({ text: "encrypted", nonce: "nonce" })),
		decryptData: jest.fn(),
	},
}));

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function respond(body: string, status = 200, statusText = ""): Response {
	// Only the fetch Response members used by the transport are needed here.
	const response: Partial<Response> = {
		ok: status >= 200 && status < 300,
		status,
		statusText,
		text: async () => body,
	};
	fetchMock.mockResolvedValue(response as Response);
	return response as Response;
}

describe("API client: transport compatibility", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		jest.clearAllMocks();
		mockStore = createTestStore();
		fetchMock.mockReset();
		globalThis.fetch = fetchMock;
		jest.mocked(offlineCache.get).mockResolvedValue(null);
		jest.mocked(offlineCache.isActive).mockReturnValue(false);
		jest.mocked(offlineCache.canUse).mockReturnValue(false);
		jest.mocked(cryptoLibrary.decryptData).mockReturnValue('{"id":"secret"}');
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it("unwraps encrypted JSON and caches the decrypted envelope", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}');

		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).resolves.toEqual({
			data: { id: "secret" },
		});
		expect(cryptoLibrary.decryptData).toHaveBeenCalledWith(
			"ciphertext",
			"response-nonce",
			"key",
		);
		expect(offlineCache.set).toHaveBeenCalledWith(
			"https://api.test/secret/secret/",
			"GET",
			{ data: { id: "secret" } },
		);
		expect(
			mockStore.getState().user.lastServerConnectionTimeSinceEpoch,
		).toBeGreaterThan(0);
	});

	it("exposes HTTP 400 share reads by status so cleanup can skip them", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}', 400);
		jest
			.mocked(cryptoLibrary.decryptData)
			.mockReturnValue('{"non_field_errors":["NO_PERMISSION_OR_NOT_EXIST"]}');
		await expect(
			apiClient.readShare("token", "key", "denied-share", "refresh"),
		).rejects.toEqual({ status: 400 });
		expect(offlineCache.get).not.toHaveBeenCalled();
	});

	it("sends a shared RP ID without substituting the extension registration origin", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}');
		const origin = "chrome-extension://eljmjmgjkbmpmfljlmklcfineebidmlo";
		await apiClient.createWebauthn(
			"token",
			"key",
			"Shared key",
			origin,
			"example.com",
		);
		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({ title: "Shared key", origin, rp_id: "example.com" }),
			"key",
		);
	});

	it("renews the offline window on later live requests, including non-cacheable status reads", async () => {
		const now = jest.spyOn(Date, "now").mockReturnValue(1794398400000);
		respond('{"text":"ciphertext","nonce":"response-nonce"}');
		await apiClient.readSecret("token", "key", "secret");
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			1794398400000,
		);
		now.mockReturnValue(1794398401000);
		await apiClient.readStatus("token", "key");
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			1794398401000,
		);
	});

	it.each([
		["https://other.test", "key"],
		["https://api.test", "other-key"],
	])("does not renew the active account's window for another server/session (%s, %s)", async (serverUrl, sessionKey) => {
		respond("", 204);
		await apiClient.statelessLogout(
			"other-token",
			sessionKey,
			undefined,
			undefined,
			serverUrl,
			"other-fingerprint",
		);
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it.each([
		false,
		true,
	])("transports automatic WebAuthn compatibility requests (legacy=%s)", async (legacy) => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}');
		const origin = "chrome-extension://eljmjmgjkbmpmfljlmklcfineebidmlo";
		await apiClient.webauthnVerifyInit(
			"token",
			"key",
			origin,
			"example.com",
			legacy,
		);
		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({
				origin,
				rp_id: "example.com",
				...(legacy ? { legacy: true } : {}),
			}),
			"key",
		);
	});

	it("falls back to cached envelopes on network failure without decrypting them again", async () => {
		const cached = { data: { id: "cached-secret" } };
		jest.mocked(offlineCache.get).mockResolvedValue(cached);
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(apiClient.readSecret("token", "key", "secret")).resolves.toBe(
			cached,
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(cryptoLibrary.decryptData).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("uses a fresh live response even when a cached copy exists", async () => {
		jest.mocked(offlineCache.get).mockResolvedValue({ data: { id: "old" } });
		respond('{"text":"ciphertext","nonce":"response-nonce"}');
		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).resolves.toEqual({ data: { id: "secret" } });
		expect(offlineCache.get).not.toHaveBeenCalled();
	});

	it.each([
		["/datastore/", () => apiClient.readDatastore("token", "key")],
		[
			"/datastore/vault/",
			() => apiClient.readDatastore("token", "key", "vault"),
		],
		["/share/shared/", () => apiClient.readShare("token", "key", "shared")],
		["/share/right/", () => apiClient.readShareRightsOverview("token", "key")],
		["/secret/secret/", () => apiClient.readSecret("token", "key", "secret")],
	] as const)("falls back to cached data on HTTP 404 for %s", async (endpoint, read) => {
		const cached = { data: { id: "cached" } };
		jest.mocked(offlineCache.get).mockResolvedValue(cached);
		respond("<html>Not Found</html>", 404, "Not Found");

		await expect(read()).resolves.toBe(cached);
		expect(offlineCache.get).toHaveBeenCalledWith(
			`https://api.test${endpoint}`,
			"GET",
		);
		expect(offlineCache.markOffline).toHaveBeenCalled();
		expect(offlineCache.clear).not.toHaveBeenCalled();
		expect(offlineCache.set).not.toHaveBeenCalled();
		expect(cryptoLibrary.decryptData).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("retains the displayed datastore after a 404 refresh and replaces it after reconnection", async () => {
		jest.useFakeTimers();
		const cached = { data: { id: "cached" } };
		jest.mocked(offlineCache.get).mockResolvedValue(cached);
		respond("<html>Not Found</html>", 404, "Not Found");
		const onData = jest.fn();
		const onError = jest.fn();
		const setCacheActive = jest.fn();
		const resource = new CachedResource({
			kind: "datastore",
			read: (mode) => apiClient.readDatastore("token", "key", "vault", mode),
			canReadCache: () => true,
			scope: () => "account",
			setCacheActive,
			onData,
			onError,
			delay: 0,
		});
		try {
			await resource.load();
			expect(onData).toHaveBeenCalledWith(cached, "cache");
			jest.runOnlyPendingTimers();
			await resource.refreshComplete;
			expect(resource.data).toBe(cached);
			expect(onError).toHaveBeenCalledWith(
				{ errors: ["SERVER_OFFLINE"], status: 404 },
				true,
			);
			expect(setCacheActive).toHaveBeenLastCalledWith(true, true);
			expect(offlineCache.clear).not.toHaveBeenCalled();
			expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
				0,
			);

			respond('{"text":"ciphertext","nonce":"response-nonce"}');
			await resource.load();
			jest.runOnlyPendingTimers();
			await resource.refreshComplete;
			expect(onData).toHaveBeenLastCalledWith(
				{ data: { id: "secret" } },
				"server",
			);
			expect(setCacheActive).toHaveBeenLastCalledWith(false);
		} finally {
			resource.dispose();
		}
	});

	it("preserves cache but rejects explicit refreshes on HTTP 404", async () => {
		jest.mocked(offlineCache.get).mockResolvedValue({ data: { id: "cached" } });
		respond("Not Found", 404, "Not Found");
		await expect(
			apiClient.refreshOfflineCacheEntry("token", "key", "/secret/secret/"),
		).rejects.toEqual({ errors: ["SERVER_OFFLINE"], status: 404 });
		expect(offlineCache.get).not.toHaveBeenCalled();
		expect(offlineCache.clear).not.toHaveBeenCalled();
		expect(offlineCache.markOnline).not.toHaveBeenCalled();
	});

	it("reports HTTP 404 when no cached data is available", async () => {
		respond("", 404);
		await expect(
			apiClient.readSecret("token", "key", "missing"),
		).rejects.toEqual({
			errors: ["RESOURCE_NOT_FOUND"],
		});
		expect(offlineCache.markOffline).not.toHaveBeenCalled();
		expect(offlineCache.clear).not.toHaveBeenCalled();
	});

	it("does not fall back to cache for mutations returning HTTP 404", async () => {
		jest.mocked(offlineCache.get).mockResolvedValue({ data: { id: "cached" } });
		respond("", 404);
		await expect(apiClient.logout("token", "key")).rejects.toEqual({
			errors: ["RESOURCE_NOT_FOUND"],
		});
		expect(offlineCache.get).not.toHaveBeenCalled();
		expect(offlineCache.markOffline).not.toHaveBeenCalled();
	});

	it("serves explicit cache-only reads immediately without fetching or claiming online status", async () => {
		const cached = { data: { id: "cached" } };
		jest.mocked(offlineCache.get).mockResolvedValue(cached);
		await expect(
			apiClient.readSecret("token", "key", "secret", "cache-only"),
		).resolves.toBe(cached);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(offlineCache.markOnline).not.toHaveBeenCalled();
		expect(offlineCache.markOffline).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("treats a cache-only miss as a miss rather than silently falling through to the network", async () => {
		await expect(
			apiClient.readSecret("token", "key", "secret", "cache-only"),
		).rejects.toBeInstanceOf(CacheMissError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("requires a live response for revalidation even if a cached secret exists", async () => {
		jest.mocked(offlineCache.get).mockResolvedValue({ data: { id: "cached" } });
		fetchMock.mockRejectedValue(new TypeError("offline"));
		await expect(
			apiClient.readSecret("token", "key", "secret", "refresh"),
		).rejects.toEqual({ errors: ["SERVER_OFFLINE"] });
		expect(offlineCache.get).not.toHaveBeenCalled();
	});

	it("bounds background verification when the server never responds", async () => {
		jest.useFakeTimers();
		jest.mocked(offlineCache.canUse).mockReturnValue(true);
		fetchMock.mockImplementation(
			(_url, options) =>
				new Promise((_resolve, reject) => {
					options?.signal?.addEventListener("abort", () =>
						reject(new DOMException("timed out", "AbortError")),
					);
				}),
		);
		const pending = apiClient.readSecret("token", "key", "secret", "refresh");
		const result = expect(pending).rejects.toEqual({
			errors: ["SERVER_OFFLINE"],
		});
		jest.advanceTimersByTime(5000);
		await result;
		expect(offlineCache.get).not.toHaveBeenCalled();
	});

	it("never reports an explicit cache refresh as successful using an offline fallback", async () => {
		jest.mocked(offlineCache.get).mockResolvedValue({ data: { id: "old" } });
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
		await expect(
			apiClient.refreshOfflineCacheEntry("token", "key", "/secret/secret/"),
		).rejects.toEqual({ errors: ["SERVER_OFFLINE"] });
		expect(offlineCache.get).not.toHaveBeenCalled();
	});

	it("only allows relative vault GET endpoints for individual cache refreshes", async () => {
		await expect(
			apiClient.refreshOfflineCacheEntry(
				"token",
				"key",
				"https://other.test/secret/secret/",
			),
		).rejects.toThrow("OFFLINE_CACHE_ENDPOINT_UNSUPPORTED");
		await expect(
			apiClient.refreshOfflineCacheEntry(
				"token",
				"key",
				"/authentication/login/",
			),
		).rejects.toThrow("OFFLINE_CACHE_ENDPOINT_UNSUPPORTED");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("permits cached fallback on server errors and never falls back on permission errors", async () => {
		const cached = { data: { id: "cached" } };
		jest.mocked(offlineCache.get).mockResolvedValue(cached);
		respond("", 503);
		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).resolves.toEqual(cached);
		expect(offlineCache.markOffline).toHaveBeenCalled();
		jest.clearAllMocks();
		respond('{"text":"ciphertext","nonce":"response-nonce"}', 403);
		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).rejects.toEqual({ data: { id: "secret" } });
		expect(offlineCache.get).not.toHaveBeenCalled();
		expect(offlineCache.clear).toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("blocks mutations while using cached responses and vault reads while locked", async () => {
		jest.mocked(offlineCache.isActive).mockReturnValue(true);
		await expect(
			apiClient.createWebauthn("token", "key", "title", "https://api.test"),
		).rejects.toEqual({
			errors: ["OFFLINE_CACHE_READ_ONLY"],
		});
		jest.spyOn(vaultLock, "isBlocked").mockReturnValue(true);
		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).rejects.toEqual({ errors: ["VAULT_LOCKED"] });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("discards responses from an earlier account/lock generation before decrypting or caching", async () => {
		let finish!: (response: Response) => void;
		fetchMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		const pending = apiClient.readSecret("token", "key", "secret");
		jest.spyOn(vaultLock, "getRevision").mockReturnValue(999);
		finish({
			ok: true,
			status: 200,
			text: async () => '{"text":"ciphertext","nonce":"response-nonce"}',
		} as Response);
		await expect(pending).rejects.toEqual({
			errors: ["VAULT_SESSION_CHANGED"],
		});
		expect(cryptoLibrary.decryptData).not.toHaveBeenCalled();
		expect(offlineCache.set).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it.each([
		200, 400,
	])("rejects plaintext on encrypted requests (HTTP %s)", async (status) => {
		respond('{"id":"untrusted"}', status);

		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).rejects.toEqual({
			errors: ["UNENCRYPTED_RESPONSE_RECEIVED"],
		});
		expect(offlineCache.set).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("preserves decrypted server validation errors", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}', 400);
		jest
			.mocked(cryptoLibrary.decryptData)
			.mockReturnValue('{"non_field_errors":["invalid"]}');

		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).rejects.toEqual({
			data: { non_field_errors: ["invalid"] },
		});
	});

	it("identifies HTTP 400 metadata-share responses for graceful sync skipping", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}', 400);
		await expect(
			apiClient.readCacheMetadata("share", "token", "key", "rejected"),
		).rejects.toEqual({ status: 400 });
		expect(offlineCache.get).not.toHaveBeenCalled();
		expect(offlineCache.set).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("preserves empty successful responses and omitted logout fields", async () => {
		respond("", 204);

		await expect(apiClient.logout("token", "key")).resolves.toBe("");
		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith("{}", "key");
	});

	it("allows public unencrypted JSON responses", async () => {
		respond('{"info":"server-info"}');

		await expect(apiClient.info()).resolves.toEqual({
			data: { info: "server-info" },
		});
		expect(cryptoLibrary.decryptData).not.toHaveBeenCalled();
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
	});

	it("uses explicit stateless connection details and invokes the response callback", async () => {
		const response = respond("", 204);
		const sideEffect = jest.fn<void, [Response]>();

		await apiClient.statelessLogout(
			"other-token",
			"other-key",
			undefined,
			undefined,
			"https://other.test",
			"other-fingerprint",
			sideEffect,
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://other.test/authentication/logout/",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Token other-token",
				}),
			}),
		);
		expect(sideEffect).toHaveBeenCalledWith(response);
		expect(mockStore.getState().user.lastServerConnectionTimeSinceEpoch).toBe(
			0,
		);
		const validator: unknown = JSON.parse(
			jest.mocked(cryptoLibrary.encryptData).mock.calls[1][0],
		);
		expect(validator).toEqual({
			request_time: expect.any(String),
			request_device_fingerprint: "other-fingerprint",
		});
	});

	it("maps failed network requests to the legacy offline error", async () => {
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(apiClient.info()).rejects.toEqual({
			errors: ["SERVER_OFFLINE"],
		});
	});

	it.each([
		[404, "RESOURCE_NOT_FOUND"],
		[503, "SERVER_OFFLINE"],
	])("maps HTTP %s without status text to a stable error", async (status, error) => {
		respond("", status);

		await expect(apiClient.info()).rejects.toEqual({ errors: [error] });
	});
});
