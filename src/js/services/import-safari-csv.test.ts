import cryptoLibrary from "./crypto-library";
import importSafariCsv from "./import-safari-csv";

describe("Service: importSafariCsv test suite", () => {
	it("imports non-default TOTP settings directly on the website password", () => {
		const code = "JBSWY3DPEHPK3PXP";
		const uri = `otpauth://totp/Account?secret=${code}&algorithm=SHA256&digits=8&period=60`;
		const output = importSafariCsv.parser(
			"Title,URL,Username,Password,Notes,OTPAuth\n" +
				[
					"Account",
					"https://www.example.com:8443/login?foo=bar#section",
					"alice",
					"",
					"backup",
					uri,
				].join(","),
		);
		expect(output).not.toBeNull();
		expect(output!.secrets).toHaveLength(1);
		expect(output!.secrets[0]).toMatchObject({
			type: "website_password",
			website_password_totp_code: code,
			website_password_totp_algorithm: "SHA256",
			website_password_totp_digits: 8,
			website_password_totp_period: 60,
		});
	});

	it("helper exists", () => {
		expect(importSafariCsv).toBeDefined();
	});

	it("parse", () => {
		const generic_uuid = "1fce01f4-6411-47a9-885c-a80bf4c654aa";
		cryptoLibrary.generateUuid = jest.fn(() => generic_uuid);

		const input =
			"Title,URL,Username,Password,Notes,OTPAuth\n" +
			"www.amazon.com (jdoe13),https://www.amazon.com/ap/signin,jdoe13@gmail.com,asdfasdf,some note," +
			"";

		const output = importSafariCsv.parser(input);
		if (!output) throw new Error("Expected a successful import");

		const expected_output = {
			datastore: {
				id: generic_uuid,
				name: output.datastore.name,
				folders: [],
				items: [
					{
						id: generic_uuid,
						type: "website_password",
						name: "www.amazon.com (jdoe13)",
						urlfilter: "www.amazon.com",
						website_password_url_filter: "www.amazon.com",
						website_password_password: "asdfasdf",
						website_password_username: "jdoe13@gmail.com",
						description: "jdoe13@gmail.com",
						website_password_notes: "some note",
						website_password_url: "https://www.amazon.com/ap/signin",
						website_password_title: "www.amazon.com (jdoe13)",
					},
				],
			},
			secrets: [
				{
					id: generic_uuid,
					type: "website_password",
					name: "www.amazon.com (jdoe13)",
					urlfilter: "www.amazon.com",
					website_password_url_filter: "www.amazon.com",
					website_password_password: "asdfasdf",
					website_password_username: "jdoe13@gmail.com",
					description: "jdoe13@gmail.com",
					website_password_notes: "some note",
					website_password_url: "https://www.amazon.com/ap/signin",
					website_password_title: "www.amazon.com (jdoe13)",
				},
			],
		};

		expect(JSON.parse(JSON.stringify(output))).toEqual(expected_output);
	});
});
