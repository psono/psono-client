import type { ScryptParameters } from "./crypto";

export type AuthenticationMethod = "AUTHKEY" | "LDAP" | "SAML" | "OIDC";
export type SsoProtocol = "saml" | "oidc";

/** The authentication endpoints retain the legacy axios-shaped envelope. */
export interface AuthResponse<T> {
	data: T;
}

export interface AuthErrorData {
	non_field_errors?: string[];
	ga_token?: string[];
	detail?: string;
	[field: string]: unknown;
}

export type AuthOperationResult =
	| { response: "success" }
	| { response: "error"; error_data: unknown };

export interface LogoutResult {
	response: "success" | "ignored";
	redirect_url?: string;
}

export interface PreloginData {
	hashing_algorithm: string;
	hashing_parameters: ScryptParameters;
}

export interface EncryptedLoginData {
	login_info: string;
	login_info_nonce: string;
}

export interface LoginUser {
	id?: string;
	username: string;
	email?: string;
	private_key: string;
	private_key_nonce: string;
	public_key: string;
	user_sauce: string;
	authentication?: AuthenticationMethod;
	hashing_algorithm?: string;
	hashing_parameters?: ScryptParameters;
	require_password_change?: boolean;
	language?: string;
	policies?: Record<string, unknown>;
}

export interface LoginData {
	user: LoginUser;
	token: string;
	session_secret_key: string;
	session_secret_key_nonce?: string;
	session_public_key?: string;
	server_session_public_key?: string;
	user_validator: string;
	user_validator_nonce: string;
	password?: string;
	required_multifactors: string[];
}

export interface LoginEnvelope {
	server_session_public_key?: string;
	session_public_key?: string;
	data: string;
	data_nonce: string;
}

export type LoginResult =
	| LoginData
	| { require_password: (password: string) => LoginResult };

export interface TokenActivationData {
	user: {
		id: string;
		email: string;
		secret_key: string;
		secret_key_nonce: string;
		authentication: AuthenticationMethod;
		server_secret_exists?: boolean;
		require_password_change?: boolean;
	};
}

export interface UserSession {
	id: string;
	device_description: string;
	create_date: string;
	current_session: boolean;
}

export interface RecoveredKeys {
	user_private_key: string;
	user_secret_key: string;
}

export interface RecoveryInformation extends RecoveredKeys {
	user_sauce: string;
	verifier_public_key: string;
	verifier_time_valid: number;
	hashing_algorithm: string;
	hashing_parameters: ScryptParameters;
}

export interface RecoveryEnableData
	extends Omit<
		RecoveryInformation,
		keyof RecoveredKeys | "hashing_algorithm" | "hashing_parameters"
	> {
	recovery_data: string;
	recovery_data_nonce: string;
	recovery_sauce: string;
	policies?: Record<string, unknown>;
	hashing_algorithm?: string;
	hashing_parameters?: ScryptParameters;
}

export interface EmergencyCodeStatus {
	status: "started" | "waiting" | "active";
	remaining_wait_time?: number;
}

export interface EmergencyCodeActivationData {
	status?: string;
	emergency_data: string;
	emergency_data_nonce: string;
	emergency_sauce: string;
	user_sauce: string;
	verifier_public_key: string;
	policies?: Record<string, unknown>;
	authentication?: AuthenticationMethod;
}

export interface EmergencyLoginData {
	user_public_key: string;
	session_secret_key: string;
	token: string;
	user_id: string;
	user_email: string;
	authentication?: AuthenticationMethod;
	server_secret_exists?: boolean;
	require_password_change?: boolean;
}

export interface SecondFactor {
	id: string;
	title: string;
	active: boolean;
}

export interface IvaltFactor {
	id: string;
	mobile: string;
	active: boolean;
}

export interface FactorEnrollment {
	id: string;
	uri: string;
}

export interface EmergencyCode {
	id: string;
	description: string;
	activation_delay: number;
	activation_date: string | null;
}

export type ConnectionType =
	| "ssh_connection"
	| "rdp_connection"
	| "vnc_connection";

/** References can be incomplete in persisted settings; resolution validates them. */
export interface ConnectionAuthenticationReference {
	secret_id?: string;
	secret_key?: string;
	type?: string;
	username?: string;
}

export interface ConnectionAuthenticationSettings {
	schema_version: number;
	by_connection_secret_id: Record<string, ConnectionAuthenticationReference>;
}

export interface ConnectionData {
	ssh_connection_authentication_type?: string;
	ssh_connection_username?: string;
	ssh_connection_password?: string;
	ssh_connection_private_key?: string;
	rdp_connection_username?: string;
	rdp_connection_password?: string;
	vnc_connection_username?: string;
	vnc_connection_password?: string;
}

export interface ReferencedCredential {
	application_password_username?: string;
	application_password_password?: string;
	ssh_own_key_private?: string;
}

export interface ResolvedConnectionAuthentication {
	source: "connection" | "reference";
	type: "password" | "private_key";
	username: string;
	password: string;
	private_key: string;
}

export type ReadReferencedCredential = (
	id: string,
	key: string,
) => Promise<ReferencedCredential>;

/** JSON transport equivalents of WebAuthn's binary options. */
export interface SerializedCredentialDescriptor
	extends Omit<PublicKeyCredentialDescriptor, "id"> {
	id: string;
}

export interface SerializedCreationOptions
	extends Omit<
		PublicKeyCredentialCreationOptions,
		"challenge" | "user" | "excludeCredentials"
	> {
	challenge: string;
	user: Omit<PublicKeyCredentialUserEntity, "id"> & { id: string };
	excludeCredentials?: SerializedCredentialDescriptor[];
	hints?: string[];
}

export interface SerializedRequestOptions
	extends Omit<
		PublicKeyCredentialRequestOptions,
		"challenge" | "allowCredentials"
	> {
	challenge: string;
	allowCredentials?: SerializedCredentialDescriptor[];
}

export interface PasskeyCreationOptions {
	publicKey: SerializedCreationOptions;
}

export interface PasskeyRequestOptions {
	publicKey: SerializedRequestOptions;
	mediation?: CredentialMediationRequirement;
}

export interface PasskeySecret {
	[field: string]: unknown;
	passkey_id: string;
	passkey_public_key: JsonWebKey;
	passkey_private_key: JsonWebKey;
	passkey_algorithm: EcKeyImportParams;
	passkey_user_handle: string;
	read_count: number;
}

export interface SerializedAssertionResponse {
	authenticatorData: string;
	clientDataJSON: string;
	signature: string;
	userHandle: string;
}

export interface SerializedAttestationResponse {
	attestationObject: string;
	clientDataJSON: string;
	transports: AuthenticatorTransport[];
	publicKeyAlgorithm: number;
	publicKey: string;
	authenticatorData: string;
}

export interface SerializedPasskeyCredential<T> {
	id: string;
	rawId: string;
	response: T;
	type: "public-key";
	clientExtensionResults: AuthenticationExtensionsClientOutputs;
	authenticatorAttachment: AuthenticatorAttachment;
}

export type PasskeyErrorType =
	| "BYPASS_PSONO"
	| "ORIGIN_NOT_SUPPORTED"
	| "RP_ID_NOT_ALLOWED"
	| "SERVER_INCOMPATIBLE"
	| "USER_DENIED_REQUEST"
	| "PASSKEY_DISABLED"
	| "USER_NOT_LOGGED_IN"
	| "PUBLIC_KEY_PARAMS_NOT_SUPPORTED";

export interface PasskeyErrorMetadata {
	reason?: "NOT_LOGGED_IN" | "NO_MATCHING_PASSKEY" | "USER_CLICKED_BYPASS";
	eventId?: string;
	origin?: string;
	rpId?: string;
	isConditional?: boolean;
	allowCredentialsCount?: number;
	discoverableCredentialsOnly?: boolean;
	operation?: "navigator.credentials.get" | "navigator.credentials.create";
}

export interface PasskeyMessage<T> {
	data: { options: T; eventId?: string; origin?: string };
}

export interface PasskeyMessageResponse<T> {
	event:
		| "navigator-credentials-get-response"
		| "navigator-credentials-create-response";
	data: { eventId?: string } & (
		| { credential: SerializedPasskeyCredential<T>; error?: never }
		| {
				credential?: never;
				error: {
					errorType: PasskeyErrorType;
					message: string;
					metadata?: PasskeyErrorMetadata;
				};
		  }
	);
}
