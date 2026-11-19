import cryptoLibraryService from "./crypto-library";
import datastorePasswordService from "./datastore-password";
import importService from "./import";
import secretService from "./secret";
import type { ExportItem } from "../../types/import";
import type { BulkSecretInput } from "../../types/vault";
import { TextDecoder as NativeTextDecoder } from "util";

jest.mock("./datastore-password", () => ({
	getPasswordDatastore: jest.fn(() =>
		Promise.resolve({ datastore_id: "test-datastore-id" }),
	),
	analyzeBreadcrumbs: jest.fn(() => ({
		target: { folders: [] },
		path: [],
		parent_datastore_id: "test-datastore-id",
	})),
	updateParents: jest.fn(),
	handleDatastoreContentChanged: jest.fn(() => Promise.resolve()),
	saveDatastoreContent: jest.fn(() => Promise.resolve()),
}));

jest.mock("./secret", () => ({
	createSecretBulk: jest.fn((objects: BulkSecretInput[]) =>
		Promise.resolve(
			objects.map((obj, index) => ({
				link_id: obj.linkId,
				secret_id: `secret-id-${index}`,
				secret_key: `secret-key-${index}`,
			})),
		),
	),
}));

jest.mock("./item-blueprint", () => ({
	getEntryTypes: jest.fn(() => [
		{ value: "website_password" },
		{ value: "application_password" },
	]),
}));

function importedItem() {
	const folder = jest.mocked(datastorePasswordService.updateParents).mock
		.calls[0][0];
	const item = folder.items?.[0];
	if (!item) throw new Error("Expected an imported datastore item");
	return item;
}

function createdContent() {
	return jest.mocked(secretService.createSecretBulk).mock.calls[0][0][0]
		.content;
}

async function importNativeSecret(secret: ExportItem) {
	await expect(
		importService.importDatastore(
			"psono_pw_json",
			JSON.stringify({ items: [secret] }),
		),
	).resolves.toEqual({ msgs: ["IMPORT_SUCCESSFUL"] });
	return importedItem();
}

describe("Import Service: password_hash calculation test suite", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("requires file storage for ZIP imports before creating any secrets", async () => {
		await expect(
			importService.importDatastore("bitwarden_zip", ""),
		).rejects.toEqual({
			errors: ["BITWARDEN_ZIP_REQUIRES_FILE_STORAGE"],
		});
		expect(secretService.createSecretBulk).not.toHaveBeenCalled();
	});

	it("enables HTTP matching for imported HTTP website passwords", async () => {
		await importService.importDatastore(
			"bitwarden_json",
			JSON.stringify({
				items: [
					{
						type: 1,
						name: "Intranet",
						login: { uris: [{ uri: "http://intranet.example/login" }] },
					},
				],
			}),
		);
		expect(importedItem().allow_http).toBe(true);
		expect(createdContent().website_password_allow_http).toBe(true);
	});

	it("passes the Samsung Pass export password through the import pipeline", async () => {
		const spass =
			"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjfQQUEbOlaF347ttHdaNWXzceUq6Cty24icyz6uSDgzz0+1bSBUUXOVoRvJh63hQjIq8dL5Q7FWTvhiKQ39mHEz88Tt0dIuj+Deljn0PM8UUr/kQk/xaBNdO66OL/ClgcjLwHB9QaeSnGIakCnDWfJvrp86/NBbjgaWjGDH3RUoph71X+c1El9pZ3uK0Y49DEqqciLRc3/EShRSYtNLCbGKITStp+lfiH+csvNWAu789oPfC4pb/96gWXLIp05dBHOOQcbIUFMtdMtjJKhvfSieH6/BkyRH3JmWLHbnBSxgARpe6KBq4BI4lOv9rLLNB8a0jvrxtXBTOOygAuAG7n6Ntt1GV2WkpHWqRo68n+rd4s/dGVV9EjSaeGs5m0qPVBKf9VlZmmlaznoNsnQST/KVXKoXOOsK7KL4oC2jGNr0j9tvsEUiReVDuZtIet0yqpnbEfW1UAu7WOc4vUBR9ItZ9lT9imBDDDKKnpEz77fd9mnA8fiFOfJ/QbiOpDXndgXevUV3Y833H3TQqLaeR3wufh4sQV6fnQaJA+tqVd7wdPiJZpTx2MSgGIfMQR8JhYxzcUmmCLIeyrTKp7JRWdWg5D5QdNwCOjZE3e9QCOzPYmuuhg8VHXJ/xpuTVIYoAhluIdorxjut2L0b5hxEK7t+t9juGCVsXyfMWhhqRtfy8Qq8pF7GWdcFKzYWoHig8YrA3NpBGV+cy91OSZU6dtBk+rd/ZbTZRaj3vjFnkGQSXdbTZh+uHkwGLi4Xk+GgGJTky9GST4uknq1p7TmKuQGwsugGKuuzLt4YDV5wrni4hol1dIXtT0iMnaafKX3CpCPlDNlQinkS4a+UelXbrpoxNd2VXcibcCHzvam82UWGhwXCzInM7Lbsb82rfxmnTcpW4qKM8aUBztBC41M/+1UWvayo8V2bvEcE03OEpAREKlZxzX1n2VEzQdUfmzh1VVANidouD4wPn5N30o4EDAEIJIUWYPh6dWbltpLBWm4DqxKZHxFH5GjqJKlZM7RBgz6fYOw4gV4Dbd0Rh3zhO+XpQZQeanrhRaP1njfDyelX80N1YHQZ33/gRRTzuqLwFIdXhmTrpjvZ15pU3pKy6QAtntaTnrLdw+n2aO0exIfIiceEXAZEvI74LZksTlcyTs9A5PYCCtPGZUlrex46tekQaONxp54t5NOZf/Wki1YZpmC1yGI0VcV49tygPZ175aMhO010qiGhIjZKr8jg7fcfUa70KhSJ/Y2mKA0Eqlh+wmHQgiHleHOw6MDIYjUh0qI1CyOPkKqJjsXlWKpSm3UdMrkoqMa5XwVmbFGwB8ElILH6rMU6qlZtqqY+O2ukUN44lNTeTsOxR71jATrAysyRHx/+NgvluuF0+QAvnoVcM=";
		const originalDecoder = global.TextDecoder;
		Object.defineProperty(global, "TextDecoder", { value: NativeTextDecoder });
		try {
			await expect(
				importService.importDatastore(
					"samsung_pass",
					spass,
					undefined,
					"wrong",
				),
			).rejects.toEqual({
				errors: ["DECRYPTION_OF_EXPORT_FAILED_WRONG_PASSWORD"],
			});
			expect(secretService.createSecretBulk).not.toHaveBeenCalled();
			await expect(
				importService.importDatastore(
					"samsung_pass",
					spass,
					undefined,
					"Samsung-test-密碼!",
				),
			).resolves.toEqual({ msgs: ["IMPORT_SUCCESSFUL"] });
			expect(createdContent().website_password_password).toBe(
				"  päss;word\nline  ",
			);
			expect(
				jest.mocked(secretService.createSecretBulk).mock.calls[0][0],
			).toHaveLength(7);
		} finally {
			global.TextDecoder = originalDecoder;
		}
	});

	it("preserves an explicit HTTP autofill setting", async () => {
		const item = await importNativeSecret({
			type: "website_password",
			name: "Intranet",
			website_password_url: "http://intranet.example/login",
			allow_http: false,
			website_password_allow_http: false,
		});
		expect(item.allow_http).toBe(false);
		expect(createdContent().website_password_allow_http).toBe(false);
	});

	it("preserves password age in native imports inside the encrypted secret", async () => {
		const timestamp = "2025-01-01T09:00:00.123456Z";
		const item = await importNativeSecret({
			type: "website_password",
			website_password_password: "password",
			password_modification_datetime: timestamp,
		});
		expect(createdContent().password_modification_datetime).toBe(timestamp);
		expect(item).not.toHaveProperty("password_modification_datetime");
	});

	it("should calculate password_hash for website_password during import", async () => {
		const testPassword = "testPassword123";
		const item = await importNativeSecret({
			type: "website_password",
			name: "Test Website",
			website_password_password: testPassword,
			website_password_username: "testuser",
			website_password_url: "https://example.com",
		});
		expect(item.password_hash).toBe(
			cryptoLibraryService.sha1(testPassword).substring(0, 5).toLowerCase(),
		);
		expect(createdContent().website_password_password).toBe(testPassword);
		expect(item).not.toHaveProperty("website_password_password");
		expect(item.secret_id).toBe("secret-id-0");
		expect(item.secret_key).toBe("secret-key-0");
	});

	it("should set empty password_hash for empty password during import", async () => {
		const item = await importNativeSecret({
			type: "website_password",
			website_password_password: "",
		});
		expect(item.password_hash).toBe("");
		expect(createdContent().website_password_password).toBe("");
	});

	it("should calculate password_hash for application_password during import", async () => {
		const testPassword = "appPassword456";
		const item = await importNativeSecret({
			type: "application_password",
			application_password_password: testPassword,
		});
		expect(item.password_hash).toBe(
			cryptoLibraryService.sha1(testPassword).substring(0, 5).toLowerCase(),
		);
		expect(createdContent().application_password_password).toBe(testPassword);
		expect(item).not.toHaveProperty("application_password_password");
	});
});
