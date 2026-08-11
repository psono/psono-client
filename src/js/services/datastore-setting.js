/**
 * Service to manage the setting datastore
 */

import action from "../actions/bound-action-creators";
import datastore from "./datastore";
import { getStore } from "./store";

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

function serializeSettingsDatastore(settings) {
	return [
		{
			key: "setting_show_website_password",
			value: settings.showWebsitePassword,
		},
		{
			key: "setting_show_application_password",
			value: settings.showApplicationPassword,
		},
		{ key: "setting_show_totp", value: settings.showTOTPAuthenticator },
		{ key: "setting_show_passkey", value: settings.showPasskey },
		{ key: "setting_show_note", value: settings.showNote },
		{
			key: "setting_show_environment_variables",
			value: settings.showEnvironmentVariables,
		},
		{ key: "setting_show_ssh_own_key", value: settings.showSSHKey },
		{ key: "setting_show_mail_gpg_own_key", value: settings.showGPGKey },
		{
			key: "setting_show_ssh_connection",
			value: settings.showSSHConnection,
		},
		{
			key: "setting_show_rdp_connection",
			value: settings.showRDPConnection,
		},
		{
			key: "setting_show_vnc_connection",
			value: settings.showVNCConnection,
		},
		{ key: "setting_show_credit_card", value: settings.showCreditCard },
		{ key: "setting_show_bookmark", value: settings.showBookmark },
		{ key: "setting_show_identity", value: settings.showIdentity },
		{
			key: "setting_show_elster_certificate",
			value: settings.showElsterCertificate,
		},
		{ key: "setting_show_file", value: settings.showFile },
		{ key: "setting_password_length", value: settings.passwordLength },
		{
			key: "setting_password_letters_uppercase",
			value: settings.passwordLettersUppercase,
		},
		{
			key: "setting_password_letters_lowercase",
			value: settings.passwordLettersLowercase,
		},
		{ key: "setting_password_numbers", value: settings.passwordNumbers },
		{
			key: "setting_password_special_chars",
			value: settings.passwordSpecialChars,
		},
		{ key: "gpg_default_key", value: settings.gpgDefaultKey },
		{ key: "gpg_hkp_key_server", value: settings.gpgHkpKeyServer },
		{ key: "gpg_hkp_search", value: settings.gpgHkpSearch },
		{
			key: "setting_clipboard_clear_delay",
			value: settings.clipboardClearDelay,
		},
		{ key: "setting_no_save_mode", value: settings.noSaveMode },
		{ key: "setting_show_no_save_toggle", value: settings.showNoSaveToggle },
		{
			key: "setting_confirm_unsaved_changes",
			value: settings.confirmOnUnsavedChanges,
		},
		{
			key: "setting_custom_domain_synonyms",
			value: JSON.stringify(settings.customDomainSynonyms || []),
		},
		{
			key: "setting_connection_authentication",
			value: JSON.stringify(
				settings.connectionAuthentication || {
					schema_version: 1,
					by_connection_secret_id: {},
				},
			),
		},
		{
			key: "setting_gateway_cluster_selection",
			value: JSON.stringify(
				settings.gatewayClusterSelection || {
					schema_version: 1,
					by_connection_secret_id: {},
				},
			),
		},
	];
}

/**
 * Returns the settings datastore.
 *
 * @returns {Promise} Returns the settings datastore
 */
function getSettingsDatastore() {
	const type = "settings";
	const description = "key-value-settings";

	const onSuccess = (results) => {
		const data = {
			setting_clipboard_clear_delay: 30,
			setting_password_length: 16,
			setting_password_letters_uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			setting_password_letters_lowercase: "abcdefghijklmnopqrstuvwxyz",
			setting_password_numbers: "0123456789",
			setting_password_special_chars: ",.-;:_#'+*~!\"$%&/@()=?{[]}\\",
		};
		if (
			typeof getStore().getState().server.complianceClipboardClearDelay !==
			"undefined"
		) {
			data["setting_clipboard_clear_delay"] =
				getStore().getState().server.complianceClipboardClearDelay;
		}

		if (
			typeof getStore().getState().server.complianceMinClipboardClearDelay !==
				"undefined" &&
			getStore().getState().server.complianceMinClipboardClearDelay >
				data["setting_clipboard_clear_delay"]
		) {
			data["setting_clipboard_clear_delay"] =
				getStore().getState().server.complianceMinClipboardClearDelay;
		}

		if (
			typeof getStore().getState().server.complianceMaxClipboardClearDelay !==
				"undefined" &&
			getStore().getState().server.complianceMaxClipboardClearDelay <
				data["setting_clipboard_clear_delay"]
		) {
			data["setting_clipboard_clear_delay"] =
				getStore().getState().server.complianceMaxClipboardClearDelay;
		}
		if (
			typeof getStore().getState().server
				.compliancePasswordGeneratorDefaultPasswordLength !== "undefined"
		) {
			data["setting_password_length"] =
				getStore().getState().server.compliancePasswordGeneratorDefaultPasswordLength;
		}
		if (
			typeof getStore().getState().server
				.compliancePasswordGeneratorDefaultLettersUppercase !== "undefined"
		) {
			data["setting_password_letters_uppercase"] =
				getStore().getState().server.compliancePasswordGeneratorDefaultLettersUppercase;
		}
		if (
			typeof getStore().getState().server
				.compliancePasswordGeneratorDefaultLettersLowercase !== "undefined"
		) {
			data["setting_password_letters_lowercase"] =
				getStore().getState().server.compliancePasswordGeneratorDefaultLettersLowercase;
		}
		if (
			typeof getStore().getState().server
				.compliancePasswordGeneratorDefaultNumbers !== "undefined"
		) {
			data["setting_password_numbers"] =
				getStore().getState().server.compliancePasswordGeneratorDefaultNumbers;
		}
		if (
			typeof getStore().getState().server
				.compliancePasswordGeneratorDefaultSpecialChars !== "undefined"
		) {
			data["setting_password_special_chars"] =
				getStore().getState().server.compliancePasswordGeneratorDefaultSpecialChars;
		}
		action().settingsDatastoreLoaded(data);

		if (Array.isArray(results)) {
			// if the user has no settings datastore then this function will return an dict, e.g. {'datastore_id': '...'}
			results.forEach((result) => {
				if (
					[
						"setting_custom_domain_synonyms",
						"setting_connection_authentication",
						"setting_gateway_cluster_selection",
					].includes(result["key"])
				) {
					try {
						data[result["key"]] = JSON.parse(result["value"]);
						if (result["key"] === "setting_connection_authentication") {
							data[result["key"]] = normalizeConnectionAuthentication(
								data[result["key"]],
							);
						} else if (result["key"] === "setting_gateway_cluster_selection") {
							data[result["key"]] = normalizeGatewayClusterSelection(
								data[result["key"]],
							);
						}
					} catch (e) {
						data[result["key"]] =
							result["key"] === "setting_custom_domain_synonyms"
								? []
								: { schema_version: 1, by_connection_secret_id: {} };
					}
				} else {
					data[result["key"]] = result["value"];
				}
			});
			action().settingsDatastoreLoaded(data);
		}

		return results;
	};
	const onError = () => {
		// pass
	};
	return datastore.getDatastore(type).then(onSuccess, onError);
}

/**
 * Saves the settings datastore with given content
 *
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 * @returns {Promise} Promise with the status of the save
 */
function saveSettingsDatastore(content) {
	const type = "settings";
	const description = "key-value-settings";

	return datastore.saveDatastoreContent(type, description, content);
}

const datastoreSettingService = {
	getSettingsDatastore: getSettingsDatastore,
	saveSettingsDatastore: saveSettingsDatastore,
	serializeSettingsDatastore: serializeSettingsDatastore,
	normalizeConnectionAuthentication: normalizeConnectionAuthentication,
	normalizeGatewayClusterSelection: normalizeGatewayClusterSelection,
};
export default datastoreSettingService;
