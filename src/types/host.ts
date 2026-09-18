/** Decoded /info/ payload; host-selection resets use a partial state projection. */
export interface DecodedServerInfo {
	type: "CE" | "EE";
	version: string;
	public_key: string;
	web_client: string;
	authentication_methods?: string[];
	build?: string;
	admin_recovery_public_key?: unknown;
	compliance_min_master_password_length?: number;
	compliance_min_master_password_complexity?: number;
	[field: string]: unknown;
}

export interface KnownHostCheck {
	status:
		| "matched"
		| "not_found"
		| "signature_changed"
		| "admin_recovery_public_key_changed";
	verify_key_old?: string;
	admin_recovery_public_key_old?: string;
	admin_recovery_public_key_changed?: boolean;
	admin_recovery_public_key_missing?: boolean;
	admin_recovery_public_key_needs_normalization?: boolean;
}

export interface HostCheckResult {
	status:
		| "matched"
		| "signature_changed"
		| "admin_recovery_public_key_changed"
		| "invalid_signature"
		| "unsupported_server_version"
		| "new_server";
	server_url: string;
	verify_key?: string;
	verify_key_old?: string;
	admin_recovery_public_key: string;
	admin_recovery_public_key_old?: string;
	admin_recovery_public_key_changed?: boolean;
	info: DecodedServerInfo;
}
