import { getPasskeyUrl } from "./passkey-url";

describe("Passkey launch URLs", () => {
	it("preserves a custom launch URL and authentication scope", () => {
		const content = {
			passkey_url: "https://login.example.com/account",
			passkey_rp_id: "example.com",
			passkey_url_filter: "example.com#credential-id",
		};
		expect(getPasskeyUrl(content)).toBe(content.passkey_url);
		expect(content.passkey_rp_id).toBe("example.com");
		expect(content.passkey_url_filter).toBe("example.com#credential-id");
	});

	it.each([
		undefined,
		"",
		"  ",
	])("defaults an empty URL (%p) to the RP domain", (passkey_url) => {
		expect(getPasskeyUrl({ passkey_url, passkey_rp_id: "example.com" })).toBe(
			"https://example.com",
		);
	});

	it("uses a legacy authority filter without its credential ID", () => {
		expect(
			getPasskeyUrl({ passkey_url_filter: "example.com:8443#abcdef" }),
		).toBe("https://example.com:8443");
	});

	it("does not invent a URL for a passkey without a domain", () => {
		expect(getPasskeyUrl({})).toBe("");
	});
});
