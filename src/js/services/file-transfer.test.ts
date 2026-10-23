import fileTransfer from "./file-transfer";
import apiClient from "./api-client";
import apiAWS from "./api-aws";
import apiFileserver from "./api-fileserver";
import cryptoLibrary from "./crypto-library";

jest.mock("./store", () => ({
	getStore: () => ({ getState: () => ({ user: {} }) }),
}));
jest.mock("./api-client", () => ({
	readFile: jest.fn(),
	fileRepositoryDownload: jest.fn(),
	readShards: jest.fn(),
}));
jest.mock("./api-aws", () => ({ download: jest.fn() }));
jest.mock("./api-fileserver", () => ({ download: jest.fn() }));
jest.mock("./crypto-library", () => ({
	decryptFile: jest.fn(),
	encryptData: () => ({ text: "ticket", nonce: "nonce" }),
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(apiClient.readFile).mockResolvedValue({
		data: {
			file_transfer_id: "transfer",
			file_transfer_secret_key: "transfer-key",
		},
	});
	jest
		.mocked(apiClient.fileRepositoryDownload)
		.mockResolvedValue({ data: { type: "aws_s3", url: "signed" } });
	jest.mocked(apiAWS.download).mockResolvedValue({ data: new ArrayBuffer(2) });
	jest
		.mocked(apiFileserver.download)
		.mockResolvedValue({ data: new ArrayBuffer(2) });
	jest
		.mocked(cryptoLibrary.decryptFile)
		.mockResolvedValue(new Uint8Array([1, 2]));
});

const file = {
	file_id: "file",
	file_title: "file",
	file_secret_key: "key",
	file_chunks: { 10: "last", 2: "first" },
};

it("downloads and decrypts repository chunks in numeric order only when pulled", async () => {
	const chunks = fileTransfer.downloadFileChunks(file);
	expect(apiClient.readFile).not.toHaveBeenCalled();
	expect((await chunks.next()).value).toEqual(new Uint8Array([1, 2]));
	expect(apiClient.fileRepositoryDownload).toHaveBeenCalledTimes(1);
	expect(apiClient.fileRepositoryDownload).toHaveBeenLastCalledWith(
		"transfer",
		"transfer-key",
		"first",
	);
	await chunks.next();
	expect(apiClient.fileRepositoryDownload).toHaveBeenLastCalledWith(
		"transfer",
		"transfer-key",
		"last",
	);
	expect((await chunks.next()).done).toBe(true);
});

it("uses readable shards and stops after cancellation", async () => {
	jest.mocked(apiClient.readShards).mockResolvedValue({
		data: {
			shards: [
				{
					id: "shard",
					read: true,
					fileserver: [{ fileserver_url: "https://files", read: true }],
				},
			],
		},
	});
	const chunks = fileTransfer.downloadFileChunks({
		...file,
		file_shard_id: "shard",
	});
	await chunks.next();
	await chunks.return();
	expect(apiFileserver.download).toHaveBeenCalledTimes(1);
	expect(apiAWS.download).not.toHaveBeenCalled();
});

it("exports empty files without opening a transfer and propagates decryption failures", async () => {
	expect(
		(await fileTransfer.downloadFileChunks({ file_title: "empty" }).next())
			.done,
	).toBe(true);
	expect(apiClient.readFile).not.toHaveBeenCalled();
	jest
		.mocked(cryptoLibrary.decryptFile)
		.mockRejectedValueOnce(new Error("invalid ciphertext"));
	await expect(fileTransfer.downloadFileChunks(file).next()).rejects.toThrow(
		"invalid ciphertext",
	);
	expect(apiAWS.download).toHaveBeenCalledTimes(1);
});

it("detects incomplete files and yields small slices from large decrypted chunks", async () => {
	jest
		.mocked(cryptoLibrary.decryptFile)
		.mockResolvedValue(new Uint8Array(1024 * 1024));
	const chunks = fileTransfer.downloadFileChunks({
		...file,
		file_chunks: { 1: "first" },
		file_size: 2 * 1024 * 1024,
	});
	for (let i = 0; i < 16; i++)
		expect((await chunks.next()).value?.length).toBe(64 * 1024);
	expect(apiAWS.download).toHaveBeenCalledTimes(1);
	await expect(chunks.next()).rejects.toThrow("File size mismatch");
});
