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

	it.each([
		"javascript:alert(document.domain)",
		"javascript://example.com/%0aalert(document.domain)",
		"JaVaScRiPt:alert(document.domain)",
		" \njava\tscript:alert(document.domain)",
		"data:text/html,<script>alert(document.domain)</script>",
		"vbscript:msgbox(1)",
	])("replaces an unsafe custom launch URL (%p) with about:blank", (passkey_url) => {
		const content = {
			passkey_url,
			passkey_rp_id: "example.com",
			passkey_url_filter: "example.com#credential-id",
		};
		expect(getPasskeyUrl(content)).toBe("about:blank");
		expect(content.passkey_url).toBe(passkey_url);
		expect(content.passkey_rp_id).toBe("example.com");
		expect(content.passkey_url_filter).toBe("example.com#credential-id");
	});

	it.each([
		{ passkey_rp_id: "javascript://example.com/%0aalert(1)" },
		{
			passkey_url_filter: "javascript://example.com/%0aalert(1)#credential-id",
		},
	])("sanitizes an unsafe URL derived from the passkey scope (%p)", (content) => {
		expect(getPasskeyUrl(content)).toBe("about:blank");
	});

	it.each([
		"https://login.example.com/account?next=%2Fvault#login",
		"http://localhost:8080/login",
		"login.example.com/account",
	])("preserves a safe custom launch URL (%p)", (passkey_url) => {
		expect(getPasskeyUrl({ passkey_url })).toBe(passkey_url);
	});
});
