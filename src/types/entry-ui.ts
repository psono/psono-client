import type { DatastoreItem } from "./datastore";
export type { FileDestination } from "./components";
import type { SecretContent, SecretMetadata } from "./vault";

/** The editor also accepts decrypted entries from history and link shares. */
export type EntryItem = DatastoreItem & SecretContent & { type: string };
export type EntrySecretData = SecretContent & SecretMetadata;
export type EntryAttachment = NonNullable<SecretContent["attachments"]>[number];
export type EnvironmentVariable = NonNullable<
	SecretContent["environment_variables_variables"]
>[number];

/** Number inputs retain their string values until the existing submit conversion. */
export interface ConnectionFormState {
	title: string;
	host: string;
	port: string | number;
	username: string;
	password: string;
	notes: string;
}

export interface SshConnectionFormState extends ConnectionFormState {
	authenticationType: string;
	privateKey: string;
}

export interface RdpConnectionFormState extends ConnectionFormState {
	domain: string;
	ignoreCertificate: boolean;
	resizeMethod: string;
	serverLayout: string;
}

export interface UploadedEntryFile {
	file_id: string;
	file_secret_key: string;
	file_chunks: Record<number, string>;
	file_size: number;
	file_shard_id?: string;
	file_repository_id?: string;
}

export interface UploadedEntryChunk {
	chunk_position: number;
	hash_checksum: string;
}

export type EntryMenuAnchors = Record<number, HTMLElement | null>;

export interface DialogNewEntryProps {
	open: boolean;
	onClose: () => void;
	onCreate?: (item: EntryItem) => void;
	parentDatastoreId?: string;
	parentShareId?: string;
}

export interface DialogEditEntryProps {
	open: boolean;
	onClose: () => void;
	item: EntryItem;
	data?: EntrySecretData;
	setDirty: (dirty: boolean) => void;
	isDirty?: boolean;
	getShowConfirmDialog?: () => boolean;
	setConfirmDialog?: (open: boolean) => void;
	onEdit?: (item: EntryItem) => void;
	onDeleteItem?: () => void;
	onCustomSave?: (
		item: EntryItem,
		secret: SecretContent,
		callbackUrl: SecretMetadata["callback_url"],
		callbackUser: SecretMetadata["callback_user"],
		callbackPass: SecretMetadata["callback_pass"],
	) => void;
	hideLinkToEntry?: boolean;
	hideShowHistory?: boolean;
	hideMoreMenu?: boolean;
	linkDirectly?: boolean;
	hideAddTOTP?: boolean;
	hideAddCustomField?: boolean;
	hideAddTag?: boolean;
	hideAttachments?: boolean;
	inline?: boolean;
}
