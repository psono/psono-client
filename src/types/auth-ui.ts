import type { AuthErrorData, LoginResult } from "./auth";
import type { DecodedServerInfo, HostCheckResult } from "./host";

export interface SsoRouteParams {
	samlTokenId?: string;
	oidcTokenId?: string;
	ssoState?: string;
}

export interface LoginViewProps {
	fullWidth?: boolean;
}

export interface LoginFormProps extends LoginViewProps, SsoRouteParams {}

export interface ActivationFormProps {
	activationCode?: string;
}

export interface DeleteUserConfirmFormProps {
	unregisterCode?: string;
}

export type AuthFormView = "default" | "success";
export type LoginFormView =
	| "default"
	| HostCheckResult["status"]
	| "google_authenticator"
	| "yubikey_otp"
	| "duo"
	| "webauthn"
	| "ivalt"
	| "pick_second_factor"
	| "ask_send_plain";

export type DecryptLoginData = (password: string) => LoginResult;

/** Fields used by auth views but not yet declared by the host service contract. */
export interface AuthUiServerInfo extends DecodedServerInfo {
	public_key: string;
	web_client: string;
	authentication_methods?: string[];
}

export interface AuthUiHostCheck extends HostCheckResult {
	info: AuthUiServerInfo;
}

export type AuthFieldErrors = Record<string, string[]>;

interface AuthUiResponseFields {
	data: AuthErrorData;
	errors: string[];
	non_field_errors: string[];
	detail: string;
	message: string;
	required_multifactors: string[];
	require_password: DecryptLoginData;
}

/**
 * Auth endpoints use these field shapes. Preserve the views' own-property
 * checks (including their handling of unexpected responses) while narrowing
 * the otherwise unknown promise rejection payloads.
 */
export function hasAuthField<K extends keyof AuthUiResponseFields>(
	value: unknown,
	field: K,
): value is Pick<AuthUiResponseFields, K> {
	return Object.hasOwn(value as object, field);
}
