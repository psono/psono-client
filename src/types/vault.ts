import type { ShareRights as DatastoreShareRights } from "./datastore";

/** Fields understood by vault services in decrypted, versioned secret JSON.
 * Secret plugins and older clients can add fields. Keep that extensibility at
 * this JSON boundary; consumers must narrow fields not explicitly described here.
 */
export interface SecretContent {
	[field: string]: unknown;
	application_password_title?: string;
	application_password_username?: string;
	application_password_password?: string;
	application_password_notes?: string;
	website_password_title?: string | null;
	website_password_username?: string;
	website_password_password?: string;
	website_password_url?: string;
	website_password_url_filter?: string;
	website_password_auto_submit?: boolean;
	/** URL-derived legacy entries can persist a falsy scheme instead of false. */
	website_password_allow_http?: boolean | "" | null;
	website_password_notes?: string;
	website_password_totp_code?: string;
	website_password_totp_period?: number;
	website_password_totp_algorithm?: string;
	website_password_totp_digits?: number;
	bookmark_title?: string | null;
	bookmark_url?: string;
	bookmark_url_filter?: string;
	bookmark_notes?: string;
	identity_title?: string;
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
	identity_notes?: string;
	passkey_title?: string;
	passkey_rp_id?: string;
	passkey_id?: string;
	passkey_public_key?: string | JsonWebKey;
	passkey_private_key?: string | JsonWebKey;
	passkey_user_handle?: string;
	passkey_algorithm?: EcKeyGenParams | RsaHashedKeyGenParams | Algorithm | null;
	passkey_auto_submit?: boolean;
	passkey_url_filter?: string;
	elster_certificate_title?: string;
	elster_certificate_file_content?: string;
	elster_certificate_password?: string;
	elster_certificate_retrieval_code?: string;
	elster_certificate_notes?: string;
	ssh_connection_title?: string;
	ssh_connection_host?: string;
	ssh_connection_port?: number | string;
	ssh_connection_authentication_type?: string;
	ssh_connection_username?: string;
	ssh_connection_password?: string;
	ssh_connection_private_key?: string;
	ssh_connection_notes?: string;
	ssh_own_key_title?: string;
	ssh_own_key_public?: string;
	ssh_own_key_private?: string;
	ssh_own_key_notes?: string;
	rdp_connection_title?: string;
	rdp_connection_host?: string;
	rdp_connection_port?: number | string;
	rdp_connection_domain?: string;
	rdp_connection_ignore_certificate?: boolean;
	rdp_connection_resize_method?: string;
	rdp_connection_server_layout?: string;
	rdp_connection_username?: string;
	rdp_connection_password?: string;
	rdp_connection_notes?: string;
	vnc_connection_title?: string;
	vnc_connection_host?: string;
	vnc_connection_port?: number | string;
	vnc_connection_username?: string;
	vnc_connection_password?: string;
	vnc_connection_notes?: string;
	totp_title?: string;
	totp_code?: string;
	totp_period?: number;
	totp_algorithm?: string;
	totp_digits?: number;
	totp_notes?: string;
	totp_url_filter?: string;
	note_title?: string;
	note_notes?: string;
	environment_variables_title?: string;
	environment_variables_variables?: { key: string; value: string }[];
	environment_variables_notes?: string;
	file_title?: string;
	credit_card_title?: string;
	credit_card_number?: string;
	credit_card_name?: string;
	credit_card_valid_through?: string;
	credit_card_cvc?: string;
	credit_card_pin?: string;
	credit_card_notes?: string;
	mail_gpg_own_key_title?: string;
	mail_gpg_own_key_email?: string;
	mail_gpg_own_key_name?: string;
	mail_gpg_own_key_public?: string;
	mail_gpg_own_key_private?: string;
	custom_fields?: CustomField[];
	tags?: string[];
	attachments?: {
		file_id: string;
		file_chunks: { hash: string; position: number }[];
		file_secret_key: string;
		file_size: number;
		file_shard_id: string | null;
		file_repository_id: string | null;
		filename: string;
	}[];
}

export interface CustomField {
	name: string;
	value: string;
	type?: string;
}

export interface SecretMetadata {
	id?: string;
	read_count?: number;
	create_date?: string;
	write_date?: string;
	callback_url?: string | null;
	callback_user?: string | null;
	callback_pass?: string | null;
}

export interface EncryptedSecret extends SecretMetadata {
	id: string;
	data: string;
	data_nonce: string;
}

export interface SecretReference {
	secret_id: string;
	secret_key: string;
	type: string;
}

export interface NamedSecretReference {
	secret_id: string;
	secret_key: string;
	name: string;
}

export interface BulkSecretInput {
	content: SecretContent;
	linkId: string;
	callbackUrl?: string;
	callbackUser?: string;
	callbackPass?: string;
}

export interface CreatedSecret {
	secret_id: string;
	secret_key: string;
}

/** The tree projection used when moving links; folder contents are optional. */
export interface LinkTree {
	id?: string;
	share_id?: string;
	datastore_id?: string;
	secret_id?: string;
	file_id?: string;
	folders?: LinkTree[];
	items?: LinkTree[];
}

export interface ShareRights {
	read: boolean;
	write: boolean;
	grant: boolean;
	delete: boolean;
}

export interface GroupKeyMaterial {
	secret_key: string;
	secret_key_nonce: string;
	secret_key_type: string;
	private_key: string;
	private_key_nonce: string;
	private_key_type: string;
	public_key: string;
}

export interface Group extends GroupKeyMaterial {
	group_id: string;
	name: string;
	membership_id: string;
	membership_create_date: string;
	accepted?: boolean;
	forced_membership?: boolean;
	group_admin?: boolean;
	share_admin?: boolean;
	share_right_grant?: boolean;
	user_id?: string;
	user_username?: string;
}

export interface GroupShare {
	group_id: string;
	share_id: string;
	share_key: string;
	share_key_nonce: string;
	share_title: string;
	share_title_nonce: string;
	share_type?: string;
	share_type_nonce?: string;
	share_data?: string;
	share_data_nonce?: string;
}

export interface GroupMember {
	id: string;
	name: string;
	public_key: string;
	membership_id: string;
	group_admin: boolean;
	share_admin: boolean;
	accepted: boolean | null;
	membership_create_date: string;
	is_current_user?: boolean;
}

/** Rights returned with a group detail use unprefixed encrypted field names. */
export interface GroupShareRight
	extends DatastoreShareRights,
		Partial<GroupShare> {
	id: string;
	group_id: string;
	share_id: string;
	user_id?: string;
	key: string;
	key_nonce: string;
	title: string;
	title_nonce: string;
	type?: string;
	type_nonce?: string;
	create_date: string;
	expiration_date?: string | null;
}

export interface GroupDetail extends Group {
	share_admin: boolean;
	members: GroupMember[];
	group_share_rights: GroupShareRight[];
}

export interface CreatedMembership {
	membership_id: string;
}

export interface ShareRight extends DatastoreShareRights {
	share_id: string;
	id?: string;
	user_id?: string;
	username?: string;
	group_id?: string;
	group_name?: string;
	accepted?: boolean | null;
	create_date?: string | null;
	expiration_date?: string | null;
}

export interface UserShareRight extends ShareRight {
	id: string;
	user_id: string;
	username: string;
}

export interface GroupRecipientShareRight extends ShareRight {
	id: string;
	group_id: string;
	group_name: string;
}

export interface ShareRightsOverview {
	share_rights: ShareRight[];
}

export interface ShareRightsDetail {
	user_share_rights: UserShareRight[];
	group_share_rights: GroupRecipientShareRight[];
	own_share_rights: DatastoreShareRights;
}

/** Invitation metadata remains alongside the title/type decrypted by readShares. */
export interface ShareOverviewEntry {
	id: string;
	share_id: string;
	share_right_id: string;
	share_right_key: string;
	share_right_key_nonce: string;
	share_right_title: string;
	share_right_title_nonce: string;
	share_right_type?: string;
	share_right_type_nonce?: string;
	share_right_accepted: boolean | null;
	share_right_read: boolean;
	share_right_write: boolean;
	share_right_grant: boolean;
	share_right_create_date?: string | null;
	share_right_create_user_id: string;
	share_right_create_user_username: string;
	share_right_create_user_public_key?: string;
}

export interface ApiKey {
	id: string;
	title: string;
	public_key: string;
	private_key: string;
	private_key_nonce?: string;
	secret_key: string;
	secret_key_nonce?: string;
	restrict_to_secrets: boolean;
	allow_insecure_access: boolean;
	allow_api_key_management: boolean;
	allow_admin_access: boolean;
	allow_recovery_access: boolean;
	allow_emergency_access: boolean;
	read: boolean;
	write: boolean;
	active: boolean;
}

export interface ApiKeyOverview {
	api_keys: ApiKey[];
}

export interface ApiKeySecret {
	id: string;
	secret_id: string;
	title: string;
	title_nonce: string;
	name?: string;
}

export interface LinkShare {
	id: string;
	public_title: string;
	allowed_reads: number | null;
	valid_till: string | null;
	allow_write?: boolean;
}

export interface LinkShareOverview {
	link_shares: LinkShare[];
}

/** An unfilled number input is forwarded unchanged by the legacy edit form. */
export type LinkShareReadLimitInput = LinkShare["allowed_reads"] | "";

export interface ReportItem extends SecretContent, SecretMetadata {
	type: string;
	name?: string;
	secret_id?: string;
	deleted?: boolean;
}

export interface ReportFolder {
	deleted?: boolean;
	items?: ReportItem[];
	folders?: ReportFolder[];
}

export interface ReportPassword {
	type: string;
	name?: string;
	secret_id?: string;
	username?: string;
	password?: string;
	create_date?: string;
	write_date?: string;
	master_password: boolean;
}

export interface PasswordRating {
	score: number;
	advice: string;
	password_length: number;
	variation_count: number;
	min_password_length?: number;
	max_password_length?: number;
	breached?: string | number;
}

export interface AnalyzedPassword {
	name?: string;
	password?: string;
	secret_id?: string;
	master_password: boolean;
	rating: number;
	min_password_length?: number;
	password_length: number;
	variation_count: number;
	breached?: string | number;
	pwned?: number;
	type: string;
	input_type: string;
	advice: string;
	create_age: number;
	write_age: number;
	duplicate: boolean;
}

export interface PasswordSummary {
	total: number;
	duplicate: number;
	no_duplicate: number;
	weak: number;
	good: number;
	strong: number;
	average_rating: number;
	average_update_age: number;
	update_newer_than_90_days: number;
	update_older_than_90_days: number;
	update_older_than_180_days: number;
}

export interface UserSecuritySummary {
	multifactor_auth_enabled?: boolean;
	recovery_code_enabled?: boolean;
}

export interface SecurityAnalysis {
	passwords: AnalyzedPassword[];
	password_summary?: PasswordSummary;
	user_summary?: UserSecuritySummary;
}
