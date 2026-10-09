import type {
	EmergencyCode,
	EmergencyCodeActivationData,
	EmergencyCodeStatus,
	EncryptedLoginData,
	IvaltFactor,
	PreloginData,
	RecoveryEnableData,
	SecondFactor,
	SerializedCreationOptions,
	SerializedRequestOptions,
	TokenActivationData,
	UserSession,
} from "./auth";
import type { ScryptParameters } from "./crypto";
import type { DatastoreOverview, ShareRights } from "./datastore";
import type { DecodedServerInfo } from "./host";
import type {
	CreatedFile,
	FileRepository,
	FileRepositoryDetail,
	FileTransfer,
	RepositoryDownload,
	RepositoryUpload,
	Shard,
} from "./files";
import type {
	ApiKey,
	ApiKeyOverview,
	ApiKeySecret,
	CreatedMembership,
	Group,
	GroupDetail,
	GroupShare,
	LinkShareOverview,
	ShareOverviewEntry,
	ShareRightsDetail,
	ShareRightsOverview,
} from "./vault";

export type { ShareOverviewEntry, ShareRight } from "./vault";

/** The Axios-compatible envelope retained by the fetch-based API clients. */
export interface ApiResponse<T = ApiRecord> {
	data: T;
}

/**
 * Legacy server records are extensible across server versions and editions.
 * Keep the dynamic JSON boundary here; transport, request parameters and known
 * response fields are typed independently rather than making services `any`.
 */
export interface ApiRecord {
	[field: string]: any;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type ApiHeaders = Record<string, string>;
export type AuthToken = string | null | undefined;
export type SessionSecretKey = string | null | undefined;
export type ResponseSideEffect = (response: Response) => void;
export type SignedUploadFields = Record<string, string | Blob>;

/** Optional or empty IDs select list endpoints in the legacy API. */
export type ApiDetailOrList<Id, Detail, List> = Id extends "" | null | undefined
	? List
	: Detail;

/** JSON-compatible parameters for password hashing algorithms. */
export type HashingParameters =
	| ScryptParameters
	| Record<string, string | number | boolean | undefined>;

export interface EncryptedPayload {
	text: string;
	nonce: string;
}

export interface ApiError extends ApiRecord {
	errors?: string[];
	non_field_errors?: string[];
}

export interface ServerInfo extends ApiRecord {
	info: string;
	signature: string;
	verify_key: string;
	decoded_info?: DecodedServerInfo;
}

export type PreloginResponse = PreloginData;

export interface EncryptedSecret extends ApiRecord {
	id: string;
	data: string;
	data_nonce: string;
}

export interface BulkSecretInput {
	data: string;
	data_nonce: string;
	link_id: string;
	callback_url?: string | null;
	callback_user?: string | null;
	callback_pass?: string | null;
}

export interface CreatedSecret {
	secret_id: string;
	link_id: string;
}

export interface GatewayCluster extends ApiRecord {
	id: string;
	title?: string;
}

export interface GatewayLaunch extends ApiRecord {
	gateway_url: string;
	launch_id: string;
}

export interface SecurityReportEntry {
	name?: string;
	master_password: boolean;
	rating: number;
	password_length: number;
	variation_count: number;
	breached?: number | string;
	type: string;
	input_type: string;
	duplicate: boolean;
	create_age: number;
	write_age: number;
}

export interface EncryptedDatastore extends ApiRecord {
	secret_key: string;
	secret_key_nonce: string;
	data: string;
	data_nonce: string;
	write_date?: string;
}

export interface SecretHistoryEntry extends ApiRecord {
	id: string;
	create_date: string;
	write_date: string;
}

export interface SecretHistoryDetail extends ApiRecord {
	data: string;
	data_nonce: string;
	create_date: string;
	write_date: string;
	callback_url?: string;
	callback_user?: string;
	callback_pass?: string;
}

/** Known payloads; edition-specific extra fields remain in ApiRecord. */
export interface ApiEndpointData {
	login: EncryptedLoginData;
	activateToken: TokenActivationData;
	sessions: { sessions: UserSession[] };
	emergencyCodes: {
		emegency_codes: EmergencyCode[];
		default_hashing_algorithm?: string;
		default_hashing_parameters?: ScryptParameters;
	};
	recovery: RecoveryEnableData;
	emergency:
		| EmergencyCodeActivationData
		| (EmergencyCodeStatus & { status: "started" | "waiting" });
	datastores: DatastoreOverview;
	datastore: EncryptedDatastore;
	share: {
		data: string;
		data_nonce: string;
		write_date?: string;
		rights: ShareRights;
	};
	shares: { shares: ShareOverviewEntry[] };
	shareRights: ShareRightsOverview;
	shareRightsDetail: ShareRightsDetail;
	acceptedShare: ApiRecord & { share_id: string };
	webauthn: { id: string; options: SerializedCreationOptions };
	webauthns: { webauthns: SecondFactor[] };
	webauthnVerification: { options: SerializedRequestOptions };
	googleAuthenticators: { google_authenticators: SecondFactor[] };
	duos: { duos: SecondFactor[] };
	yubikeyOtps: { yubikey_otps: SecondFactor[] };
	ivalts: { ivalt: IvaltFactor[] };
	apiKey: ApiKey;
	apiKeys: ApiKeyOverview;
	apiKeySecrets: ApiKeySecret[];
	fileRepository: FileRepositoryDetail;
	fileRepositories: { file_repositories: FileRepository[] };
	fileTransfer: FileTransfer;
	createdFile: CreatedFile;
	repositoryUpload: RepositoryUpload;
	repositoryDownload: RepositoryDownload;
	shards: { shards: Shard[] };
	group: GroupDetail;
	createdGroup: Group;
	groups: { groups: Group[] };
	createdMembership: CreatedMembership;
	groupRights: { group_rights: GroupShare[] };
	linkShares: LinkShareOverview;
	history: { history: SecretHistoryEntry[] };
	historyDetail: SecretHistoryDetail;
	avatars: { avatars: (ApiRecord & { id: string })[] };
}
