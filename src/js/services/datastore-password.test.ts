import type {
	Datastore,
	DatastoreFolder,
	ShareRights,
} from "../../types/datastore";
import apiClient from "./api-client";
import datastoreService from "./datastore";
import datastorePasswordService from "./datastore-password";
import shareService from "./share";
import * as storeService from "./store";
import rootReducer from "../reducers";
import { loadWordlist } from "./passphrase";
import helper from "./helper";
import offlineCache from "./offline-cache";

describe("Service: datastorePasswordService - unavailable data", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("rejects before reading shares when the datastore request failed", async () => {
		jest.spyOn(datastoreService, "getDatastore").mockResolvedValue(undefined);
		const readRights = jest.spyOn(shareService, "readShareRightsOverview");

		await expect(
			datastorePasswordService.getPasswordDatastore("password-store"),
		).rejects.toEqual({
			errors: ["SERVER_OFFLINE"],
		});
		expect(readRights).not.toHaveBeenCalled();
	});

	it("rejects when share rights could not be loaded instead of returning incomplete data", async () => {
		jest.spyOn(datastoreService, "getDatastore").mockResolvedValue({});
		jest
			.spyOn(shareService, "readShareRightsOverview")
			.mockResolvedValue(undefined);

		await expect(
			datastorePasswordService.getPasswordDatastore("password-store"),
		).rejects.toEqual({
			errors: ["SERVER_OFFLINE"],
		});
	});

	it.each([
		["cache-only", "rejected"],
		["cache-only", "missing"],
		["refresh", "rejected"],
		["refresh", "missing"],
	] as const)("handles a %s display read with a %s nested share", async (mode, outcome) => {
		jest.spyOn(datastoreService, "getDatastoreForDisplay").mockResolvedValue({
			datastore_id: "ds",
			items: [
				{ id: "personal", name: "Personal password", secret_id: "secret" },
			],
			folders: [
				{
					id: "outer",
					share_id: "outer-share",
					share_secret_key: "outer-key",
				},
			],
		});
		jest.spyOn(shareService, "readShareRightsOverview").mockResolvedValue({
			share_rights: [
				{ share_id: "outer-share", read: true, write: true, grant: false },
			],
		});
		const failure =
			mode === "cache-only" ? new Error("missing cache") : { status: 403 };
		const read = jest
			.spyOn(shareService, "readShare")
			.mockImplementation(async (id) => {
				if (id === "outer-share")
					return {
						data: {
							items: [
								{
									id: "shared",
									name: "Shared password",
									secret_id: "shared-secret",
								},
							],
							folders: [
								{
									id: "nested",
									share_id: "nested-share",
									share_secret_key: "nested-key",
								},
							],
						},
						rights: { read: true, write: true, grant: false },
					};
				if (outcome === "missing") return undefined;
				throw failure;
			});
		const load = datastorePasswordService.getPasswordDatastoreForDisplay(
			"ds",
			mode,
		);
		if (mode === "cache-only") {
			await expect(load).rejects.toEqual(
				outcome === "missing" ? { errors: ["SERVER_OFFLINE"] } : failure,
			);
		} else {
			const loaded = await load;
			expect(loaded.items![0].secret_id).toBe("secret");
			expect(loaded.folders![0].items![0].secret_id).toBe("shared-secret");
			expect(loaded.folders![0].folders![0].share_id).toBe("nested-share");
			expect(loaded.folders![0].folders![0].items).toBeUndefined();
		}
		expect(read).toHaveBeenCalledWith("nested-share", "nested-key", mode);
	});

	it("still rejects live display reads when the main datastore fails", async () => {
		const failure = { status: 503 };
		jest
			.spyOn(datastoreService, "getDatastoreForDisplay")
			.mockRejectedValue(failure);
		jest
			.spyOn(shareService, "readShareRightsOverview")
			.mockResolvedValue({ share_rights: [] });
		const readShare = jest.spyOn(shareService, "readShare");
		await expect(
			datastorePasswordService.getPasswordDatastoreForDisplay("ds", "refresh"),
		).rejects.toBe(failure);
		expect(readShare).not.toHaveBeenCalled();
	});

	it("still rejects live display reads when sharing permissions fail", async () => {
		const failure = { status: 403 };
		jest
			.spyOn(datastoreService, "getDatastoreForDisplay")
			.mockResolvedValue({});
		jest
			.spyOn(shareService, "readShareRightsOverview")
			.mockRejectedValue(failure);
		const readShare = jest.spyOn(shareService, "readShare");
		await expect(
			datastorePasswordService.getPasswordDatastoreForDisplay("ds", "refresh"),
		).rejects.toBe(failure);
		expect(readShare).not.toHaveBeenCalled();
	});
});

describe("Service: datastorePasswordService test suite #1", () => {
	it("datastorePasswordService exists", () => {
		expect(datastorePasswordService).toBeDefined();
	});

	it("uses saved passphrase preferences for quick generation while explicit arguments still generate passwords", async () => {
		const state = rootReducer(undefined, { type: "@@INIT" });
		const configured: ReturnType<typeof rootReducer> = {
			...state,
			settingsDatastore: {
				...state.settingsDatastore,
				defaultPasswordGenerator: "passphrase",
				passphraseWordCount: 6,
				passphraseLanguage: "en",
			},
		};
		const getStore = jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => configured,
		} as ReturnType<typeof storeService.getStore>);
		try {
			const words = await loadWordlist("en");
			const parts = (await datastorePasswordService.generateDefault()).split(
				"-",
			);
			expect(parts).toHaveLength(6);
			for (const part of parts) {
				expect(words).toContain(part.replace(/[0-9]/g, "").toLowerCase());
			}
			expect(datastorePasswordService.generate(12, "", "a", "", "")).toBe(
				"a".repeat(12),
			);
		} finally {
			getStore.mockRestore();
		}
	});
	it("uses regular password settings when the default generator is a password", async () => {
		const state = rootReducer(undefined, { type: "@@INIT" });
		const getStore = jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => ({
				...state,
				settingsDatastore: {
					...state.settingsDatastore,
					passwordLength: 12,
					passwordLettersUppercase: "",
					passwordLettersLowercase: "a",
					passwordNumbers: "",
					passwordSpecialChars: "",
				},
			}),
		} as ReturnType<typeof storeService.getStore>);
		try {
			expect(await datastorePasswordService.generateDefault()).toBe(
				"a".repeat(12),
			);
		} finally {
			getStore.mockRestore();
		}
	});

	it.each<[number | string, number]>([
		[16, 16],
		["16", 16],
		["2.5", 3],
		["1e1", 10],
		["0x04", 4],
		["", 0],
	])("preserves numeric comparison for password length %p", (length, expectedLength) => {
		const expectedPassword = "a".repeat(expectedLength);

		expect(datastorePasswordService.generatePassword(length, "a")).toBe(
			expectedPassword,
		);
		expect(datastorePasswordService.generate(length, "", "a", "", "")).toBe(
			expectedPassword,
		);
	});

	it("preserves the short-length complexity bypass for numeric strings", () => {
		expect(datastorePasswordService.generate("3", "A", "a", "1", "!")).toBe("");
	});

	it("escapeRegExp: strength test lowercase success", () => {
		const password = "test";
		const characters = "abcdefghijklmnopqrstuvwxyz";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("escapeRegExp: strength test uppercase success", () => {
		const password = "TEST";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("escapeRegExp: strength test lowercase failure", () => {
		const password = "TEST";
		const characters = "abcdefghijklmnopqrstuvwxyz";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeFalsy();
	});

	it("escapeRegExp: strength test uppercase failure", () => {
		const password = "test";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeFalsy();
	});

	it("escapeRegExp: strength test special chars dash success", () => {
		const password = "test-";
		const characters = ",-.";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("escapeRegExp: strength test special chars dot success", () => {
		const password = "test.";
		const characters = ",-.";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("getFolderPath returns the parent folder names", () => {
		const datastore: Datastore = {
			folders: [
				{
					id: "work",
					name: "Work",
					folders: [{ id: "servers", name: "Servers", folders: [] }],
				},
			],
		};

		expect(
			datastorePasswordService.getFolderPath(
				["work", "servers", "entry"],
				datastore,
			),
		).toBe("/Work/Servers/");
		expect(
			datastorePasswordService.getFolderPath(["work", "servers"], datastore),
		).toBe("/Work/");
		expect(
			datastorePasswordService.getFolderPath(["top-level-entry"], datastore),
		).toBe("/");
	});

	it("abbreviateFolderPath replaces the middle of long paths", () => {
		expect(
			datastorePasswordService.abbreviateFolderPath(
				"/first/second/third/fourth/",
				20,
			),
		).toBe("/first/se.../fourth/");
		expect(datastorePasswordService.abbreviateFolderPath("/short/", 20)).toBe(
			"/short/",
		);
	});
});

describe("Service: datastorePasswordService share_index", () => {
	it("onShareAdded moves all nested share paths into the new share", () => {
		const datastore: Datastore = {
			datastore_id: "ds1",
			share_index: {
				childShare: {
					secret_key: "child-secret-key",
					paths: [
						["newShare", "child1"],
						["newShare", "child2"],
					],
				},
			},
			folders: [
				{
					id: "newShare",
					name: "New Share",
					share_id: "new-share-id",
					share_secret_key: "new-share-secret-key",
					folders: [
						{
							id: "child1",
							share_id: "child-share-id",
						},
						{
							id: "child2",
							share_id: "child-share-id",
						},
					],
				},
			],
		};

		const changedPaths = datastorePasswordService.onShareAdded(
			"new-share-id",
			["newShare"],
			datastore,
			1,
		);

		expect(datastore.share_index).toEqual({
			"new-share-id": {
				secret_key: "new-share-secret-key",
				paths: [["newShare"]],
			},
		});
		expect(datastore.folders![0].share_index).toEqual({
			childShare: {
				secret_key: "child-secret-key",
				paths: [["child2"], ["child1"]],
			},
		});
		expect(changedPaths).toEqual([[], ["newShare"]]);
	});

	it("deleteFromShareIndex removes all paths below the relative path", () => {
		const share = {
			share_index: {
				childShare: {
					secret_key: "child-secret-key",
					paths: [
						["folder", "child1"],
						["folder", "child2"],
						["other", "child3"],
					],
				},
			},
		};

		datastorePasswordService.deleteFromShareIndex(share, "childShare", [
			"folder",
		]);

		expect(share.share_index.childShare.paths).toEqual([["other", "child3"]]);
	});

	it("repairShareIndex rebuilds and canonicalizes embedded shares", () => {
		const datastore: Datastore = {
			folders: [
				{
					id: "parent",
					folders: [
						{
							id: "first",
							share_id: "share-1",
							share_secret_key: "key-1",
						},
					],
					items: [
						{
							id: "second",
							share_id: "share-2",
							share_secret_key: "key-2",
						},
					],
				},
			],
			share_index: {
				"share-1": {
					secret_key: "stale-key",
					paths: [["parent", "first"], ["parent", "first"], ["missing"]],
				},
				"wrong-share": {
					secret_key: "key-3",
					paths: [["parent", "first"]],
				},
			},
		};

		expect(datastorePasswordService.repairShareIndex(datastore)).toBe(true);
		expect(datastore.share_index).toEqual({
			"share-1": {
				secret_key: "key-1",
				paths: [["parent", "first"]],
			},
			"share-2": {
				secret_key: "key-2",
				paths: [["parent", "second"]],
			},
		});
		expect(datastorePasswordService.repairShareIndex(datastore)).toBe(false);
	});

	it("repairs nested share indexes during reads without writing", async () => {
		const datastore: Datastore = {
			datastore_id: "datastore-1",
			folders: [
				{
					id: "outer-link",
					share_id: "outer-share",
					share_secret_key: "outer-key",
				},
			],
			items: [],
		};
		const getDatastoreSpy = jest
			.spyOn(datastoreService, "getDatastore")
			.mockResolvedValue(datastore);
		const saveDatastoreSpy = jest
			.spyOn(datastoreService, "saveDatastoreContent")
			.mockResolvedValue(undefined);
		const fillStorageSpy = jest
			.spyOn(datastoreService, "fillStorage")
			.mockImplementation(() => undefined);
		const readRightsSpy = jest
			.spyOn(shareService, "readShareRightsOverview")
			.mockResolvedValue({
				share_rights: [
					{
						share_id: "outer-share",
						read: true,
						write: true,
						grant: true,
					},
				],
			});
		const readShareSpy = jest
			.spyOn(shareService, "readShare")
			.mockImplementation((shareId) => {
				if (shareId === "outer-share") {
					return Promise.resolve({
						data: {
							folders: [],
							items: [
								{
									id: "nested-link",
									share_id: "nested-share",
									share_secret_key: "nested-key",
								},
							],
						},
						rights: { read: true, write: true, grant: true },
					});
				}
				return Promise.resolve({
					data: { name: "Nested item", type: "note" },
					rights: { read: true, write: true, grant: true },
				});
			});
		const writeShareSpy = jest
			.spyOn(shareService, "writeShare")
			.mockResolvedValue({ data: {} });

		try {
			const result = (await datastorePasswordService.getPasswordDatastore())!;

			expect(result.share_index).toEqual({
				"outer-share": {
					secret_key: "outer-key",
					paths: [["outer-link"]],
				},
			});
			expect(result.folders![0].share_index).toEqual({
				"nested-share": {
					secret_key: "nested-key",
					paths: [["nested-link"]],
				},
			});
			expect(result.folders![0].items![0].name).toBe("Nested item");
			expect(readShareSpy).toHaveBeenCalledTimes(2);
			expect(saveDatastoreSpy).not.toHaveBeenCalled();
			expect(writeShareSpy).not.toHaveBeenCalled();
		} finally {
			getDatastoreSpy.mockRestore();
			saveDatastoreSpy.mockRestore();
			fillStorageSpy.mockRestore();
			readRightsSpy.mockRestore();
			readShareSpy.mockRestore();
			writeShareSpy.mockRestore();
		}
	});
});

describe("Service: datastorePasswordService - entry and folder locations", () => {
	let stored: Datastore;
	let shareContent: Datastore;
	let rights: ShareRights;

	beforeEach(() => {
		const state = rootReducer(undefined, { type: "@@INIT" });
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
		} as ReturnType<typeof storeService.getStore>);
		jest.spyOn(offlineCache, "isActive").mockReturnValue(false);
		rights = { read: true, write: true, grant: true };
		shareContent = {
			type: "note",
			name: "Example",
			secret_id: "secret",
			secret_key: "key",
		};
		stored = {
			datastore_id: "ds",
			write_date: "initial",
			folders: [
				{ id: "original", items: [{ id: "entry", ...shareContent }] },
				{ id: "target" },
				{ id: "other" },
			],
		};
		jest
			.spyOn(datastoreService, "getDatastore")
			.mockImplementation(async () => helper.duplicateObject(stored));
		jest
			.spyOn(datastoreService, "fillStorage")
			.mockImplementation(() => undefined);
		jest
			.spyOn(shareService, "readShareRightsOverview")
			.mockImplementation(async () => ({
				share_rights: [{ share_id: "share", ...rights }],
			}));
		jest.spyOn(shareService, "readShare").mockImplementation(async () => ({
			data: helper.duplicateObject(shareContent),
			rights: { ...rights },
		}));
		jest
			.spyOn(shareService, "createShare")
			.mockImplementation(async (content) => {
				shareContent = helper.duplicateObject(content);
				datastoreService.normalizeShareContent(shareContent);
				delete shareContent.id;
				return { share_id: "share", secret_key: "share-key" };
			});
		jest.spyOn(apiClient, "createShareLink").mockResolvedValue({ data: {} });
		jest
			.spyOn(datastoreService, "saveDatastoreContent")
			.mockImplementation(async (_type, _description, content) => {
				if (!content || Array.isArray(content))
					throw new Error("Expected a datastore");
				stored = helper.duplicateObject(content);
				datastoreService.hideSubShareContent(stored);
				stored.write_date = "updated";
				return { write_date: stored.write_date };
			});
	});

	afterEach(() => jest.restoreAllMocks());

	function makeShared() {
		Object.assign(stored.folders![0].items![0], {
			share_id: "share",
			share_secret_key: "share-key",
		});
		stored.share_index = {
			share: { secret_key: "share-key", paths: [["original", "entry"]] },
		};
	}

	it("persists multiple locations in the same datastore and reads current content through every link", async () => {
		makeShared();
		await datastorePasswordService.linkEntry(["original", "entry"], ["target"]);
		await datastorePasswordService.linkEntry(["original", "entry"], ["other"]);
		expect(shareService.createShare).not.toHaveBeenCalled();
		expect(stored.share_index!.share.paths).toHaveLength(3);
		const locationIds = stored.folders!.map((folder) => folder.items![0].id);
		expect(new Set(locationIds).size).toBe(3);
		expect(locationIds[0]).toBe("entry");
		// Persisted locations contain no copy of the secret or its key.
		for (const folder of stored.folders!) {
			expect(folder.items![0].secret_id).toBeUndefined();
			expect(folder.items![0].secret_key).toBeUndefined();
		}
		shareContent.name = "Updated through another location";
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		for (const folder of loaded.folders!) {
			expect(folder.items![0].name).toBe(shareContent.name);
			expect(folder.items![0].secret_id).toBe("secret");
		}
		// Unlinking one location leaves the other index paths intact.
		datastorePasswordService.onShareDeleted(
			"share",
			["target", locationIds[1]],
			loaded,
			1,
		);
		expect(loaded.share_index!.share.paths).toEqual([
			["original", "entry"],
			["other", locationIds[2]],
		]);
	});

	it.each([
		"note",
		"file",
	])("converts an unshared %s once and retains its original location and content", async (type) => {
		const item = stored.folders![0].items![0];
		item.type = type;
		if (type === "file") {
			delete item.secret_id;
			delete item.secret_key;
			item.file_id = "file";
			item.file_secret_key = "file-key";
		}
		await datastorePasswordService.linkEntry(["original", "entry"], ["target"]);
		expect(shareService.createShare).toHaveBeenCalledTimes(1);
		expect(stored.folders![0].items![0].id).toBe("entry");
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		const original = loaded.folders![0].items![0];
		const linked = loaded.folders![1].items![0];
		expect(linked.share_id).toBe(original.share_id);
		expect(linked.secret_id || linked.file_id).toBe(
			type === "file" ? "file" : "secret",
		);
		expect(stored.share_index!.share.paths).toHaveLength(2);
	});

	it("allows a read-only share in a personal folder, but requires grant permission for shared destinations", async () => {
		makeShared();
		rights = { read: true, write: false, grant: false };
		await datastorePasswordService.linkEntry(["original", "entry"], ["target"]);
		const item = (await datastorePasswordService.getPasswordDatastore())!
			.folders![0].items![0];
		expect(
			datastorePasswordService.canLinkEntryToFolder(item, {
				id: "shared-folder",
				share_id: "parent",
				share_rights: { read: true, write: true, grant: true },
			}),
		).toBe(false);
		expect(
			datastorePasswordService.canLinkEntryToFolder(item, {
				id: "nested-folder",
				parent_share_id: "parent",
				share_rights: { read: true, write: true, grant: true },
			}),
		).toBe(false);
	});

	it.each([
		true,
		false,
	])("allows repeated entries in the original folder (already shared: %s)", async (alreadyShared) => {
		if (alreadyShared) makeShared();
		await datastorePasswordService.linkEntry(
			["original", "entry"],
			["original"],
		);
		await datastorePasswordService.linkEntry(
			["original", "entry"],
			["original"],
		);
		const entries = stored.folders![0].items!;
		expect(entries).toHaveLength(3);
		expect(new Set(entries.map((entry) => entry.id)).size).toBe(3);
		expect(entries.map((entry) => entry.share_id)).toEqual([
			"share",
			"share",
			"share",
		]);
		expect(stored.share_index!.share.paths).toEqual(
			entries.map((entry) => ["original", entry.id]),
		);
		expect(apiClient.createShareLink).toHaveBeenCalledTimes(2);
		expect(shareService.createShare).toHaveBeenCalledTimes(
			alreadyShared ? 0 : 1,
		);
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		expect(loaded.folders![0].items!.map((entry) => entry.secret_id)).toEqual([
			"secret",
			"secret",
			"secret",
		]);
	});

	it("rejects read-only destination folders", () => {
		makeShared();
		stored.folders![0].items![0].share_rights = rights;
		stored.folders![1].share_rights = {
			read: true,
			write: false,
			grant: false,
		};
		expect(
			datastorePasswordService.canLinkEntryToFolder(
				stored.folders![0].items![0],
				stored.folders![1],
			),
		).toBe(false);
		expect(apiClient.createShareLink).not.toHaveBeenCalled();
		expect(datastoreService.saveDatastoreContent).not.toHaveBeenCalled();
	});

	it("leaves the original conversion usable and retryable if creating the additional link fails", async () => {
		jest
			.mocked(apiClient.createShareLink)
			.mockRejectedValueOnce(new Error("Server unavailable"));
		await expect(
			datastorePasswordService.linkEntry(["original", "entry"], ["target"]),
		).rejects.toThrow("Server unavailable");
		expect(stored.share_index!.share.paths).toEqual([["original", "entry"]]);
		expect(stored.folders![1].items).toBeUndefined();
		await datastorePasswordService.linkEntry(["original", "entry"], ["target"]);
		expect(shareService.createShare).toHaveBeenCalledTimes(1);
		expect(stored.share_index!.share.paths).toHaveLength(2);
	});

	it("does not persist a phantom location if the link API rejects an existing share", async () => {
		makeShared();
		jest
			.mocked(apiClient.createShareLink)
			.mockRejectedValueOnce(new Error("Forbidden"));
		await expect(
			datastorePasswordService.linkEntry(["original", "entry"], ["target"]),
		).rejects.toThrow("Forbidden");
		expect(datastoreService.saveDatastoreContent).not.toHaveBeenCalled();
	});

	it("links into a writable shared folder using that share as the backend parent", async () => {
		makeShared();
		stored.folders![1] = {
			id: "target",
			share_id: "parent",
			share_secret_key: "parent-key",
		};
		let parentContent: Datastore = { name: "Shared folder", items: [] };
		jest.mocked(shareService.readShare).mockImplementation(async (id) => ({
			data: helper.duplicateObject(
				id === "parent" ? parentContent : shareContent,
			),
			rights: { ...rights },
		}));
		jest.mocked(shareService.readShareRightsOverview).mockResolvedValue({
			share_rights: [
				{ share_id: "share", ...rights },
				{ share_id: "parent", ...rights },
			],
		});
		jest
			.spyOn(shareService, "writeShare")
			.mockImplementation(async (id, content) => {
				expect(id).toBe("parent");
				parentContent = helper.duplicateObject(content);
				datastoreService.hideSubShareContent(parentContent);
				return { data: {} };
			});
		await datastorePasswordService.linkEntry(["original", "entry"], ["target"]);
		expect(
			jest.mocked(apiClient.createShareLink).mock.calls[0].slice(3),
		).toEqual(["share", "parent", undefined]);
		expect(parentContent.share_index!.share.paths).toHaveLength(1);
		expect(stored.share_index!.share.paths).toEqual([["original", "entry"]]);
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		expect(loaded.folders![1].items![0].secret_id).toBe("secret");
	});

	it("rejects offline writes and unshared entries that cannot be shared", async () => {
		jest.mocked(offlineCache.isActive).mockReturnValue(true);
		await expect(
			datastorePasswordService.linkEntry(["original", "entry"], ["target"]),
		).rejects.toThrow("OFFLINE");
		expect(datastoreService.getDatastore).not.toHaveBeenCalled();
		expect(
			datastorePasswordService.canLinkEntry({
				id: "entry",
				type: "note",
				share_rights: { read: true, write: true, grant: false },
			}),
		).toBe(false);
		expect(
			datastorePasswordService.canLinkEntry({
				id: "entry",
				type: "note",
				share_id: "share",
				share_secret_key: "share-key",
				share_rights: { read: false, write: true, grant: true },
			}),
		).toBe(false);
	});

	it("reloads a personal link whose read access is inherited from the original shared folder", async () => {
		const parentContent: Datastore = {
			name: "Shared folder",
			items: [
				{ id: "entry", share_id: "share", share_secret_key: "share-key" },
			],
			share_index: {
				share: { secret_key: "share-key", paths: [["entry"]] },
			},
		};
		stored.folders![0] = {
			id: "original",
			share_id: "parent",
			share_secret_key: "parent-key",
		};
		jest.mocked(shareService.readShareRightsOverview).mockResolvedValue({
			share_rights: [
				{ share_id: "parent", read: true, write: false, grant: false },
			],
		});
		jest.mocked(shareService.readShare).mockImplementation(async (id) => ({
			data: helper.duplicateObject(
				id === "parent" ? parentContent : shareContent,
			),
			rights: { read: true, write: false, grant: false },
		}));
		await datastorePasswordService.linkEntry(["original", "entry"], ["target"]);
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		expect(loaded.folders![1].items![0].secret_id).toBe("secret");
		expect(loaded.folders![1].items![0].share_rights!.write).toBe(false);
		expect(loaded.folders![0].items![0].share_rights!.delete).toBe(false);
		expect(loaded.folders![1].items![0].share_rights!.delete).toBe(true);
		jest
			.spyOn(datastoreService, "getDatastoreForDisplay")
			.mockImplementation(async () => helper.duplicateObject(stored));
		const cached =
			await datastorePasswordService.getPasswordDatastoreForDisplay(
				"ds",
				"cache-only",
			);
		expect(cached.folders![1].items![0].secret_id).toBe("secret");
		// With the inherited permission gone, neither location may be loaded.
		jest.mocked(shareService.readShareRightsOverview).mockResolvedValue({
			share_rights: [],
		});
		jest.mocked(shareService.readShare).mockClear();
		const revoked = (await datastorePasswordService.getPasswordDatastore())!;
		expect(revoked.folders![1].items![0].secret_id).toBeUndefined();
		expect(shareService.readShare).not.toHaveBeenCalled();
	});

	it("converts an ordinary folder and reloads its contents at independent paths", async () => {
		stored.folders![0].name = "Folder";
		stored.folders![0].folders = [
			{
				id: "child",
				name: "Child",
				items: [{ id: "file", type: "file", file_id: "file-id" }],
			},
		];
		await datastorePasswordService.linkEntry(["original"], ["target"]);
		expect(shareService.createShare).toHaveBeenCalledTimes(1);
		await datastorePasswordService.linkEntry(["original"], ["target"]);
		expect(apiClient.createShareLink).toHaveBeenCalledTimes(2);
		const aliasId = stored.folders![1].folders![0].id;
		const secondAliasId = stored.folders![1].folders![1].id;
		expect(new Set(["original", aliasId, secondAliasId]).size).toBe(3);
		expect(aliasId).not.toBe("original");
		expect(stored.folders![1].items).toBeUndefined();
		expect(stored.share_index!.share.paths).toEqual([
			["original"],
			["target", aliasId],
			["target", secondAliasId],
		]);
		shareContent.items!.push({
			id: "new",
			type: "note",
			name: "New content",
			secret_id: "new-secret",
		});
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		const original = loaded.folders![0];
		const alias = loaded.folders![1].folders![0];
		expect(alias.items!.map((item) => item.id)).toEqual(["entry", "new"]);
		expect(original.items!.map((item) => item.id)).toEqual(["entry", "new"]);
		expect(alias.folders![0]).not.toBe(original.folders![0]);
		expect(original.folders![0].path).toEqual(["original", "child"]);
		expect(alias.folders![0].path).toEqual(["target", aliasId, "child"]);
		expect(loaded.folders![1].folders![1].folders![0].path).toEqual([
			"target",
			secondAliasId,
			"child",
		]);
		expect(alias.folders![0].items![0].file_id).toBe("file-id");
	});

	it("loads nested shares through a cached folder alias inside another share", async () => {
		shareContent = {
			name: "Source folder",
			folders: [
				{
					id: "nested",
					share_id: "nested-share",
					share_secret_key: "nested-key",
				},
			],
			share_index: {
				"nested-share": { secret_key: "nested-key", paths: [["nested"]] },
			},
		};
		stored.folders![0] = {
			id: "original",
			share_id: "share",
			share_secret_key: "share-key",
		};
		stored.folders![1] = {
			id: "target",
			share_id: "parent",
			share_secret_key: "parent-key",
		};
		let parentContent: Datastore = { name: "Destination", folders: [] };
		jest.mocked(shareService.readShareRightsOverview).mockResolvedValue({
			share_rights: [
				{ share_id: "share", ...rights },
				{ share_id: "parent", ...rights },
			],
		});
		jest.mocked(shareService.readShare).mockImplementation(async (id) => {
			if (id === "parent") await Promise.resolve();
			let data = shareContent;
			if (id === "parent") data = parentContent;
			else if (id !== "share") {
				data = {
					name: "Nested folder",
					items: [
						{ id: "nested-note", type: "note", secret_id: "nested-secret" },
					],
				};
			}
			return { data: helper.duplicateObject(data), rights: { ...rights } };
		});
		jest
			.spyOn(shareService, "writeShare")
			.mockImplementation(async (id, data) => {
				expect(id).toBe("parent");
				parentContent = helper.duplicateObject(data);
				datastoreService.hideSubShareContent(parentContent);
				return { data: {} };
			});
		await datastorePasswordService.linkEntry(["original"], ["target"]);
		jest.mocked(shareService.readShare).mockClear();
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		const originalChild = loaded.folders![0].folders![0];
		const alias = loaded.folders![1].folders![0];
		expect(alias.folders![0].items![0].secret_id).toBe("nested-secret");
		expect(originalChild.items![0].secret_id).toBe("nested-secret");
		expect(alias.folders![0]).not.toBe(originalChild);
		expect(alias.folders![0].path).toEqual(["target", alias.id, "nested"]);
		expect(
			jest
				.mocked(shareService.readShare)
				.mock.calls.filter(([id]) => id === "share"),
		).toHaveLength(1);
	});

	it("rejects self, descendants, and descendant aliases before converting a folder", async () => {
		stored.folders![0].folders = [{ id: "child", name: "Child" }];
		await expect(
			datastorePasswordService.linkEntry(["original"], ["original"]),
		).rejects.toThrow();
		await expect(
			datastorePasswordService.linkEntry(["original"], ["original", "child"]),
		).rejects.toThrow();
		expect(shareService.createShare).not.toHaveBeenCalled();
		expect(apiClient.createShareLink).not.toHaveBeenCalled();
		const folder: Datastore = {
			id: "source",
			share_id: "source-share",
			share_secret_key: "source-key",
			share_rights: rights,
			folders: [
				{
					id: "child",
					share_id: "child-share",
					share_secret_key: "child-key",
					share_rights: rights,
				},
			],
		};
		for (const target of [
			{ id: "source-alias", share_id: "source-share" },
			{ id: "inside-source-alias", parent_share_id: "source-share" },
			{ id: "child-alias", share_id: "child-share" },
			{ id: "inside-child-alias", parent_share_id: "child-share" },
		]) {
			expect(
				datastorePasswordService.canLinkEntryToFolder(folder, {
					...target,
					share_rights: rights,
				}),
			).toBe(false);
		}
	});

	it("reloads an inherited-only folder alias and its nested shares in a personal location", async () => {
		const parentContent: Datastore = {
			folders: [
				{ id: "source", share_id: "share", share_secret_key: "share-key" },
			],
			share_index: { share: { secret_key: "share-key", paths: [["source"]] } },
		};
		shareContent = {
			name: "Inherited folder",
			folders: [
				{ id: "child", share_id: "child-share", share_secret_key: "child-key" },
			],
			share_index: {
				"child-share": { secret_key: "child-key", paths: [["child"]] },
			},
		};
		stored.folders![0] = {
			id: "original",
			share_id: "parent",
			share_secret_key: "parent-key",
		};
		jest.mocked(shareService.readShareRightsOverview).mockResolvedValue({
			share_rights: [
				{ share_id: "parent", read: true, write: false, grant: false },
			],
		});
		jest.mocked(shareService.readShare).mockImplementation(async (id) => {
			let data = shareContent;
			if (id === "parent") data = parentContent;
			else if (id !== "share") {
				data = {
					items: [{ id: "note", type: "note", secret_id: "nested-secret" }],
				};
			}
			return {
				data: helper.duplicateObject(data),
				rights: { read: true, write: false, grant: false },
			};
		});
		await datastorePasswordService.linkEntry(
			["original", "source"],
			["target"],
		);
		const loaded = (await datastorePasswordService.getPasswordDatastore())!;
		const alias = loaded.folders![1].folders![0];
		expect(alias.folders![0].items![0].secret_id).toBe("nested-secret");
		expect(alias.folders![0].path).toEqual(["target", alias.id, "child"]);
		expect(loaded.folders![0].folders![0].share_rights!.delete).toBe(false);
		expect(alias.share_rights!.delete).toBe(true);
		expect(shareService.createShare).not.toHaveBeenCalled();
		jest
			.spyOn(datastoreService, "getDatastoreForDisplay")
			.mockImplementation(async () => helper.duplicateObject(stored));
		const cached =
			await datastorePasswordService.getPasswordDatastoreForDisplay(
				"ds",
				"cache-only",
			);
		expect(cached.folders![1].folders![0].folders![0].items![0].secret_id).toBe(
			"nested-secret",
		);
	});

	it("requires permission to reparent nested shares when converting an ordinary folder", () => {
		expect(
			datastorePasswordService.canLinkEntry({
				id: "empty",
				share_rights: rights,
			}),
		).toBe(true);
		const child: DatastoreFolder = {
			id: "child",
			share_id: "child-share",
			share_secret_key: "child-key",
			share_rights: { read: true, write: false, grant: false },
		};
		const folder: Datastore = {
			id: "source",
			share_rights: rights,
			folders: [child],
		};
		expect(datastorePasswordService.canLinkEntry(folder)).toBe(false);
		child.share_rights!.grant = true;
		expect(datastorePasswordService.canLinkEntry(folder)).toBe(true);
		child.share_rights = undefined;
		expect(datastorePasswordService.canLinkEntry(folder)).toBe(false);
	});

	it("allows read-only shared folders in personal locations and rejects missing destination rights", () => {
		const folder: Datastore = {
			id: "source",
			share_id: "source-share",
			share_secret_key: "key",
			share_rights: { read: true, write: false, grant: false },
		};
		expect(
			datastorePasswordService.canLinkEntryToFolder(folder, { id: "personal" }),
		).toBe(true);
		expect(
			datastorePasswordService.canLinkEntryToFolder(folder, {
				id: "shared",
				share_id: "parent",
				share_rights: rights,
			}),
		).toBe(false);
		folder.share_rights = rights;
		expect(
			datastorePasswordService.canLinkEntryToFolder(folder, {
				id: "nested",
				parent_share_id: "parent",
			}),
		).toBe(false);
		expect(
			datastorePasswordService.canLinkEntryToFolder(folder, {
				id: "duplicate",
				folders: [{ ...folder, id: "alias" }],
			}),
		).toBe(true);
	});
});
