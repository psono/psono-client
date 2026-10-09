export type FileRepositoryType =
	| "aws_s3"
	| "azure_blob"
	| "gcp_cloud_storage"
	| "do_spaces"
	| "other_s3"
	| "backblaze";

export interface FileRepositoryRight {
	id: string;
	user_id: string;
	read: boolean;
	write: boolean;
	grant: boolean;
	accepted?: boolean;
	own_user?: boolean;
}

export interface FileRepository {
	id: string;
	title: string;
	type: FileRepositoryType;
	read?: boolean;
	write?: boolean;
	grant?: boolean;
	active?: boolean;
	accepted?: boolean;
	file_repository_right_id?: string;
	file_repository_rights?: FileRepositoryRight[];
}

export type FileRepositoryCredentialField =
	| `gcp_cloud_storage_${"bucket" | "json_key"}`
	| `aws_s3_${"bucket" | "region" | "access_key_id" | "secret_access_key"}`
	| `azure_blob_storage_account_${"name" | "primary_key" | "container_name"}`
	| `backblaze_${"bucket" | "region" | "access_key_id" | "secret_access_key"}`
	| `other_s3_${"bucket" | "region" | "endpoint_url" | "access_key_id" | "secret_access_key"}`
	| `do_${"space" | "region" | "key" | "secret"}`;

export interface FileRepositoryUserRight extends FileRepositoryRight {
	user_username: string;
	accepted: boolean;
}

export interface FileRepositoryGroupRight
	extends Pick<FileRepositoryRight, "id" | "read" | "write" | "grant"> {
	group_name: string;
}

export interface FileRepositoryDetail
	extends FileRepository,
		Partial<Record<FileRepositoryCredentialField, string | null>> {
	active: boolean;
	file_repository_rights: FileRepositoryUserRight[];
	group_file_repository_rights: FileRepositoryGroupRight[];
}

/** The service marks the current user's rows after reading repository details. */
export interface FileRepositoryDetailWithOwnUser extends FileRepositoryDetail {
	file_repository_rights: (FileRepositoryUserRight & { own_user: boolean })[];
}

export interface FileServer {
	fileserver_url: string;
	read?: boolean;
	write?: boolean;
}

export interface Shard {
	id: string;
	fileserver: FileServer[];
	read?: boolean;
	write?: boolean;
}

export interface FileTransfer {
	file_transfer_id: string;
	file_transfer_secret_key: string;
}

export interface CreatedFile extends FileTransfer {
	file_id: string;
}

/** Empty files may only have a title, without a server ID or chunk list. */
export interface DownloadFile {
	file_id?: string;
	file_title: string;
	file_secret_key?: string;
	file_shard_id?: string | null;
	file_repository_id?: string | null;
	file_chunks?: Record<number, string>;
}

export type ChunkedFile = DownloadFile & {
	file_id: string;
	file_secret_key: string;
	file_chunks: Record<number, string>;
};

export interface RepositoryUpload {
	url: string;
	fields: Record<string, string>;
}

export interface RepositoryDownload {
	url: string;
	type: FileRepositoryType;
}

export interface DownloadCallbacks {
	download_started: (steps: number) => void;
	download_step_complete: (
		step: "DOWNLOADING_FILE_CHUNK" | "DECRYPTING_FILE_CHUNK",
	) => void;
	download_complete: () => void;
}
