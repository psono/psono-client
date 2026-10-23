import { Blob as NodeBlob } from "buffer";
import type { FileEntry } from "@zip.js/zip.js";
import type { ExportFolder } from "../../types/import";
import { writeZipExport, createZipExportTarget } from "./export-zip";
import fileTransfer from "./file-transfer";

Object.assign(global, require("stream/web"));
Object.defineProperty(global, "Blob", { value: NodeBlob });
jest.mock("./file-transfer", () => ({ downloadFileChunks: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it("writes JSON, standalone files, empty files and duplicate-named attachments with matching paths", async () => {
	const { BlobReader, ZipReader, Uint8ArrayWriter } = await import(
		"@zip.js/zip.js"
	);
	const data: ExportFolder = {
		items: [
			{ type: "file", name: "../../proof.txt", file_id: "standalone" },
			{ type: "file", name: "empty" },
		],
		folders: [
			{
				name: "nested",
				items: [
					{
						type: "note",
						note_notes: "secret",
						attachments: [1, 2].map(() => ({
							filename: "../proof.txt",
							file_id: "attachment",
							file_chunks: [
								{ position: 2, hash: "second" },
								{ position: 1, hash: "first" },
							],
							file_secret_key: "key",
							file_size: 11,
							file_shard_id: null,
							file_repository_id: "repo",
						})),
					},
				],
			},
		],
	};
	jest
		.mocked(fileTransfer.downloadFileChunks)
		.mockImplementation(async function* (file) {
			if (!file.file_id) return;
			yield new TextEncoder().encode("hello ");
			yield new TextEncoder().encode("world");
		});
	const output: Uint8Array[] = [];
	const close = jest.fn();
	await writeZipExport(
		data,
		new WritableStream({
			write: (chunk) => {
				output.push(chunk.slice());
			},
			close,
		}),
	);
	expect(close).toHaveBeenCalledTimes(1);
	const reader = new ZipReader(new BlobReader(new Blob(output as BlobPart[])), {
		useWebWorkers: false,
	});
	try {
		const entries = (await reader.getEntries()) as FileEntry[];
		expect(entries[1].compressionMethod).toBe(0);
		const contents = Object.fromEntries(
			await Promise.all(
				entries.map(async (entry) => [
					entry.filename,
					new TextDecoder().decode(
						await entry.getData(new Uint8ArrayWriter(), {
							checkSignature: true,
						}),
					),
				]),
			),
		);
		const manifest = JSON.parse(contents["export.json"]) as ExportFolder;
		expect(manifest.items?.[0].name).toBe("../../proof.txt");
		expect(contents[manifest.items![0].archive_path!]).toBe("hello world");
		expect(contents[manifest.items![1].archive_path!]).toBe("");
		const attachments = manifest.folders![0].items![0].attachments!;
		expect(attachments[0].archive_path).not.toBe(attachments[1].archive_path);
		for (const attachment of attachments)
			expect(contents[attachment.archive_path!]).toBe("hello world");
		expect(
			entries.every(({ filename }) => !filename.split("/").includes("..")),
		).toBe(true);
		expect(fileTransfer.downloadFileChunks).toHaveBeenLastCalledWith(
			expect.objectContaining({ file_chunks: { 1: "first", 2: "second" } }),
		);
	} finally {
		await reader.close();
	}
});

it("applies output backpressure instead of retaining an entire file", async () => {
	let produced = 0;
	let written = 0;
	jest
		.mocked(fileTransfer.downloadFileChunks)
		.mockImplementation(async function* () {
			for (let i = 0; i < 1024; i++) {
				produced += 64 * 1024;
				// Allow the ZIP pipeline's small fixed buffers, not file-sized buffering.
				expect(produced - written).toBeLessThan(4 * 1024 * 1024);
				yield new Uint8Array(64 * 1024);
			}
		});
	await writeZipExport(
		{ items: [{ type: "file", name: "large" }] },
		new WritableStream({
			async write(chunk) {
				await new Promise((resolve) => setTimeout(resolve, 0));
				written += chunk.length;
			},
		}),
	);
	expect(produced).toBe(64 * 1024 * 1024);
	expect(written).toBeGreaterThan(produced);
});

it("aborts a partial archive and stops downloading after a file failure", async () => {
	const failure = new Error("download failed");
	jest
		.mocked(fileTransfer.downloadFileChunks)
		.mockImplementation(async function* () {
			yield new Uint8Array([1, 2, 3]);
			throw failure;
		});
	const abort = jest.fn();
	const close = jest.fn();
	const target = new WritableStream<Uint8Array>({ write() {}, abort, close });
	await expect(
		writeZipExport({ items: [{ type: "file" }, { type: "file" }] }, target),
	).rejects.toThrow(failure);
	expect(abort).toHaveBeenCalledTimes(1);
	expect(close).not.toHaveBeenCalled();
	expect(fileTransfer.downloadFileChunks).toHaveBeenCalledTimes(1);
	expect(target.locked).toBe(false);
});

it("opens a disk-backed picker target and preserves cancellation", async () => {
	const writable = new WritableStream<Uint8Array>();
	const picker = jest
		.fn()
		.mockResolvedValue({ createWritable: async () => writable });
	Object.defineProperty(window, "showSaveFilePicker", {
		configurable: true,
		value: picker,
	});
	try {
		expect((await createZipExportTarget()).writable).toBe(writable);
		picker.mockRejectedValueOnce(new DOMException("Cancelled", "AbortError"));
		await expect(createZipExportTarget()).rejects.toMatchObject({
			name: "AbortError",
		});
	} finally {
		delete (window as Window & { showSaveFilePicker?: unknown })
			.showSaveFilePicker;
	}
});

it("stages fallback exports on disk and removes abandoned/failed temporary files", async () => {
	const originalStorage = Object.getOwnPropertyDescriptor(navigator, "storage");
	const originalUuid = Object.getOwnPropertyDescriptor(crypto, "randomUUID");
	const abort = jest.fn();
	const removeEntry = jest.fn().mockResolvedValue(undefined);
	const getFileHandle = jest.fn().mockResolvedValue({
		createWritable: async () => new WritableStream({ abort }),
	});
	const directory = {
		getFileHandle,
		removeEntry,
		async *entries() {
			yield [`${Date.now() - 2 * 24 * 60 * 60 * 1000}-old.zip`, {}];
		},
	};
	Object.defineProperty(navigator, "storage", {
		configurable: true,
		value: {
			getDirectory: async () => ({ getDirectoryHandle: async () => directory }),
		},
	});
	Object.defineProperty(crypto, "randomUUID", {
		configurable: true,
		value: () => "uuid",
	});
	try {
		const target = await createZipExportTarget();
		expect(removeEntry).toHaveBeenCalledTimes(1);
		await target.abort();
		expect(abort).toHaveBeenCalledTimes(1);
		expect(removeEntry).toHaveBeenLastCalledWith(
			getFileHandle.mock.calls[0][0],
		);
	} finally {
		if (originalStorage)
			Object.defineProperty(navigator, "storage", originalStorage);
		else Reflect.deleteProperty(navigator, "storage");
		if (originalUuid) Object.defineProperty(crypto, "randomUUID", originalUuid);
		else Reflect.deleteProperty(crypto, "randomUUID");
	}
});

it("propagates disk-write failures and stops the file source", async () => {
	const finished = jest.fn();
	jest
		.mocked(fileTransfer.downloadFileChunks)
		.mockImplementation(async function* () {
			try {
				for (let i = 0; i < 1024; i++) yield new Uint8Array(64 * 1024);
			} finally {
				finished();
			}
		});
	let written = 0;
	await expect(
		writeZipExport(
			{ items: [{ type: "file" }] },
			new WritableStream({
				write(chunk) {
					written += chunk.length;
					if (written > 1024 * 1024) throw new Error("Disk full");
				},
			}),
		),
	).rejects.toThrow("Disk full");
	expect(finished).toHaveBeenCalledTimes(1);
});
