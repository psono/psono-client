import { Blob as NodeBlob } from "buffer";
import { deflateRawSync } from "zlib";
import { openBitwardenZip, importZipAttachments } from "./import-bitwarden-zip";
import secretService from "./secret";
import fileTransfer from "./file-transfer";
import importBitwardenJson from "./import-bitwarden-json";
import type { ParsedImport } from "../../types/import";

// jsdom does not provide the browser Streams and Blob APIs used by zip.js.
Object.assign(global, require("stream/web"));
Object.defineProperty(global, "Blob", { value: NodeBlob });

jest.mock("./crypto-library", () => ({
	generateUuid: () => Math.random().toString(),
	generateSecretKey: () => "key",
	encryptFile: jest.fn(async (bytes: Uint8Array) => bytes.slice()),
	sha512: () => "hash",
}));
jest.mock("./secret", () => ({
	readSecret: jest.fn(),
	writeSecret: jest.fn(),
}));
jest.mock("./file-transfer", () => ({
	createFile: jest.fn(),
	upload: jest.fn(),
	deleteFile: jest.fn(),
}));
jest.mock("./helper", () => ({
	parseUrl: () => ({ authority: "example.com" }),
}));

function archive(files: Record<string, string>, compressed = false): Blob {
	const local: Buffer[] = [];
	const central: Buffer[] = [];
	let offset = 0;
	for (const [name, text] of Object.entries(files)) {
		const filename = Buffer.from(name);
		const plain = Buffer.from(text);
		const content = compressed ? deflateRawSync(plain) : plain;
		let crc = 0xffffffff;
		for (const byte of plain) {
			crc ^= byte;
			for (let bit = 0; bit < 8; bit++)
				crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
		const header = Buffer.alloc(30);
		header.writeUInt32LE(0x04034b50, 0);
		header.writeUInt16LE(20, 4);
		header.writeUInt16LE(compressed ? 8 : 0, 8);
		header.writeUInt32LE((crc ^ 0xffffffff) >>> 0, 14);
		header.writeUInt32LE(content.length, 18);
		header.writeUInt32LE(plain.length, 22);
		header.writeUInt16LE(filename.length, 26);
		const directory = Buffer.alloc(46);
		directory.writeUInt32LE(0x02014b50, 0);
		directory.writeUInt16LE(20, 4);
		header.copy(directory, 6, 4, 28);
		directory.writeUInt32LE(offset, 42);
		local.push(header, filename, content);
		central.push(directory, filename);
		offset += header.length + filename.length + content.length;
	}
	const directory = Buffer.concat(central);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(central.length / 2, 8);
	end.writeUInt16LE(central.length / 2, 10);
	end.writeUInt32LE(directory.length, 12);
	end.writeUInt32LE(offset, 16);
	return new NodeBlob([...local, directory, end]) as unknown as Blob;
}

function manifest(items: object[]) {
	return JSON.stringify({ encrypted: false, items });
}

it("preserves all JSON entry conversions and folder placement in its own parser", async () => {
	const json = JSON.stringify({
		encrypted: false,
		folders: [
			{ id: "parent", name: "Work" },
			{ id: "child", name: "Work/Accounts" },
		],
		items: [
			{
				id: "login",
				type: 1,
				name: "Website",
				folderId: "child",
				notes: "Login notes",
				fields: [{ name: "extra", type: 1, value: "secret" }],
				login: {
					username: "alice",
					password: "password",
					uris: [
						{ uri: "https://example.com" },
						{ uri: "https://other.example.com" },
					],
					totp: "JBSW Y3DP EHPK 3PXP",
				},
			},
			{
				id: "invalid-totp",
				type: 1,
				name: "Invalid TOTP",
				login: { totp: "invalid TOTP!" },
			},
			{
				id: "note",
				type: 2,
				name: "Secure note",
				folderId: "parent",
				notes: "Notes",
				fields: [{ name: "text", type: 0, value: "value" }],
				login: { totp: "JBSWY3DPEHPK3PXP" },
			},
			{
				id: "card",
				type: 3,
				name: "Card",
				folderId: "child",
				notes: "Card notes",
				card: {
					cardholderName: "Alice",
					number: "4111 1111 1111 1111",
					expMonth: "12",
					expYear: "2030",
					code: "123",
				},
			},
			{
				id: "identity",
				type: 4,
				name: "Identity",
				identity: { firstName: "Alice", email: "alice@example.com" },
			},
			{
				id: "ssh",
				type: 5,
				name: "SSH",
				sshKey: {
					publicKey: "public",
					privateKey: "private",
					keyFingerprint: "fingerprint",
				},
			},
			{ id: "unknown", type: 99, name: "Fallback", notes: "Unknown type" },
		],
	});
	const expected = importBitwardenJson.parser(json);
	expect(expected).not.toBeNull();
	const zip = await openBitwardenZip(
		archive({
			"data.json": json,
			"attachments/Secure note/proof.txt": "proof",
		}),
	);
	const normalize = (parsed: ParsedImport) =>
		JSON.parse(
			JSON.stringify(
				{ ...parsed, datastore: { ...parsed.datastore, name: "Import" } },
				(key, value) => (key === "id" ? undefined : value),
			),
		);
	try {
		expect(normalize(zip.parsed)).toEqual(normalize(expected!));
		expect(zip.attachments[0].secret.type).toBe("note");
		expect(zip.attachments[0].secret.name).toBe("Secure note");
	} finally {
		await zip.reader.close();
	}
});

it.each([
	false,
	true,
])("imports named attachments and preserves orphan files (deflated: %s)", async (compressed) => {
	const zip = await openBitwardenZip(
		archive(
			{
				"data.json": manifest([{ id: "item", type: 2, name: "Account" }]),
				"attachments/Account/key.pem": "private key",
				"attachments/Elster/a.pfx": "certificate A",
				"attachments/Elster/b.pfx": "certificate B",
			},
			compressed,
		),
	);
	try {
		expect(zip.parsed.secrets).toHaveLength(2);
		expect(zip.attachments.map(({ secret }) => secret.name)).toEqual([
			"Account",
			"Elster",
			"Elster",
		]);
		const output: number[] = [];
		await zip.attachments[0].entry.getData(
			new WritableStream({
				write(bytes) {
					output.push(...bytes);
				},
			}),
			{ checkSignature: true },
		);
		expect(Buffer.from(output).toString()).toBe("private key");
	} finally {
		await zip.reader.close();
	}
});

it("matches IDs before names and restores original filenames", async () => {
	const zip = await openBitwardenZip(
		archive({
			"data.json": manifest([
				{
					id: "item",
					type: 2,
					name: "Account",
					attachments: [{ id: "attachment", fileName: "original.txt" }],
				},
			]),
			"attachments/item/attachment": "content",
		}),
	);
	expect(zip.attachments[0].filename).toBe("original.txt");
	expect(zip.attachments[0].secret.name).toBe("Account");
	await zip.reader.close();
});

it("uploads entries sequentially and persists the attachment keys on their parent secret", async () => {
	const zip = await openBitwardenZip(
		archive(
			{
				"data.json": manifest([{ id: "item", type: 2, name: "Account" }]),
				"attachments/Account/first.txt": "first",
				"attachments/Account/second.txt": "second",
			},
			true,
		),
	);
	const content = { note_title: "Account", attachments: [] };
	jest.mocked(secretService.readSecret).mockResolvedValue(content);
	jest
		.mocked(secretService.writeSecret)
		.mockResolvedValue({ secret_id: "parent" });
	jest.mocked(fileTransfer.createFile).mockResolvedValue({
		file_id: "file",
		file_transfer_id: "transfer",
		file_transfer_secret_key: "transfer-key",
	});
	jest.mocked(fileTransfer.upload).mockResolvedValue(undefined);
	for (const attachment of zip.attachments) {
		attachment.secret.secret_id = "parent";
		attachment.secret.secret_key = "parent-key";
	}
	try {
		await importZipAttachments(
			zip.attachments,
			{
				id: "repository",
				type: "aws_s3",
				destination_type: "file_repository",
				title: "Repository",
			},
			jest.fn(),
		);
		expect(content.attachments).toEqual([
			expect.objectContaining({
				filename: "first.txt",
				file_secret_key: "key",
				file_repository_id: "repository",
			}),
			expect.objectContaining({
				filename: "second.txt",
				file_secret_key: "key",
				file_repository_id: "repository",
			}),
		]);
		expect(fileTransfer.createFile).toHaveBeenCalledWith(
			undefined,
			"repository",
			45,
			1,
			undefined,
			undefined,
			undefined,
			"parent",
		);
		expect(secretService.writeSecret).toHaveBeenCalledTimes(2);
		expect(
			jest.mocked(secretService.writeSecret).mock.invocationCallOrder[0],
		).toBeLessThan(
			jest.mocked(fileTransfer.createFile).mock.invocationCallOrder[1],
		);
	} finally {
		await zip.reader.close();
	}
});

it("rejects ambiguous entry names instead of attaching to the wrong secret", async () => {
	await expect(
		openBitwardenZip(
			archive({
				"data.json": manifest([
					{ type: 2, name: "Account" },
					{ type: 2, name: "Account" },
				]),
				"attachments/Account/key": "key",
			}),
		),
	).rejects.toEqual({ errors: ["FILE_FORMAT_WRONG"] });
});

it.each([
	{ "other.json": "{}" },
	{ "data.json": '{"encrypted": true, "items": []}' },
	{ "data.json": manifest([]), "attachments/../key": "key" },
])("rejects invalid exports", async (files) => {
	await expect(
		openBitwardenZip(archive(files as unknown as Record<string, string>)),
	).rejects.toEqual({ errors: ["FILE_FORMAT_WRONG"] });
});
