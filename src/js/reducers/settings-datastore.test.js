import {
	SET_CONNECTION_AUTHENTICATION,
	SET_SHOWN_ENTRIES_CONFIG,
	SETTINGS_DATASTORE_LOADED,
} from "../actions/action-types";
import settingsDatastore from "./settings-datastore";

describe("Reducer: settings datastore", () => {
	it("defaults connection entry types to hidden and authentication to empty", () => {
		const state = settingsDatastore(undefined, { type: "unknown" });

		expect(state.showSSHConnection).toBe(false);
		expect(state.showRDPConnection).toBe(false);
		expect(state.connectionAuthentication).toEqual({
			schema_version: 1,
			by_connection_secret_id: {},
		});
	});

	it("loads connection settings and the correctly named GPG visibility field", () => {
		const connectionAuthentication = {
			schema_version: 1,
			by_connection_secret_id: {
				connection: {
					secret_id: "secret",
					secret_key: "secret-key",
					type: "application_password",
				},
			},
		};
		const state = settingsDatastore(undefined, {
			type: SETTINGS_DATASTORE_LOADED,
			data: {
				setting_show_mail_gpg_own_key: true,
				setting_show_ssh_connection: true,
				setting_show_rdp_connection: true,
				setting_connection_authentication: connectionAuthentication,
			},
		});

		expect(state.showGPGKey).toBe(true);
		expect(state.howGPGKey).toBeUndefined();
		expect(state.showSSHConnection).toBe(true);
		expect(state.showRDPConnection).toBe(true);
		expect(state.connectionAuthentication).toBe(connectionAuthentication);
	});

	it("updates connection visibility and authentication actions", () => {
		const shownState = settingsDatastore(undefined, {
			type: SET_SHOWN_ENTRIES_CONFIG,
			showSSHConnection: true,
			showRDPConnection: true,
		});
		const connectionAuthentication = {
			schema_version: 1,
			by_connection_secret_id: {},
		};
		const state = settingsDatastore(shownState, {
			type: SET_CONNECTION_AUTHENTICATION,
			connectionAuthentication,
		});

		expect(state.showSSHConnection).toBe(true);
		expect(state.showRDPConnection).toBe(true);
		expect(state.connectionAuthentication).toBe(connectionAuthentication);
	});
});
