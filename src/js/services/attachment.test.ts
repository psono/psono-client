import { uploadAttachment, type PendingAttachment } from "./attachment";
import cryptoLibrary from "./crypto-library";
import fileTransferService from "./file-transfer";

jest.mock("./crypto-library", () => ({
	generateSecretKey: () => "key",
	encryptFile: jest.fn(async () => new Uint8Array([1, 2, 3])),
	sha512: () => "hash",
}));
jest.mock("./file-transfer", () => ({
	createFile: jest.fn(),
	upload: jest.fn(),
	deleteFile: jest.fn(),
}));

describe("attachment uploads", () => {
	let pending: PendingAttachment;
	beforeEach(() => {
		jest.clearAllMocks();
		pending = {
			file: new File(["test"], "file.txt"),
			filename: "renamed.txt",
			destination: {
				id: "shard",
				destination_type: "shard",
			} as PendingAttachment["destination"],
		};
		jest.mocked(fileTransferService.createFile).mockResolvedValue({
			file_id: "file",
			file_transfer_id: "transfer",
			file_transfer_secret_key: "transfer-key",
		});
		jest.mocked(fileTransferService.upload).mockResolvedValue(undefined);
		jest.mocked(fileTransferService.deleteFile).mockResolvedValue({});
	});
	it("encrypts and links files to the parent secret, retaining completed uploads for retries", async () => {
		const progress = jest.fn();
		const result = await uploadAttachment(pending, "secret", progress);
		expect(fileTransferService.createFile).toHaveBeenCalledWith(
			"shard",
			undefined,
			44,
			1,
			undefined,
			undefined,
			undefined,
			"secret",
		);
		expect(cryptoLibrary.encryptFile).toHaveBeenCalled();
		expect(result).toMatchObject({
			filename: "renamed.txt",
			file_id: "file",
			file_chunks: [{ hash: "hash", position: 1 }],
		});
		expect(progress).toHaveBeenLastCalledWith(100);
		expect(await uploadAttachment(pending, "secret", progress)).toBe(result);
		expect(fileTransferService.createFile).toHaveBeenCalledTimes(1);
	});
	it("cleans up a failed transfer and leaves it retryable", async () => {
		jest
			.mocked(fileTransferService.upload)
			.mockRejectedValueOnce(new Error("offline"));
		await expect(
			uploadAttachment(pending, "secret", jest.fn()),
		).rejects.toThrow("offline");
		expect(fileTransferService.deleteFile).toHaveBeenCalledWith("file");
		expect(pending.uploaded).toBeUndefined();
		await uploadAttachment(pending, "secret", jest.fn());
		expect(fileTransferService.createFile).toHaveBeenCalledTimes(2);
	});
});
