import type { Datastore, DatastoreFolder, DatastoreItem } from "./datastore";
import type { PasskeySecret } from "./auth";
import type { CustomField, SecretMetadata } from "./vault";

/** CSV parsers disable dynamic typing; column positions are format-specific. */
export type CsvRow = string[];

export interface ImportCustomField extends CustomField {
	type: "text" | "password";
}

type TextFields =
	| `website_password_${
			| "title"
			| "url"
			| "username"
			| "password"
			| "notes"
			| "url_filter"
			| "totp_code"
			| "totp_algorithm"}`
	| `application_password_${"title" | "username" | "password" | "notes"}`
	| `bookmark_${"title" | "url" | "notes" | "url_filter"}`
	| `note_${"title" | "notes"}`
	| `totp_${"title" | "notes" | "code" | "algorithm"}`
	| `credit_card_${
			| "title"
			| "number"
			| "name"
			| "cvc"
			| "pin"
			| "valid_through"
			| "notes"}`
	| `ssh_own_key_${"title" | "email" | "name" | "public" | "private" | "notes"}`
	| `mail_gpg_own_key_${"title" | "email" | "name" | "public" | "private"}`
	| `elster_certificate_${
			| "title"
			| "file_content"
			| "password"
			| "retrieval_code"
			| "notes"}`
	| `environment_variables_${"title" | "notes"}`
	| `${"ssh" | "rdp" | "vnc"}_connection_${"title" | "host" | "username" | "password" | "notes"}`
	| `ssh_connection_${"authentication_type" | "private_key"}`
	| `rdp_connection_${"domain" | "resize_method" | "server_layout"}`
	| `passkey_${"title" | "rp_id" | "id" | "user_handle" | "url_filter"}`
	| `identity_${
			| "title"
			| "first_name"
			| "last_name"
			| "company"
			| "address"
			| "city"
			| "postal_code"
			| "state"
			| "country"
			| "phone_number"
			| "email"}`;

/** Decrypted fields carried by native exports and format-specific importers. */
export type ImportSecretContent = Partial<Record<TextFields, string>> &
	Partial<
		Pick<
			PasskeySecret,
			"passkey_public_key" | "passkey_private_key" | "passkey_algorithm"
		>
	> & {
		website_password_allow_http?: boolean;
		website_password_auto_submit?: boolean;
		// Older native exports store TOTP settings as strings; URI parsers emit numbers.
		website_password_totp_period?: number | string;
		website_password_totp_digits?: number | string;
		totp_period?: number | string;
		totp_digits?: number | string;
		rdp_connection_ignore_certificate?: boolean;
		ssh_connection_port?: string | number;
		rdp_connection_port?: string | number;
		vnc_connection_port?: string | number;
		passkey_auto_submit?: boolean;
		environment_variables_variables?: { key: string; value: string }[];
		custom_fields?: CustomField[];
		tags?: string[];
	};

export type ImportMetadata = Pick<
	Datastore,
	| "id"
	| "name"
	| "description"
	| "datastore_id"
	| "parent_datastore_id"
	| "parent_share_id"
	| "share_id"
	| "share_secret_key"
	| "share_rights"
	| "share_index"
	| "is_folder"
	| "deleted"
	| "path"
>;

/** Native export entries contain metadata and decrypted secret content. */
export interface ExportItem
	extends ImportMetadata,
		ImportSecretContent,
		SecretMetadata {
	type?: string;
	secret_id?: string;
	secret_key?: string;
	urlfilter?: string;
	allow_http?: Datastore["allow_http"];
	password_hash?: string;
}

export interface ImportedSecret extends ExportItem, DatastoreItem {
	id: string;
	type: string;
}

export interface ExportFolder extends ImportMetadata {
	items?: ExportItem[];
	folders?: ExportFolder[];
}

export interface ImportedFolder extends DatastoreFolder {
	items?: ImportedSecret[];
	folders?: ImportedFolder[];
}

/** Folder variants preserve the arrays actually emitted by each format. */
export interface ImportItemsFolder extends ImportedFolder {
	items: ImportedSecret[];
	folders?: ImportItemsFolder[];
}

export interface ImportTreeFolder extends ImportItemsFolder {
	folders: ImportTreeFolder[];
}

export interface ImportFoldersRoot extends ImportedFolder {
	folders: ImportItemsFolder[];
}

/**
 * The import pipeline moves format-specific fields verbatim into secret JSON.
 * Its tree operations only require linkage metadata: XLS fields such as names,
 * descriptions, and credentials can still contain raw numeric/boolean cells.
 */
export interface ImportSecretLink
	extends Pick<
		ImportedSecret,
		| "id"
		| "type"
		| "tags"
		| "custom_fields"
		| "allow_http"
		| "password_hash"
		| "secret_id"
		| "secret_key"
	> {
	[field: string]: unknown;
}

export interface ImportFolderLink extends DatastoreFolder {
	items?: ImportSecretLink[];
	folders?: ImportFolderLink[];
}

export interface ParsedImport<
	Folder extends ImportFolderLink = ImportFolderLink,
	Secret extends ImportSecretLink = ImportSecretLink,
> {
	datastore: Folder;
	secrets: Secret[];
}

export interface ImportResult<Folder extends ImportedFolder = ImportedFolder>
	extends ParsedImport<Folder, ImportedSecret> {}

export type ImportParser = (
	data: string,
	binary?: ArrayBuffer,
) => ParsedImport | null | Promise<ParsedImport | null>;

/** Undefined selects the object form used by security reports and offline mode. */
export type ExportOutput<Format extends string | undefined> = Format extends
	| "json"
	| "csv"
	? string
	: Format extends "kdbxv4"
		? ArrayBuffer
		: string extends Format
			? string | ArrayBuffer | ExportFolder
			: ExportFolder;
