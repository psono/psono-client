import itemBlueprintService from "./item-blueprint";

jest.mock("./store", () => ({
	getStore: () => ({
		getState: () => ({
			server: { complianceDisableTotp: false, files: true },
			settingsDatastore: {
				showApplicationPassword: true,
				showBookmark: true,
				showCreditCard: true,
				showElsterCertificate: true,
				showEnvironmentVariables: true,
				showFile: true,
				showGPGKey: true,
				showIdentity: true,
				showNote: true,
				showPasskey: true,
				showRDPConnection: true,
				showSSHConnection: true,
				showSSHKey: true,
				showTOTPAuthenticator: true,
				showWebsitePassword: true,
			},
		}),
	}),
}));

describe("connection item blueprints", () => {
	it("allows enabled connection types in the new-entry selector", () => {
		const values = itemBlueprintService
			.getEntryTypes(true, true)
			.map((entryType) => entryType.value);

		expect(values).toContain("ssh_connection");
		expect(values).toContain("rdp_connection");
	});
});
