import { openDB } from "idb";
import storage from "./storage";
import vaultLock, { seal, unseal } from "./vault-lock";

const mockDatabases = new Map<string, Map<string, unknown>>();
jest.mock("localforage", () => ({
	__esModule: true,
	default: {
		INDEXEDDB: "indexeddb",
		createInstance: ({ name }: { name: string }) => {
			const db = () => {
				if (!mockDatabases.has(name)) mockDatabases.set(name, new Map());
				return mockDatabases.get(name)!;
			};
			return {
				ready: async () => {},
				driver: () => "indexeddb",
				config: (key: string) => (key === "name" ? name : "keyvaluepairs"),
				getItem: jest.fn(async (key: string) => db().get(key) ?? null),
				setItem: jest.fn(async (key: string, value: unknown) => {
					db().set(key, value);
					return value;
				}),
				removeItem: jest.fn(async (key: string) => db().delete(key)),
				iterate: jest.fn(
					async (callback: (value: unknown, key: string) => void) => {
						for (const [key, value] of db()) callback(value, key);
					},
				),
			};
		},
	},
}));
jest.mock("idb", () => ({ openDB: jest.fn() }));

interface Range {
	lower: string;
	upper: string;
	lowerOpen: boolean;
	upperOpen: boolean;
}

describe("storage bulk queries", () => {
	const originalKeyRange = globalThis.IDBKeyRange;
	const secret = "11".repeat(32);
	let getAll: jest.Mock;
	let getAllKeys: jest.Mock;
	let close: jest.Mock;
	let transaction: jest.Mock;
	let put: jest.Mock;
	let deleteEntry: jest.Mock;
	let abort: jest.Mock;
	let commitGate: Promise<void> | undefined;
	let transactionStarted: Promise<void>;
	let startTransaction: () => void;
	let onRead: (() => void) | undefined;
	let writeError: Error | undefined;
	let synchronousWriteFailure = false;

	beforeAll(() => {
		Object.defineProperty(globalThis, "IDBKeyRange", {
			configurable: true,
			value: {
				bound: (
					lower: string,
					upper: string,
					lowerOpen: boolean,
					upperOpen: boolean,
				) => ({ lower, upper, lowerOpen, upperOpen }),
			},
		});
	});
	afterAll(() => {
		Object.defineProperty(globalThis, "IDBKeyRange", {
			configurable: true,
			value: originalKeyRange,
		});
	});
	beforeEach(() => {
		mockDatabases.clear();
		jest.clearAllMocks();
		commitGate = undefined;
		onRead = undefined;
		writeError = undefined;
		synchronousWriteFailure = false;
		transactionStarted = new Promise((resolve) => {
			startTransaction = resolve;
		});
		jest.spyOn(vaultLock, "getAccountId").mockReturnValue("alice");
		jest.spyOn(vaultLock, "getRevision").mockReturnValue(1);
		jest.spyOn(vaultLock, "getKey").mockReturnValue(secret);
		jest.spyOn(vaultLock, "isBlocked").mockReturnValue(false);
		close = jest.fn();
		jest.mocked(openDB).mockImplementation(async (name) => {
			transaction = jest.fn((_storeName: string, mode: string) => {
				const snapshot = new Map(mockDatabases.get(name));
				const entries = (range?: Range) =>
					Array.from(snapshot)
						.filter(
							([key]) => !range || (key >= range.lower && key < range.upper),
						)
						.sort(([first], [second]) =>
							first < second ? -1 : first > second ? 1 : 0,
						);
				getAll = jest.fn(async (range?: Range) => {
					onRead?.();
					return entries(range).map(([, value]) => value);
				});
				getAllKeys = jest.fn(async (range?: Range) =>
					entries(range).map(([key]) => key),
				);
				put = jest.fn((value: unknown, key: string) => {
					if (
						writeError &&
						synchronousWriteFailure &&
						put.mock.calls.length === 2
					)
						throw writeError;
					return Promise.resolve().then(() => {
						if (writeError && !synchronousWriteFailure) throw writeError;
						snapshot.set(key, value);
					});
				});
				deleteEntry = jest.fn(async (key: string) => snapshot.delete(key));
				let aborted = false;
				let rejectDone!: (error: Error) => void;
				const done = new Promise<void>((resolve, reject) => {
					rejectDone = reject;
					setTimeout(async () => {
						await commitGate;
						if (aborted) return;
						if (mode === "readwrite") mockDatabases.set(name, snapshot);
						resolve();
					}, 0);
				});
				abort = jest.fn(() => {
					aborted = true;
					rejectDone(new Error("Transaction aborted"));
				});
				startTransaction();
				return {
					store: { getAll, getAllKeys, put, delete: deleteEntry },
					done,
					abort,
				};
			});
			return {
				transaction,
				close,
			} as unknown as Awaited<ReturnType<typeof openDB>>;
		});
	});
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("reads and decrypts the account's index in bulk without individual reads", async () => {
		await storage.upsert(
			"datastore-password-leafs",
			Array.from({ length: 100 }, (_, i) => ({
				key: `secret-${i}`,
				name: `Credential ${i}`,
				urlfilter: i === 42 ? "example.com" : "other.test",
			})),
		);
		// The same encryption key makes this an account-isolation test, independent of decryption failure.
		mockDatabases.get("datastore-password-leafs")!.set(
			"bob:secret-42",
			seal(
				JSON.stringify({
					key: "secret-42",
					name: "Bob's credential",
					urlfilter: "example.com",
				}),
				secret,
			),
		);
		const filter = jest.fn(
			(value: { urlfilter: string }, _key?: string) =>
				value.urlfilter === "example.com",
		);

		await expect(
			storage.where("datastore-password-leafs", filter),
		).resolves.toEqual([
			{ key: "secret-42", name: "Credential 42", urlfilter: "example.com" },
		]);
		expect(filter).toHaveBeenCalledTimes(100);
		expect(filter).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Credential 42" }),
			"secret-42",
		);
		expect(getAll).toHaveBeenCalledTimes(1);
		expect(getAllKeys).toHaveBeenCalledTimes(1);
		expect(getAll).toHaveBeenCalledWith({
			lower: "alice:",
			upper: "alice;",
			lowerOpen: false,
			upperOpen: true,
		});
		expect(
			storage.get("datastore-password-leafs").getItem,
		).not.toHaveBeenCalled();
		expect(close).toHaveBeenCalledTimes(1);
	});

	it("skips corrupt entries without losing valid matches", async () => {
		await storage.upsert("datastore-password-leafs", {
			key: "valid",
			name: "Valid credential",
		});
		mockDatabases
			.get("datastore-password-leafs")!
			.set("alice:broken", { nonce: "invalid", text: "invalid" });
		await expect(
			storage.where("datastore-password-leafs", () => true),
		).resolves.toEqual([{ key: "valid", name: "Valid credential" }]);
	});

	it.each([
		"lock",
		"account",
		"revision",
		"key",
	])("discards results after a %s change during asynchronous filtering", async (change) => {
		await storage.upsert("datastore-password-leafs", {
			key: "secret",
			name: "Credential",
		});
		let finishFilter!: (value: boolean) => void;
		let startedFilter!: () => void;
		const started = new Promise<void>((resolve) => {
			startedFilter = resolve;
		});
		const pending = storage.where("datastore-password-leafs", () => {
			startedFilter();
			return new Promise<boolean>((resolve) => {
				finishFilter = resolve;
			});
		});
		await started;
		if (change === "lock")
			jest.mocked(vaultLock.isBlocked).mockReturnValue(true);
		if (change === "account")
			jest.mocked(vaultLock.getAccountId).mockReturnValue("bob");
		if (change === "revision")
			jest.mocked(vaultLock.getRevision).mockReturnValue(2);
		if (change === "key")
			jest.mocked(vaultLock.getKey).mockReturnValue("22".repeat(32));
		finishFilter(true);
		await expect(pending).resolves.toEqual([]);
	});

	it.each([
		true,
		false,
	])("does not read protected data when blocked=%s and no usable key is available", async (blocked) => {
		jest.mocked(vaultLock.isBlocked).mockReturnValue(blocked);
		if (!blocked) jest.mocked(vaultLock.getKey).mockReturnValue(undefined);
		await expect(
			storage.where("datastore-password-leafs", () => true),
		).resolves.toEqual([]);
		expect(openDB).not.toHaveBeenCalled();
	});

	it("uses the fallback driver's iteration and supports asynchronous filters", async () => {
		const db = storage.get("datastore-password-leafs");
		jest.spyOn(db, "driver").mockReturnValue("localStorage");
		await storage.upsert("datastore-password-leafs", {
			key: "secret",
			name: "Alice's credential",
		});
		mockDatabases
			.get("datastore-password-leafs")!
			.set(
				"bob:secret",
				seal(
					JSON.stringify({ key: "secret", name: "Bob's credential" }),
					secret,
				),
			);
		await expect(
			storage.where("datastore-password-leafs", async () => true),
		).resolves.toEqual([{ key: "secret", name: "Alice's credential" }]);
		expect(db.iterate).toHaveBeenCalledTimes(1);
		expect(db.getItem).not.toHaveBeenCalled();
		expect(openDB).not.toHaveBeenCalled();
	});

	it("queries unprotected state without a vault key and preserves its keys", async () => {
		jest.mocked(vaultLock.isBlocked).mockReturnValue(true);
		jest.mocked(vaultLock.getKey).mockReturnValue(undefined);
		await storage.insert("state", {
			key: "persist:alice",
			value: "public state",
		});
		const filter = jest.fn(async () => true);
		await expect(storage.where("state", filter)).resolves.toEqual([
			"public state",
		]);
		expect(filter).toHaveBeenCalledWith("public state", "persist:alice");
		expect(getAll).toHaveBeenCalledWith(undefined);
	});

	it("replaces a large account index in one transaction without touching other accounts", async () => {
		await storage.upsert("datastore-password-leafs", {
			key: "obsolete",
			name: "Old entry",
		});
		const other = seal(JSON.stringify({ key: "other" }), secret);
		mockDatabases.get("datastore-password-leafs")!.set("bob:other", other);
		const items = Array.from({ length: 1000 }, (_, i) => ({
			key: `secret-${i}`,
			name: `Credential ${i}`,
		}));

		await expect(
			storage.replaceIndex("datastore-password-leafs", items),
		).resolves.toBe(true);
		expect(transaction).toHaveBeenCalledTimes(1);
		expect(transaction).toHaveBeenCalledWith("keyvaluepairs", "readwrite");
		expect(put).toHaveBeenCalledTimes(1000);
		expect(deleteEntry).toHaveBeenCalledTimes(1);
		expect(deleteEntry).toHaveBeenCalledWith("alice:obsolete");
		const raw = mockDatabases.get("datastore-password-leafs")!;
		expect(raw.size).toBe(1001);
		expect(raw.get("bob:other")).toBe(other);
		expect(
			JSON.parse(
				unseal(
					raw.get("alice:secret-42") as Parameters<typeof unseal>[0],
					secret,
				),
			),
		).toEqual(items[42]);
	});

	it("does not rewrite unchanged entries, including when their traversal order changes", async () => {
		const items = [
			{ key: "first", name: "First" },
			{ key: "second", name: "Second" },
		];
		await storage.replaceIndex("datastore-password-leafs", items);
		const before = new Map(mockDatabases.get("datastore-password-leafs"));
		await expect(
			storage.replaceIndex("datastore-password-leafs", items.slice().reverse()),
		).resolves.toBe(false);
		expect(put).not.toHaveBeenCalled();
		expect(deleteEntry).not.toHaveBeenCalled();
		expect(mockDatabases.get("datastore-password-leafs")).toEqual(before);
	});

	it("only writes changed or corrupt entries and removes obsolete entries", async () => {
		await storage.replaceIndex("datastore-password-leafs", [
			{ key: "unchanged", name: "Keep" },
			{ key: "changed", name: "Before" },
			{ key: "obsolete" },
		]);
		const raw = mockDatabases.get("datastore-password-leafs")!;
		const unchanged = raw.get("alice:unchanged");
		raw.set("alice:corrupt", { text: "bad", nonce: "bad" });
		await storage.replaceIndex("datastore-password-leafs", [
			{ key: "unchanged", name: "Keep" },
			{ key: "changed", name: "After" },
			{ key: "corrupt", name: "Repaired" },
		]);
		expect(put).toHaveBeenCalledTimes(2);
		expect(deleteEntry).toHaveBeenCalledTimes(1);
		expect(
			mockDatabases.get("datastore-password-leafs")!.get("alice:unchanged"),
		).toBe(unchanged);
	});

	it("keeps the previous index visible until the replacement commits", async () => {
		await storage.upsert("datastore-password-leafs", { key: "previous" });
		let commit!: () => void;
		commitGate = new Promise((resolve) => {
			commit = resolve;
		});
		const replacement = storage.replaceIndex("datastore-password-leafs", [
			{ key: "next" },
		]);
		await transactionStarted;
		await expect(
			storage.findKey("datastore-password-leafs", "previous"),
		).resolves.toEqual({ key: "previous" });
		expect(
			mockDatabases.get("datastore-password-leafs")!.has("alice:next"),
		).toBe(false);
		commit();
		await replacement;
		await expect(
			storage.findKey("datastore-password-leafs", "next"),
		).resolves.toEqual({ key: "next" });
		await expect(
			storage.findKey("datastore-password-leafs", "previous"),
		).resolves.toBeNull();
	});

	it.each([
		"lock",
		"account",
		"revision",
		"key",
	])("aborts replacement after a %s change while reading the old index", async (change) => {
		await storage.upsert("datastore-password-leafs", { key: "previous" });
		const before = new Map(mockDatabases.get("datastore-password-leafs"));
		onRead = () => {
			if (change === "lock")
				jest.mocked(vaultLock.isBlocked).mockReturnValue(true);
			if (change === "account")
				jest.mocked(vaultLock.getAccountId).mockReturnValue("bob");
			if (change === "revision")
				jest.mocked(vaultLock.getRevision).mockReturnValue(2);
			if (change === "key")
				jest.mocked(vaultLock.getKey).mockReturnValue("22".repeat(32));
		};
		await expect(
			storage.replaceIndex("datastore-password-leafs", [{ key: "next" }]),
		).resolves.toBe(false);
		expect(abort).toHaveBeenCalled();
		expect(put).not.toHaveBeenCalled();
		expect(deleteEntry).not.toHaveBeenCalled();
		expect(mockDatabases.get("datastore-password-leafs")).toEqual(before);
	});

	it("aborts an in-flight transaction when the vault locks before commit", async () => {
		await storage.upsert("datastore-password-leafs", { key: "previous" });
		let commit!: () => void;
		commitGate = new Promise((resolve) => {
			commit = resolve;
		});
		let notify!: () => void;
		const unsubscribe = jest.fn();
		jest.spyOn(vaultLock, "subscribe").mockImplementation((listener) => {
			notify = listener;
			return unsubscribe;
		});
		const replacement = storage.replaceIndex("datastore-password-leafs", [
			{ key: "next" },
		]);
		await transactionStarted;
		jest.mocked(vaultLock.isBlocked).mockReturnValue(true);
		notify();
		commit();
		await expect(replacement).resolves.toBe(false);
		expect(
			mockDatabases.get("datastore-password-leafs")!.has("alice:previous"),
		).toBe(true);
		expect(unsubscribe).toHaveBeenCalled();
		expect(close).toHaveBeenCalled();
	});

	it("preserves the old index and reports a failed write", async () => {
		await storage.upsert("datastore-password-leafs", { key: "previous" });
		writeError = new Error("Disk full");
		await expect(
			storage.replaceIndex("datastore-password-leafs", [{ key: "next" }]),
		).rejects.toThrow("Disk full");
		expect(abort).toHaveBeenCalled();
		expect(
			mockDatabases.get("datastore-password-leafs")!.has("alice:previous"),
		).toBe(true);
		expect(close).toHaveBeenCalled();
	});

	it("rolls back earlier writes when creating a later request throws synchronously", async () => {
		await storage.upsert("datastore-password-leafs", { key: "previous" });
		writeError = new Error("Could not create write request");
		synchronousWriteFailure = true;
		await expect(
			storage.replaceIndex("datastore-password-leafs", [
				{ key: "first" },
				{ key: "second" },
			]),
		).rejects.toThrow("Could not create write request");
		expect(abort).toHaveBeenCalled();
		expect(
			Array.from(mockDatabases.get("datastore-password-leafs")!.keys()),
		).toEqual(["alice:previous"]);
	});

	it("clears an empty account index without deleting another account's entries", async () => {
		await storage.upsert("datastore-password-leafs", { key: "previous" });
		mockDatabases
			.get("datastore-password-leafs")!
			.set("bob:other", "other account");
		await expect(
			storage.replaceIndex("datastore-password-leafs", []),
		).resolves.toBe(true);
		expect(mockDatabases.get("datastore-password-leafs")).toEqual(
			new Map([["bob:other", "other account"]]),
		);
		await expect(
			storage.replaceIndex("datastore-password-leafs", []),
		).resolves.toBe(false);
	});

	it.each([
		true,
		false,
	])("does not start replacement when blocked=%s and no usable key is available", async (blocked) => {
		jest.mocked(vaultLock.isBlocked).mockReturnValue(blocked);
		if (!blocked) jest.mocked(vaultLock.getKey).mockReturnValue(undefined);
		await expect(
			storage.replaceIndex("datastore-password-leafs", [{ key: "next" }]),
		).resolves.toBe(false);
		expect(openDB).not.toHaveBeenCalled();
	});

	it("updates fallback drivers without emptying or rewriting an unchanged index", async () => {
		const db = storage.get("datastore-file-leafs");
		jest.spyOn(db, "driver").mockReturnValue("localStorage");
		await storage.upsert("datastore-file-leafs", [
			{ key: "previous" },
			{ key: "unchanged" },
		]);
		jest.mocked(db.setItem).mockClear();
		const items = [{ key: "next" }, { key: "unchanged" }];
		await expect(
			storage.replaceIndex("datastore-file-leafs", items),
		).resolves.toBe(true);
		expect(db.setItem).toHaveBeenCalledTimes(1);
		expect(db.removeItem).toHaveBeenCalledWith("alice:previous");
		jest.mocked(db.setItem).mockClear();
		jest.mocked(db.removeItem).mockClear();
		await expect(
			storage.replaceIndex("datastore-file-leafs", items),
		).resolves.toBe(false);
		expect(db.setItem).not.toHaveBeenCalled();
		expect(db.removeItem).not.toHaveBeenCalled();
		expect(openDB).not.toHaveBeenCalled();
	});
});
