/**
 * managerFileRepository collects all functions to edit / update / create file repositories and to work with them.
 */

import apiClientService from "./api-client";
import { getStore } from "./store";
import type {
	FileRepository,
	FileRepositoryDetail,
	FileRepositoryDetailWithOwnUser,
	FileRepositoryType,
} from "../../types/files";

/**
 * Accepts a file repository
 *
 * @param fileRepositoryRightId
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function accept(fileRepositoryRightId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = (data: unknown) => {
		console.log(data);
		// pass
	};

	return apiClientService
		.acceptFileRepositoryRight(token, sessionSecretKey, fileRepositoryRightId)
		.then(onSuccess, onError);
}

/**
 * Declines a file repository
 *
 * @param fileRepositoryRightId
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function decline(fileRepositoryRightId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.declineFileRepositoryRight(token, sessionSecretKey, fileRepositoryRightId)
		.then(onSuccess, onError);
}

/**
 * Creates a group file repository right
 *
 * @param fileRepositoryId
 * @param groupId
 * @param read
 * @param write
 * @param grant
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function createGroupFileRepositoryRight(
	fileRepositoryId: string,
	groupId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.createGroupFileRepositoryRight(
			token,
			sessionSecretKey,
			fileRepositoryId,
			groupId,
			read,
			write,
			grant,
		)
		.then(onSuccess, onError);
}

/**
 * Updates a group file repository right
 *
 * @param fileRepositoryRightId
 * @param read
 * @param write
 * @param grant
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function updateGroupFileRepositoryRight(
	fileRepositoryRightId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.updateGroupFileRepositoryRight(
			token,
			sessionSecretKey,
			fileRepositoryRightId,
			read,
			write,
			grant,
		)
		.then(onSuccess, onError);
}

/**
 * Deletes a group file repository right
 *
 * @param fileRepositoryRightId
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function deleteGroupFileRepositoryRight(fileRepositoryRightId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.deleteGroupFileRepositoryRight(
			token,
			sessionSecretKey,
			fileRepositoryRightId,
		)
		.then(onSuccess, onError);
}

/**
 * Creates a file repository right for another user
 *
 * @param fileRepositoryId
 * @param userId
 * @param read
 * @param write
 * @param grant
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function createFileRepositoryRight(
	fileRepositoryId: string,
	userId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.createFileRepositoryRight(
			token,
			sessionSecretKey,
			fileRepositoryId,
			userId,
			read,
			write,
			grant,
		)
		.then(onSuccess, onError);
}

/**
 * Updates a file repository right for another user
 *
 * @param fileRepositoryRightId
 * @param read
 * @param write
 * @param grant
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function updateFileRepositoryRight(
	fileRepositoryRightId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.updateFileRepositoryRight(
			token,
			sessionSecretKey,
			fileRepositoryRightId,
			read,
			write,
			grant,
		)
		.then(onSuccess, onError);
}

/**
 * Deletes a file repository right for another user
 *
 * @param fileRepositoryRightId
 *
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function deleteFileRepositoryRight(fileRepositoryRightId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.deleteFileRepositoryRight(token, sessionSecretKey, fileRepositoryRightId)
		.then(onSuccess, onError);
}

/**
 * Returns the possible types
 *
 * @returns {*[]}
 */
function getPossibleTypes() {
	const fileRepositoryTypes: { value: FileRepositoryType; title: string }[] = [
		{ value: "aws_s3", title: "AWS S3" },
		{ value: "azure_blob", title: "Azure Blob Storage" },
		// Backblaze reported (May 11, 2020, 4:11:19 PM PDT):
		// Currently, CORS is not supported for S3 buckets. While we currently have this in development, we do not have a concrete timeline unfortunately.
		//{value: 'backblaze', title: 'Backblaze S3'},
		{ value: "gcp_cloud_storage", title: "GCP Cloud Storage" },
		{ value: "do_spaces", title: "Digital Ocean Spaces" },
		{ value: "other_s3", title: "Other S3 compatible storage" },
	];

	const allowedFileRepositoryTypes =
		getStore().getState().server.allowedFileRepositoryTypes;

	for (let i = fileRepositoryTypes.length - 1; i >= 0; i--) {
		if (!allowedFileRepositoryTypes.includes(fileRepositoryTypes[i]["value"])) {
			fileRepositoryTypes.splice(i, 1);
		}
	}

	return fileRepositoryTypes;
}

/**
 * Returns one file repositories
 *
 * @returns {Promise} Promise with the file repositories
 */
function readFileRepository(fileRepositoryId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: { data: FileRepositoryDetail }) => {
		if (Object.hasOwn(result.data, "file_repository_rights")) {
			for (let i = 0; i < result.data["file_repository_rights"]!.length; i++) {
				result.data["file_repository_rights"]![i]["own_user"] =
					result.data["file_repository_rights"]![i]["user_id"] ===
					getStore().getState().user.userId;
			}
		}
		return result.data as FileRepositoryDetailWithOwnUser;
	};
	const onError = () => {
		// pass
	};

	return apiClientService
		.readFileRepository(token, sessionSecretKey, fileRepositoryId)
		.then(onSuccess, onError);
}

/**
 * Returns all file repositories
 *
 * @returns {Promise} Promise with the file repositories
 */
function readFileRepositories() {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: {
		data: { file_repositories: FileRepository[] };
	}) => result.data.file_repositories;
	const onError = () => {
		// pass
	};

	return apiClientService
		.readFileRepository(token, sessionSecretKey)
		.then(onSuccess, onError);
}

/**
 * Creates an File Repository
 *
 * @param {string} title The title of the new file repository
 * @param {string} type The type of the new file repository
 * @param {string} [gcpCloudStorageBucket] (optional) The gcp cloud storage bucket
 * @param {string} [gcpCloudStorageJsonKey] (optional) The gcp cloud storage json key
 * @param {string} [awsS3Bucket] (optional) The s3 bucket
 * @param {string} [awsS3Region] (optional) The s3 region
 * @param {string} [awsS3AccessKeyId] (optional) The s3 access key
 * @param {string} [awsS3SecretAccessKey] (optional) The s3 secret key
 * @param {string} [azureBlobStorageAccountName] (optional) The azure blob storage account name
 * @param {string} [azureBlobStorageAccountPrimaryKey] (optional) The azure blob storage account primary key
 * @param {string} [azureBlobStorageAccountContainerName] (optional) The azure blob storage account container name
 * @param {string} [backblazeBucket] (optional) The s3 bucket
 * @param {string} [backblazeRegion] (optional) The s3 region
 * @param {string} [backblazeAccessKeyId] (optional) The s3 access key
 * @param {string} [backblazeSecretAccessKey] (optional) The s3 secret key
 * @param {string} [others3Bucket] (optional) The s3 bucket
 * @param {string} [otherS3Region] (optional) The s3 region
 * @param {string} [otherS3EndpointUrl] (optional) The s3 endpoint url
 * @param {string} [otherS3AccessKeyId] (optional) The s3 access key
 * @param {string} [otherS3SecretAccessKey] (optional) The s3 secret key
 * @param {string} [doSpace] (optional) The digital ocean space
 * @param {string} [doRegion] (optional) The digital ocean region
 * @param {string} [doKey] (optional) The digital ocean key
 * @param {string} [doSecret] (optional) The digital ocean secret
 *
 * @returns {Promise} Promise with the new id
 */
function createFileRepository(
	title: string,
	type: FileRepositoryType,
	gcpCloudStorageBucket?: string,
	gcpCloudStorageJsonKey?: string,
	awsS3Bucket?: string,
	awsS3Region?: string,
	awsS3AccessKeyId?: string,
	awsS3SecretAccessKey?: string,
	azureBlobStorageAccountName?: string,
	azureBlobStorageAccountPrimaryKey?: string,
	azureBlobStorageAccountContainerName?: string,
	backblazeBucket?: string,
	backblazeRegion?: string,
	backblazeAccessKeyId?: string,
	backblazeSecretAccessKey?: string,
	others3Bucket?: string,
	otherS3Region?: string,
	otherS3EndpointUrl?: string,
	otherS3AccessKeyId?: string,
	otherS3SecretAccessKey?: string,
	doSpace?: string,
	doRegion?: string,
	doKey?: string,
	doSecret?: string,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (result: { data: { file_repository_id: string } }) => {
		const fileRepositoryId = result.data["file_repository_id"];
		return {
			file_repository_id: fileRepositoryId,
		};
	};
	const onError = () => {
		// pass
	};

	return apiClientService
		.createFileRepository(
			token,
			sessionSecretKey,
			title,
			type,
			gcpCloudStorageBucket,
			gcpCloudStorageJsonKey,
			awsS3Bucket,
			awsS3Region,
			awsS3AccessKeyId,
			awsS3SecretAccessKey,
			azureBlobStorageAccountName,
			azureBlobStorageAccountPrimaryKey,
			azureBlobStorageAccountContainerName,
			backblazeBucket,
			backblazeRegion,
			backblazeAccessKeyId,
			backblazeSecretAccessKey,
			others3Bucket,
			otherS3Region,
			otherS3EndpointUrl,
			otherS3AccessKeyId,
			otherS3SecretAccessKey,
			doSpace,
			doRegion,
			doKey,
			doSecret,
		)
		.then(onSuccess, onError);
}

/**
 * Updates an File Repository
 *
 * @param {uuid} fileRepositoryId The id of the file repository
 * @param {string} title The title of the new file repository
 * @param {string} type The type of the new file repository
 * @param {string} [gcpCloudStorageBucket] (optional) The gcp cloud storage bucket
 * @param {string} [gcpCloudStorageJsonKey] (optional) The gcp cloud storage json key
 * @param {string} [awsS3Bucket] (optional) The s3 bucket
 * @param {string} [awsS3Region] (optional) The s3 region
 * @param {string} [awsS3AccessKeyId] (optional) The s3 access key
 * @param {string} [awsS3SecretAccessKey] (optional) The s3 secret key
 * @param {string} [azureBlobStorageAccountName] (optional) The azure blob storage account name
 * @param {string} [azureBlobStorageAccountPrimaryKey] (optional) The azure blob storage account primary key
 * @param {string} [azureBlobStorageAccountContainerName] (optional) The azure blob storage account container name
 * @param {string} [backblazeBucket] (optional) The s3 bucket
 * @param {string} [backblazeRegion] (optional) The s3 region
 * @param {string} [backblazeAccessKeyId] (optional) The s3 access key
 * @param {string} [backblazeSecretAccessKey] (optional) The s3 secret key
 * @param {string} [otherS3Bucket] (optional) The s3 bucket
 * @param {string} [otherS3Region] (optional) The s3 region
 * @param {string} [otherS3EndpointUrl] (optional) The s3 endpoint url
 * @param {string} [otherS3AccessKeyId] (optional) The s3 access key
 * @param {string} [otherS3SecretAccessKey] (optional) The s3 secret key
 * @param {string} [doSpace] (optional) The digital ocean space
 * @param {string} [doRegion] (optional) The digital ocean region
 * @param {string} [doHey] (optional) The digital ocean key
 * @param {string} [doSecret] (optional) The digital ocean secret
 * @param {bool} active
 *
 * @returns {Promise} Promise with the new id
 */
function updateFileRepository(
	fileRepositoryId: string,
	title: string,
	type: FileRepositoryType,
	gcpCloudStorageBucket: string | undefined,
	gcpCloudStorageJsonKey: string | undefined,
	active: boolean,
	awsS3Bucket?: string,
	awsS3Region?: string,
	awsS3AccessKeyId?: string,
	awsS3SecretAccessKey?: string,
	azureBlobStorageAccountName?: string,
	azureBlobStorageAccountPrimaryKey?: string,
	azureBlobStorageAccountContainerName?: string,
	backblazeBucket?: string,
	backblazeRegion?: string,
	backblazeAccessKeyId?: string,
	backblazeSecretAccessKey?: string,
	otherS3Bucket?: string,
	otherS3Region?: string,
	otherS3EndpointUrl?: string,
	otherS3AccessKeyId?: string,
	otherS3SecretAccessKey?: string,
	doSpace?: string,
	doRegion?: string,
	doHey?: string,
	doSecret?: string,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	return apiClientService.updateFileRepository(
		token,
		sessionSecretKey,
		fileRepositoryId,
		title,
		type,
		gcpCloudStorageBucket,
		gcpCloudStorageJsonKey,
		active,
		awsS3Bucket,
		awsS3Region,
		awsS3AccessKeyId,
		awsS3SecretAccessKey,
		azureBlobStorageAccountName,
		azureBlobStorageAccountPrimaryKey,
		azureBlobStorageAccountContainerName,
		backblazeBucket,
		backblazeRegion,
		backblazeAccessKeyId,
		backblazeSecretAccessKey,
		otherS3Bucket,
		otherS3Region,
		otherS3EndpointUrl,
		otherS3AccessKeyId,
		otherS3SecretAccessKey,
		doSpace,
		doRegion,
		doHey,
		doSecret,
	);
}

/**
 * Deletes an File Repository
 *
 * @param {uuid} fileRepositoryId The id of the file repository to delete
 *
 * @returns {Promise} Promise
 */
function deleteFileRepository(fileRepositoryId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(result: { data: T }): T => result.data;
	const onError = () => {
		// pass
	};

	return apiClientService
		.deleteFileRepository(token, sessionSecretKey, fileRepositoryId)
		.then(onSuccess, onError);
}

/**
 * Returns weather the server allows the file repositories feature or not
 * By default it will return false (indicate enabled file repositories)
 */
function fileRepositoriesDisabled() {
	return getStore().getState().server.complianceDisableFileRepositories;
}

/**
 * Filters an array of file repositories
 *
 * @param {array} fileRepositories Array of file repositories
 * @param {bool} requireRead Determines whether read is required or not
 * @param {bool} requireWrite Determines whether write is required or not
 * @param {bool} requireActive Determines whether active is required or not
 * @param {bool} requireAccepted Determines whether accepted is required or not
 *
 * @returns {array} list of fileRepositories that fulfill the filter criteria
 */
function filterFileRepositories<
	T extends Pick<FileRepository, "read" | "write" | "active" | "accepted">,
>(
	fileRepositories: T[],
	requireRead?: boolean | null,
	requireWrite?: boolean | null,
	requireActive?: boolean | null,
	requireAccepted?: boolean | null,
) {
	const filteredFileRepositories = [];

	for (let i = 0; i < fileRepositories.length; i++) {
		if (requireRead && !fileRepositories[i]["read"]) {
			continue;
		}
		if (requireWrite && !fileRepositories[i]["write"]) {
			continue;
		}
		if (requireActive && !fileRepositories[i]["active"]) {
			continue;
		}
		if (requireAccepted && !fileRepositories[i]["accepted"]) {
			continue;
		}

		filteredFileRepositories.push(fileRepositories[i]);
	}

	return filteredFileRepositories;
}

function getAwsRegions() {
	const awsRegions = [
		"us-east-1", // USA Ost (Nord-Virginia)
		"us-east-2", // USA Ost (Ohio)
		"us-west-1", // USA West (Nordkalifornien)
		"us-west-2", // USA West (Oregon)
		"ap-south-1", // Asien-Pazifik (Mumbai)
		"ap-northeast-1", // Asien-Pazifik (Tokio)
		"ap-northeast-2", // Asien-Pazifik (Seoul
		"ap-northeast-3", // Asien-Pazifik (Osaka-Lokal)
		"ap-southeast-1", // Asien-Pazifik (Singapur)
		"ap-southeast-2", // Asien-Pazifik (Sydney)
		"ca-central-1", // Kanada (Zentral)
		"cn-north-1", // China (Peking)
		"cn-northwest-1", // China (Ningxia)
		"eu-central-1", // EU (Frankfurt)
		"eu-west-1", // EU (Irland)
		"eu-west-2", // EU (London)
		"eu-west-3", // EU (Paris)
		"eu-north-1", // EU (Stockholm)
		"sa-east-1", // Südamerika (Sao Paulo)
		"us-gov-east-1", // AWS GovCloud (USA Ost)
		"us-gov-west-1", // AWS GovCloud (USA)
	];

	return awsRegions;
}

function getDoSpacesRegions() {
	const doSpacesRegions = ["ams3", "fra1", "nyc3", "sfo2", "sgp1"];

	return doSpacesRegions;
}

const fileRepositoryService = {
	accept: accept,
	decline: decline,
	createGroupFileRepositoryRight: createGroupFileRepositoryRight,
	updateGroupFileRepositoryRight: updateGroupFileRepositoryRight,
	deleteGroupFileRepositoryRight: deleteGroupFileRepositoryRight,
	createFileRepositoryRight: createFileRepositoryRight,
	updateFileRepositoryRight: updateFileRepositoryRight,
	deleteFileRepositoryRight: deleteFileRepositoryRight,
	getPossibleTypes: getPossibleTypes,
	readFileRepository: readFileRepository,
	readFileRepositories: readFileRepositories,
	createFileRepository: createFileRepository,
	updateFileRepository: updateFileRepository,
	deleteFileRepository: deleteFileRepository,
	fileRepositoriesDisabled: fileRepositoriesDisabled,
	filterFileRepositories: filterFileRepositories,
	getAwsRegions: getAwsRegions,
	getDoSpacesRegions: getDoSpacesRegions,
};
export default fileRepositoryService;
