import type { AppAction, SettingsDatastorePayload } from "../../types/actions";
import type {
	DatastoreMetadata,
	SettingsDatastore,
	SettingsEntry,
} from "../../types/datastore";
import actionCreators from "../actions/action-creators";
import { SETTINGS_DATASTORE_LOADED } from "../actions/action-types";
import settingsReducer from "../reducers/settings-datastore";
import datastore from "./datastore";
import datastoreSettingService from "./datastore-setting";
import notification from "./notification";

let mockState = {
	user: { userId: "user-a", token: "token-a" },
	server: { url: "https://server-a.example" } as {
		url: string;
		compliancePasswordGeneratorDefaultWordLength?: number;
	},
	settingsDatastore: settingsReducer(undefined, { type: "@@INIT" }),
};
let stored: SettingsDatastore | DatastoreMetadata;
let revision = 1;

function mockDispatch<Action extends AppAction>(action: Action): Action {
	mockState.settingsDatastore = settingsReducer(
		mockState.settingsDatastore,
		action,
	);
	return action;
}
const mockSettingsLoaded = jest.fn((data: SettingsDatastorePayload) => {
	mockDispatch({ type: SETTINGS_DATASTORE_LOADED, data });
});

jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({ settingsDatastoreLoaded: mockSettingsLoaded }),
}));
jest.mock("./datastore", () => ({
	__esModule: true,
	default: {
		getDatastore: jest.fn(),
		saveDatastoreContent: jest.fn(),
		saveDatastoreContentWithId: jest.fn(),
	},
}));
jest.mock("./notification", () => ({
	__esModule: true,
	default: { errorSend: jest.fn() },
}));

const mockRead = jest.mocked(datastore.getDatastore);
const mockWrite = jest.mocked(datastore.saveDatastoreContentWithId);

// Complete persisted browser-setting inventory, including the app's numeric
// strings and the JSON-string envelopes used by both clients.
function browserEntries(): SettingsEntry[] {
	return [
		{ key: "setting_show_website_password", value: true },
		{ key: "setting_show_application_password", value: false },
		{ key: "setting_show_totp", value: true },
		{ key: "setting_show_passkey", value: false },
		{ key: "setting_show_note", value: true },
		{ key: "setting_show_environment_variables", value: true },
		{ key: "setting_show_ssh_own_key", value: true },
		{ key: "setting_show_mail_gpg_own_key", value: true },
		{ key: "setting_show_ssh_connection", value: true },
		{ key: "setting_show_rdp_connection", value: false },
		{ key: "setting_show_vnc_connection", value: true },
		{ key: "setting_show_credit_card", value: false },
		{ key: "setting_show_bookmark", value: true },
		{ key: "setting_show_identity", value: false },
		{ key: "setting_show_elster_certificate", value: true },
		{ key: "setting_show_file", value: true },
		{ key: "setting_password_length", value: "22" },
		{ key: "setting_passphrase_word_count", value: "6" },
		{ key: "setting_passphrase_language", value: "en" },
		{ key: "setting_default_password_generator", value: "passphrase" },
		{ key: "setting_password_letters_uppercase", value: "ABC" },
		{ key: "setting_password_letters_lowercase", value: "abc" },
		{ key: "setting_password_numbers", value: "012" },
		{ key: "setting_password_special_chars", value: "!@" },
		{ key: "setting_clipboard_clear_delay", value: "45" },
		{ key: "setting_use_markdown_for_notes", value: false },
		{ key: "gpg_default_key", value: { id: "gpg-key", label: "Work" } },
		{ key: "gpg_hkp_key_server", value: "https://keys.example" },
		{ key: "gpg_hkp_search", value: "on" },
		{ key: "setting_no_save_mode", value: true },
		{ key: "setting_show_no_save_toggle", value: true },
		{ key: "setting_confirm_unsaved_changes", value: false },
		{
			key: "setting_custom_domain_synonyms",
			value: '[["example.com", "example.org"]]',
		},
		{
			key: "setting_connection_authentication",
			value: JSON.stringify({
				schema_version: 1,
				by_connection_secret_id: {
					existing: {
						secret_id: "credential",
						secret_key: "key",
						type: "application_password",
					},
				},
			}),
		},
		{
			key: "setting_gateway_cluster_selection",
			value: JSON.stringify({
				schema_version: 1,
				by_connection_secret_id: { existing: "cluster-a" },
			}),
		},
	];
}

function otherClientEntries(): SettingsEntry[] {
	return [
		{ key: "setting_show_qr_code_field_buttons", value: "true" },
		{ key: "future_false", value: false },
		{ key: "future_zero", value: 0 },
		{ key: "future_empty", value: "" },
		{ key: "future_null", value: null },
		{
			key: "future_object",
			value: { version: 2, preferences: { enabled: false } },
		},
		{ key: "future_array", value: ["a", { enabled: true }] },
		{ key: "future_json_string", value: '{ "version": 2, "enabled": true }' },
	];
}

function cloneStored() {
	return Object.assign(JSON.parse(JSON.stringify(stored)), {
		datastore_id: stored.datastore_id,
		write_date: stored.write_date,
	}) as SettingsDatastore | DatastoreMetadata;
}

function entries(): SettingsEntry[] {
	if (!Array.isArray(stored))
		throw new Error("Expected persisted settings entries");
	return stored;
}

function commit(id: string, content: unknown) {
	if (!Array.isArray(content))
		throw new Error("Settings must be saved as an array");
	const write_date = `revision-${++revision}`;
	stored = Object.assign(
		JSON.parse(JSON.stringify(content)) as SettingsEntry[],
		{
			datastore_id: id,
			write_date,
		},
	);
	return { write_date };
}

const flushPersistence = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
	jest.resetAllMocks();
	revision = 1;
	mockState = {
		user: { userId: "user-a", token: "token-a" },
		server: { url: "https://server-a.example" },
		settingsDatastore: settingsReducer(undefined, { type: "@@INIT" }),
	};
	stored = Object.assign([...browserEntries(), ...otherClientEntries()], {
		datastore_id: "settings-a",
		write_date: "revision-1",
	});
	mockSettingsLoaded.mockImplementation((data) => {
		mockState.settingsDatastore = settingsReducer(mockState.settingsDatastore, {
			type: SETTINGS_DATASTORE_LOADED,
			data,
		});
	});
	mockRead.mockImplementation(async () => cloneStored());
	mockWrite.mockImplementation(async (id, content) => commit(id, content));
	jest
		.mocked(datastore.saveDatastoreContent)
		.mockImplementation(async (_type, _description, content) =>
			commit("settings-a", content),
		);
	await datastoreSettingService.getSettingsDatastore();
	mockRead.mockClear();
	mockSettingsLoaded.mockClear();
});

describe("Settings datastore preservation", () => {
	it("uses the admin word-count default only when the user has not saved a length", async () => {
		mockState.server.compliancePasswordGeneratorDefaultWordLength = 8;
		await datastoreSettingService.getSettingsDatastore();
		expect(mockState.settingsDatastore.passphraseWordCount).toBe(6);
		stored = Object.assign(
			entries().filter(
				(entry) =>
					![
						"setting_passphrase_word_count",
						"setting_passphrase_language",
						"setting_default_password_generator",
					].includes(entry.key),
			),
			{ datastore_id: "settings-a", write_date: "revision-1" },
		);
		await datastoreSettingService.getSettingsDatastore();
		expect(mockState.settingsDatastore.passphraseWordCount).toBe(8);
		expect(mockState.settingsDatastore.passphraseLanguage).toBe("");
		expect(mockState.settingsDatastore.defaultPasswordGenerator).toBe(
			"password",
		);
	});

	it("round-trips every known browser setting through the loader and serializer", () => {
		const content = datastoreSettingService.serializeSettingsDatastore(
			mockState.settingsDatastore,
		);
		expect(content).toHaveLength(35);
		expect(new Set(content.map(({ key }) => key))).toEqual(
			new Set(browserEntries().map(({ key }) => key)),
		);
	});

	it.each([
		"true",
		"false",
	])("preserves the app QR preference %s and opaque values on an unrelated save", async (value) => {
		entries().find(
			(entry) => entry.key === "setting_show_qr_code_field_buttons",
		)!.value = value;
		const before = entries().map((entry) => ({ ...entry }));
		const result = await datastoreSettingService.saveSettingsDatastore(
			datastoreSettingService.serializeSettingsDatastore({
				passwordLength: "31",
			}),
		);

		expect(result).toEqual({ write_date: "revision-2" });
		expect([...entries()]).toEqual(
			before.map((entry) =>
				entry.key === "setting_password_length"
					? { ...entry, value: "31" }
					: entry,
			),
		);
		expect(mockWrite).toHaveBeenCalledWith(
			"settings-a",
			expect.any(Array),
			"revision-1",
		);
		expect(mockSettingsLoaded).not.toHaveBeenCalled();
	});

	it("serializes only supplied settings while retaining explicit falsy values", () => {
		expect(
			datastoreSettingService.serializeSettingsDatastore({
				passwordLength: 0,
				passwordNumbers: "",
				gpgDefaultKey: null,
				useMarkdownForNotes: false,
			}),
		).toEqual([
			{ key: "setting_password_length", value: 0 },
			{ key: "setting_password_numbers", value: "" },
			{ key: "gpg_default_key", value: null },
			{ key: "setting_use_markdown_for_notes", value: false },
		]);
	});

	it.each([
		{
			name: "password settings",
			run: () =>
				actionCreators.setPasswordConfig(
					"30",
					"XYZ",
					"xyz",
					"789",
					"!?",
				)(mockDispatch),
			keys: [
				"setting_password_length",
				"setting_password_letters_uppercase",
				"setting_password_letters_lowercase",
				"setting_password_numbers",
				"setting_password_special_chars",
			],
		},
		{
			name: "passphrase settings",
			run: () =>
				actionCreators.setPassphraseConfig(7, "fr", "passphrase")(mockDispatch),
			keys: [
				"setting_passphrase_word_count",
				"setting_passphrase_language",
				"setting_default_password_generator",
			],
		},
		{
			name: "default password generator",
			run: () =>
				actionCreators.setDefaultPasswordGenerator("password")(mockDispatch),
			keys: ["setting_default_password_generator"],
		},
		{
			name: "passphrase settings without a default-generator change",
			run: () => actionCreators.setPassphraseConfig(8, "da")(mockDispatch),
			keys: ["setting_passphrase_word_count", "setting_passphrase_language"],
		},
		{
			name: "client options and no-save toggle",
			run: () =>
				actionCreators.setClientOptionsConfig(
					0,
					false,
					false,
					true,
					true,
				)(mockDispatch),
			keys: [
				"setting_clipboard_clear_delay",
				"setting_no_save_mode",
				"setting_show_no_save_toggle",
				"setting_confirm_unsaved_changes",
				"setting_use_markdown_for_notes",
			],
		},
		{
			name: "domain synonyms",
			run: () => actionCreators.setDomainSynonymsConfig([])(mockDispatch),
			keys: ["setting_custom_domain_synonyms"],
		},
		{
			name: "entry visibility",
			run: () =>
				actionCreators.setShownEntriesConfig(
					false,
					true,
					false,
					true,
					false,
					false,
					false,
					false,
					false,
					true,
					false,
					true,
					false,
					true,
					false,
					false,
				)(mockDispatch),
			keys: browserEntries()
				.filter(
					({ key }) =>
						key.startsWith("setting_show_") &&
						key !== "setting_show_no_save_toggle",
				)
				.map(({ key }) => key),
		},
		{
			name: "GPG settings",
			run: () =>
				actionCreators.setGpgConfig(
					null,
					"https://other-keys.example",
					false,
				)(mockDispatch),
			keys: ["gpg_default_key", "gpg_hkp_key_server", "gpg_hkp_search"],
		},
		{
			name: "connection-reference addition",
			run: () =>
				actionCreators.setConnectionAuthentication("new", {
					secret_id: "new-credential",
					secret_key: "new-key",
				})(mockDispatch),
			keys: ["setting_connection_authentication"],
		},
		{
			name: "connection-reference removal",
			run: () =>
				actionCreators.setConnectionAuthentication(
					"existing",
					null,
				)(mockDispatch),
			keys: ["setting_connection_authentication"],
		},
		{
			name: "gateway selection",
			run: () =>
				actionCreators.setGatewayClusterSelection(
					"new",
					"cluster-b",
				)(mockDispatch),
			keys: ["setting_gateway_cluster_selection"],
		},
		{
			name: "gateway selection removal",
			run: () =>
				actionCreators.setGatewayClusterSelection(
					"existing",
					null,
				)(mockDispatch),
			keys: ["setting_gateway_cluster_selection"],
		},
	])("preserves every unrelated setting through $name", async ({
		run,
		keys,
	}) => {
		const untouched = entries().filter(({ key }) => !keys.includes(key));
		const previousValues = entries().filter(({ key }) => keys.includes(key));
		await run();
		await flushPersistence();

		expect(mockWrite).toHaveBeenCalledTimes(1);
		expect(entries().filter(({ key }) => !keys.includes(key))).toEqual(
			untouched,
		);
		expect(entries().filter(({ key }) => keys.includes(key))).not.toEqual(
			previousValues,
		);
		expect(entries()).toHaveLength(43);
		expect(new Set(entries().map(({ key }) => key)).size).toBe(43);
	});

	it("re-reads changes from another client before each save, including recognized settings", async () => {
		await datastoreSettingService.saveSettingsDatastore([
			{ key: "setting_password_length", value: "31" },
		]);
		await datastoreSettingService.getSettingsDatastore();
		entries().find(
			({ key }) => key === "setting_show_qr_code_field_buttons",
		)!.value = "false";
		entries().find(
			({ key }) => key === "setting_clipboard_clear_delay",
		)!.value = "90";
		entries().push({ key: "new_app_setting", value: { enabled: true } });
		stored.write_date = "external-revision";
		const before = entries().map((entry) => ({ ...entry }));

		actionCreators.setDomainSynonymsConfig([])(mockDispatch);
		await flushPersistence();
		expect([...entries()]).toEqual(
			before.map((entry) =>
				entry.key === "setting_custom_domain_synonyms"
					? { ...entry, value: "[]" }
					: entry,
			),
		);
		expect(mockWrite).toHaveBeenLastCalledWith(
			"settings-a",
			expect.any(Array),
			"external-revision",
		);
		expect(mockRead).toHaveBeenCalledTimes(3);
	});

	it("does not dispatch or retry a revision-conflicted gateway save", async () => {
		const selection = mockState.settingsDatastore.gatewayClusterSelection;
		mockWrite.mockImplementationOnce(async () => {
			// The datastore writer reports a rejected revision as an undefined result.
			entries().find(
				({ key }) => key === "setting_show_qr_code_field_buttons",
			)!.value = "false";
			stored.write_date = "newer-app-revision";
			return undefined;
		});
		await expect(
			actionCreators.setGatewayClusterSelection(
				"new",
				"cluster-b",
			)(mockDispatch),
		).rejects.toEqual({ code: "SETTINGS_PERSISTENCE_FAILED" });
		expect(mockState.settingsDatastore.gatewayClusterSelection).toBe(selection);
		expect(
			entries().find(({ key }) => key === "setting_show_qr_code_field_buttons")!
				.value,
		).toBe("false");
		expect(stored.write_date).toBe("newer-app-revision");
		expect(mockWrite).toHaveBeenCalledTimes(1);
		expect(datastore.saveDatastoreContent).not.toHaveBeenCalled();
	});

	it("preserves opaque entry metadata without mutating the loaded data or updates", async () => {
		const loaded = Object.assign(
			[
				{
					key: "setting_password_length",
					value: "22",
					metadata: { source: "app" },
				},
				...otherClientEntries(),
			],
			{ datastore_id: "settings-a", write_date: "revision-1" },
		);
		mockRead.mockResolvedValueOnce(loaded);
		const before = JSON.stringify(loaded);
		const updates = [{ key: "setting_password_length", value: "32" }];
		await datastoreSettingService.saveSettingsDatastore(updates);
		expect(entries()[0]).toEqual({
			key: "setting_password_length",
			value: "32",
			metadata: { source: "app" },
		});
		expect(JSON.stringify(loaded)).toBe(before);
		expect(updates).toEqual([{ key: "setting_password_length", value: "32" }]);
	});

	it("initializes a new metadata-only settings datastore", async () => {
		stored = { datastore_id: "new-settings", write_date: "initial-revision" };
		await datastoreSettingService.saveSettingsDatastore([
			{ key: "setting_use_markdown_for_notes", value: false },
		]);
		expect([...entries()]).toEqual([
			{ key: "setting_use_markdown_for_notes", value: false },
		]);
		expect(mockWrite).toHaveBeenCalledWith(
			"new-settings",
			expect.any(Array),
			"initial-revision",
		);
	});

	it.each([
		undefined,
		{ datastore_id: "settings-a", unexpected: "data" },
	])("does not overwrite settings after an unavailable or unrecognized read (%p)", async (result) => {
		mockRead.mockResolvedValueOnce(result);
		await expect(
			datastoreSettingService.saveSettingsDatastore([
				{ key: "setting_password_length", value: "31" },
			]),
		).resolves.toBeUndefined();
		expect(mockWrite).not.toHaveBeenCalled();
		expect(datastore.saveDatastoreContent).not.toHaveBeenCalled();
		expect(notification.errorSend).toHaveBeenCalledWith(
			"DATASTORE_SAVE_FAILED",
		);
	});

	it("reports a rejected read without replacing the datastore", async () => {
		mockRead.mockRejectedValueOnce(new Error("read failed"));
		await expect(
			datastoreSettingService.saveSettingsDatastore([]),
		).resolves.toBeUndefined();
		expect(mockWrite).not.toHaveBeenCalled();
		expect(notification.errorSend).toHaveBeenCalledWith(
			"DATASTORE_SAVE_FAILED",
		);
	});

	it.each([
		"user",
		"server",
		"session",
	])("does not save into a changed %s while reading existing settings", async (changed) => {
		let resolveRead!: (value: SettingsDatastore | DatastoreMetadata) => void;
		mockRead.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveRead = resolve;
			}),
		);
		const original = cloneStored();
		const saving = datastoreSettingService.saveSettingsDatastore([
			{ key: "setting_password_length", value: "31" },
		]);
		if (changed === "user") mockState.user.userId = "user-b";
		if (changed === "server") mockState.server.url = "https://server-b.example";
		if (changed === "session") mockState.user.token = "token-b";
		resolveRead(original);
		await expect(saving).resolves.toBeUndefined();
		expect(mockWrite).not.toHaveBeenCalled();
		expect(datastore.saveDatastoreContent).not.toHaveBeenCalled();
	});
});

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
			useMarkdownForNotes: false,
			showGPGKey: true,
			showSSHConnection: true,
			showRDPConnection: false,
			showVNCConnection: true,
			connectionAuthentication,
			gatewayClusterSelection: {
				schema_version: 1,
				by_connection_secret_id: { connection: "cluster" },
			},
		});
		const settings = Object.fromEntries(
			content.map(({ key, value }) => [key, value]),
		);

		expect(settings.setting_show_mail_gpg_own_key).toBe(true);
		expect(settings.setting_use_markdown_for_notes).toBe(false);
		expect(settings.setting_show_ssh_connection).toBe(true);
		expect(settings.setting_show_rdp_connection).toBe(false);
		expect(settings.setting_show_vnc_connection).toBe(true);
		expect(
			JSON.parse(settings.setting_connection_authentication as string),
		).toEqual(connectionAuthentication);
		expect(
			JSON.parse(settings.setting_gateway_cluster_selection as string),
		).toEqual({
			schema_version: 1,
			by_connection_secret_id: { connection: "cluster" },
		});
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

	it("normalizes malformed gateway cluster selections and drops invalid values", () => {
		expect(
			datastoreSettingService.normalizeGatewayClusterSelection({}),
		).toEqual({
			schema_version: 1,
			by_connection_secret_id: {},
		});
		expect(
			datastoreSettingService.normalizeGatewayClusterSelection({
				schema_version: 1,
				by_connection_secret_id: {
					valid: "cluster-a",
					empty: "",
					wrong: 42,
				},
			}),
		).toEqual({
			schema_version: 1,
			by_connection_secret_id: { valid: "cluster-a" },
		});
	});
});
