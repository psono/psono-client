import React from "react";
import datastoreService from "./datastore";
import datastorePasswordService from "./datastore-password";
import shareService from "./share";

describe("Service: datastorePasswordService test suite #1", () => {
	it("datastorePasswordService exists", () => {
		expect(datastorePasswordService).toBeDefined();
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
		const datastore = {
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
		const datastore = {
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
		expect(datastore.folders[0].share_index).toEqual({
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
		const datastore = {
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
		const datastore = {
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
			.mockResolvedValue();
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
			.mockResolvedValue();

		try {
			const result = await datastorePasswordService.getPasswordDatastore();

			expect(result.share_index).toEqual({
				"outer-share": {
					secret_key: "outer-key",
					paths: [["outer-link"]],
				},
			});
			expect(result.folders[0].share_index).toEqual({
				"nested-share": {
					secret_key: "nested-key",
					paths: [["nested-link"]],
				},
			});
			expect(result.folders[0].items[0].name).toBe("Nested item");
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
