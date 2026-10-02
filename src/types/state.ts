import type { Store } from "redux";
import type { ThunkDispatch } from "redux-thunk";
import type { ReducerAction } from "./actions";
import type {
	AuthenticationMethod,
	ConnectionAuthenticationReference,
	ConnectionAuthenticationSettings,
} from "./auth";
import type { ClientConfiguration } from "./browser";
import type { ScryptParameters } from "./crypto";
import type {
	DatastoreOverview,
	EncryptedValue,
	GpgKeySelection,
} from "./datastore";
import type {
	DomainSynonymGroups,
	DomainSynonymMap,
	NotificationMessage,
} from "./utilities";

export type { AppAction } from "./actions";

export type {
	ClientConfiguration,
	BackendServerConfiguration as BackendServer,
} from "./browser";

export type HashingParameters = ScryptParameters;

export interface UserState {
	isLoggedIn: boolean;
	username: string;
	rememberMe: boolean;
	trustDevice: boolean;
	hasTwoFactor: boolean;
	authentication: AuthenticationMethod | "";
	/** Short, non-authenticating check for mistyped report passwords. */
	passwordSha1Prefix: string;
	hashingAlgorithm: string | undefined;
	hashingParameters: HashingParameters | undefined;
	userSecretKey: string;
	serverSecretExists: boolean;
	userPrivateKey: string;
	userPublicKey: string;
	sessionSecretKey: string;
	token: string;
	userSauce: string;
	userEmail: string;
	userId: string;
	requirePasswordChange: boolean;
	userDatastoreOverview: DatastoreOverview;
}

export interface KnownHost {
	url: string;
	verify_key: string;
	admin_recovery_public_key?: string;
}

export interface PersistentState {
	knownHosts: KnownHost[];
	autoApproveLdap: Record<string, boolean>;
	remoteConfigWebClientUrl: string | null;
	remoteConfigJson: Partial<ClientConfiguration> | null;
	fingerprint: string | null;
}

export type DomainSynonyms = DomainSynonymGroups;

export interface ServerState {
	url: string;
	/** Sparse server info is used to reset the selected host before login. */
	api: string | undefined;
	allowUserSearchByEmail: boolean | undefined;
	allowUserSearchByUsernamePartial: boolean | undefined;
	allowedSecondFactors: string[] | undefined;
	authenticationMethods: string[] | undefined;
	build: string | undefined;
	creditBuyAddress: string | undefined;
	/** Legacy download views may read this persisted wire-format field. */
	credit_buy_address?: string;
	creditCostsUpload: string | number | undefined;
	creditCostsDownload: string | number | undefined;
	creditCostsStorage: string | number | undefined;
	complianceCentralSecurityReportsRecurrenceInterval: number | undefined;
	complianceDisableApiKeys: boolean | undefined;
	complianceDisableDeleteAccount: boolean | undefined;
	complianceDisableEmergencyCodes: boolean | undefined;
	complianceDisableTotp: boolean | undefined;
	complianceDisableExport: boolean | undefined;
	complianceDisableExportOfSharedItems: boolean | undefined;
	complianceDisableUnmanagedGroups: boolean | undefined;
	complianceDisableFileRepositories: boolean | undefined;
	complianceDisableLinkShares: boolean | undefined;
	complianceDisableMultiplePasswordDatastores: boolean;
	complianceDisableOfflineMode: boolean | undefined;
	complianceMaxOfflineCacheTimeValid: number;
	complianceDisableShares: boolean | undefined;
	complianceDisableRecoveryCodes: boolean | undefined;
	complianceEnforce2fa: boolean | undefined;
	complianceEnforceCentralSecurityReports: boolean | undefined;
	complianceEnforceBreachDetection: boolean;
	complianceMinMasterPasswordComplexity: number | undefined;
	complianceMinMasterPasswordLength: number | undefined;
	complianceClipboardClearDelay: number;
	complianceMinClipboardClearDelay: number;
	complianceMaxClipboardClearDelay: number;
	compliancePasswordGeneratorDefaultPasswordLength: number | undefined;
	compliancePasswordGeneratorDefaultLettersUppercase: string | undefined;
	compliancePasswordGeneratorDefaultLettersLowercase: string | undefined;
	compliancePasswordGeneratorDefaultNumbers: string | undefined;
	compliancePasswordGeneratorDefaultSpecialChars: string | undefined;
	complianceServerSecrets: string;
	licenseId: string | undefined;
	licenseMode: string | undefined;
	licenseType: string | undefined;
	licenseMaxUsers?: number | null;
	licenseValidFrom?: number | null;
	licenseValidTill?: number | null;
	type: string | undefined;
	files: boolean | undefined;
	gateway: boolean;
	logAudit: boolean | undefined;
	management: boolean | undefined;
	adminRecoveryPublicKey: string;
	publicKey: string | undefined;
	version: string | undefined;
	webClient: string | undefined;
	disableCentralSecurityReports: boolean | undefined;
	disableCallbacks: boolean;
	allowedFileRepositoryTypes: string[];
	multifactorEnabled: boolean | undefined;
	systemWideDuoExists: boolean | undefined;
	verifyKey: string | undefined;
	faviconServiceUrl?: string;
	status: {
		data: {
			last_security_report_created?: string | null;
			unaccepted_shares_count?: number;
			unaccepted_groups_count?: number;
			unaccepted_forced_groups_count?: number;
			[counter: string]: unknown;
		};
		valid_till?: number;
	};
	domainSynonyms: DomainSynonyms;
	customDomainSynonyms: DomainSynonyms;
	domainSynonymMap: DomainSynonymMap;
}

export type ConnectionAuthenticationEntry = ConnectionAuthenticationReference;

export type ConnectionAuthentication = ConnectionAuthenticationSettings;

export interface GatewayClusterSelection {
	schema_version: number;
	by_connection_secret_id: Record<string, string>;
}

export interface SettingsState {
	/** The settings form dispatches its text input without numeric coercion. */
	passwordLength: number | string;
	passwordLettersUppercase: string;
	passwordLettersLowercase: string;
	passwordNumbers: string;
	passwordSpecialChars: string;
	clipboardClearDelay: number;
	useMarkdownForNotes: boolean;
	/** Imported keys may have an ID without a display label. */
	gpgDefaultKey:
		| (Pick<GpgKeySelection, "id"> & Partial<Pick<GpgKeySelection, "label">>)
		| null;
	gpgHkpKeyServer: string;
	/** The legacy GPG checkbox stores event.target.value as well as booleans. */
	gpgHkpSearch: boolean | string;
	showWebsitePassword: boolean;
	showApplicationPassword: boolean;
	showTOTPAuthenticator: boolean;
	showPasskey: boolean;
	showNote: boolean;
	showEnvironmentVariables: boolean;
	showSSHKey: boolean;
	showGPGKey: boolean;
	showSSHConnection: boolean;
	showRDPConnection: boolean;
	showVNCConnection: boolean;
	showCreditCard: boolean;
	showBookmark: boolean;
	showIdentity: boolean;
	showElsterCertificate: boolean;
	showFile: boolean;
	noSaveMode?: boolean;
	showNoSaveToggle?: boolean;
	confirmOnUnsavedChanges?: boolean;
	customDomainSynonyms: DomainSynonyms;
	connectionAuthentication: ConnectionAuthentication;
	gatewayClusterSelection: GatewayClusterSelection;
}

export interface ClientState {
	url: string;
	offlineMode: boolean | null;
	offlineCacheEncryptionKey: EncryptedValue | null;
	offlineCacheEncryptionSalt: string | null;
	notificationOnCopy: boolean;
	disableBrowserPm: boolean;
	showFilters: boolean;
	hideDownloadBanner: boolean;
	lastPopupSearch: string;
}

export interface TransientState {
	requestCounterOpen: number;
	requestCounterClosed: number;
}

export interface NotificationState {
	messages: NotificationMessage[];
}

export interface DeviceState {
	deviceCode: { id: string; secretBoxKey: string } | null;
}

/** Public state includes initial values and values written by every reducer. */
export interface AppState {
	user: UserState;
	server: ServerState;
	persistent: PersistentState;
	settingsDatastore: SettingsState;
	client: ClientState;
	transient: TransientState;
	notification: NotificationState;
	device: DeviceState;
}

export type AppDispatch = ThunkDispatch<AppState, undefined, ReducerAction>;

export type AppStore = Omit<Store<AppState, ReducerAction>, "dispatch"> & {
	dispatch: AppDispatch;
};
