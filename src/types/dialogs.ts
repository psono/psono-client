import type { Datastore, DatastoreItem, GpgUser } from "./datastore";
import type { DatastoreTreeNode } from "./datastore-ui";
export type {
	FileDestination,
	GpgKeyOption as GpgSecretSelection,
} from "./components";

export interface DialogProps {
	open: boolean;
	onClose: () => void;
}

/** These dialogs return null on cancellation, rather than an empty result. */
export interface ResultDialogProps<Result> {
	open: boolean;
	onClose: (result: Result | null) => void;
}

export type TotpDialogCallback = (
	period: number,
	algorithm: string,
	digits: number,
	code: string,
) => void;

export type GpgKeyDialogCallback = (
	title: string,
	name: string,
	email: string,
	privateKey: string,
	publicKey: string,
) => void;

export type SshKeyDialogCallback = (
	title: string,
	privateKey: string,
	publicKey: string,
) => void;

export interface GpgRecipientSelection {
	user: GpgUser;
	public_key?: string;
}

/** Attachment chunks are an ordered API list, not a datastore chunk map. */
export interface DialogAttachment {
	file_id: string;
	file_chunks: { hash: string; position: number }[];
	file_secret_key: string;
	file_size: number;
	file_shard_id: string | null;
	file_repository_id: string | null;
	filename: string;
}

export interface FolderBreadcrumbs<
	Node extends { id: string } = DatastoreItem,
> {
	id_breadcrumbs: string[];
	path: Node[];
}

export interface EditableFolder {
	id: string;
	name?: string;
	color?: string;
}

export type DialogNodeSelection = (node: DatastoreTreeNode) => boolean;

export type LinkShareDialogItem = Datastore;

export function isDialogRecord(
	value: unknown,
): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/** Rejected promises and imported data are untrusted at the UI boundary. */
export function dialogErrorMessage(error: unknown): string {
	if (isDialogRecord(error) && typeof error.message === "string") {
		return error.message;
	}
	return typeof error === "string" ? error : (JSON.stringify(error) ?? "");
}
