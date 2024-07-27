/**
 * Service to manage everything around file transfer
 */
import { saveAs } from "file-saver";

import apiClientService from "./api-client";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import helper from "./helper";
import apiAWS from "./api-aws";
import apiAzureBlob from "./api-azure-blob";
import apiBackblaze from "./api-backblaze";
import apiOtherS3 from "./api-other-s3";
import apiGCP from "./api-gcp";
import apiDO from "./api-aws";
import apiFileserver from "./api-fileserver";
import { getStore } from "./store";
import storage from "./storage";
import offlineCache from "./offline-cache";

const registrations = {};

/**
 * Triggered once someone wants to read a file
 *
 * @param fileId The id of the file to read
 *
 * @returns {Promise} promise
 */
function readFile(fileId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiClientService.readFile(token, sessionSecretKey, fileId).then(onSuccess, onError);
}

/**
 * Triggered once someone wants to create a file object
 *
 * @param shardId (optional) The id of the shard this upload goes to
 * @param fileRepositoryId (optional) The id of the file repository this upload goes to
 * @param size The file size in bytes
 * @param chunkCount The amount of chunks to upload
 * @param linkId The id of the link
 * @param parentDatastoreId The id of the parent datastore (can be undefined if the parent is a share)
 * @param parentShareId The id of the parent share (can be undefined if the parent is a datastore)
 *
 * @returns {Promise} promise
 */
function createFile(shardId, fileRepositoryId, size, chunkCount, linkId, parentDatastoreId, parentShareId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiClientService
        .createFile(
            token,
            sessionSecretKey,
            shardId,
            fileRepositoryId,
            size,
            chunkCount,
            linkId,
            parentDatastoreId,
            parentShareId
        )
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The hex encoded secret key for the file transfer
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {object} shard The target shard
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
async function uploadShard(chunk, fileTransferId, fileTransferSecretKey, chunkPosition, shard, hashChecksum) {
    const ticket = {
        chunk_position: chunkPosition,
        hash_checksum: hashChecksum,
    };

    const ticketEncrypted = await cryptoLibrary.encryptData(JSON.stringify(ticket), fileTransferSecretKey);

    let fileserver;
    if (shard["fileserver"].length > 1) {
        // math random should be good enough here, don't use for crypto!
        const pos = Math.floor(Math.random() * shard["fileserver"].length);
        fileserver = shard["fileserver"][pos];
    } else {
        fileserver = shard["fileserver"][0];
    }

    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiFileserver
        .upload(fileserver["fileserver_url"], fileTransferId, chunk, ticketEncrypted.text, ticketEncrypted.nonce)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to GCP Cloud Storage
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryGcpCloudStorage(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    hashChecksum
) {
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiGCP.upload(result.data.url, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(fileTransferId, fileTransferSecretKey, chunkSize, chunkPosition, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to AWS S3
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryAwsS3(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    hashChecksum
) {
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiAWS.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(fileTransferId, fileTransferSecretKey, chunkSize, chunkPosition, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to Azure Blob Storage
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryAzureBlob(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    hashChecksum
) {
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiAzureBlob.upload(result.data.url, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(fileTransferId, fileTransferSecretKey, chunkSize, chunkPosition, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to Backblaze
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryBackblaze(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    hashChecksum
) {
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiBackblaze.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(fileTransferId, fileTransferSecretKey, chunkSize, chunkPosition, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to another S3 compatible storage
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryOtherS3(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    hashChecksum
) {
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiOtherS3.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(fileTransferId, fileTransferSecretKey, chunkSize, chunkPosition, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to Digital ocean spaces
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryDoSpaces(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    hashChecksum
) {
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiDO.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(fileTransferId, fileTransferSecretKey, chunkSize, chunkPosition, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The hex encoded secret key for the file transfer
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {object|undefined} shard (optional) The target shard
 * @param {object|undefined} fileRepository (optional) The target file repository
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function upload(
    chunk,
    fileTransferId,
    fileTransferSecretKey,
    chunkSize,
    chunkPosition,
    shard,
    fileRepository,
    hashChecksum
) {
    if (typeof shard !== "undefined") {
        return uploadShard(chunk, fileTransferId, fileTransferSecretKey, chunkPosition, shard, hashChecksum);
    } else if (typeof fileRepository !== "undefined" && fileRepository["type"] === "gcp_cloud_storage") {
        return uploadFileRepositoryGcpCloudStorage(
            chunk,
            fileTransferId,
            fileTransferSecretKey,
            chunkSize,
            chunkPosition,
            hashChecksum
        );
    } else if (typeof fileRepository !== "undefined" && fileRepository["type"] === "do_spaces") {
        return uploadFileRepositoryDoSpaces(
            chunk,
            fileTransferId,
            fileTransferSecretKey,
            chunkSize,
            chunkPosition,
            hashChecksum
        );
    } else if (typeof fileRepository !== "undefined" && fileRepository["type"] === "aws_s3") {
        return uploadFileRepositoryAwsS3(
            chunk,
            fileTransferId,
            fileTransferSecretKey,
            chunkSize,
            chunkPosition,
            hashChecksum
        );
    } else if (typeof fileRepository !== "undefined" && fileRepository["type"] === "azure_blob") {
        return uploadFileRepositoryAzureBlob(
            chunk,
            fileTransferId,
            fileTransferSecretKey,
            chunkSize,
            chunkPosition,
            hashChecksum
        );
    } else if (typeof fileRepository !== "undefined" && fileRepository["type"] === "backblaze") {
        return uploadFileRepositoryBackblaze(
            chunk,
            fileTransferId,
            fileTransferSecretKey,
            chunkSize,
            chunkPosition,
            hashChecksum
        );
    } else if (typeof fileRepository !== "undefined" && fileRepository["type"] === "other_s3") {
        return uploadFileRepositoryOtherS3(
            chunk,
            fileTransferId,
            fileTransferSecretKey,
            chunkSize,
            chunkPosition,
            hashChecksum
        );
    }
}

/**
 * Triggered once someone wants to retrieve the potential shards from the server
 *
 * @returns {Promise} promise with all the shards
 */
function readShards() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const onError = async function (result) {
        result = await result;
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data["shards"];
    };

    return apiClientService.readShards(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Filters an array of shards and fileservers
 *
 * @param {array} shards Array of shards
 * @param {bool} requireRead Determines whether read is required or not
 * @param {bool} requireWrite Determines whether write is required or not
 *
 * @returns {array} list of shards with fileservers that fulfill the filter criteria
 */
function filterShards(shards, requireRead, requireWrite) {
    const filteredShards = [];

    for (let i = 0; i < shards.length; i++) {
        if (requireRead && !shards[i]["read"]) {
            continue;
        }
        if (requireWrite && !shards[i]["write"]) {
            continue;
        }
        const filtered_shard = helper.duplicateObject(shards[i]);
        filteredShards.push(filtered_shard);

        helper.removeFromArray(filtered_shard["fileserver"], undefined, function (fileserver, nothing) {
            return (requireRead && !fileserver["read"]) || (requireWrite && !fileserver["write"]);
        });
    }

    return filteredShards;
}

/**
 * Handles item clicks and triggers behaviour
 *
 * @param {object} item The item one has clicked on
 */
function onItemClick(item) {
    readShards().then(function (data) {
        storage.upsert("file-downloads", { key: "shards", shards: data });
        browserClient.openTab("download-file.html#!/file/download/" + item.id).then(function (window) {
            window.psono_offline_cache_encryption_key = offlineCache.getEncryptionKey();
        });
    });
}

/**
 * Takes a list of shards with their fileservers and created a lookup dictionary that only contains those
 * with read privilege
 *
 * @param {array} shards A list of shards
 */
function createShardReadDict(shards) {
    const shards_dict = {};

    for (let i = 0; i < shards.length; i++) {
        if (!shards[i]["read"]) {
            continue;
        }
        if (!shards_dict.hasOwnProperty(shards[i]["id"])) {
            shards_dict[shards[i]["id"]] = {
                fileserver: [],
                id: shards[i]["id"],
            };
        }

        for (let ii = 0; ii < shards[i]["fileserver"].length; ii++) {
            if (!shards[i]["fileserver"][ii]["read"]) {
                continue;
            }
            shards_dict[shards[i]["id"]]["fileserver"].push(shards[i]["fileserver"][ii]);
        }
    }

    for (let shardId in shards_dict) {
        if (!shards_dict.hasOwnProperty(shardId)) {
            continue;
        }
        if (shards_dict[shardId]["fileserver"].length === 0) {
            delete shards_dict[shardId];
        }
    }

    return shards_dict;
}

/**
 * Downloads a file from a shard
 *
 * @param {uuid} fileTransferId The file transfer id
 * @param {string} fileTransferSecretKey The hex encoded secret key for the file transfer
 * @param shard
 * @param hashChecksum
 *
 * @returns {PromiseLike<T | void> | Promise<T | void> | *}
 */
async function shardDownload(fileTransferId, fileTransferSecretKey, shard, hashChecksum) {
    registrations["download_step_complete"]("DOWNLOADING_FILE_CHUNK");

    const ticket = {
        hash_checksum: hashChecksum,
    };

    const ticketEncrypted = await cryptoLibrary.encryptData(JSON.stringify(ticket), fileTransferSecretKey);
    let fileserver;
    if (shard["fileserver"].length > 1) {
        // math random should be good enough here, don't use for crypto!
        const pos = Math.floor(Math.random() * shard["fileserver"].length);
        fileserver = shard["fileserver"][pos];
    } else {
        fileserver = shard["fileserver"][0];
    }

    const onError = async function (result) {
        result = await result;
        console.log(result);
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiFileserver
        .download(fileserver["fileserver_url"], fileTransferId, ticketEncrypted.text, ticketEncrypted.nonce)
        .then(onSuccess, onError);
}

/**
 * Downloads a file from a file repository
 *
 * @param {uuid} fileTransferId The file transfer id
 * @param {string} fileTransferSecretKey The hex encoded secret key for the file transfer
 * @param {string} hashChecksum The hash checksum of the file to download
 *
 * @returns {PromiseLike<T | void> | Promise<T | void> | *}
 */
function fileRepositoryDownload(fileTransferId, fileTransferSecretKey, hashChecksum) {
    registrations["download_step_complete"]("DOWNLOADING_FILE_CHUNK");

    const onError = async function (result) {
        result = await result;
        console.log(result);
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = async function (result) {
            result = await result;
            console.log(result);
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result.data;
        };

        if (result.data.type === "aws_s3") {
            return apiAWS.download(result.data.url).then(onSuccess, onError);
        } else if (result.data.type === "azure_blob") {
            return apiAzureBlob.download(result.data.url).then(onSuccess, onError);
        } else if (result.data.type === "backblaze") {
            return apiBackblaze.download(result.data.url).then(onSuccess, onError);
        } else if (result.data.type === "other_s3") {
            return apiOtherS3.download(result.data.url).then(onSuccess, onError);
        } else if (result.data.type === "gcp_cloud_storage") {
            return apiGCP.download(result.data.url).then(onSuccess, onError);
        } else if (result.data.type === "do_spaces") {
            return apiDO.download(result.data.url).then(onSuccess, onError);
        } else {
            return Promise.reject("UNKNOWN_FILE_REPOSITORY_TYPE");
        }
    };

    return apiClientService
        .fileRepositoryDownload(fileTransferId, fileTransferSecretKey, hashChecksum)
        .then(onSuccess, onError);
}

/**
 * Downloads a file from a shard
 *
 * @param {object} file The file config object
 * @param {array|undefined} shards List of shards
 * @param {object|undefined} fileTransfer (optional) Already a filetransfer
 *
 * @returns {Promise}
 */
function downloadFileFromShard(file, shards, fileTransfer) {
    function downloadFileFromShardHelper(shards) {
        const shards_dict = createShardReadDict(shards);
        const shardId = file["file_shard_id"];

        if (!shards_dict.hasOwnProperty(shardId)) {
            return Promise.reject({
                non_field_errors: ["NO_FILESERVER_AVAILABLE"],
            });
        }

        function onSuccess(data) {
            const fileTransferId = data.file_transfer_id;
            const fileTransferSecretKey = data.file_transfer_secret_key;

            const shard = shards_dict[shardId];
            let next_chunk_id = 1;
            const allblobs = [];
            const chunkCount = Object.keys(file.file_chunks).length;
            registrations["download_started"](chunkCount * 2);

            function onError(data) {
                return Promise.reject(data);
            }

            function onChunkDownload(data) {
                registrations["download_step_complete"]("DECRYPTING_FILE_CHUNK");

                next_chunk_id = next_chunk_id + 1;
                return cryptoLibrary.decryptFile(new Uint8Array(data), file["file_secret_key"]).then(function (data) {
                    allblobs.push(data);
                    if (next_chunk_id > chunkCount) {
                        const concat = new Blob(allblobs, { type: "application/octet-string" });
                        registrations["download_complete"]();
                        saveAs(concat, file["file_title"]);
                    } else {
                        return shardDownload(
                            fileTransferId,
                            fileTransferSecretKey,
                            shard,
                            file.file_chunks[next_chunk_id]
                        ).then(onChunkDownload, onError);
                    }
                });
            }

            return shardDownload(fileTransferId, fileTransferSecretKey, shard, file.file_chunks[next_chunk_id]).then(
                onChunkDownload,
                onError
            );
        }

        function onError(data) {
            return Promise.reject(data);
        }

        if (!fileTransfer) {
            return readFile(file["file_id"]).then(onSuccess, onError);
        } else {
            return Promise.resolve(onSuccess(fileTransfer));
        }
    }

    if (shards === null || typeof shards === "undefined") {
        storage
            .findKey("file-downloads", "shards")
            .then(function (data) {
                downloadFileFromShardHelper(data.shards);
            })
            .catch(function (err) {
                console.log(err);
                return Promise.reject({
                    non_field_errors: ["NO_FILESERVER_AVAILABLE"],
                });
            });
    } else {
        downloadFileFromShardHelper(shards);
    }
}

/**
 * Downloads a file from a file repository
 *
 * @param {object} file The file config object
 * @param {object|undefined} fileTransfer (optional) Already a file transfer
 *
 * @returns {Promise}
 */
function downloadFileFromFileRepository(file, fileTransfer) {
    function onSuccess(data) {
        const fileTransferId = data.file_transfer_id;
        const fileTransferSecretKey = data.file_transfer_secret_key;

        let next_chunk_id = 1;
        const allblobs = [];
        const chunkCount = Object.keys(file.file_chunks).length;

        registrations["download_started"](chunkCount * 2);

        function onError(data) {
            return Promise.reject(data);
        }

        function on_chunk_download(data) {
            registrations["download_step_complete"]("DECRYPTING_FILE_CHUNK");

            next_chunk_id = next_chunk_id + 1;
            return cryptoLibrary.decryptFile(new Uint8Array(data), file["file_secret_key"]).then(function (data) {
                allblobs.push(data);
                if (next_chunk_id > chunkCount) {
                    const concat = new Blob(allblobs, { type: "application/octet-string" });
                    registrations["download_complete"]();
                    saveAs(concat, file["file_title"]);
                } else {
                    return fileRepositoryDownload(
                        fileTransferId,
                        fileTransferSecretKey,
                        file.file_chunks[next_chunk_id]
                    ).then(on_chunk_download, onError);
                }
            });
        }

        return fileRepositoryDownload(fileTransferId, fileTransferSecretKey, file.file_chunks[next_chunk_id]).then(
            on_chunk_download,
            onError
        );
    }
    function onError(data) {
        console.log(data);
        return Promise.reject(data);
    }

    if (!fileTransfer) {
        return readFile(file["file_id"]).then(onSuccess, onError);
    } else {
        return Promise.resolve(onSuccess(fileTransfer));
    }
}

/**
 * Downloads a file
 *
 * @param {object} file The file config object
 * @param {array} shards An array of shards
 * @param {object|undefined} fileTransfer (optional) Already a filetransfer
 *
 * @returns {Promise}
 */
function downloadFile(file, shards, fileTransfer) {
    if (
        !file.hasOwnProperty("file_id") ||
        !file.hasOwnProperty("file_chunks") ||
        !file["file_id"] ||
        Object.keys(file.file_chunks).length === 0
    ) {
        registrations["download_complete"]();
        saveAs(new Blob([""], { type: "text/plain;charset=utf-8" }), file["file_title"]);
        return Promise.resolve();
    }

    if (file.hasOwnProperty("file_shard_id") && file["file_shard_id"]) {
        return downloadFileFromShard(file, shards, fileTransfer);
    } else {
        return downloadFileFromFileRepository(file, fileTransfer);
    }
}

/**
 * Downloads a file
 *
 * @param {string} id The id of the file to download
 *
 * @returns {Promise}
 */
function downloadFileByStorageId(id) {
    return storage.findKey("datastore-file-leafs", id).then(function (file) {
        if (file === null || typeof file === "undefined") {
            return Promise.resolve();
        }

        return downloadFile(file, undefined, undefined);
    });
}

/**
 * used to register functions for callbacks
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key, func) {
    registrations[key] = func;
}

const fileTransferService = {
    readFile: readFile,
    createFile: createFile,
    upload: upload,
    readShards: readShards,
    filterShards: filterShards,
    onItemClick: onItemClick,
    downloadFileByStorageId: downloadFileByStorageId,
    downloadFile: downloadFile,
    register: register,
};
export default fileTransferService;
