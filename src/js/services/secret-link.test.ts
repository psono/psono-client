import type {
	Datastore,
	DatastoreItem,
	ShareContent,
} from "../../types/datastore";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import datastoreService from "./datastore";
import linkCleanup, { LinkCleanupError } from "./secret-link";
import offlineCache, { type CacheMetadata } from "./offline-cache";
import shareService from "./share";
import vaultLock from "./vault-lock";

let mockState = {
	user: { token: "token", sessionSecretKey: "session" },
	server: { url: "https://server.test" },
};
jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		readDatastore: jest.fn(),
		readShare: jest.fn(),
		readShares: jest.fn(),
		readShareRightsOverview: jest.fn(),
		readCacheMetadata: jest.fn(),
		moveSecretLink: jest.fn(),
		deleteSecretLink: jest.fn(),
	},
}));
jest.mock("./datastore", () => ({
	__esModule: true,
	default: { getDatastoreWithId: jest.fn() },
}));
jest.mock("./share", () => ({
	__esModule: true,
	default: { readShare: jest.fn() },
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: { decryptSecretKey: jest.fn() },
}));
jest.mock("./offline-cache", () => ({
	__esModule: true,
	default: { isActive: jest.fn() },
}));
jest.mock("./vault-lock", () => ({
	__esModule: true,
	default: { getRevision: jest.fn(), isBlocked: jest.fn() },
}));

const date = "2026-11-23T10:00:00Z";
const metadata = (
	secrets: CacheMetadata[] = [],
	shares: string[] = [],
): CacheMetadata => ({
	write_date: date,
	secrets,
	shares: shares.map((id) => ({ id })),
});
const link = (linkId: string, secretId = linkId): CacheMetadata => ({
	id: secretId,
	link_id: linkId,
});
const item = (id: string, secretId = id): DatastoreItem => ({
	id,
	secret_id: secretId,
});
const tree = (items: Datastore[] = []): Datastore => ({
	write_date: date,
	items: items as Datastore["items"],
});
const rights = { read: true, write: true, grant: true };
let datastores: {
	id: string;
	type: string;
	description: string;
	is_default: boolean;
}[];
let trees: Map<string, Datastore>;
let shares: Map<string, ShareContent>;
let metadatas: Map<string, CacheMetadata>;

function addShare(id: string, data = tree(), write = true) {
	shares.set(id, { data, rights: { ...rights, write } });
	metadatas.set(`share:${id}`, metadata());
	return {
		id: `placeholder-${id}`,
		share_id: id,
		share_secret_key: `key-${id}`,
	};
}

beforeEach(() => {
	jest.resetAllMocks();
	mockState = {
		user: { token: "token", sessionSecretKey: "session" },
		server: { url: "https://server.test" },
	};
	datastores = [
		{ id: "d1", type: "password", description: "", is_default: true },
	];
	trees = new Map([["d1", tree()]]);
	shares = new Map();
	metadatas = new Map([["datastore:d1", metadata()]]);
	jest.mocked(vaultLock.getRevision).mockReturnValue(1);
	jest.mocked(vaultLock.isBlocked).mockReturnValue(false);
	jest.mocked(offlineCache.isActive).mockReturnValue(false);
	jest.mocked(apiClient.readDatastore).mockImplementation(async () => ({
		data: { datastores: [...datastores] },
	}));
	jest.mocked(apiClient.readShares).mockResolvedValue({ data: { shares: [] } });
	jest
		.mocked(apiClient.readShareRightsOverview)
		.mockResolvedValue({ data: { share_rights: [] } });
	jest
		.mocked(datastoreService.getDatastoreWithId)
		.mockImplementation(async (id) => trees.get(id));
	jest
		.mocked(shareService.readShare)
		.mockImplementation(async (id) => shares.get(id));
	jest
		.mocked(apiClient.readCacheMetadata)
		.mockImplementation(async (kind, _token, _key, id) => {
			const data = metadatas.get(`${kind}:${id}`);
			if (!data) throw new Error("missing metadata");
			return { data };
		});
	jest.mocked(apiClient.moveSecretLink).mockResolvedValue({ data: {} });
	jest.mocked(apiClient.deleteSecretLink).mockResolvedValue({ data: {} });
});

function expectNoRepairs() {
	expect(apiClient.moveSecretLink).not.toHaveBeenCalled();
	expect(apiClient.deleteSecretLink).not.toHaveBeenCalled();
}

it("scans every datastore and nested share, preserves trash, and repairs by link ID", async () => {
	datastores.push({
		id: "d2",
		type: "password",
		description: "",
		is_default: false,
	});
	const nested = addShare(
		"s2",
		tree([item("from-datastore"), item("same-secret-kept", "shared-secret")]),
	);
	const shared = addShare("s1", {
		...tree([item("from-share"), nested]),
		folders: [{ id: "trash", deleted: true, items: [item("trash-entry")] }],
	});
	trees.set("d1", tree([item("kept"), item("to-datastore"), shared, shared]));
	trees.set("d2", tree([item("other-datastore")]));
	metadatas.set(
		"datastore:d1",
		metadata(
			[
				link("kept"),
				link("from-datastore"),
				link("stale"),
				link("same-secret-stale", "shared-secret"),
			],
			["s1"],
		),
	);
	metadatas.set(
		"datastore:d2",
		metadata([link("other-datastore"), link("from-share")]),
	);
	metadatas.set(
		"share:s1",
		metadata([link("trash-entry"), link("to-datastore")], ["s2"]),
	);
	metadatas.set(
		"share:s2",
		metadata([link("same-secret-kept", "shared-secret")]),
	);
	const progress = jest.fn();
	expect(await linkCleanup.cleanup(progress)).toEqual({
		moved: 3,
		deleted: 2,
		skipped: 0,
	});
	expect(apiClient.moveSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"from-datastore",
		"s2",
		undefined,
	);
	expect(apiClient.moveSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"from-share",
		"s1",
		undefined,
	);
	expect(apiClient.moveSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"to-datastore",
		undefined,
		"d1",
	);
	expect(apiClient.deleteSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"stale",
	);
	expect(apiClient.deleteSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"same-secret-stale",
	);
	expect(shareService.readShare).toHaveBeenCalledTimes(2);
	expect(datastoreService.getDatastoreWithId).toHaveBeenCalledWith(
		"d2",
		"refresh",
	);
	expect(apiClient.readDatastore).toHaveBeenCalledWith(
		"token",
		"session",
		undefined,
		"refresh",
	);
	expect(progress).toHaveBeenLastCalledWith({
		phase: "repair",
		completed: 5,
		total: 5,
		moved: 3,
		deleted: 2,
		skipped: 0,
	});
});

it("reads shares discovered only through the share index and handles cycles", async () => {
	addShare("s1", {
		...tree(),
		share_index: { s1: { secret_key: "key-s1", paths: [[]] } },
	});
	trees.set("d1", {
		...tree(),
		share_index: { s1: { secret_key: "key-s1", paths: [[]] } },
	});
	await linkCleanup.cleanup();
	expect(shareService.readShare).toHaveBeenCalledTimes(1);
	expectNoRepairs();
});

it("skips inaccessible shares and continues moves and deletions in accessible containers", async () => {
	const inaccessible = addShare("denied");
	const readable = addShare("readable", tree([item("misplaced")]));
	trees.set("d1", tree([inaccessible, readable]));
	metadatas.set(
		"datastore:d1",
		metadata([link("misplaced"), link("potentially-stale")]),
	);
	jest.mocked(shareService.readShare).mockImplementation(async (id) => {
		if (id === "denied")
			throw { data: { non_field_errors: ["NO_PERMISSION_OR_NOT_EXIST"] } };
		return shares.get(id);
	});
	expect(await linkCleanup.cleanup()).toEqual({
		moved: 1,
		deleted: 1,
		skipped: 0,
		unavailableShares: ["denied"],
	});
	expect(apiClient.moveSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"misplaced",
		"readable",
		undefined,
	);
	expect(apiClient.deleteSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"potentially-stale",
	);
	expect(shareService.readShare).toHaveBeenCalledTimes(2);
});

it("does not retry a share that returned HTTP 400", async () => {
	trees.set("d1", tree([addShare("denied")]));
	jest
		.mocked(shareService.readShare)
		.mockRejectedValueOnce({ status: 400 })
		.mockResolvedValueOnce(shares.get("denied"));
	await expect(linkCleanup.cleanup()).resolves.toMatchObject({
		unavailableShares: ["denied"],
	});
	expect(shareService.readShare).toHaveBeenCalledTimes(1);
	expectNoRepairs();
});

it.each([
	"share",
	"metadata",
])("skips HTTP 400 from the %s read and cleans the remaining datastore", async (stage) => {
	trees.set("d1", tree([addShare("denied")]));
	metadatas.set("datastore:d1", metadata([link("stale")]));
	if (stage === "share")
		jest.mocked(shareService.readShare).mockRejectedValue({ status: 400 });
	else
		jest
			.mocked(apiClient.readCacheMetadata)
			.mockImplementation(async (kind, _token, _key, id) => {
				if (kind === "share") throw { status: 400 };
				return { data: metadatas.get(`${kind}:${id}`)! };
			});
	await expect(linkCleanup.cleanup()).resolves.toEqual({
		moved: 0,
		deleted: 1,
		skipped: 0,
		unavailableShares: ["denied"],
	});
});

it.each([
	{ status: 500 },
	{ status: 401 },
	new Error("cannot decrypt"),
])("does not skip non-400 share failures and identifies the failing request: %p", async (error) => {
	trees.set("d1", tree([addShare("failing-share")]));
	jest.mocked(shareService.readShare).mockRejectedValue(error);
	await expect(linkCleanup.cleanup()).rejects.toMatchObject({
		details: expect.stringContaining("GET /share/failing-share/"),
	});
	expectNoRepairs();
});

it("skips a share that loses access during revalidation and still cleans other containers", async () => {
	trees.set("d1", tree([addShare("denied", tree([item("misplaced")]))]));
	metadatas.set("datastore:d1", metadata([link("misplaced"), link("stale")]));
	metadatas.set("share:denied", metadata([link("stale-in-share")]));
	let shareReads = 0;
	jest
		.mocked(apiClient.readCacheMetadata)
		.mockImplementation(async (kind, _token, _key, id) => {
			if (kind === "share" && ++shareReads === 2) throw { status: 400 };
			return { data: metadatas.get(`${kind}:${id}`)! };
		});
	await expect(linkCleanup.cleanup()).resolves.toEqual({
		moved: 0,
		deleted: 1,
		skipped: 2,
		unavailableShares: ["denied"],
	});
	expect(apiClient.moveSecretLink).not.toHaveBeenCalled();
	expect(apiClient.deleteSecretLink).toHaveBeenCalledTimes(1);
	expect(apiClient.deleteSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"stale",
	);
});

it.each([
	"metadata",
	"index",
])("silently skips keyless inaccessible shares discovered through %s after other shares were rejected", async (origin) => {
	const denied = addShare("denied");
	trees.set("d1", {
		...tree([denied]),
		...(origin === "index"
			? { share_index: { keyless: { secret_key: "", paths: [] } } }
			: {}),
	});
	metadatas.set(
		"datastore:d1",
		metadata(
			[link("stale")],
			origin === "metadata" ? ["denied", "keyless"] : ["denied"],
		),
	);
	jest.mocked(shareService.readShare).mockRejectedValue({ status: 400 });
	jest
		.mocked(apiClient.readCacheMetadata)
		.mockImplementation(async (kind, _token, _key, id) => {
			if (kind === "share") throw { status: 400 };
			return { data: metadatas.get(`${kind}:${id}`)! };
		});
	await expect(linkCleanup.cleanup()).resolves.toEqual({
		moved: 0,
		deleted: 1,
		skipped: 0,
		unavailableShares: ["denied", "keyless"],
	});
	expect(apiClient.readCacheMetadata).toHaveBeenCalledWith(
		"share",
		"token",
		"session",
		"keyless",
	);
	expect(shareService.readShare).toHaveBeenCalledTimes(1);
});

it.each([
	"metadata",
	"index",
	"rights",
])("silently skips a keyless share from %s when metadata succeeds but the share returns HTTP 400", async (origin) => {
	metadatas.set(
		"datastore:d1",
		metadata([link("stale")], origin === "metadata" ? ["denied"] : []),
	);
	if (origin === "index")
		trees.set("d1", {
			...tree(),
			share_index: { denied: { secret_key: "", paths: [] } },
		});
	if (origin === "rights")
		jest.mocked(apiClient.readShareRightsOverview).mockResolvedValue({
			data: { share_rights: [{ share_id: "denied", ...rights }] },
		});
	metadatas.set("share:denied", metadata());
	jest.mocked(apiClient.readShare).mockRejectedValue({ status: 400 });
	await expect(linkCleanup.cleanup()).resolves.toEqual({
		moved: 0,
		deleted: 1,
		skipped: 0,
		unavailableShares: ["denied"],
	});
	expect(apiClient.readShare).toHaveBeenCalledWith(
		"token",
		"session",
		"denied",
		"refresh",
	);
	expect(shareService.readShare).not.toHaveBeenCalled();
	expect(apiClient.deleteSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"stale",
	);
});

it("does not discard a readable share whose key is missing", async () => {
	metadatas.set(
		"datastore:d1",
		metadata([link("stale")], ["readable-keyless"]),
	);
	metadatas.set("share:readable-keyless", metadata());
	jest.mocked(apiClient.readShare).mockResolvedValue({
		data: { data: "encrypted", data_nonce: "nonce", rights, write_date: date },
	});
	await expect(linkCleanup.cleanup()).rejects.toThrow(
		"LINK_CLEANUP_INCOMPLETE",
	);
	expectNoRepairs();
});

it("reports a failed keyless share access check instead of treating a server failure as lost permission", async () => {
	metadatas.set("datastore:d1", metadata([link("stale")], ["keyless"]));
	metadatas.set("share:keyless", metadata());
	jest.mocked(apiClient.readShare).mockRejectedValue({ status: 500 });
	await expect(linkCleanup.cleanup()).rejects.toMatchObject({
		details: "GET /share/keyless/",
	});
	expectNoRepairs();
});

it("reads accepted shares even when their datastore placeholder is missing", async () => {
	addShare("s1", tree([item("kept")]));
	metadatas.set("share:s1", metadata([link("kept"), link("stale")]));
	jest.mocked(apiClient.readShares).mockResolvedValue({
		data: {
			shares: [
				{
					id: "s1",
					share_id: "s1",
					share_right_id: "right",
					share_right_key: "encrypted",
					share_right_key_nonce: "nonce",
					share_right_title: "",
					share_right_title_nonce: "",
					share_right_accepted: true,
					share_right_read: true,
					share_right_write: true,
					share_right_grant: true,
					share_right_create_user_id: "user",
					share_right_create_user_username: "user",
				},
			],
		},
	});
	jest.mocked(cryptoLibrary.decryptSecretKey).mockReturnValue("key-s1");
	expect(await linkCleanup.cleanup()).toEqual({
		moved: 0,
		deleted: 1,
		skipped: 0,
	});
	expect(apiClient.deleteSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"stale",
	);
});

it("keeps legacy single-entry share roots without a local ID", async () => {
	trees.set(
		"d1",
		tree([addShare("s1", { write_date: date, secret_id: "root-secret" })]),
	);
	metadatas.set("share:s1", metadata([link("original-link", "root-secret")]));
	expect(await linkCleanup.cleanup()).toEqual({
		moved: 0,
		deleted: 0,
		skipped: 0,
	});
	expectNoRepairs();
});

it("moves an unambiguous legacy single-entry link to its share", async () => {
	trees.set(
		"d1",
		tree([addShare("s1", { write_date: date, secret_id: "root-secret" })]),
	);
	metadatas.set(
		"datastore:d1",
		metadata([link("original-link", "root-secret")]),
	);
	expect(await linkCleanup.cleanup()).toEqual({
		moved: 1,
		deleted: 0,
		skipped: 0,
	});
	expect(apiClient.moveSecretLink).toHaveBeenCalledWith(
		"token",
		"session",
		"original-link",
		"s1",
		undefined,
	);
});

it("does not guess which link belongs to an ambiguous legacy root", async () => {
	trees.set(
		"d1",
		tree([addShare("s1", { write_date: date, secret_id: "root-secret" })]),
	);
	metadatas.set(
		"share:s1",
		metadata([link("one", "root-secret"), link("two", "root-secret")]),
	);
	expect(await linkCleanup.cleanup()).toEqual({
		moved: 0,
		deleted: 0,
		skipped: 2,
	});
	expectNoRepairs();
});

it("leaves read-only source and destination shares unchanged", async () => {
	trees.set("d1", tree([addShare("s1", tree([item("wrong-parent")]), false)]));
	metadatas.set("datastore:d1", metadata([link("wrong-parent")]));
	metadatas.set("share:s1", metadata([link("stale")]));
	expect(await linkCleanup.cleanup()).toEqual({
		moved: 0,
		deleted: 0,
		skipped: 2,
	});
	expectNoRepairs();
});

it.each([
	"datastore",
	"share",
	"metadata",
	"missing-key",
	"unsupported",
	"conflict",
])("does not mutate anything when the scan is incomplete: %s", async (failure) => {
	metadatas.set("datastore:d1", metadata([link("stale")]));
	if (failure === "datastore")
		jest
			.mocked(datastoreService.getDatastoreWithId)
			.mockRejectedValue(new Error("offline"));
	if (failure === "share") {
		trees.set("d1", tree([addShare("s1")]));
		jest
			.mocked(shareService.readShare)
			.mockRejectedValue(new Error("cannot decrypt"));
	}
	if (failure === "metadata")
		jest
			.mocked(apiClient.readCacheMetadata)
			.mockRejectedValue(new Error("offline"));
	if (failure === "missing-key")
		metadatas.set("datastore:d1", metadata([link("stale")], ["s1"]));
	if (failure === "unsupported")
		metadatas.set("datastore:d1", metadata([{ id: "secret-without-link-id" }]));
	if (failure === "conflict")
		trees.set("d1", tree([item("same", "one"), item("same", "two")]));
	await expect(linkCleanup.cleanup()).rejects.toBeInstanceOf(LinkCleanupError);
	expectNoRepairs();
});

it.each([
	"tree-revision",
	"link-membership",
	"datastore-list",
])("aborts when the snapshot changes before repairs: %s", async (change) => {
	metadatas.set("datastore:d1", metadata([link("stale")]));
	if (change === "datastore-list") {
		jest
			.mocked(apiClient.readDatastore)
			.mockResolvedValueOnce({ data: { datastores: [...datastores] } })
			.mockResolvedValueOnce({ data: { datastores: [] } });
	} else {
		jest
			.mocked(apiClient.readCacheMetadata)
			.mockResolvedValueOnce({ data: metadata([link("stale")]) })
			.mockResolvedValueOnce({
				data:
					change === "tree-revision"
						? { ...metadata([link("stale")]), write_date: "new-revision" }
						: metadata([link("stale"), link("new-link")]),
			});
	}
	await expect(linkCleanup.cleanup()).rejects.toThrow("LINK_CLEANUP_CHANGED");
	expectNoRepairs();
});

it("rejects a tree and metadata from different revisions", async () => {
	metadatas.set("datastore:d1", {
		...metadata([link("stale")]),
		write_date: "changed",
	});
	await expect(linkCleanup.cleanup()).rejects.toThrow("LINK_CLEANUP_CHANGED");
	expectNoRepairs();
});

it("aborts if share access changes during the scan", async () => {
	metadatas.set("datastore:d1", metadata([link("stale")]));
	jest
		.mocked(apiClient.readShareRightsOverview)
		.mockResolvedValueOnce({ data: { share_rights: [] } })
		.mockResolvedValueOnce({
			data: { share_rights: [{ share_id: "new-share", ...rights }] },
		});
	await expect(linkCleanup.cleanup()).rejects.toThrow("LINK_CLEANUP_CHANGED");
	expectNoRepairs();
});

it("includes non-tree settings datastores without treating settings as entries", async () => {
	datastores.push({
		id: "settings",
		type: "settings",
		description: "",
		is_default: true,
	});
	trees.set(
		"settings",
		Object.assign([{ key: "setting", value: true }], {
			write_date: date,
		}) as unknown as Datastore,
	);
	metadatas.set("datastore:settings", metadata());
	await linkCleanup.cleanup();
	expect(datastoreService.getDatastoreWithId).toHaveBeenCalledTimes(2);
	expectNoRepairs();
});

it("awaits mutations and reports partial completion on failure", async () => {
	metadatas.set(
		"datastore:d1",
		metadata([link("first"), link("second"), link("third")]),
	);
	jest
		.mocked(apiClient.deleteSecretLink)
		.mockResolvedValueOnce({ data: {} })
		.mockRejectedValueOnce(new Error("offline"));
	await expect(linkCleanup.cleanup()).rejects.toMatchObject({
		result: { deleted: 1, moved: 0, skipped: 0 },
	});
	expect(apiClient.deleteSecretLink).toHaveBeenCalledTimes(2);
});

it("stops an old scan after the account or vault session changes", async () => {
	jest
		.mocked(datastoreService.getDatastoreWithId)
		.mockImplementation(async () => {
			mockState = {
				...mockState,
				user: { token: "new-account", sessionSecretKey: "new-session" },
			};
			return tree();
		});
	await expect(linkCleanup.cleanup()).rejects.toThrow(
		"LINK_CLEANUP_UNAVAILABLE",
	);
	expectNoRepairs();
});

it("rejects offline execution and concurrent cleanup runs", async () => {
	jest.mocked(offlineCache.isActive).mockReturnValue(true);
	await expect(linkCleanup.cleanup()).rejects.toThrow(
		"LINK_CLEANUP_UNAVAILABLE",
	);
	expect(apiClient.readDatastore).not.toHaveBeenCalled();
	jest.mocked(offlineCache.isActive).mockReturnValue(false);
	let finish!: (value: Datastore) => void;
	jest.mocked(datastoreService.getDatastoreWithId).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const first = linkCleanup.cleanup();
	while (!finish) await Promise.resolve();
	await expect(linkCleanup.cleanup()).rejects.toThrow("LINK_CLEANUP_RUNNING");
	finish(tree());
	await first;
	expectNoRepairs();
});
