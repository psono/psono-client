import type { Action, Dispatch } from "redux";
import type * as ActionTypes from "../js/actions/action-types";
import type { DecodedServerInfo } from "./host";
import type {
	ClientState,
	ConnectionAuthentication,
	DomainSynonyms,
	GatewayClusterSelection,
	PersistentState,
	ServerState,
	SettingsState,
	TransientState,
	UserState,
} from "./state";
import type { NotificationMessage, NotificationText } from "./utilities";

/** Signed server information is sparse while the login page resets its host. */
export interface ServerInfoPayload extends Partial<DecodedServerInfo> {
	allow_user_search_by_email?: boolean;
	allow_user_search_by_username_partial?: boolean;
	allowed_second_factors?: string[];
	api?: string;
	authentication_methods?: string[];
	credit_buy_address?: string;
	credit_costs_upload?: string | number;
	credit_costs_download?: string | number;
	credit_costs_storage?: string | number;
	compliance_central_security_reports_recurrence_interval?: number;
	compliance_disable_api_keys?: boolean;
	compliance_disable_delete_account?: boolean;
	compliance_disable_emergency_codes?: boolean;
	compliance_disable_totp?: boolean;
	compliance_disable_export?: boolean;
	compliance_disable_export_of_shared_items?: boolean;
	compliance_disable_unmanaged_groups?: boolean;
	compliance_disable_file_repositories?: boolean;
	compliance_disable_link_shares?: boolean;
	compliance_disable_multiple_password_datastores?: boolean;
	compliance_disable_offline_mode?: boolean;
	compliance_max_offline_cache_time_valid?: number;
	compliance_disable_shares?: boolean;
	compliance_disable_recovery_codes?: boolean;
	compliance_enforce_2fa?: boolean;
	compliance_enforce_central_security_reports?: boolean;
	compliance_enforce_breach_detection?: boolean;
	compliance_clipboard_clear_delay?: number;
	compliance_min_clipboard_clear_delay?: number;
	compliance_max_clipboard_clear_delay?: number;
	compliance_password_generator_default_password_length?: number;
	compliance_password_generator_default_letters_uppercase?: string;
	compliance_password_generator_default_letters_lowercase?: string;
	compliance_password_generator_default_numbers?: string;
	compliance_password_generator_default_special_chars?: string;
	compliance_server_secrets?: string;
	license_id?: string;
	license_max_users?: number | null;
	license_mode?: string;
	license_type?: string;
	license_valid_from?: number | null;
	license_valid_till?: number | null;
	files?: boolean;
	/** Only an explicit boolean true enables the gateway. */
	gateway?: unknown;
	log_audit?: boolean;
	management?: boolean;
	public_key?: string;
	web_client?: string;
	disable_callbacks?: boolean;
	allowed_file_repository_types?: string[];
	disable_central_security_reports?: boolean;
	multifactor_enabled?: boolean;
	favicon_service_url?: string;
	system_wide_duo_exists?: boolean;
	domain_synonyms?: DomainSynonyms;
}

/** Policies use the same wire fields; reducers apply only their known keys. */
export type ServerPolicyPayload = ServerInfoPayload;

/** Decrypted key/value settings, including legacy numeric strings. */
export interface SettingsDatastorePayload {
	[key: string]: unknown;
	setting_password_length?: string | number;
	setting_password_letters_uppercase?: string;
	setting_password_letters_lowercase?: string;
	setting_password_numbers?: string;
	setting_password_special_chars?: string;
	setting_clipboard_clear_delay?: string | number;
	setting_use_markdown_for_notes?: boolean | string;
	gpg_default_key?: SettingsState["gpgDefaultKey"];
	gpg_hkp_key_server?: string;
	gpg_hkp_search?: boolean | string;
	setting_show_website_password?: boolean;
	setting_show_application_password?: boolean;
	setting_show_totp?: boolean;
	setting_show_passkey?: boolean;
	setting_show_note?: boolean;
	setting_show_environment_variables?: boolean;
	setting_show_ssh_own_key?: boolean;
	setting_show_mail_gpg_own_key?: boolean;
	setting_show_ssh_connection?: boolean;
	setting_show_rdp_connection?: boolean;
	setting_show_vnc_connection?: boolean;
	setting_show_credit_card?: boolean;
	setting_show_bookmark?: boolean;
	setting_show_identity?: boolean;
	setting_show_elster_certificate?: boolean;
	setting_show_file?: boolean;
	setting_show_no_save_toggle?: boolean;
	setting_no_save_mode?: boolean;
	setting_confirm_unsaved_changes?: boolean;
	setting_custom_domain_synonyms?: DomainSynonyms;
	/** These legacy envelopes are normalized by the reducer. */
	setting_connection_authentication?: unknown;
	setting_gateway_cluster_selection?: unknown;
}

type PasswordConfig = Pick<
	SettingsState,
	| "passwordLength"
	| "passwordLettersUppercase"
	| "passwordLettersLowercase"
	| "passwordNumbers"
	| "passwordSpecialChars"
>;
type ClientOptionsConfig = Pick<
	SettingsState,
	| "clipboardClearDelay"
	| "noSaveMode"
	| "showNoSaveToggle"
	| "confirmOnUnsavedChanges"
	| "useMarkdownForNotes"
>;
type ShownEntriesConfig = Pick<
	SettingsState,
	| "showWebsitePassword"
	| "showApplicationPassword"
	| "showTOTPAuthenticator"
	| "showPasskey"
	| "showNote"
	| "showEnvironmentVariables"
	| "showSSHKey"
	| "showGPGKey"
	| "showSSHConnection"
	| "showRDPConnection"
	| "showVNCConnection"
	| "showCreditCard"
	| "showBookmark"
	| "showIdentity"
	| "showElsterCertificate"
	| "showFile"
>;

export interface ActionPayloads {
	[ActionTypes.SET_USER_USERNAME]: Pick<UserState, "username">;
	[ActionTypes.SET_USER_INFO_1]: Pick<
		UserState,
		"rememberMe" | "trustDevice" | "authentication"
	>;
	[ActionTypes.SET_USER_INFO_2]: Pick<
		UserState,
		| "userPrivateKey"
		| "userPublicKey"
		| "sessionSecretKey"
		| "token"
		| "userSauce"
		| "authentication"
		| "passwordSha1Prefix"
	>;
	[ActionTypes.SET_USER_PASSWORD_SHA1_PREFIX]: Pick<
		UserState,
		"passwordSha1Prefix"
	>;
	[ActionTypes.SET_USER_INFO_3]: Pick<
		UserState,
		| "userId"
		| "userEmail"
		| "userSecretKey"
		| "serverSecretExists"
		| "requirePasswordChange"
	>;
	[ActionTypes.SET_REQUIRE_PASSWORD_CHANGE]: Pick<
		UserState,
		"requirePasswordChange"
	>;
	[ActionTypes.SET_HASHING_PARAMETERS]: Pick<
		UserState,
		"hashingAlgorithm" | "hashingParameters"
	>;
	[ActionTypes.SET_SERVER_SECRET_EXISTS]: Pick<UserState, "serverSecretExists">;
	[ActionTypes.SET_HAS_TWO_FACTOR]: Pick<UserState, "hasTwoFactor">;
	[ActionTypes.SET_EMAIL]: Pick<UserState, "userEmail">;
	[ActionTypes.SET_USER_DATASTORE_OVERVIEW]: Pick<
		UserState,
		"userDatastoreOverview"
	>;
	[ActionTypes.LOGOUT]: Pick<UserState, "rememberMe">;
	[ActionTypes.SET_SERVER_INFO]: {
		info: ServerInfoPayload;
		verifyKey?: string;
		adminRecoveryPublicKey?: unknown;
	};
	[ActionTypes.SET_SERVER_POLICY]: { policy: ServerPolicyPayload };
	[ActionTypes.SET_SERVER_URL]: Pick<ServerState, "url">;
	[ActionTypes.SET_SERVER_STATUS]: Pick<ServerState, "status">;
	[ActionTypes.SET_CLIENT_URL]: Pick<ClientState, "url">;
	[ActionTypes.ENABLE_OFFLINE_MODE]: Record<never, never>;
	[ActionTypes.DISABLE_OFFLINE_MODE]: Record<never, never>;
	[ActionTypes.SET_OFFLINE_CACHE_ENCRYPTION_INFO]: Pick<
		ClientState,
		"offlineCacheEncryptionKey" | "offlineCacheEncryptionSalt"
	>;
	[ActionTypes.SET_NOTIFICATION_ON_COPY]: Pick<
		ClientState,
		"notificationOnCopy"
	>;
	[ActionTypes.SET_DISABLE_BROWSER_PM]: Pick<ClientState, "disableBrowserPm">;
	[ActionTypes.SET_SHOW_FILTERS]: Pick<ClientState, "showFilters">;
	[ActionTypes.SET_HIDE_DOWNLOAD_BANNER]: Pick<
		ClientState,
		"hideDownloadBanner"
	>;
	[ActionTypes.SET_LAST_POPUP_SEARCH]: Pick<ClientState, "lastPopupSearch">;
	[ActionTypes.SETTINGS_DATASTORE_LOADED]: { data: SettingsDatastorePayload };
	[ActionTypes.SET_PASSWORD_CONFIG]: PasswordConfig;
	[ActionTypes.SET_CLIENT_CONFIG]: ClientOptionsConfig;
	[ActionTypes.SET_DOMAIN_SYNONYMS_CONFIG]: Pick<
		SettingsState,
		"customDomainSynonyms"
	>;
	[ActionTypes.SET_SHOWN_ENTRIES_CONFIG]: ShownEntriesConfig;
	[ActionTypes.SET_GPG_CONFIG]: Pick<
		SettingsState,
		"gpgDefaultKey" | "gpgHkpKeyServer" | "gpgHkpSearch"
	>;
	[ActionTypes.SET_GPG_DEFAULT_KEY]: Pick<SettingsState, "gpgDefaultKey">;
	[ActionTypes.SET_CONNECTION_AUTHENTICATION]: {
		connectionAuthentication: ConnectionAuthentication;
	};
	[ActionTypes.SET_GATEWAY_CLUSTER_SELECTION]: {
		gatewayClusterSelection: GatewayClusterSelection;
	};
	[ActionTypes.SET_KNOWN_HOSTS]: Pick<PersistentState, "knownHosts">;
	[ActionTypes.SET_AUTO_APPROVE_PLAINTEXT_PASSWORD]: Pick<
		PersistentState,
		"autoApproveLdap"
	>;
	[ActionTypes.SET_FINGERPRINT]: Pick<PersistentState, "fingerprint">;
	[ActionTypes.SET_REMOTE_CONFIG_JSON]: Pick<
		PersistentState,
		"remoteConfigWebClientUrl" | "remoteConfigJson"
	>;
	[ActionTypes.NOTIFICATION_SEND]: {
		message: NotificationText;
		messageType: NotificationMessage["type"];
	};
	[ActionTypes.NOTIFICATION_SET]: { messages: NotificationMessage[] };
	[ActionTypes.SET_REQUESTS_IN_PROGRESS]: TransientState;
	[ActionTypes.SET_DEVICE_CODE]: { id: string; secretBoxKey: string };
	[ActionTypes.CLEAR_DEVICE_CODE]: Record<never, never>;
}

export type AppAction = {
	[Type in keyof ActionPayloads]: Action<Type> & ActionPayloads[Type];
}[keyof ActionPayloads];

/** Redux initialization/probe actions carry no application payload. */
export type ReducerAction = AppAction | Action<`@@${string}`>;

/** These thunks only use dispatch and are compatible with redux-thunk. */
export type AppThunk<Result = void> = (dispatch: Dispatch<AppAction>) => Result;

/** bindActionCreators dispatches the thunk, returning its result to the caller. */
export type BoundActionCreators<Creators> = {
	[Name in keyof Creators]: Creators[Name] extends (
		...args: infer Args
	) => AppThunk<infer Result>
		? (...args: Args) => Result
		: never;
};
