import type { Datastore } from "../../types/datastore";
import rootReducer from "../reducers";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import "./datastore-password";
import shareService from "./share";
import * as storeService from "./store";

describe("Creating folder shares", () => {
	const folder: Datastore = {
		id: "source",
		name: "Folder",
		folders: [
			{
				id: "ordinary",
				items: [
					{
						id: "note",
						type: "note",
						secret_id: "secret",
						secret_key: "secret-key",
					},
				],
				folders: [
					{
						id: "shared-child",
						share_id: "child-share",
						share_secret_key: "child-key",
						items: [
							{
								id: "private",
								type: "note",
								secret_id: "private-secret",
								secret_key: "private-key",
							},
						],
					},
				],
			},
		],
		items: [
			{
				id: "file",
				type: "file",
				file_id: "file-id",
				file_secret_key: "file-key",
			},
		],
	};
	beforeEach(() => {
		const state = rootReducer(undefined, { type: "@@INIT" });
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () => state,
		} as ReturnType<typeof storeService.getStore>);
		jest
			.spyOn(cryptoLibrary, "encryptData")
			.mockReturnValue({ text: "cipher", nonce: "nonce" });
		jest
			.spyOn(cryptoLibrary, "encryptSecretKey")
			.mockReturnValue({ text: "encrypted-key", nonce: "key-nonce" });
		jest
			.spyOn(apiClient, "createShare")
			.mockResolvedValue({ data: { share_id: "new-share" } });
		jest.spyOn(apiClient, "moveSecretLink").mockResolvedValue({ data: {} });
		jest.spyOn(apiClient, "moveFileLink").mockResolvedValue({ data: {} });
		jest.spyOn(apiClient, "moveShareLink").mockResolvedValue({ data: {} });
	});
	afterEach(() => jest.restoreAllMocks());

	it("keeps nested shares as encrypted-key references and awaits every direct child link", async () => {
		let release!: () => void;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		jest.mocked(apiClient.moveSecretLink).mockImplementation(async () => {
			await pending;
			return { data: {} };
		});
		const opened = jest.fn();
		const closed = jest.fn();
		let finished = false;
		const creating = shareService
			.createShare(folder, undefined, "ds", "source", opened, closed)
			.then((result) => {
				finished = true;
				return result;
			});
		await Promise.resolve();
		await Promise.resolve();
		expect(finished).toBe(false);
		expect(apiClient.moveFileLink).not.toHaveBeenCalled();
		const plaintext = JSON.parse(
			jest.mocked(cryptoLibrary.encryptData).mock.calls[0][0],
		);
		expect(plaintext.share_index["child-share"]).toEqual({
			secret_key: "child-key",
			paths: [["ordinary", "shared-child"]],
		});
		expect(plaintext.folders[0].folders[0].items).toBeUndefined();
		expect(JSON.stringify(plaintext)).not.toContain("private-key");
		release();
		await expect(creating).resolves.toEqual({
			share_id: "new-share",
			secret_key: expect.any(String),
		});
		expect(
			jest
				.mocked(apiClient.moveSecretLink)
				.mock.calls.map((args) => args.slice(2)),
		).toEqual([["note", "new-share"]]);
		expect(jest.mocked(apiClient.moveFileLink).mock.calls[0].slice(2)).toEqual([
			"file",
			"new-share",
		]);
		expect(jest.mocked(apiClient.moveShareLink).mock.calls[0].slice(2)).toEqual(
			["shared-child", "new-share"],
		);
		expect(opened).toHaveBeenCalledTimes(3);
		expect(closed).toHaveBeenCalledTimes(3);
	});

	it("rejects the conversion if a child link cannot be reparented", async () => {
		jest
			.mocked(apiClient.moveSecretLink)
			.mockRejectedValue(new Error("Forbidden"));
		await expect(
			shareService.createShare(folder, undefined, "ds", "source"),
		).rejects.toThrow("Forbidden");
		expect(apiClient.moveFileLink).not.toHaveBeenCalled();
		expect(apiClient.moveShareLink).toHaveBeenCalledTimes(1);
	});
});
