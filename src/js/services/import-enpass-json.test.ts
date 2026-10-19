import importEnpassJson from "./import-enpass-json";

describe("Service: importEnpassJson test suite", () => {
	it.each([
		"uri",
		"base32",
	])("imports inline TOTP settings from %s", (format) => {
		const code = "JBSWY3DPEHPK3PXP";
		const totp =
			format === "uri"
				? `otpauth://totp/Account?secret=${code}&algorithm=SHA256&digits=8&period=60`
				: code;
		const output = importEnpassJson.parser(
			JSON.stringify({
				items: [
					{
						title: "Account",
						note: "backup",
						fields: [
							{ type: "username", value: "alice", label: "Username" },
							{
								type: "url",
								value: "https://www.example.com:8443/login?foo=bar#section",
								label: "URL",
							},
							{ type: "totp", value: totp, label: "TOTP" },
						],
					},
				],
			}),
		);
		expect(output).not.toBeNull();
		expect(output!.secrets).toHaveLength(1);
		expect(output!.secrets[0]).toMatchObject({
			type: "website_password",
			website_password_totp_code: code,
			website_password_totp_algorithm: format === "uri" ? "SHA256" : "SHA1",
			website_password_totp_digits: format === "uri" ? 8 : 6,
			website_password_totp_period: format === "uri" ? 60 : 30,
		});
	});

	it("populates standalone TOTP filters from the URL", () => {
		const code = "JBSWY3DPEHPK3PXP";
		const output = importEnpassJson.parser(
			JSON.stringify({
				items: [
					{
						title: "Account",
						note: "backup",
						fields: [
							{
								type: "url",
								value: "https://www.example.com:8443/login?foo=bar#section",
								label: "URL",
							},
							{ type: "totp", value: code, label: "TOTP" },
						],
					},
				],
			}),
		);
		expect(output).not.toBeNull();
		const totps = output!.secrets.filter((entry) => entry.type === "totp");
		expect(totps).toHaveLength(1);
		expect(totps[0]).toMatchObject({
			totp_code: code,
			totp_url_filter: "www.example.com:8443",
			urlfilter: "www.example.com:8443",
		});
	});
});
