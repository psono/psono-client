import { TextDecoder as NativeTextDecoder } from "util";
import importer from "./import-samsung-pass";

// Synthetic export verified with NHClaessens/samsung_pass_converter/convert.py
// (Git blob 6c5c100150d79fe361fe92cf8cdf0a3443834ce4).
const spass =
	"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjfQQUEbOlaF347ttHdaNWXzceUq6Cty24icyz6uSDgzz0+1bSBUUXOVoRvJh63hQjIq8dL5Q7FWTvhiKQ39mHEz88Tt0dIuj+Deljn0PM8UUr/kQk/xaBNdO66OL/ClgcjLwHB9QaeSnGIakCnDWfJvrp86/NBbjgaWjGDH3RUoph71X+c1El9pZ3uK0Y49DEqqciLRc3/EShRSYtNLCbGKITStp+lfiH+csvNWAu789oPfC4pb/96gWXLIp05dBHOOQcbIUFMtdMtjJKhvfSieH6/BkyRH3JmWLHbnBSxgARpe6KBq4BI4lOv9rLLNB8a0jvrxtXBTOOygAuAG7n6Ntt1GV2WkpHWqRo68n+rd4s/dGVV9EjSaeGs5m0qPVBKf9VlZmmlaznoNsnQST/KVXKoXOOsK7KL4oC2jGNr0j9tvsEUiReVDuZtIet0yqpnbEfW1UAu7WOc4vUBR9ItZ9lT9imBDDDKKnpEz77fd9mnA8fiFOfJ/QbiOpDXndgXevUV3Y833H3TQqLaeR3wufh4sQV6fnQaJA+tqVd7wdPiJZpTx2MSgGIfMQR8JhYxzcUmmCLIeyrTKp7JRWdWg5D5QdNwCOjZE3e9QCOzPYmuuhg8VHXJ/xpuTVIYoAhluIdorxjut2L0b5hxEK7t+t9juGCVsXyfMWhhqRtfy8Qq8pF7GWdcFKzYWoHig8YrA3NpBGV+cy91OSZU6dtBk+rd/ZbTZRaj3vjFnkGQSXdbTZh+uHkwGLi4Xk+GgGJTky9GST4uknq1p7TmKuQGwsugGKuuzLt4YDV5wrni4hol1dIXtT0iMnaafKX3CpCPlDNlQinkS4a+UelXbrpoxNd2VXcibcCHzvam82UWGhwXCzInM7Lbsb82rfxmnTcpW4qKM8aUBztBC41M/+1UWvayo8V2bvEcE03OEpAREKlZxzX1n2VEzQdUfmzh1VVANidouD4wPn5N30o4EDAEIJIUWYPh6dWbltpLBWm4DqxKZHxFH5GjqJKlZM7RBgz6fYOw4gV4Dbd0Rh3zhO+XpQZQeanrhRaP1njfDyelX80N1YHQZ33/gRRTzuqLwFIdXhmTrpjvZ15pU3pKy6QAtntaTnrLdw+n2aO0exIfIiceEXAZEvI74LZksTlcyTs9A5PYCCtPGZUlrex46tekQaONxp54t5NOZf/Wki1YZpmC1yGI0VcV49tygPZ175aMhO010qiGhIjZKr8jg7fcfUa70KhSJ/Y2mKA0Eqlh+wmHQgiHleHOw6MDIYjUh0qI1CyOPkKqJjsXlWKpSm3UdMrkoqMa5XwVmbFGwB8ElILH6rMU6qlZtqqY+O2ukUN44lNTeTsOxR71jATrAysyRHx/+NgvluuF0+QAvnoVcM=";
const plaintext = `Samsung Pass synthetic export
next_table
title;credential_memo;origin_url;username_value;password_value;otp
VW5pY29kZSDsgrzshLEg8J+UkQ==;Rmlyc3QgbGluZQpTZWNvbmQgbGluZTsgR3LDvMOfZQ==;aHR0cHM6Ly9leGFtcGxlLmNvbTo4NDQzL2xvZ2lu;IGFsaWNlQGV4YW1wbGUuY29tIA==;ICBww6Rzczt3b3JkCmxpbmUgIA==;SkJTV1kzRFBFSFBLM1BYUA==
Plain login!;Raw: note!;http://intranet.example/login;raw@example.com;abc;&&&NULL&&&
VVJJIFRPVFA=;VVJJIHNldHRpbmdz;aHR0cHM6Ly9vdHAuZXhhbXBsZQ==;YWxpY2U=;cGFzc3dvcmQh;b3RwYXV0aDovL3RvdHAvRXhhbXBsZTphbGljZT9zZWNyZXQ9SkJTV1kzRFBFSFBLM1BYUCZhbGdvcml0aG09U0hBMjU2JmRpZ2l0cz04JnBlcmlvZD02MA==
SW52YWxpZCBUT1RQ;;;;/w==;bm90IGEgdmFsaWQgb3RwIQ==
RXhpc3Rpbmcgbm90ZXM=;RXhpc3RpbmcK;YW5kcm9pZGFwcDovL2NvbS5leGFtcGxlLmFwcA==;Ym9i;cGFzc3dvcmQh;aW52YWxpZCE=
R3JvdXBlZCBUT1RQ;;aHR0cHM6Ly9ncm91cGVkLmV4YW1wbGU=;Ym9i;cGFzc3dvcmQh;ICBqYnN3IHkzZHAgZWhwayAzcHhwICA=
malformed;row

outside table
next_table
title;username_value;password_value
TWluaW1hbCBsb2dpbg==;bWluaW1hbEBleGFtcGxlLmNvbQ==;

next_table
setting;value
theme!;dark!
`.replace(/\n/g, "\r\n");
const password = "Samsung-test-密碼!";
const expected = [
	{
		type: "website_password",
		name: "Unicode 삼성 🔑",
		description: " alice@example.com ",
		urlfilter: "example.com:8443",
		website_password_title: "Unicode 삼성 🔑",
		website_password_notes: "First line\nSecond line; Grüße",
		website_password_url: "https://example.com:8443/login",
		website_password_url_filter: "example.com:8443",
		website_password_username: " alice@example.com ",
		website_password_password: "  päss;word\nline  ",
		custom_fields: [],
		website_password_totp_code: "JBSWY3DPEHPK3PXP",
		website_password_totp_algorithm: "SHA1",
		website_password_totp_digits: 6,
		website_password_totp_period: 30,
	},
	{
		type: "website_password",
		name: "Plain login!",
		description: "raw@example.com",
		urlfilter: "intranet.example",
		website_password_title: "Plain login!",
		website_password_notes: "Raw: note!",
		website_password_url: "http://intranet.example/login",
		website_password_url_filter: "intranet.example",
		website_password_username: "raw@example.com",
		website_password_password: "abc",
		custom_fields: [],
	},
	{
		type: "website_password",
		name: "URI TOTP",
		description: "alice",
		urlfilter: "otp.example",
		website_password_title: "URI TOTP",
		website_password_notes: "URI settings",
		website_password_url: "https://otp.example",
		website_password_url_filter: "otp.example",
		website_password_username: "alice",
		website_password_password: "password!",
		custom_fields: [],
		website_password_totp_code: "JBSWY3DPEHPK3PXP",
		website_password_totp_algorithm: "SHA256",
		website_password_totp_digits: 8,
		website_password_totp_period: 60,
	},
	{
		type: "website_password",
		name: "Invalid TOTP",
		description: "",
		urlfilter: "",
		website_password_title: "Invalid TOTP",
		website_password_notes: "TOTP: not a valid otp!",
		website_password_url: "",
		website_password_url_filter: "",
		website_password_username: "",
		website_password_password: "/w==",
		custom_fields: [],
	},
	{
		type: "website_password",
		name: "Existing notes",
		description: "bob",
		urlfilter: "com.example.app",
		website_password_title: "Existing notes",
		website_password_notes: "Existing\nTOTP: invalid!",
		website_password_url: "androidapp://com.example.app",
		website_password_url_filter: "com.example.app",
		website_password_username: "bob",
		website_password_password: "password!",
		custom_fields: [],
	},
	{
		type: "website_password",
		name: "Grouped TOTP",
		description: "bob",
		urlfilter: "grouped.example",
		website_password_title: "Grouped TOTP",
		website_password_notes: "",
		website_password_url: "https://grouped.example",
		website_password_url_filter: "grouped.example",
		website_password_username: "bob",
		website_password_password: "password!",
		custom_fields: [],
		website_password_totp_code: "JBSWY3DPEHPK3PXP",
		website_password_totp_algorithm: "SHA1",
		website_password_totp_digits: 6,
		website_password_totp_period: 30,
	},
	{
		type: "website_password",
		name: "Minimal login",
		description: "minimal@example.com",
		urlfilter: "",
		website_password_title: "Minimal login",
		website_password_notes: "",
		website_password_url: "",
		website_password_url_filter: "",
		website_password_username: "minimal@example.com",
		website_password_password: "",
		custom_fields: [],
	},
];

describe("Samsung Pass importer", () => {
	// Web Crypto returns Node-realm buffers that the old test polyfill cannot read.
	const originalDecoder = global.TextDecoder;
	beforeAll(() => {
		Object.defineProperty(global, "TextDecoder", { value: NativeTextDecoder });
	});
	afterAll(() => {
		global.TextDecoder = originalDecoder;
	});
	it.each([
		"encrypted",
		"plaintext",
		"wrapped base64",
	])("imports the embedded %s export without losing data", async (format) => {
		const input =
			format === "plaintext"
				? plaintext
				: format === "wrapped base64"
					? spass.replace(/(.{64})/g, "$1\r\n")
					: spass;
		const result = await importer.parser(
			input,
			undefined,
			format === "plaintext" ? "" : password,
		);
		expect(result).not.toBeNull();
		expect(result!.secrets.map(({ id, ...secret }) => secret)).toEqual(
			expected,
		);
		expect(result!.datastore.items).toEqual(result!.secrets);
		expect(new Set(result!.secrets.map(({ id }) => id)).size).toBe(7);
	});

	it.each([
		"wrong password",
		"",
	])("rejects incorrect or missing password %j", async (value) => {
		await expect(importer.parser(spass, undefined, value)).rejects.toEqual({
			errors: ["DECRYPTION_OF_EXPORT_FAILED_WRONG_PASSWORD"],
		});
	});

	it("rejects damaged PKCS7 padding", async () => {
		const bytes = Buffer.from(spass, "base64");
		// Flip the last plaintext byte via the previous CBC ciphertext block.
		bytes[bytes.length - 17] ^= 0xff;
		await expect(
			importer.parser(bytes.toString("base64"), undefined, password),
		).rejects.toEqual({
			errors: ["DECRYPTION_OF_EXPORT_FAILED_WRONG_PASSWORD"],
		});
	});

	it.each([
		"",
		"not a spass file!",
		"AAAA",
		"====",
		"next_table\nsetting;value\ntheme!;dark!",
		Buffer.alloc(53).toString("base64"),
	])("rejects malformed/unsupported input %j", async (value) => {
		expect(await importer.parser(value)).toBeNull();
	});

	it("accepts an empty credential table", async () => {
		const result = await importer.parser(
			"next_table\ntitle;username_value;password_value\n",
		);
		expect(result!.secrets).toEqual([]);
	});
});
