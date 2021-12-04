/**
 * Service to manage everything around file transfer
 */
import { saveAs } from "file-saver";

import apiClientService from "./api-client";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import apiAWS from "./api-aws";
import apiAzureBlob from "./api-azure-blob";
import apiBackblaze from "./api-backblaze";
import apiOtherS3 from "./api-other-s3";
import apiGCP from "./api-gcp";
import apiDO from "./api-aws";
import store from "./store";
import storage from "./storage";

const registrations = {};

/**
 * Triggered once someone wants to read a file
 *
 * @param file_id The id of the file to read
 *
 * @returns {Promise} promise
 */
function readFile(file_id) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiClientService.readFile(token, sessionSecretKey, file_id).then(onSuccess, onError);
}

/**
 * Triggered once someone wants to create a file object
 *
 * @param shard_id (optional) The id of the shard this upload goes to
 * @param file_repository_id (optional) The id of the file repository this upload goes to
 * @param size The file size in bytes
 * @param chunk_count The amount of chunks to upload
 * @param link_id The id of the link
 * @param parent_datastore_id The id of the parent datastore (can be undefined if the parent is a share)
 * @param parent_share_id The id of the parent share (can be undefined if the parent is a datastore)
 *
 * @returns {Promise} promise
 */
function createFile(shard_id, file_repository_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiClientService
        .createFile(token, sessionSecretKey, shard_id, file_repository_id, size, chunk_count, link_id, parent_datastore_id, parent_share_id)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The hex encoded secret key for the file transfer
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {object} shard The target shard
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadShard(chunk, file_transfer_id, file_transfer_secret_key, chunk_position, shard, hash_checksum) {
    const ticket = {
        chunk_position: chunk_position,
        hash_checksum: hash_checksum,
    };

    const ticket_enc = cryptoLibrary.encryptData(JSON.stringify(ticket), file_transfer_secret_key);

    let fileserver;
    if (shard["fileserver"].length > 1) {
        // math random should be good enough here, don't use for crypto!
        const pos = Math.floor(Math.random() * shard["fileserver"].length);
        fileserver = shard["fileserver"][pos];
    } else {
        fileserver = shard["fileserver"][0];
    }

    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiFileserver.upload(fileserver["fileserver_url"], file_transfer_id, chunk, ticket_enc.text, ticket_enc.nonce).then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to GCP Cloud Storage
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The file transfer secret key
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryGcpCloudStorage(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum) {
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiGCP.upload(result.data.url, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to AWS S3
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The file transfer secret key
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryAwsS3(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum) {
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiAWS.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to Azure Blob Storage
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The file transfer secret key
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryAzureBlob(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum) {
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiAzureBlob.upload(result.data.url, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to Backblaze
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The file transfer secret key
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryBackblaze(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum) {
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiBackblaze.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to another S3 compatible storage
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The file transfer secret key
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryOtherS3(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum) {
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiOtherS3.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file to Digital ocean spaces
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The file transfer secret key
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function uploadFileRepositoryDoSpaces(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum) {
    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
            return Promise.reject(result.data);
        };

        const onSuccess = function (result) {
            return result;
        };

        return apiDO.upload(result.data.url, result.data.fields, chunk).then(onSuccess, onError);
    };

    return apiClientService
        .fileRepositoryUpload(file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum)
        .then(onSuccess, onError);
}

/**
 * Triggered once someone wants to actually upload the file
 *
 * @param {Blob} chunk The content of the chunk to upload
 * @param {uuid} file_transfer_id The id of the file transfer
 * @param {string} file_transfer_secret_key The hex encoded secret key for the file transfer
 * @param {int} chunk_size The size of the complete chunk in bytes
 * @param {int} chunk_position The sequence number of the chunk to determine the order
 * @param {object|undefined} shard (optional) The target shard
 * @param {object|undefined} file_repository (optional) The target file repository
 * @param {string} hash_checksum The sha512 hash
 *
 * @returns {Promise} promise
 */
function upload(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, shard, file_repository, hash_checksum) {
    if (typeof shard !== "undefined") {
        return uploadShard(chunk, file_transfer_id, file_transfer_secret_key, chunk_position, shard, hash_checksum);
    } else if (typeof file_repository !== "undefined" && file_repository["type"] === "gcp_cloud_storage") {
        return uploadFileRepositoryGcpCloudStorage(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum);
    } else if (typeof file_repository !== "undefined" && file_repository["type"] === "do_spaces") {
        return uploadFileRepositoryDoSpaces(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum);
    } else if (typeof file_repository !== "undefined" && file_repository["type"] === "aws_s3") {
        return uploadFileRepositoryAwsS3(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum);
    } else if (typeof file_repository !== "undefined" && file_repository["type"] === "azure_blob") {
        return uploadFileRepositoryAzureBlob(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum);
    } else if (typeof file_repository !== "undefined" && file_repository["type"] === "backblaze") {
        return uploadFileRepositoryBackblaze(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum);
    } else if (typeof file_repository !== "undefined" && file_repository["type"] === "other_s3") {
        return uploadFileRepositoryOtherS3(chunk, file_transfer_id, file_transfer_secret_key, chunk_size, chunk_position, hash_checksum);
    }
}

/**
 * Triggered once someone wants to retrieve the potential shards from the server
 *
 * @returns {Promise} promise with all the shards
 */
function readShards() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const onError = function (result) {
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
 * @param {bool} require_read Determines whether read is required or not
 * @param {bool} require_write Determines whether write is required or not
 *
 * @returns {array} list of shards with fileservers that fulfill the filter criteria
 */
function filterShards(shards, require_read, require_write) {
    const filtered_shards = [];

    for (let i = 0; i < shards.length; i++) {
        if (require_read && !shards[i]["read"]) {
            continue;
        }
        if (require_write && !shards[i]["write"]) {
            continue;
        }
        const filtered_shard = angular.copy(shards[i]);
        filtered_shards.push(filtered_shard);

        helper.remove_from_array(filtered_shard["fileserver"], undefined, function (fileserver, nothing) {
            return (require_read && !fileserver["read"]) || (require_write && !fileserver["write"]);
        });
    }

    return filtered_shards;
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
            //window.psono_offline_cache_encryption_key = offlineCache.get_encryption_key();
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

    for (let shard_id in shards_dict) {
        if (!shards_dict.hasOwnProperty(shard_id)) {
            continue;
        }
        if (shards_dict[shard_id]["fileserver"].length === 0) {
            delete shards_dict[shard_id];
        }
    }

    return shards_dict;
}

/**
 * Downloads a file from a shard
 *
 * @param {uuid} file_transfer_id The file transfer id
 * @param {string} file_transfer_secret_key The hex encoded secret key for the file transfer
 * @param shard
 * @param hash_checksum
 *
 * @returns {PromiseLike<T | void> | Promise<T | void> | *}
 */
function shardDownload(file_transfer_id, file_transfer_secret_key, shard, hash_checksum) {
    registrations["download_step_complete"]("DOWNLOADING_FILE_CHUNK");

    const ticket = {
        hash_checksum: hash_checksum,
    };

    const ticket_enc = cryptoLibrary.encryptData(JSON.stringify(ticket), file_transfer_secret_key);
    let fileserver;
    if (shard["fileserver"].length > 1) {
        // math random should be good enough here, don't use for crypto!
        const pos = Math.floor(Math.random() * shard["fileserver"].length);
        fileserver = shard["fileserver"][pos];
    } else {
        fileserver = shard["fileserver"][0];
    }

    const onError = function (result) {
        console.log(result);
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        return result.data;
    };

    return apiFileserver.download(fileserver["fileserver_url"], file_transfer_id, ticket_enc.text, ticket_enc.nonce).then(onSuccess, onError);
}

/**
 * Downloads a file from a file repository
 *
 * @param {uuid} file_transfer_id The file transfer id
 * @param {string} file_transfer_secret_key The hex encoded secret key for the file transfer
 * @param {string} hash_checksum The hash checksum of the file to download
 *
 * @returns {PromiseLike<T | void> | Promise<T | void> | *}
 */
function fileRepositoryDownload(file_transfer_id, file_transfer_secret_key, hash_checksum) {
    registrations["download_step_complete"]("DOWNLOADING_FILE_CHUNK");

    const onError = function (result) {
        console.log(result);
        return Promise.reject(result.data);
    };

    const onSuccess = function (result) {
        const onError = function (result) {
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
            return Promise.reject("UNKNOW_FILE_REPOSITORY_TYPE");
        }
    };

    return apiClientService.fileRepositoryDownload(file_transfer_id, file_transfer_secret_key, hash_checksum).then(onSuccess, onError);
}

/**
 * Downloads a file from a shard
 *
 * @param {object} file The file config object
 * @param {array|undefined} shards List of shards
 * @param {object|undefined} file_transfer (optional) Already a filetransfer
 *
 * @returns {Promise}
 */
function downloadFileFromShard(file, shards, file_transfer) {
    function downloadFileFromShardHelper(shards) {
        const shards_dict = createShardReadDict(shards);
        const shard_id = file["file_shard_id"];

        if (!shards_dict.hasOwnProperty(shard_id)) {
            return Promise.reject({
                non_field_errors: ["NO_FILESERVER_AVAILABLE"],
            });
        }

        function onSuccess(data) {
            const file_transfer_id = data.file_transfer_id;
            const file_transfer_secret_key = data.file_transfer_secret_key;

            const shard = shards_dict[shard_id];
            let next_chunk_id = 1;
            const allblobs = [];
            const chunk_count = Object.keys(file.file_chunks).length;
            registrations["download_started"](chunk_count * 2);

            function onError(data) {
                return Promise.reject(data);
            }

            function onChunkDownload(data) {
                registrations["download_step_complete"]("DECRYPTING_FILE_CHUNK");

                next_chunk_id = next_chunk_id + 1;
                return cryptoLibrary.decryptFile(new Uint8Array(data), file["file_secret_key"]).then(function (data) {
                    allblobs.push(data);
                    if (next_chunk_id > chunk_count) {
                        const concat = new Blob(allblobs, { type: "application/octet-string" });
                        registrations["download_complete"]();
                        saveAs(concat, file["file_title"]);
                    } else {
                        return shardDownload(file_transfer_id, file_transfer_secret_key, shard, file.file_chunks[next_chunk_id]).then(onChunkDownload, onError);
                    }
                });
            }

            return shardDownload(file_transfer_id, file_transfer_secret_key, shard, file.file_chunks[next_chunk_id]).then(onChunkDownload, onError);
        }

        function onError(data) {
            return Promise.reject(data);
        }

        if (!file_transfer) {
            return readFile(file["file_id"]).then(onSuccess, onError);
        } else {
            return Promise.resolve(onSuccess(file_transfer));
        }
    }

    if (shards === null || typeof shards === "undefined") {
        storage
            .findKey("file-downloads", "shards")
            .then(function (data) {
                console.log(data);
                downloadFileFromShardHelper(data.shards);
            })
            .catch(function (err) {
                console.log(data);
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
 * @param {object|undefined} file_transfer (optional) Already a file transfer
 *
 * @returns {Promise}
 */
function downloadFileFromFileRepository(file, file_transfer) {
    function onSuccess(data) {
        const file_transfer_id = data.file_transfer_id;
        const file_transfer_secret_key = data.file_transfer_secret_key;

        let next_chunk_id = 1;
        const allblobs = [];
        const chunk_count = Object.keys(file.file_chunks).length;

        registrations["download_started"](chunk_count * 2);

        function onError(data) {
            return Promise.reject(data);
        }

        function on_chunk_download(data) {
            registrations["download_step_complete"]("DECRYPTING_FILE_CHUNK");

            next_chunk_id = next_chunk_id + 1;
            return cryptoLibrary.decryptFile(new Uint8Array(data), file["file_secret_key"]).then(function (data) {
                allblobs.push(data);
                if (next_chunk_id > chunk_count) {
                    const concat = new Blob(allblobs, { type: "application/octet-string" });
                    registrations["download_complete"]();
                    saveAs(concat, file["file_title"]);
                } else {
                    return fileRepositoryDownload(file_transfer_id, file_transfer_secret_key, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);
                }
            });
        }

        return fileRepositoryDownload(file_transfer_id, file_transfer_secret_key, file.file_chunks[next_chunk_id]).then(on_chunk_download, onError);
    }
    function onError(data) {
        console.log(data);
        return Promise.reject(data);
    }

    if (!file_transfer) {
        return readFile(file["file_id"]).then(onSuccess, onError);
    } else {
        return Promise.resolve(onSuccess(file_transfer));
    }
}

/**
 * Downloads a file
 *
 * @param {object} file The file config object
 * @param {array} shards An array of shards
 * @param {object|undefined} file_transfer (optional) Already a filetransfer
 *
 * @returns {Promise}
 */
function downloadFile(file, shards, file_transfer) {
    if (!file.hasOwnProperty("file_id") || !file.hasOwnProperty("file_chunks") || !file["file_id"] || Object.keys(file.file_chunks).length === 0) {
        registrations["download_complete"]();
        saveAs(new Blob([""], { type: "text/plain;charset=utf-8" }), file["file_title"]);
        return Promise.resolve();
    }

    if (file.hasOwnProperty("file_shard_id") && file["file_shard_id"]) {
        return downloadFileFromShard(file, shards, file_transfer);
    } else {
        return downloadFileFromFileRepository(file, file_transfer);
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
        console.log(file);
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

const service = {
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
export default service;
