import type { FileRepositoryType } from "../../types/files";
import apiAWS from "./api-aws";
import apiAzureBlob from "./api-azure-blob";
import apiBackblaze from "./api-backblaze";
import apiDO from "./api-do";
import apiGCP from "./api-gcp";
import apiOtherS3 from "./api-other-s3";
import apiClient from "./api-client";
import { uploadAttachment, type PendingAttachment } from "./attachment";

jest.mock("./store", () => ({
	getStore: () => ({ getState: () => ({ user: {} }) }),
}));
jest.mock("./api-client", () => ({
	createFile: jest.fn(),
	deleteFile: jest.fn(),
	fileRepositoryUpload: jest.fn(),
}));
jest.mock("./crypto-library", () => ({
	generateSecretKey: () => "key",
	encryptFile: async () => new Uint8Array([1, 2, 3]),
	sha512: () => "hash",
}));

const signedUrl = "https://storage.example/chunk?signature=private";
const chunk = new Blob(["encrypted"]);
const fields = { key: "chunk", policy: "signed-policy" };
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = globalThis.fetch;
const providers: {
	type: FileRepositoryType;
	method: string;
	upload: () => Promise<Response>;
	download: (url: string) => Promise<{ data: ArrayBuffer }>;
}[] = [
	{
		type: "aws_s3",
		method: "POST",
		upload: () => apiAWS.upload(signedUrl, fields, chunk),
		download: apiAWS.download,
	},
	{
		type: "azure_blob",
		method: "PUT",
		upload: () => apiAzureBlob.upload(signedUrl, chunk),
		download: apiAzureBlob.download,
	},
	{
		type: "gcp_cloud_storage",
		method: "PUT",
		upload: () => apiGCP.upload(signedUrl, chunk),
		download: apiGCP.download,
	},
	{
		type: "do_spaces",
		method: "POST",
		upload: () => apiDO.upload(signedUrl, fields, chunk),
		download: apiDO.download,
	},
	{
		type: "backblaze",
		method: "POST",
		upload: () => apiBackblaze.upload(signedUrl, fields, chunk),
		download: apiBackblaze.download,
	},
	{
		type: "other_s3",
		method: "POST",
		upload: () => apiOtherS3.upload(signedUrl, fields, chunk),
		download: apiOtherS3.download,
	},
];

beforeEach(() => {
	jest.clearAllMocks();
	fetchMock.mockReset();
	globalThis.fetch = fetchMock;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe.each(providers)("$type transport", ({ method, upload, download }) => {
	it.each([
		200, 201, 204,
	])("accepts successful uploads without requiring a response body (HTTP %s)", async (status) => {
		const response = { ok: true, status } as Response;
		fetchMock.mockResolvedValue(response);
		await expect(upload()).resolves.toBe(response);
		const [url, request] = fetchMock.mock.calls[0];
		expect(url).toBe(signedUrl);
		expect(request?.method).toBe(method);
		if (method === "POST") {
			const body = request?.body as FormData;
			expect(body.get("key")).toBe(fields.key);
			expect(body.get("policy")).toBe(fields.policy);
			expect(body.get("file")).toBeInstanceOf(Blob);
		} else {
			expect(request?.body).toBe(chunk);
		}
	});

	it.each([
		400, 403, 404, 413, 429, 500, 503,
	])("rejects upload and download HTTP errors before reading their bodies (HTTP %s)", async (status) => {
		const arrayBuffer = jest.fn();
		fetchMock.mockResolvedValue({
			ok: false,
			status,
			arrayBuffer,
		} as unknown as Response);
		const error = {
			status,
			message: `Storage request failed (HTTP ${status})`,
		};
		await expect(upload()).rejects.toMatchObject(error);
		await expect(download(signedUrl)).rejects.toMatchObject(error);
		expect(arrayBuffer).not.toHaveBeenCalled();
	});

	it("preserves successful downloaded bytes", async () => {
		const bytes = new Uint8Array([0, 1, 128, 255]).buffer;
		fetchMock.mockResolvedValue({
			ok: true,
			arrayBuffer: async () => bytes,
		} as Response);
		await expect(download(signedUrl)).resolves.toEqual({ data: bytes });
	});

	it("preserves network failures", async () => {
		const error = new TypeError("Network interrupted");
		fetchMock.mockRejectedValue(error);
		await expect(upload()).rejects.toBe(error);
		await expect(download(signedUrl)).rejects.toBe(error);
	});
});

describe.each(providers)("$type attachment upload", ({ type }) => {
	it.each([
		403, 500,
	])("does not complete an attachment on HTTP %s and retries with a fresh transfer", async (status) => {
		jest
			.mocked(apiClient.createFile)
			.mockResolvedValueOnce({
				data: {
					file_id: "failed-file",
					file_transfer_id: "failed-transfer",
					file_transfer_secret_key: "transfer-key",
				},
			})
			.mockResolvedValueOnce({
				data: {
					file_id: "retry-file",
					file_transfer_id: "retry-transfer",
					file_transfer_secret_key: "retry-key",
				},
			});
		jest
			.mocked(apiClient.fileRepositoryUpload)
			.mockResolvedValue({ data: { url: signedUrl, fields } });
		jest.mocked(apiClient.deleteFile).mockResolvedValue({ data: {} });
		fetchMock.mockResolvedValueOnce({ ok: false, status } as Response);
		const pending: PendingAttachment = {
			file: new File(["content"], "example.txt"),
			filename: "example.txt",
			destination: {
				id: "repository",
				title: "Storage",
				type,
				destination_type: "file_repository",
			},
		};
		const completed = jest.fn();
		const rejected = jest.fn();
		const progress = jest.fn();
		await uploadAttachment(pending, "secret", progress).then(
			completed,
			rejected,
		);
		expect(rejected).toHaveBeenCalledTimes(1);
		expect(completed).not.toHaveBeenCalled();
		expect(pending.uploaded).toBeUndefined();
		expect(progress).not.toHaveBeenCalledWith(100);
		expect(apiClient.deleteFile).toHaveBeenCalledWith(
			undefined,
			undefined,
			"failed-file",
		);
		fetchMock.mockResolvedValueOnce({ ok: true, status: 201 } as Response);
		const result = await uploadAttachment(pending, "secret", progress);
		expect(result).toMatchObject({
			file_id: "retry-file",
			file_repository_id: "repository",
			file_chunks: [{ hash: "hash", position: 1 }],
		});
		expect(progress).toHaveBeenLastCalledWith(100);
		expect(apiClient.createFile).toHaveBeenCalledTimes(2);
		expect(apiClient.fileRepositoryUpload).toHaveBeenLastCalledWith(
			"retry-transfer",
			"retry-key",
			3,
			1,
			"hash",
		);
		expect(await uploadAttachment(pending, "secret", progress)).toBe(result);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(apiClient.deleteFile).toHaveBeenCalledTimes(1);
	});
});
