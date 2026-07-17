import cryptoLibrary from "../services/crypto-library";
import import1PasswordV8Csv from "./import-1password-v8-csv";

describe("Service: import1PasswordV8Csv test suite", () => {
	it("helper exists", () => {
		expect(import1PasswordV8Csv).toBeDefined();
	});

	it("parses the current 1Password v8 CSV format", () => {
		const generic_uuid = "1fce01f4-6411-47a9-885c-a80bf4c654aa";
		cryptoLibrary.generateUuid = jest.fn();
		cryptoLibrary.generateUuid.mockImplementation(() => generic_uuid);

		const input =
			"Title,Url,Username,Password,OTPAuth,Favorite,Archived,Tags,Notes\n" +
			"TICK-TICK TODO,https://ticktick.com/webapp/#q/all/tasks,g.mueller@kkh-hagen.de,xxxxxxxxxxxxxxxx,,false,false,GM,\n" +
			"Zimbra KKIMK GM,https://webmail.kkimk.de/,g.mueller@kkh-hagen.de,xxxxxxxxxxxxxxxxx,,false,false,GM,\n" +
			"PSONO ,https://kkhpsono.psono.app,mullerg@kkhpsono.psono.app,xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx,,false,false,GM,555df3a7153f72ab2327ed36fe335xxxxxxxxxxxxxxxxxxxxxx4cfe67cde5ebd6d7676a9\n" +
			"Sprecho KI,,g.mueller@kkh-hagen.de,xxxxxxxxxxxxxxxxxxxxxxxxx,,false,false,GM,\n" +
			"Amazon,https://eu-north-1.signin.aws.amazon.com/oauth?client_id=arn%3Aaws%3Asignin%3A%3A%3Aconsole%2Fcanvas&code_challenge=sSoL7h0DXezic9Yub3-bVOXkMUOaXs4jddADs9sZ-Aw&code_challenge_method=SHA-256&response_type=code&redirect_uri=https%3A%2F%2Fconsole.aws.amazon.com%2Fconsole%2Fhome%3FhashArgs%3D%2523%26isauthcode%3Dtrue%26state%3DhashArgsFromTB_eu-north-1_8e863a06ea4f6482,simsekk,kxxxxxxxxxxxxxxxxxmk8gyg,otpauth://totp/?secret=JBSWY3DPEHPK3PXP&period=30&algorithm=SHA1&digits=6,false,false,,";

		const output = import1PasswordV8Csv.parser(input);

		expect(output.secrets).toHaveLength(5);
		expect(output.datastore.items).toEqual(output.secrets);
		expect(output.secrets).toEqual([
			{
				id: generic_uuid,
				type: "website_password",
				name: "TICK-TICK TODO",
				description: "g.mueller@kkh-hagen.de",
				urlfilter: "ticktick.com",
				website_password_url_filter: "ticktick.com",
				website_password_password: "xxxxxxxxxxxxxxxx",
				website_password_username: "g.mueller@kkh-hagen.de",
				website_password_notes: "",
				website_password_url: "https://ticktick.com/webapp/#q/all/tasks",
				website_password_title: "TICK-TICK TODO",
			},
			{
				id: generic_uuid,
				type: "website_password",
				name: "Zimbra KKIMK GM",
				description: "g.mueller@kkh-hagen.de",
				urlfilter: "webmail.kkimk.de",
				website_password_url_filter: "webmail.kkimk.de",
				website_password_password: "xxxxxxxxxxxxxxxxx",
				website_password_username: "g.mueller@kkh-hagen.de",
				website_password_notes: "",
				website_password_url: "https://webmail.kkimk.de/",
				website_password_title: "Zimbra KKIMK GM",
			},
			{
				id: generic_uuid,
				type: "website_password",
				name: "PSONO ",
				description: "mullerg@kkhpsono.psono.app",
				urlfilter: "kkhpsono.psono.app",
				website_password_url_filter: "kkhpsono.psono.app",
				website_password_password: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				website_password_username: "mullerg@kkhpsono.psono.app",
				website_password_notes:
					"555df3a7153f72ab2327ed36fe335xxxxxxxxxxxxxxxxxxxxxx4cfe67cde5ebd6d7676a9",
				website_password_url: "https://kkhpsono.psono.app",
				website_password_title: "PSONO ",
			},
			{
				id: generic_uuid,
				type: "application_password",
				name: "Sprecho KI",
				description: "g.mueller@kkh-hagen.de",
				application_password_password: "xxxxxxxxxxxxxxxxxxxxxxxxx",
				application_password_username: "g.mueller@kkh-hagen.de",
				application_password_notes: "",
				application_password_title: "Sprecho KI",
			},
			{
				id: generic_uuid,
				type: "website_password",
				name: "Amazon",
				description: "simsekk",
				urlfilter: "eu-north-1.signin.aws.amazon.com",
				website_password_url_filter: "eu-north-1.signin.aws.amazon.com",
				website_password_password: "kxxxxxxxxxxxxxxxxxmk8gyg",
				website_password_username: "simsekk",
				website_password_notes: "",
				website_password_url:
					"https://eu-north-1.signin.aws.amazon.com/oauth?client_id=arn%3Aaws%3Asignin%3A%3A%3Aconsole%2Fcanvas&code_challenge=sSoL7h0DXezic9Yub3-bVOXkMUOaXs4jddADs9sZ-Aw&code_challenge_method=SHA-256&response_type=code&redirect_uri=https%3A%2F%2Fconsole.aws.amazon.com%2Fconsole%2Fhome%3FhashArgs%3D%2523%26isauthcode%3Dtrue%26state%3DhashArgsFromTB_eu-north-1_8e863a06ea4f6482",
				website_password_title: "Amazon",
				website_password_totp_period: 30,
				website_password_totp_algorithm: "SHA1",
				website_password_totp_digits: 6,
				website_password_totp_code: "JBSWY3DPEHPK3PXP",
			},
		]);
	});

	it("infers website passwords from a URL or from password plus OTPAuth", () => {
		const input =
			"Title,Url,Username,Password,OTPAuth,Favorite,Archived,Tags,Notes\n" +
			"URL only,https://example.com,,,,false,false,,\n" +
			"TOTP login,,user,password,otpauth://totp/Example:user?secret=JBSWY3DPEHPK3PXP&period=30&algorithm=SHA1&digits=6,false,false,,\n" +
			"Application,,user,password,,false,false,,\n" +
			"Note,,,,,false,false,,text";

		const output = import1PasswordV8Csv.parser(input);

		expect(output.secrets.map((secret) => secret.type)).toEqual([
			"website_password",
			"website_password",
			"application_password",
			"note",
		]);
		expect(output.secrets[0]).toMatchObject({
			type: "website_password",
			website_password_url: "https://example.com",
		});
		expect(output.secrets[1]).toMatchObject({
			type: "website_password",
			website_password_url: "",
			website_password_password: "password",
			website_password_totp_period: 30,
			website_password_totp_algorithm: "SHA1",
			website_password_totp_digits: 6,
			website_password_totp_code: "JBSWY3DPEHPK3PXP",
		});
	});

	it("uses legacy behavior when a Type column is present", () => {
		const input =
			"Url,Username,Password,Notes,Title,Type\n" +
			"https://example.com,user,password,,Password entry,Password\n" +
			"https://example.com,user,password,,Login entry,Login\n" +
			",user,password,,Server entry,Server\n" +
			"https://example.com,user,password,,Secure note entry,Secure Note\n" +
			"https://example.com,user,password,,Identity entry,Identity\n" +
			"https://example.com,user,password,,Credit card entry,Credit Card\n" +
			"https://example.com,user,password,,Unknown entry,Unknown";

		const output = import1PasswordV8Csv.parser(input);

		expect(output.secrets.map((secret) => secret.type)).toEqual([
			"website_password",
			"website_password",
			"application_password",
			"note",
			"note",
			"note",
			"note",
		]);
	});
});
