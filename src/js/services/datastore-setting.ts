/**
 * Service to manage the setting datastore
 */

import action from "../actions/bound-action-creators";
import datastore from "./datastore";
import notification from "./notification";
import { getStore } from "./store";
import type {
	DatastoreMetadata,
	SettingsDatastore,
	SettingsEntry,
	WriteResult,
} from "../../types/datastore";
import type {
	ConnectionAuthentication,
	GatewayClusterSelection,
	SettingsState,
} from "../../types/state";

function normalizeConnectionAuthentication(
	value: unknown,
): ConnectionAuthentication {
	if (
		!value ||
		Array.isArray(value) ||
		typeof value !== "object" ||
		!("schema_version" in value) ||
		value.schema_version !== 1 ||
		!("by_connection_secret_id" in value) ||
		!value.by_connection_secret_id ||
		Array.isArray(value.by_connection_secret_id) ||
		typeof value.by_connection_secret_id !== "object"
	) {
		return { schema_version: 1, by_connection_secret_id: {} };
	}
	// Legacy settings validate the envelope only; entries are resolved by gateway.
	return value as ConnectionAuthentication;
}

function normalizeGatewayClusterSelection(
	value: unknown,
): GatewayClusterSelection {
	if (
		!value ||
		Array.isArray(value) ||
		typeof value !== "object" ||
		!("schema_version" in value) ||
		value.schema_version !== 1 ||
		!("by_connection_secret_id" in value) ||
		!value.by_connection_secret_id ||
		Array.isArray(value.by_connection_secret_id) ||
		typeof value.by_connection_secret_id !== "object"
	) {
		return { schema_version: 1, by_connection_secret_id: {} };
	}
	const byConnectionSecretId: Record<string, string> = {};
	Object.entries(value.by_connection_secret_id).forEach(
		([connectionSecretId, clusterId]) => {
			if (connectionSecretId && typeof clusterId === "string" && clusterId) {
				byConnectionSecretId[connectionSecretId] = clusterId;
			}
		},
	);
	return { schema_version: 1, by_connection_secret_id: byConnectionSecretId };
}

function serializeSettingsDatastore(
	settings: Partial<SettingsState>,
): SettingsDatastore {
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
			key: "setting_passphrase_word_count",
			value: settings.passphraseWordCount,
		},
		{ key: "setting_passphrase_language", value: settings.passphraseLanguage },
		{
			key: "setting_default_password_generator",
			value: settings.defaultPasswordGenerator,
		},
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
		{
			key: "setting_use_markdown_for_notes",
			value: settings.useMarkdownForNotes,
		},
		{ key: "setting_no_save_mode", value: settings.noSaveMode },
		{ key: "setting_show_no_save_toggle", value: settings.showNoSaveToggle },
		{
			key: "setting_confirm_unsaved_changes",
			value: settings.confirmOnUnsavedChanges,
		},
		{
			key: "setting_custom_domain_synonyms",
			value:
				settings.customDomainSynonyms === undefined
					? undefined
					: JSON.stringify(settings.customDomainSynonyms || []),
		},
		{
			key: "setting_connection_authentication",
			value:
				settings.connectionAuthentication === undefined
					? undefined
					: JSON.stringify(
							settings.connectionAuthentication || {
								schema_version: 1,
								by_connection_secret_id: {},
							},
						),
		},
		{
			key: "setting_gateway_cluster_selection",
			value:
				settings.gatewayClusterSelection === undefined
					? undefined
					: JSON.stringify(
							settings.gatewayClusterSelection || {
								schema_version: 1,
								by_connection_secret_id: {},
							},
						),
		},
	].filter(({ value }) => value !== undefined);
}

/**
 * Returns the settings datastore.
 *
 * @returns {Promise} Returns the settings datastore
 */
function getSettingsDatastore() {
	const type = "settings";
	const description = "key-value-settings";

	const onSuccess = (
		results: SettingsDatastore | DatastoreMetadata | undefined,
	) => {
		const data: Record<string, unknown> & {
			setting_clipboard_clear_delay: number;
		} = {
			setting_clipboard_clear_delay: 30,
			setting_use_markdown_for_notes: true,
			setting_password_length: 16,
			setting_passphrase_word_count:
				getStore().getState().server
					.compliancePasswordGeneratorDefaultWordLength ?? 4,
			setting_passphrase_language: "",
			setting_default_password_generator: "password",
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
						data[result["key"]] = JSON.parse(result["value"] as string);
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
		return undefined;
	};
	return datastore
		.getDatastore<SettingsDatastore | DatastoreMetadata>(type)
		.then(onSuccess, onError);
}

/**
 * Merges changed settings into the current datastore. Unrelated settings belong
 * to other screens, clients, or future versions and must be retained verbatim.
 *
 * @param content The changed key/value entries
 * @returns {Promise} Promise with the status of the save
 */
async function saveSettingsDatastore(
	content: SettingsEntry[],
): Promise<WriteResult | undefined> {
	const state = getStore().getState();
	const userId = state.user.userId;
	const token = state.user.token;
	const serverUrl = state.server.url;
	let current: SettingsDatastore | DatastoreMetadata | undefined;
	try {
		// Read the raw datastore: the settings loader dispatches Redux updates and
		// would overwrite pending UI edits while preparing this save.
		current = await datastore.getDatastore<
			SettingsDatastore | DatastoreMetadata
		>("settings");
	} catch {
		notification.errorSend("DATASTORE_SAVE_FAILED");
		return undefined;
	}

	const activeState = getStore().getState();
	if (
		activeState.user.userId !== userId ||
		activeState.user.token !== token ||
		activeState.server.url !== serverUrl
	) {
		return undefined;
	}

	if (
		!current?.datastore_id ||
		(!Array.isArray(current) &&
			Object.keys(current).some(
				(key) => key !== "datastore_id" && key !== "write_date",
			))
	) {
		// A failed or unrecognized read must never turn into a replacement write.
		notification.errorSend("DATASTORE_SAVE_FAILED");
		return undefined;
	}

	// An empty/new datastore is returned as a metadata-only object.
	const existing = Array.isArray(current) ? current : [];
	const updates = new Map(content.map((entry) => [entry.key, entry]));
	const existingKeys = new Set(existing.map(({ key }) => key));
	const merged: SettingsDatastore = existing.map((entry) => {
		const update = updates.get(entry.key);
		return update ? { ...entry, ...update } : entry;
	});
	for (const [key, entry] of updates) {
		if (!existingKeys.has(key)) {
			merged.push(entry);
		}
	}

	// Keep the revision from the read so a concurrent app write produces a
	// conflict instead of silently replacing newer settings.
	return datastore.saveDatastoreContentWithId(
		current.datastore_id,
		merged,
		current.write_date,
	);
}

const datastoreSettingService = {
	getSettingsDatastore: getSettingsDatastore,
	saveSettingsDatastore: saveSettingsDatastore,
	serializeSettingsDatastore: serializeSettingsDatastore,
	normalizeConnectionAuthentication: normalizeConnectionAuthentication,
	normalizeGatewayClusterSelection: normalizeGatewayClusterSelection,
};
export default datastoreSettingService;
