import Papa from "papaparse";
import cryptoLibrary from "./crypto-library";
import importer from "./import-delinea-secretserver-csv";
import importService from "./import";

const headers = [
	"Secret Name",
	"Username",
	"URL",
	"Password",
	"Notes",
	"Date Created",
	"Expires",
	"Folder",
	"TOTP Key",
	"TOTP Backup Codes",
];
const key = "JBSWY3DPEHPK3PXP";

describe("Delinea SecretServer CSV importer", () => {
	beforeEach(() => {
		jest.spyOn(cryptoLibrary, "generateUuid").mockReturnValue("import-uuid");
	});
	afterEach(() => jest.restoreAllMocks());

	it("is available in the import selector", () => {
		expect(importService.getImporter()).toContainEqual({
			name: "Delinea SecretServer (CSV)",
			value: "delinea_secretserver_csv",
			parser: importer.parser,
		});
	});

	it("imports the sample format and reuses nested folders", () => {
		const csv = Papa.unparse([
			headers,
			[
				"Server",
				"user@example.com",
				"",
				' password,"123" ',
				"",
				"",
				"",
				"\\Personal Folders\\Test User\\TEST",
				"",
				"",
			],
			[
				"Other",
				"admin",
				"",
				"other",
				"",
				"",
				"",
				"\\Personal Folders\\Test User\\TEST",
				"",
				"",
			],
		]);
		const result = importer.parser(csv + "\r\n\r\n,,,,,,,,,\r\n");
		expect(result).not.toBeNull();
		const folder = result!.datastore.folders[0].folders[0].folders[0];
		expect(result!.datastore.folders).toHaveLength(1);
		expect(result!.datastore.folders[0].name).toBe("Personal Folders");
		expect(folder.name).toBe("TEST");
		expect(folder.items).toEqual(result!.secrets);
		expect(result!.secrets).toHaveLength(2);
		expect(result!.secrets[0]).toMatchObject({
			type: "application_password",
			name: "Server",
			description: "user@example.com",
			application_password_username: "user@example.com",
			application_password_password: ' password,"123" ',
			application_password_notes: "",
		});
	});

	it("preserves quoted notes, backup codes and extra fields while omitting dates", () => {
		const result = importer.parser(
			Papa.unparse([
				[...headers, "Domain"],
				[
					"Website",
					"admin",
					"https://example.com/login",
					"00123",
					'First, line\nSecond "line"',
					"2020-01-01",
					"2030-01-01",
					"",
					key,
					"111,222",
					"EXAMPLE",
				],
			]),
		);
		expect(result!.datastore.items).toEqual(result!.secrets);
		expect(result!.secrets[0]).toMatchObject({
			type: "website_password",
			urlfilter: "example.com",
			website_password_password: "00123",
			website_password_url: "https://example.com/login",
			website_password_notes:
				'First, line\nSecond "line"\nTOTP Backup Codes: 111,222\nDomain: EXAMPLE',
			website_password_totp_code: key,
			website_password_totp_algorithm: "SHA1",
			website_password_totp_period: 30,
			website_password_totp_digits: 6,
		});
	});

	it("imports a separate TOTP with URI parameters in the same folder", () => {
		const result = importer.parser(
			Papa.unparse([
				headers,
				[
					"Server",
					"admin",
					"",
					"pw",
					"",
					"",
					"",
					"\\Servers",
					`otpauth://totp/Server?secret=${key}&algorithm=SHA256&digits=8&period=60`,
					"backup",
				],
			]),
		);
		expect(result!.secrets).toHaveLength(2);
		expect(result!.datastore.folders[0].items).toEqual(result!.secrets);
		expect(result!.secrets[1]).toMatchObject({
			type: "totp",
			name: "Server TOTP",
			totp_code: key,
			totp_algorithm: "SHA256",
			totp_digits: 8,
			totp_period: 60,
			totp_notes: "backup",
		});
	});

	it("supports reordered BOM-prefixed headers without leaking column indexes", () => {
		const result = importer.parser(
			"\uFEFF PASSWORD , URL , USERNAME , SECRET NAME \r\n00123,https://example.com,user,Title\r\n",
		);
		expect(result!.secrets[0]).toMatchObject({
			name: "Title",
			website_password_password: "00123",
			website_password_username: "user",
		});
		const next = importer.parser(
			"Secret Name,Username,URL,Password\nServer,admin,,pw",
		);
		expect(next!.secrets[0].application_password_password).toBe("pw");
	});

	it("imports notes and bookmarks and retains invalid TOTP keys", () => {
		const result = importer.parser(
			Papa.unparse([
				headers,
				["Note", "", "", "", "body", "", "", "", "invalid key", ""],
				[
					"Link",
					"",
					"https://example.com",
					"",
					"link note",
					"",
					"",
					"",
					"",
					"",
				],
			]),
		);
		expect(result!.secrets).toHaveLength(2);
		expect(result!.secrets[0]).toMatchObject({
			type: "note",
			note_notes: "body\nTOTP Key: invalid key",
		});
		expect(result!.secrets[1]).toMatchObject({
			type: "bookmark",
			bookmark_url: "https://example.com",
			bookmark_notes: "link note",
		});
	});

	it.each([
		"",
		"name,username,password\nA,B,C",
		'Secret Name,Username,URL,Password\n"unterminated',
		"Secret Name,Username,URL,Password\nA,B",
	])("rejects invalid input: %s", (input) => {
		expect(importer.parser(input)).toBeNull();
	});
});
