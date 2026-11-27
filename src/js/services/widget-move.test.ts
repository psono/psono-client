import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import type { Datastore } from "../../types/datastore";
import rootReducer from "../reducers";
import cryptoLibrary from "./crypto-library";
import datastoreService from "./datastore";
import datastorePasswordService from "./datastore-password";
import device from "./device";
import offlineCache, { CachedResource, cacheStatus } from "./offline-cache";
import * as storeService from "./store";
import vaultLock from "./vault-lock";
import widgetService from "./widget";

describe("Moving entries before a cache-enabled datastore reload", () => {
	const originalFetch = globalThis.fetch;
	const rights = { read: true, write: true, grant: true };
	const fetchMock = jest.fn<
		ReturnType<typeof fetch>,
		Parameters<typeof fetch>
	>();
	let kind: "secret" | "file" | "share";
	let releaseLinkResponse: () => void;
	let display: CachedResource<Datastore>;

	beforeEach(() => {
		jest.useFakeTimers();
		const state = rootReducer(undefined, { type: "@@INIT" });
		state.server.url = "https://api.test";
		state.user.isLoggedIn = true;
		state.user.token = "token";
		state.user.sessionSecretKey = "session-key";
		const store = createStore(rootReducer, state, applyMiddleware(thunk));
		jest.spyOn(storeService, "getStore").mockReturnValue(store);
		jest.spyOn(vaultLock, "isBlocked").mockReturnValue(false);
		jest.spyOn(offlineCache, "set").mockResolvedValue(undefined);
		jest.spyOn(offlineCache, "clear").mockResolvedValue(undefined);
		jest.spyOn(offlineCache, "markOnline").mockImplementation(() => {});
		jest.spyOn(device, "getDeviceFingerprint").mockReturnValue("fingerprint");
		// Transparent encryption keeps the real loading, save, and HTTP paths active.
		jest.spyOn(cryptoLibrary, "encryptData").mockImplementation((text) => ({
			text,
			nonce: "nonce",
		}));
		jest.spyOn(cryptoLibrary, "decryptData").mockImplementation((text) => text);
		jest
			.spyOn(cryptoLibrary, "decryptSecretKey")
			.mockReturnValue("datastore-key");
		jest.spyOn(datastoreService, "fillStorage").mockResolvedValue(undefined);
		const linkResponse = new Promise<void>((resolve) => {
			releaseLinkResponse = resolve;
		});
		fetchMock.mockReset();
		globalThis.fetch = fetchMock;
		fetchMock.mockImplementation(async (url, request) => {
			const route = `${request?.method} ${new URL(String(url)).pathname}`;
			let result: unknown;
			if (route === "GET /datastore/ds/") {
				const entry = {
					id: "entry",
					...(kind === "share"
						? { share_id: "entry-share", share_secret_key: "entry-key" }
						: kind === "file"
							? { type: "file", file_id: "file", file_secret_key: "file-key" }
							: {
									type: "website_password",
									secret_id: "secret",
									secret_key: "secret-key",
								}),
				};
				result = {
					secret_key: "encrypted-key",
					secret_key_nonce: "nonce",
					write_date: "1",
					data_nonce: "nonce",
					data: JSON.stringify({
						items: [entry],
						folders: [
							{
								id: "target",
								share_id: "target-share",
								share_secret_key: "target-key",
							},
							{ id: "personal" },
						],
					}),
				};
			} else if (route === "GET /share/right/") {
				result = {
					share_rights: ["target-share", "entry-share"].map((share_id) => ({
						share_id,
						...rights,
					})),
				};
			} else if (
				route === "GET /share/target-share/" ||
				route === "GET /share/entry-share/"
			) {
				result = {
					data: JSON.stringify(
						route === "GET /share/entry-share/"
							? {
									type: "website_password",
									secret_id: "secret",
									secret_key: "secret-key",
								}
							: { folders: [{ id: "nested" }], items: [] },
					),
					data_nonce: "nonce",
					write_date: "1",
					rights,
				};
			} else if (route === "POST /datastore/" || route === "PUT /share/") {
				result = { write_date: "2" };
			} else if (route === `POST /${kind}/link/`) {
				await linkResponse;
				result = {};
			} else {
				throw new Error(`Unexpected request: ${route}`);
			}
			return {
				ok: true,
				status: 200,
				statusText: "OK",
				text: async () =>
					JSON.stringify({ text: JSON.stringify(result), nonce: "nonce" }),
			} as Response;
		});
		display = new CachedResource<Datastore>({
			kind: "datastore",
			scope: () => "test-account",
			canReadCache: () => true,
			read: async () => ({}),
			setCacheActive: () => {},
			onData: () => {},
		});
		// A populated view retains its snapshot while refreshing after a move.
		display.data = {};
	});

	afterEach(async () => {
		display.dispose();
		await display.refreshComplete;
		releaseLinkResponse();
		jest.clearAllTimers();
		jest.useRealTimers();
		jest.restoreAllMocks();
		globalThis.fetch = originalFetch;
	});

	it.each([
		"secret",
		"file",
		"share",
	] as const)("completes the %s-link HTTP request before the caller reloads cached data", async (entryKind) => {
		kind = entryKind;
		const load = jest.spyOn(datastorePasswordService, "getPasswordDatastore");
		const save = jest.spyOn(datastorePasswordService, "saveDatastoreContent");
		const reload = jest.fn(() => {
			void display.load();
		});
		// Shared entries exercise the early-return path: their container stays ds.
		const target = kind === "share" ? ["personal"] : ["target", "nested"];
		const moving = widgetService
			.moveItem({ datastore_id: "ds" }, ["entry"], target, "items", "password")!
			.then(reload);
		await load.mock.results[0].value;
		await save.mock.results[0].value;
		for (let i = 0; i < 5; i++) await Promise.resolve();
		expect(reload).not.toHaveBeenCalled();
		expect(offlineCache.isActive()).toBe(false);

		jest.advanceTimersByTime(50);
		const posts = fetchMock.mock.calls.filter(
			([url, request]) =>
				request?.method === "POST" && String(url).endsWith(`/${kind}/link/`),
		);
		expect(posts).toHaveLength(1);
		expect(JSON.parse(JSON.parse(posts[0][1]!.body as string).text)).toEqual({
			link_id: "entry",
			...(kind === "share"
				? { new_parent_datastore_id: "ds" }
				: { new_parent_share_id: "target-share" }),
		});
		expect(reload).not.toHaveBeenCalled();

		releaseLinkResponse();
		await moving;
		expect(reload).toHaveBeenCalledTimes(1);
		expect(cacheStatus.getSnapshot().usingCache).toBe(true);
		expect(offlineCache.isActive()).toBe(true);
	});
});
