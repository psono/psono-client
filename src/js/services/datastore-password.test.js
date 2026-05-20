import React from "react";
import datastorePasswordService from "./datastore-password";

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
});
