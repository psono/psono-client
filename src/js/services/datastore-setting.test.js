import datastoreSettingService from "./datastore-setting";

describe("Service: settings datastore", () => {
	it("serializes connection visibility, authentication, and GPG visibility", () => {
		const connectionAuthentication = {
			schema_version: 1,
			by_connection_secret_id: {
				connection: {
					secret_id: "secret",
					secret_key: "secret-key",
					type: "ssh_own_key",
					username: "user",
				},
			},
		};
		const content = datastoreSettingService.serializeSettingsDatastore({
			showGPGKey: true,
			showSSHConnection: true,
			showRDPConnection: false,
			connectionAuthentication,
		});
		const settings = Object.fromEntries(
			content.map(({ key, value }) => [key, value]),
		);

		expect(settings.setting_show_mail_gpg_own_key).toBe(true);
		expect(settings.setting_show_ssh_connection).toBe(true);
		expect(settings.setting_show_rdp_connection).toBe(false);
		expect(JSON.parse(settings.setting_connection_authentication)).toEqual(
			connectionAuthentication,
		);
	});

	it("normalizes malformed connection authentication settings", () => {
		expect(
			datastoreSettingService.normalizeConnectionAuthentication({}),
		).toEqual({
			schema_version: 1,
			by_connection_secret_id: {},
		});
		expect(
			datastoreSettingService.normalizeConnectionAuthentication({
				schema_version: 1,
				by_connection_secret_id: {
					connection: { secret_id: "secret", secret_key: "secret-key" },
				},
			}),
		).toEqual({
			schema_version: 1,
			by_connection_secret_id: {
				connection: { secret_id: "secret", secret_key: "secret-key" },
			},
		});
	});
});
