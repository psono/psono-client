import cryptoLibraryService from "./crypto-library";
import datastorePasswordService from "./datastore-password";
import importService from "./import";
import secretService from "./secret";
import type { ExportItem } from "../../types/import";
import type { BulkSecretInput } from "../../types/vault";

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
