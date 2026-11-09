import rootReducer from "../reducers";
import apiClient from "./api-client";
import datastoreService from "./datastore";
import * as storeService from "./store";
import storage from "./storage";
import vaultLock from "./vault-lock";
import type { Datastore } from "../../types/datastore";

describe("Service: datastoreService - failed overview requests", () => {
	let userNumber = 0;

	beforeEach(() => {
		const state = rootReducer(undefined, { type: "@@INIT" });
		state.user.userId = `overview-retry-${++userNumber}`;
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
			dispatch: jest.fn(),
		} as unknown as ReturnType<typeof storeService.getStore>);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("shares an in-flight request but retries after a network failure", async () => {
		const overview = {
			datastores: [
				{
					id: "password-store",
					type: "password",
					description: "Default",
					is_default: true,
				},
			],
		};
		const read = jest
			.spyOn(apiClient, "readDatastore")
			.mockRejectedValueOnce({ errors: ["SERVER_OFFLINE"] })
			.mockResolvedValueOnce({ data: overview });

		const first = datastoreService.getDatastoreOverview();
		expect(datastoreService.getDatastoreOverview()).toBe(first);
		await expect(first).resolves.toBeUndefined();
		await expect(datastoreService.getDatastoreOverview()).resolves.toEqual(
			overview,
		);
		await expect(datastoreService.getDatastoreOverview()).resolves.toEqual(
			overview,
		);
		expect(read).toHaveBeenCalledTimes(2);
	});

	it("does not fetch or create a datastore when its overview could not be loaded", async () => {
		const read = jest
			.spyOn(apiClient, "readDatastore")
			.mockRejectedValue({ errors: ["SERVER_OFFLINE"] });
		const create = jest.spyOn(apiClient, "createDatastore");

		await expect(
			datastoreService.getDatastore("password"),
		).resolves.toBeUndefined();
		expect(read).toHaveBeenCalledTimes(1);
		expect(create).not.toHaveBeenCalled();
	});

	it("does not fetch or create a datastore after a failed fresh overview lookup", async () => {
		const read = jest
			.spyOn(apiClient, "readDatastore")
			.mockResolvedValueOnce({ data: { datastores: [] } })
			.mockRejectedValueOnce({ errors: ["SERVER_OFFLINE"] });
		const create = jest.spyOn(apiClient, "createDatastore");

		await expect(
			datastoreService.getDatastore("password"),
		).resolves.toBeUndefined();
		expect(read).toHaveBeenCalledTimes(2);
		expect(create).not.toHaveBeenCalled();
	});
});

describe("Service: datastoreService - index replacement", () => {
	beforeEach(() => {
		jest.spyOn(vaultLock, "isBlocked").mockReturnValue(false);
	});
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("collects mapped nested entries and replaces the index once, after filtering deleted nodes", async () => {
		const datastore: Datastore = {
			items: [
				{
					id: "root",
					secret_id: "root-secret",
					name: "Root",
					type: "website_password",
				},
				{ id: "deleted", secret_id: "deleted-secret", deleted: true },
				{ id: "file", type: "file" },
			],
			folders: [
				{
					id: "folder",
					items: [
						{
							id: "nested",
							secret_id: "nested-secret",
							name: "Nested",
							type: "website_password",
						},
					],
				},
				{
					id: "deleted-folder",
					deleted: true,
					items: [{ id: "hidden", secret_id: "hidden-secret" }],
				},
			],
		};
		let finish!: (changed: boolean) => void;
		const replace = jest.spyOn(storage, "replaceIndex").mockReturnValue(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		const save = jest.spyOn(storage, "save").mockImplementation(() => {});
		const remove = jest.spyOn(storage, "removeAll");
		const upsert = jest.spyOn(storage, "upsert");
		const pending = datastoreService.fillStorage(
			"datastore-password-leafs",
			datastore,
			[
				["key", "secret_id"],
				["label", (item) => item.name?.toUpperCase()],
			],
			(item) => item.type !== "file",
		);
		expect(replace).toHaveBeenCalledTimes(1);
		expect(replace).toHaveBeenCalledWith("datastore-password-leafs", [
			{ key: "nested-secret", label: "NESTED", type: "website_password" },
			{ key: "root-secret", label: "ROOT", type: "website_password" },
		]);
		expect(remove).not.toHaveBeenCalled();
		expect(upsert).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
		finish(true);
		await pending;
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("does not broadcast storage reloads for unchanged indexes", async () => {
		jest.spyOn(storage, "replaceIndex").mockResolvedValue(false);
		const save = jest.spyOn(storage, "save").mockImplementation(() => {});
		await datastoreService.fillStorage("datastore-file-leafs", { items: [] }, [
			["key", "id"],
		]);
		expect(save).not.toHaveBeenCalled();
	});

	it("does not start rebuilding a blocked vault", async () => {
		jest.mocked(vaultLock.isBlocked).mockReturnValue(true);
		const replace = jest.spyOn(storage, "replaceIndex");
		await datastoreService.fillStorage("datastore-password-leafs", {}, []);
		expect(replace).not.toHaveBeenCalled();
	});

	it("propagates replacement failures without broadcasting a successful reload", async () => {
		jest
			.spyOn(storage, "replaceIndex")
			.mockRejectedValue(new Error("Disk full"));
		const save = jest.spyOn(storage, "save").mockImplementation(() => {});
		await expect(
			datastoreService.fillStorage("datastore-password-leafs", {}, []),
		).rejects.toThrow("Disk full");
		expect(save).not.toHaveBeenCalled();
	});
});
