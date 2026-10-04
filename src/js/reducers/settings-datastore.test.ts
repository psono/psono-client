import {
	SET_CONNECTION_AUTHENTICATION,
	SET_CLIENT_CONFIG,
	SET_DEFAULT_PASSWORD_GENERATOR,
	SET_PASSPHRASE_CONFIG,
	SET_GATEWAY_CLUSTER_SELECTION,
	SET_SHOWN_ENTRIES_CONFIG,
	SETTINGS_DATASTORE_LOADED,
} from "../actions/action-types";
import settingsDatastore from "./settings-datastore";

describe("Reducer: settings datastore", () => {
	it("updates the default independently and preserves it when passphrase options change", () => {
		const state = settingsDatastore(undefined, { type: "@@INIT" });
		const selected = settingsDatastore(state, {
			type: SET_DEFAULT_PASSWORD_GENERATOR,
			defaultPasswordGenerator: "passphrase",
		});
		expect(selected).toEqual({
			...state,
			defaultPasswordGenerator: "passphrase",
		});
		const configured = settingsDatastore(selected, {
			type: SET_PASSPHRASE_CONFIG,
			passphraseWordCount: 6,
			passphraseLanguage: "da",
		});
		expect(configured.defaultPasswordGenerator).toBe("passphrase");
		expect(configured.passphraseWordCount).toBe(6);
		expect(configured.passphraseLanguage).toBe("da");
	});

	it("loads passphrase preferences and retains backward-compatible defaults", () => {
		const defaults = settingsDatastore(undefined, {
			type: SETTINGS_DATASTORE_LOADED,
			data: {},
		});
		expect(defaults.defaultPasswordGenerator).toBe("password");
		expect(defaults.passphraseWordCount).toBe(4);
		expect(defaults.passphraseLanguage).toBe("");
		const loaded = settingsDatastore(defaults, {
			type: SETTINGS_DATASTORE_LOADED,
			data: {
				setting_passphrase_word_count: "7",
				setting_passphrase_language: "en",
				setting_default_password_generator: "passphrase",
			},
		});
		expect(loaded.defaultPasswordGenerator).toBe("passphrase");
		expect(loaded.passphraseWordCount).toBe(7);
		expect(loaded.passphraseLanguage).toBe("en");
	});

	it("ignores invalid persisted lengths and unknown default generators", () => {
		const loaded = settingsDatastore(undefined, {
			type: SETTINGS_DATASTORE_LOADED,
			data: {
				setting_passphrase_word_count: "1",
				setting_default_password_generator: "unknown",
			},
		});
		expect(loaded.passphraseWordCount).toBe(4);
		expect(loaded.defaultPasswordGenerator).toBe("password");
	});
	it("defaults connection entry types to hidden and authentication to empty", () => {
		const state = settingsDatastore(undefined, { type: "@@UNKNOWN" });

		expect(state.showSSHConnection).toBe(false);
		expect(state.showRDPConnection).toBe(false);
		expect(state.showVNCConnection).toBe(false);
		expect(state.useMarkdownForNotes).toBe(true);
		expect(state.connectionAuthentication).toEqual({
			schema_version: 1,
			by_connection_secret_id: {},
		});
		expect(state.gatewayClusterSelection).toEqual({
			schema_version: 1,
			by_connection_secret_id: {},
		});
	});

	it("loads and updates the Markdown notes preference", () => {
		const loaded = settingsDatastore(undefined, {
			type: SETTINGS_DATASTORE_LOADED,
			data: { setting_use_markdown_for_notes: false },
		});
		expect(loaded.useMarkdownForNotes).toBe(false);

		const state = settingsDatastore(loaded, {
			clipboardClearDelay: loaded.clipboardClearDelay,
			type: SET_CLIENT_CONFIG,
			useMarkdownForNotes: true,
		});
		expect(state.useMarkdownForNotes).toBe(true);
	});

	it("normalizes and updates gateway cluster selections", () => {
		const loaded = settingsDatastore(undefined, {
			type: SETTINGS_DATASTORE_LOADED,
			data: {
				setting_gateway_cluster_selection: {
					schema_version: 1,
					by_connection_secret_id: { connection: "cluster" },
				},
			},
		});
		expect(loaded.gatewayClusterSelection.by_connection_secret_id).toEqual({
			connection: "cluster",
		});

		const gatewayClusterSelection = {
			schema_version: 1,
			by_connection_secret_id: { other: "cluster-b" },
		};
		expect(
			settingsDatastore(loaded, {
				type: SET_GATEWAY_CLUSTER_SELECTION,
				gatewayClusterSelection,
			}).gatewayClusterSelection,
		).toBe(gatewayClusterSelection);
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
				setting_show_vnc_connection: true,
				setting_connection_authentication: connectionAuthentication,
			},
		});

		expect(state.showGPGKey).toBe(true);
		expect(state).not.toHaveProperty("howGPGKey");
		expect(state.showSSHConnection).toBe(true);
		expect(state.showRDPConnection).toBe(true);
		expect(state.showVNCConnection).toBe(true);
		expect(state.connectionAuthentication).toBe(connectionAuthentication);
	});

	it("updates connection visibility and authentication actions", () => {
		const shownState = settingsDatastore(undefined, {
			...settingsDatastore(undefined, { type: "@@INIT" }),
			type: SET_SHOWN_ENTRIES_CONFIG,
			showSSHConnection: true,
			showRDPConnection: true,
			showVNCConnection: true,
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
		expect(state.showVNCConnection).toBe(true);
		expect(state.connectionAuthentication).toBe(connectionAuthentication);
	});
});
