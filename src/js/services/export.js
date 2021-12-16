/**
 * Service to manage the export of datastores
 */
import datastorePasswordService from "./datastore-password";
import secretService from "./secret";

let timeout = 0;

const _exporter = [];

const registrations = {};

/**
 * used to register functions for specific events
 *
 * @param {string} event The event to subscribe to
 * @param {function} func The callback function to subscribe
 */
function on(event, func) {
    if (!registrations.hasOwnProperty(event)) {
        registrations[event] = [];
    }

    registrations[event].push(func);
}

/**
 * sends an event message to the export service
 *
 * @param {string} event The event to trigger
 * @param {*} data The payload data to send to the subscribed callback functions
 */
function emit(event, data) {
    if (!registrations.hasOwnProperty(event)) {
        return;
    }
    for (let i = registrations[event].length - 1; i >= 0; i--) {
        registrations[event][i](data);
    }
}

/**
 * Handles the download of the actual export.json
 *
 * @param {string} data The data to download
 */
function downloadExport(data) {
    const file_name = "export.json";
    const a = document.createElement("a");
    a.href = "data:attachment/json," + encodeURI(data).replace(/#/g, "%23");
    a.target = "_blank";
    a.download = file_name;
    a.click();
}

/**
 * Filters the datastore export to reduce the size and remove unnecessary elements
 *
 * @param {object} folder The folder to filter
 *
 * @returns {*} filtered folder
 */
function filterDatastoreExport(folder) {
    let i;
    let p;

    const unwanted_folder_properties = [
        "id",
        "datastore_id",
        "parent_datastore_id",
        "share_index",
        "parent_share_id",
        "share_id",
        "path",
        "share_rights",
        "share_secret_key",
    ];

    const unwanted_item_properties = [
        "id",
        "datastore_id",
        "parent_datastore_id",
        "parent_share_id",
        "secret_id",
        "secret_key",
        "share_id",
        "path",
        "share_rights",
        "share_secret_key",
    ];

    // filter out unwanted folder properties
    for (p = 0; p < unwanted_folder_properties.length; p++) {
        if (folder.hasOwnProperty(unwanted_folder_properties[p])) {
            delete folder[unwanted_folder_properties[p]];
        }
    }

    // Delete folder attribute if its empty
    if (folder.hasOwnProperty("items")) {
        if (folder["items"].length === 0) {
            delete folder["items"];
        }
    }

    // filter out unwanted item properties
    if (folder.hasOwnProperty("items")) {
        for (p = 0; p < unwanted_item_properties.length; p++) {
            for (i = folder["items"].length - 1; i >= 0; i--) {
                if (folder["items"][i].hasOwnProperty(unwanted_item_properties[p])) {
                    delete folder["items"][i][unwanted_item_properties[p]];
                }
            }
        }
    }

    // Delete folder attribute if its empty
    if (folder.hasOwnProperty("folders")) {
        if (folder["folders"].length === 0) {
            delete folder["folders"];
        }
    }
    // folder foders recursive
    if (folder.hasOwnProperty("folders")) {
        for (i = folder["folders"].length - 1; i >= 0; i--) {
            folder["folders"][i] = filterDatastoreExport(folder["folders"][i]);
        }
    }

    return folder;
}

/**
 * compose the export structure
 *
 * @param {object} data The datastore data to compose
 * @param {string} type The selected type of the export
 *
 * @returns {*} filtered folder
 */
function composeExport(data, type) {
    if (type === "json") {
        return JSON.stringify(data);
    } else {
        return data;
    }
}

/**
 * Requests all secrets in our datastore and fills the datastore with the content
 *
 * @param {object} datastore The datastore structure with secrets
 *
 * @returns {*} The datastore structure where all secrets have been filled
 */
function getAllSecrets(datastore) {
    let open_secret_requests = 0;

    let resolver;

    const handle_items = function (items) {
        const fill_secret = function (item, secret_id, secret_key) {
            const onSuccess = function (data) {
                for (let property in data) {
                    if (!data.hasOwnProperty(property)) {
                        continue;
                    }
                    item[property] = data[property];
                }

                open_secret_requests = open_secret_requests - 1;
                emit("get-secret-complete", {});
                if (open_secret_requests === 0) {
                    resolver(datastore);
                }
            };

            const onError = function () {
                open_secret_requests = open_secret_requests - 1;
            };

            open_secret_requests = open_secret_requests + 1;
            emit("get-secret-started", {});

            timeout = timeout + 50;
            setTimeout(function () {
                secretService.readSecret(secret_id, secret_key).then(onSuccess, onError);
            }, timeout);
        };
        for (let i = 0; i < items.length; i++) {
            if (items[i].hasOwnProperty("secret_id") && items[i].hasOwnProperty("secret_key")) {
                fill_secret(items[i], items[i]["secret_id"], items[i]["secret_key"]);
            }
        }
    };

    const handle_folders = function (folders) {
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].hasOwnProperty("folders")) {
                handle_folders(folders[i]["folders"]);
            }

            if (folders[i].hasOwnProperty("items")) {
                handle_items(folders[i]["items"]);
            }
        }
    };

    return new Promise(function (resolve, reject) {
        resolver = resolve;
        timeout = 0;

        if (datastore.hasOwnProperty("folders")) {
            handle_folders(datastore["folders"]);
        }

        if (datastore.hasOwnProperty("items")) {
            handle_items(datastore["items"]);
        }

        if (open_secret_requests === 0) {
            resolve(datastore);
        }
    });
}

/**
 * Returns a list with all possible exporter
 *
 * @returns {[]} List with all possible exporters
 */
function getExporter() {
    return _exporter;
}

/**
 * Fetches the datastore with all secrets ready to download or analyze
 *
 * @param {string} type The selected type of the export
 * @param {uuid} id The id of the datastore one wants to download
 *
 * @returns {Promise} Returns a promise with the exportable datastore content
 */
function fetchDatastore(type, id) {
    emit("export-started", {});

    return datastorePasswordService
        .getPasswordDatastore(id)
        .then(getAllSecrets)
        .then(filterDatastoreExport)
        .then(function (data) {
            emit("export-complete", {});
            return composeExport(data, type);
        });
}

/**
 * Returns a copy of the datastore
 *
 * @param {string} type The selected type of the export
 *
 * @returns {Promise} Returns a promise once the export is successful
 */
function exportDatastore(type) {
    return fetchDatastore(type)
        .then(downloadExport)
        .then(function () {
            return { msgs: ["EXPORT_SUCCESSFUL"] };
        });
}

const exportService = {
    on: on,
    emit: emit,
    getExporter: getExporter,
    fetchDatastore: fetchDatastore,
    exportDatastore: exportDatastore,
    getAllSecrets: getAllSecrets,
};

export default exportService;
