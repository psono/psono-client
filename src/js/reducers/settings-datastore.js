import {
	SET_CLIENT_CONFIG,
	SET_CONNECTION_AUTHENTICATION,
	SET_DOMAIN_SYNONYMS_CONFIG,
	SET_GATEWAY_CLUSTER_SELECTION,
	SET_GPG_CONFIG,
	SET_GPG_DEFAULT_KEY,
	SET_PASSWORD_CONFIG,
	SET_SHOWN_ENTRIES_CONFIG,
	SETTINGS_DATASTORE_LOADED,
} from "../actions/action-types";

function normalizeConnectionAuthentication(value) {
	if (
		!value ||
		Array.isArray(value) ||
		typeof value !== "object" ||
		value.schema_version !== 1 ||
		!value.by_connection_secret_id ||
		Array.isArray(value.by_connection_secret_id) ||
		typeof value.by_connection_secret_id !== "object"
	) {
		return { schema_version: 1, by_connection_secret_id: {} };
	}
	return value;
}

function normalizeGatewayClusterSelection(value) {
	if (
		!value ||
		Array.isArray(value) ||
		typeof value !== "object" ||
		value.schema_version !== 1 ||
		!value.by_connection_secret_id ||
		Array.isArray(value.by_connection_secret_id) ||
		typeof value.by_connection_secret_id !== "object"
	) {
		return { schema_version: 1, by_connection_secret_id: {} };
	}
	const byConnectionSecretId = {};
	Object.entries(value.by_connection_secret_id).forEach(
		([connectionSecretId, clusterId]) => {
			if (connectionSecretId && typeof clusterId === "string" && clusterId) {
				byConnectionSecretId[connectionSecretId] = clusterId;
			}
		},
	);
	return { schema_version: 1, by_connection_secret_id: byConnectionSecretId };
}

function settingsDatastore(
	state = {
		passwordLength: 16,
		passwordLettersUppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		passwordLettersLowercase: "abcdefghijklmnopqrstuvwxyz",
		passwordNumbers: "0123456789",
		passwordSpecialChars: ",.-;:_#'+*~!\"$%&/@()=?{[]}\\",
		clipboardClearDelay: 30,
		useMarkdownForNotes: true,
		gpgDefaultKey: null,
		gpgHkpKeyServer: "https://keyserver.ubuntu.com",
		gpgHkpSearch: true,
		showWebsitePassword: true,
		showApplicationPassword: true,
		showTOTPAuthenticator: true,
		showPasskey: true,
		showNote: true,
		showEnvironmentVariables: false,
		showSSHKey: false,
		showGPGKey: false,
		showSSHConnection: false,
		showRDPConnection: false,
		showVNCConnection: false,
		showCreditCard: true,
		showBookmark: true,
		showIdentity: true,
		showElsterCertificate: false,
		showFile: true,
		customDomainSynonyms: [],
		connectionAuthentication: {
			schema_version: 1,
			by_connection_secret_id: {},
		},
		gatewayClusterSelection: {
			schema_version: 1,
			by_connection_secret_id: {},
		},
	},
	action,
) {
	switch (action.type) {
		case SETTINGS_DATASTORE_LOADED:
			return Object.assign({}, state, {
				passwordLength: Object.hasOwn(action.data, "setting_password_length")
					? parseInt(action.data.setting_password_length)
					: 16,
				passwordLettersUppercase: Object.hasOwn(
					action.data,
					"setting_password_letters_uppercase",
				)
					? action.data.setting_password_letters_uppercase
					: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
				passwordLettersLowercase: Object.hasOwn(
					action.data,
					"setting_password_letters_lowercase",
				)
					? action.data.setting_password_letters_lowercase
					: "abcdefghijklmnopqrstuvwxyz",
				passwordNumbers: Object.hasOwn(action.data, "setting_password_numbers")
					? action.data.setting_password_numbers
					: "0123456789",
				passwordSpecialChars: Object.hasOwn(
					action.data,
					"setting_password_special_chars",
				)
					? action.data.setting_password_special_chars
					: ",.-;:_#'+*~!\"$%&/@()=?{[]}\\",
				clipboardClearDelay: Object.hasOwn(
					action.data,
					"setting_clipboard_clear_delay",
				)
					? parseInt(action.data.setting_clipboard_clear_delay)
					: 30,
				useMarkdownForNotes: Object.hasOwn(
					action.data,
					"setting_use_markdown_for_notes",
				)
					? ![false, "false"].includes(
							action.data.setting_use_markdown_for_notes,
						)
					: true,
				gpgDefaultKey: Object.hasOwn(action.data, "gpg_default_key")
					? action.data.gpg_default_key
					: null,
				gpgHkpKeyServer: Object.hasOwn(action.data, "gpg_hkp_key_server")
					? action.data.gpg_hkp_key_server
					: "https://keyserver.ubuntu.com",
				gpgHkpSearch: Object.hasOwn(action.data, "gpg_hkp_search")
					? action.data.gpg_hkp_search
					: true,
				showWebsitePassword: Object.hasOwn(
					action.data,
					"setting_show_website_password",
				)
					? action.data.setting_show_website_password
					: true,
				showApplicationPassword: Object.hasOwn(
					action.data,
					"setting_show_application_password",
				)
					? action.data.setting_show_application_password
					: true,
				showTOTPAuthenticator: Object.hasOwn(action.data, "setting_show_totp")
					? action.data.setting_show_totp
					: true,
				showPasskey: Object.hasOwn(action.data, "setting_show_passkey")
					? action.data.setting_show_passkey
					: true,
				showNote: Object.hasOwn(action.data, "setting_show_note")
					? action.data.setting_show_note
					: true,
				showEnvironmentVariables: Object.hasOwn(
					action.data,
					"setting_show_environment_variables",
				)
					? action.data.setting_show_environment_variables
					: false,
				showSSHKey: Object.hasOwn(action.data, "setting_show_ssh_own_key")
					? action.data.setting_show_ssh_own_key
					: false,
				showGPGKey: Object.hasOwn(action.data, "setting_show_mail_gpg_own_key")
					? action.data.setting_show_mail_gpg_own_key
					: false,
				showSSHConnection: Object.hasOwn(
					action.data,
					"setting_show_ssh_connection",
				)
					? action.data.setting_show_ssh_connection
					: false,
				showRDPConnection: Object.hasOwn(
					action.data,
					"setting_show_rdp_connection",
				)
					? action.data.setting_show_rdp_connection
					: false,
				showVNCConnection: Object.hasOwn(
					action.data,
					"setting_show_vnc_connection",
				)
					? action.data.setting_show_vnc_connection
					: false,
				showCreditCard: Object.hasOwn(action.data, "setting_show_credit_card")
					? action.data.setting_show_credit_card
					: true,
				showBookmark: Object.hasOwn(action.data, "setting_show_bookmark")
					? action.data.setting_show_bookmark
					: true,
				showIdentity: Object.hasOwn(action.data, "setting_show_identity")
					? action.data.setting_show_identity
					: true,
				showElsterCertificate: Object.hasOwn(
					action.data,
					"setting_show_elster_certificate",
				)
					? action.data.setting_show_elster_certificate
					: false,
				showFile: Object.hasOwn(action.data, "setting_show_file")
					? action.data.setting_show_file
					: true,
				showNoSaveToggle: Object.hasOwn(
					action.data,
					"setting_show_no_save_toggle",
				)
					? action.data.setting_show_no_save_toggle
					: false,
				noSaveMode: Object.hasOwn(action.data, "setting_no_save_mode")
					? action.data.setting_no_save_mode
					: false,
				confirmOnUnsavedChanges: Object.hasOwn(
					action.data,
					"setting_confirm_unsaved_changes",
				)
					? action.data.setting_confirm_unsaved_changes
					: true,
				customDomainSynonyms: Object.hasOwn(
					action.data,
					"setting_custom_domain_synonyms",
				)
					? action.data.setting_custom_domain_synonyms
					: [],
				connectionAuthentication: Object.hasOwn(
					action.data,
					"setting_connection_authentication",
				)
					? normalizeConnectionAuthentication(
							action.data.setting_connection_authentication,
						)
					: { schema_version: 1, by_connection_secret_id: {} },
				gatewayClusterSelection: Object.hasOwn(
					action.data,
					"setting_gateway_cluster_selection",
				)
					? normalizeGatewayClusterSelection(
							action.data.setting_gateway_cluster_selection,
						)
					: { schema_version: 1, by_connection_secret_id: {} },
			});
		case SET_PASSWORD_CONFIG:
			return Object.assign({}, state, {
				passwordLength: action.passwordLength,
				passwordLettersUppercase: action.passwordLettersUppercase,
				passwordLettersLowercase: action.passwordLettersLowercase,
				passwordNumbers: action.passwordNumbers,
				passwordSpecialChars: action.passwordSpecialChars,
			});
		case SET_SHOWN_ENTRIES_CONFIG:
			return Object.assign({}, state, {
				showWebsitePassword: action.showWebsitePassword,
				showApplicationPassword: action.showApplicationPassword,
				showTOTPAuthenticator: action.showTOTPAuthenticator,
				showPasskey: action.showPasskey,
				showNote: action.showNote,
				showEnvironmentVariables: action.showEnvironmentVariables,
				showSSHKey: action.showSSHKey,
				showGPGKey: action.showGPGKey,
				showSSHConnection: action.showSSHConnection,
				showRDPConnection: action.showRDPConnection,
				showVNCConnection: action.showVNCConnection,
				showCreditCard: action.showCreditCard,
				showBookmark: action.showBookmark,
				showIdentity: action.showIdentity,
				showElsterCertificate: action.showElsterCertificate,
				showFile: action.showFile,
			});
		case SET_GPG_CONFIG:
			return Object.assign({}, state, {
				gpgDefaultKey: action.gpgDefaultKey,
				gpgHkpKeyServer: action.gpgHkpKeyServer,
				gpgHkpSearch: action.gpgHkpSearch,
			});
		case SET_CLIENT_CONFIG:
			return Object.assign({}, state, {
				clipboardClearDelay: action.clipboardClearDelay,
				useMarkdownForNotes: action.useMarkdownForNotes,
				noSaveMode: action.noSaveMode,
				showNoSaveToggle: action.showNoSaveToggle,
				confirmOnUnsavedChanges: action.confirmOnUnsavedChanges,
			});
		case SET_GPG_DEFAULT_KEY:
			return Object.assign({}, state, {
				gpgDefaultKey: action.gpgDefaultKey,
			});
		case SET_DOMAIN_SYNONYMS_CONFIG:
			return Object.assign({}, state, {
				customDomainSynonyms: action.customDomainSynonyms,
			});
		case SET_CONNECTION_AUTHENTICATION:
			return Object.assign({}, state, {
				connectionAuthentication: action.connectionAuthentication,
			});
		case SET_GATEWAY_CLUSTER_SELECTION:
			return Object.assign({}, state, {
				gatewayClusterSelection: action.gatewayClusterSelection,
			});
		default:
			return state;
	}
}

export default settingsDatastore;
