import type { DecryptMessageResult } from "openpgp";
import type { CustomField, SecretContent } from "./vault";

/** The subset of a tab available in both extension and ordinary web pages. */
export interface BrowserTab {
	id?: number;
	url?: string;
	title?: string;
}

export type MessageSender = Omit<chrome.runtime.MessageSender, "tab"> & {
	tab?: BrowserTab;
};

export type SendResponse<T = unknown> = (response: T) => void;

export interface MessageRequest<T = unknown> {
	event?: string;
	data: T;
}

export interface FillPasswordData {
	username?: string;
	password?: string;
	totp_token?: string;
	url_filter?: string;
	auto_submit?: boolean;
	submit?: boolean;
	custom_fields?: CustomField[];
}

export interface FillElsterCertificateData {
	elster_certificate_title?: string;
	elster_certificate_file_content?: string;
	elster_certificate_password?: string;
}

export interface FillCreditCardData {
	credit_card_number?: string;
	credit_card_cvc?: string;
	credit_card_name?: string;
	credit_card_valid_through?: string;
	custom_fields?: CustomField[];
}

export interface FillIdentityData {
	identity_first_name?: string;
	identity_last_name?: string;
	identity_company?: string;
	identity_address?: string;
	identity_postal_code?: string;
	identity_city?: string;
	identity_state?: string;
	identity_country?: string;
	identity_phone_number?: string;
	identity_email?: string;
	custom_fields?: CustomField[];
}

export interface StatusResponse {
	event: "status";
	data: "ok" | "ignored";
}

export interface SecretSuggestion {
	secret_id: string;
	name?: string;
	description?: string;
}

export interface LoginCredentials {
	username: string;
	password: string;
	url?: string;
}

export interface GpgWriteData {
	message_id: string;
	message: string;
	receivers: string[];
	public_keys: string[];
	private_key: { secret_id: string; secret_key: string } | null;
	sign_message: boolean;
}

/** Known payloads; other legacy content-script messages remain opaque to the transport. */
export interface ExtensionEventData {
	fillpassword: FillPasswordData;
	fillcreditcard: FillCreditCardData;
	fillidentity: FillIdentityData;
	"fillpassword-active-tab": FillPasswordData;
	fillelstercertificate: FillElsterCertificateData;
	"get-username": Record<string, never>;
	"save-password-active-tab": { password: string };
	"request-secret": { secret_id: string };
	"open-tab": { url: string };
	"generate-password": { url: string; username: string };
	"decrypt-gpg": { message: string; sender: string };
	"encrypt-gpg": { receiver: string[] };
	"read-gpg": string;
	"write-gpg": string;
	"write-gpg-complete": GpgWriteData;
	"set-offline-cache-encryption-key": { encryption_key: string | undefined };
	"set-offline-cache-encryption-key-offscreen": string | null | undefined;
	"get-offline-cache-encryption-key-offscreen": null;
	"launch-web-auth-flow-in-background": { url: string };
	"language-changed": string;
	"clear-clipboard": { delay: number };
	"clear-clipboard-content-script": { delay: number };
	"login-form-submit": LoginCredentials;
}

export interface ExtensionEventResponses {
	"get-username": { username: string };
	"is-logged-in": boolean;
	"get-offline-cache-encryption-key-offscreen": string | null | undefined;
	"approve-iframe-login": {
		event: "approve-iframe-login-response";
		data: boolean;
	};
	ready:
		| StatusResponse
		| { event: "fillpassword"; data: FillPasswordData }
		| { event: "fillelstercertificate"; data: FillElsterCertificateData };
	"website-password-refresh":
		| StatusResponse
		| { event: "website-password-update"; data: SecretSuggestion[] };
	"elster-certificate-refresh":
		| StatusResponse
		| { event: "elster-certificate-update"; data: SecretSuggestion[] };
	"request-secret": { event: "return-secret"; data: SecretContent | "fail" };
	"generate-password": { event: "return-secret"; data: SecretContent };
	"oidc-saml-redirect-detected": StatusResponse;
	"read-gpg":
		| { error: string }
		| {
				public_key?: string;
				sender?: string;
				plaintext?: DecryptMessageResult & { data: string };
				message?: string;
		  };
	"write-gpg": { error: string } | { receiver?: string[] };
	"encrypt-gpg": { message: string; receivers: string[] };
}

export type EventData<E extends string> = E extends keyof ExtensionEventData
	? ExtensionEventData[E]
	: unknown;
export type EventResponse<E extends string> =
	E extends keyof ExtensionEventResponses
		? ExtensionEventResponses[E]
		: unknown;

export type AuthRequiredDetails = Parameters<
	Parameters<typeof chrome.webRequest.onAuthRequired.addListener>[0]
>[0];

export type AuthRequiredCallback = (
	details: AuthRequiredDetails,
	callback: SendResponse<chrome.webRequest.BlockingResponse>,
) => void;

/** Firefox's promise-based APIs alongside the callback forms used by older clients. */
export type FirefoxBrowser = Omit<
	typeof chrome,
	"tabs" | "runtime" | "privacy" | "webRequest"
> & {
	tabs: Omit<typeof chrome.tabs, "sendMessage"> & {
		sendMessage<T = unknown>(
			tabId: number,
			message: unknown,
			optionsOrCallback?: chrome.tabs.MessageSendOptions | SendResponse<T>,
			callback?: SendResponse<T>,
		): Promise<T>;
	};
	runtime: Omit<typeof chrome.runtime, "getBackgroundPage"> & {
		getBackgroundPage(): Promise<Window>;
	};
	privacy: Omit<typeof chrome.privacy, "services"> & {
		services: Omit<typeof chrome.privacy.services, "passwordSavingEnabled"> & {
			passwordSavingEnabled: {
				get(
					details: Record<string, never>,
				): Promise<{ levelOfControl: string; value: boolean }>;
				set(details: { value: boolean }): Promise<unknown>;
			};
		};
	};
	webRequest: Omit<typeof chrome.webRequest, "onAuthRequired"> & {
		onAuthRequired: {
			addListener(
				callback: (
					details: AuthRequiredDetails,
				) => Promise<chrome.webRequest.BlockingResponse>,
				filter: chrome.webRequest.RequestFilter,
				extraInfoSpec: string[],
			): void;
		};
	};
};

export interface BackendServerConfiguration {
	url?: string;
	domain?: string | null;
	title?: string;
	verify_key?: string;
	autoapprove_plain_password?: boolean;
}

export interface SsoProviderConfiguration {
	provider_id: number;
	title: string;
	button_name?: string;
}

export interface ConfigurationLink {
	href: string;
	title: string;
	class?: string;
}

export interface ClientTheme {
	palette: Record<string, Record<string, string>>;
	typography: { fontFamily: string; fontSize: number };
	components: Record<string, unknown>;
}

export interface ClientConfiguration {
	backend_servers: BackendServerConfiguration[];
	theme: ClientTheme;
	base_url: string;
	allow_registration: boolean;
	allow_lost_password: boolean;
	allow_delete_account: boolean;
	authentication_methods: string[];
	saml_provider: SsoProviderConfiguration[];
	oidc_provider: SsoProviderConfiguration[];
	disable_download_bar: boolean;
	allow_custom_server: boolean;
	trust_device_default: boolean;
	remember_me_default: boolean;
	more_links: ConfigurationLink[];
	footer_links: ConfigurationLink[];
	auto_login?: boolean;
	login_info_text?: string;
	// Self-hosted clients may supply additional branding and deployment settings.
	[key: string]: unknown;
}
