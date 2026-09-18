import type { SecretContent } from "./vault";
export type { EncryptedValue } from "./crypto";

/** Identifiers and paths are kept as strings to accept existing JS/import data. */
export type DatastorePath = string[];

export interface ShareRights {
	read: boolean;
	write: boolean;
	grant: boolean;
	delete?: boolean;
}

export interface ShareLocation {
	secret_key: string;
	paths: DatastorePath[];
}

export type ShareIndex = Record<string, ShareLocation>;

export interface DatastoreMetadata {
	datastore_id?: string;
	write_date?: string;
}

export interface TrustedUserData {
	user_id?: string;
	user_email?: string;
	user_username?: string;
	user_public_key?: string;
}

/**
 * Decrypted vault nodes also carry type-specific secret fields. Those extension
 * fields are deliberately unknown; the tree structure and common metadata are
 * typed independently of the legacy item blueprint registry.
 */
export interface Datastore extends DatastoreMetadata {
	[field: string]: unknown;
	id?: string;
	name?: string;
	description?: string;
	type?: string;
	folders?: DatastoreFolder[];
	items?: DatastoreItem[];
	share_index?: ShareIndex;
	share_id?: string;
	share_secret_key?: string;
	share_rights?: ShareRights;
	parent_share_id?: string;
	parent_datastore_id?: string;
	path?: DatastorePath;
	folder_path?: string;
	deleted?: boolean;
	hidden?: boolean;
	expanded?: boolean;
	expanded_temporary?: boolean;
	is_expanded?: boolean;
	is_folder?: boolean;
	secret_id?: string;
	secret_key?: string;
	urlfilter?: string;
	autosubmit?: boolean;
	allow_http?: boolean | "" | null;
	password_hash?: string;
	tags?: string[];
	file_id?: string;
	file_shard_id?: string;
	file_repository_id?: string;
	file_size?: number;
	file_secret_key?: string;
	file_chunks?: Record<number, string>;
	file_title?: string;
	data?: TrustedUserData;
	email?: string;
	public_keys?: string[];
	default_public_key?: string;
}

/** Items and folders have IDs once inserted; datastore roots need no node ID. */
export interface DatastoreItem extends Datastore {
	id: string;
}

export interface DatastoreFolder extends Datastore {
	id: string;
}

export interface UserDatastoreItem extends DatastoreItem {
	data: TrustedUserData;
}

export interface GpgUser extends DatastoreItem {
	email: string;
	public_keys: string[];
	default_public_key?: string;
}

export interface ShareContent {
	data: Datastore;
	rights: ShareRights;
}

export interface ChildShare {
	share: DatastoreItem | DatastoreFolder;
	path: DatastorePath;
}

export interface DatastoreOverviewEntry {
	id: string;
	type: string;
	description: string;
	is_default: boolean;
}

export interface DatastoreOverview {
	datastores: DatastoreOverviewEntry[];
}

/** The response envelope used at the encrypted API boundary. */
export interface DataResponse<T> {
	data: T;
}

export interface WriteResult {
	write_date?: string;
}

export interface SettingsEntry {
	key: string;
	value: string | number | boolean | GpgKeySelection | null | undefined;
}

export interface GpgKeySelection {
	id: string;
	label?: string;
}

export type SettingsDatastore = SettingsEntry[] & DatastoreMetadata;

/** Decrypted secret schemas are selected at runtime by the item blueprint. */
export type SecretData = SecretContent;

export interface PasswordLeaf extends Datastore {
	key: string;
	secret_id: string;
	secret_key: string;
	search?: string;
}

export interface FileLeaf extends Datastore {
	key: string;
	file_id: string;
	file_secret_key: string;
}
