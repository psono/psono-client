import type { ComponentProps } from "react";
import type Base from "../js/components/base";
import type { UserSession } from "./auth";
import type {
	Datastore,
	DatastoreFolder,
	DatastoreOverviewEntry,
} from "./datastore";
import type { FileRepository, FileRepositoryRight } from "./files";
import type { ApiKey, NamedSecretReference } from "./vault";

export type ManagementViewProps = Omit<ComponentProps<typeof Base>, "children">;

export interface ManagementDialogProps {
	open: boolean;
	onClose: () => void;
}

export interface ApiKeyDialogProps extends ManagementDialogProps {
	apiKeyId: string;
}

export interface DatastoreDialogProps extends ManagementDialogProps {
	datastoreId: string;
}

export interface FileRepositoryDialogProps extends ManagementDialogProps {
	fileRepositoryId: string;
}

/** Management endpoints return read/write flags, rather than request field names. */
export interface ManagementApiKey
	extends Omit<ApiKey, "allow_read_access" | "allow_write_access"> {
	read: boolean;
	write: boolean;
	active: boolean;
}

export interface ApiKeyOverview {
	api_keys: ManagementApiKey[];
}

export type ApiKeyRow = [
	id: string,
	title: string,
	restrictToSecrets: boolean,
	allowInsecureAccess: boolean,
	read: boolean,
	write: boolean,
	active: boolean,
];

export type SelectedApiKeySecret = Datastore &
	NamedSecretReference & { id: string };
export type CreateApiKeySecretRow = [
	id: string,
	name: string,
	secretId: string,
	secretKey: string,
];
export type EditApiKeySecretRow = [
	id: string,
	name: string | undefined,
	secretId: string,
];

export type DatastoreRow = [
	id: DatastoreOverviewEntry["id"],
	description: DatastoreOverviewEntry["description"],
	isDefault: DatastoreOverviewEntry["is_default"],
];

export type SessionRow = [
	id: UserSession["id"],
	device: UserSession["device_description"],
	created: string,
	currentSession: UserSession["current_session"],
];

export type KnownHostRow = [
	verifyKey: string,
	url: string,
	fingerprint: string,
	currentHost: boolean,
];

export interface ManagementFileRepository extends FileRepository {
	file_repository_right_id?: string;
}

type RepositoryCredentialField =
	| `gcp_cloud_storage_${"bucket" | "json_key"}`
	| `aws_s3_${"bucket" | "region" | "access_key_id" | "secret_access_key"}`
	| `azure_blob_storage_account_${"name" | "primary_key" | "container_name"}`
	| `backblaze_${"bucket" | "region" | "access_key_id" | "secret_access_key"}`
	| `other_s3_${"bucket" | "region" | "endpoint_url" | "access_key_id" | "secret_access_key"}`
	| `do_${"space" | "region" | "key" | "secret"}`;

interface ManagementFileRepositoryRight extends FileRepositoryRight {
	user_username: string;
	accepted: boolean;
	own_user: boolean;
}

interface ManagementGroupFileRepositoryRight
	extends Pick<FileRepositoryRight, "id" | "read" | "write" | "grant"> {
	group_name: string;
}

/** Provider-specific credentials and rights are present on the detail endpoint. */
export interface ManagementFileRepositoryDetail
	extends ManagementFileRepository,
		Partial<Record<RepositoryCredentialField, string | null>> {
	active: boolean;
	file_repository_rights: ManagementFileRepositoryRight[];
	group_file_repository_rights: ManagementGroupFileRepositoryRight[];
}

export type FileRepositoryRow = [
	id: string,
	title: string,
	type: FileRepository["type"],
	active: FileRepository["active"],
	accepted: FileRepository["accepted"],
	read: FileRepository["read"],
	write: FileRepository["write"],
	grant: FileRepository["grant"],
	rightId: ManagementFileRepository["file_repository_right_id"],
];

export type FileRepositoryRightRow = [
	id: string,
	username: string,
	read: boolean,
	write: boolean,
	grant: boolean,
	accepted: boolean,
	ownUser: boolean,
];
export type GroupFileRepositoryRightRow = [
	id: string,
	groupName: string,
	read: boolean,
	write: boolean,
	grant: boolean,
];

export interface ImportBreadcrumbs {
	id_breadcrumbs: string[];
	path: DatastoreFolder[];
}

export interface ManagementError {
	message?: string;
	errors?: string[];
}

export interface ManagementResult {
	msgs: string[];
}
