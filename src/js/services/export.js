/**
 * Service to manage the export of datastores
 */
import datastorePasswordService from "./datastore-password";
import secretService from "./secret";
import cryptoLibraryService from "./crypto-library";
const Papa = require("papaparse");

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
 * @param {string} type The selected type of the export
 * @param {string} isEncrypted Whether the datastore is encrypted or not
 */
function downloadExport(data, type, isEncrypted) {
    let file_name = "export.json";
    let data_type = "data:attachment/json,";
    if (type === "csv") {
        file_name = "export.csv";
        data_type = "data:attachment/csv,";
    }
    if (isEncrypted) {
        file_name = file_name + '.encrypted'
    }
    const a = document.createElement("a");
    a.href = data_type + encodeURI(data).replace(/#/g, "%23");
    a.target = "_blank";
    a.download = file_name;
    a.click();
}

/**
 * Filters the datastore export to reduce the size and remove unnecessary elements
 *
 * @param {object} folder The folder to filter
 * @param {boolean} includeTrashBinItems Should the items of the trash bin be included in the export
 * @param {boolean} includeSharedItems Should shared items be included in the export
 *
 * @returns {*} filtered folder
 */
function filterDatastoreExport(folder, includeTrashBinItems, includeSharedItems) {
    let i;
    let p;

    const unwanted_folder_properties = [
        "id",
        "datastore_id",
        "is_folder",
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
        "is_folder",
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

    // Delete items that have been marked as deleted if includeTrashBinItems is not set
    if (folder.hasOwnProperty("items")) {
        if (!includeTrashBinItems) {
            for (i = folder["items"].length - 1; i >= 0; i--) {
                if (folder["items"][i].hasOwnProperty("deleted") && folder["items"][i]["deleted"]) {
                    folder["items"].splice(i, 1);
                }
            }
        }
        if (!includeSharedItems) {
            for (i = folder["items"].length - 1; i >= 0; i--) {
                if (folder["items"][i].hasOwnProperty("share_id")) {
                    folder["items"].splice(i, 1);
                }
            }
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

    // Delete folders that have been marked as deleted if includeTrashBinItems is not set
    if (folder.hasOwnProperty("folders")) {
        if (!includeTrashBinItems) {
            for (i = folder["folders"].length - 1; i >= 0; i--) {
                if (folder["folders"][i].hasOwnProperty("deleted") && folder["folders"][i]["deleted"]) {
                    folder["folders"].splice(i, 1);
                }
            }
        }
        if (!includeSharedItems) {
            for (i = folder["folders"].length - 1; i >= 0; i--) {
                if (folder["folders"][i].hasOwnProperty("share_id")) {
                    folder["folders"].splice(i, 1);
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

    // filter folders recursive
    if (folder.hasOwnProperty("folders")) {
        for (i = folder["folders"].length - 1; i >= 0; i--) {
            folder["folders"][i] = filterDatastoreExport(folder["folders"][i], includeTrashBinItems, includeSharedItems);
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
    } else if (type === "csv") {
        var helper_data = [
            {
                path: "path",
                type: "type",
                callback_user: "callback_user",
                callback_url: "callback_url",
                callback_pass: "callback_pass",
                urlfilter: "urlfilter",

                website_password_title: "website_password_title",
                website_password_url: "website_password_url",
                website_password_username: "website_password_username",
                website_password_password: "website_password_password",
                website_password_notes: "website_password_notes",
                website_password_auto_submit: "website_password_auto_submit",
                website_password_url_filter: "website_password_url_filter",
                website_password_totp_period: "website_password_totp_period",
                website_password_totp_algorithm: "website_password_totp_algorithm",
                website_password_totp_digits: "website_password_totp_digits",
                website_password_totp_code: "website_password_totp_code",

                application_password_title: "application_password_title",
                application_password_username: "application_password_username",
                application_password_password: "application_password_password",
                application_password_notes: "application_password_notes",

                passkey_title: "passkey_title",
                passkey_rp_id: "passkey_rp_id",
                passkey_id: "passkey_id",
                passkey_public_key: "passkey_public_key",
                passkey_private_key: "passkey_private_key",
                passkey_user_handle: "passkey_user_handle",
                passkey_algorithm: "passkey_algorithm",
                passkey_auto_submit: "passkey_auto_submit",
                passkey_url_filter: "passkey_url_filter",

                totp_title: "totp_title",
                totp_period: "totp_period",
                totp_algorithm: "totp_algorithm",
                totp_digits: "totp_digits",
                totp_code: "totp_code",

                note_title: "note_title",
                note_notes: "note_notes",

                environment_variables_title: "environment_variables_title",
                environment_variables_variables: "environment_variables_variables",
                environment_variables_notes: "environment_variables_notes",

                ssh_own_key_title: "ssh_own_key_title",
                ssh_own_key_email: "ssh_own_key_email",
                ssh_own_key_name: "ssh_own_key_name",
                ssh_own_key_public: "ssh_own_key_public",
                ssh_own_key_private: "ssh_own_key_private",
                ssh_own_key_notes: "ssh_own_key_notes",

                mail_gpg_own_key_title: "mail_gpg_own_key_title",
                mail_gpg_own_key_email: "mail_gpg_own_key_email",
                mail_gpg_own_key_name: "mail_gpg_own_key_name",
                mail_gpg_own_key_public: "mail_gpg_own_key_public",
                mail_gpg_own_key_private: "mail_gpg_own_key_private",

                credit_card_title: "credit_card_title",
                credit_card_number: "credit_card_number",
                credit_card_name: "credit_card_name",
                credit_card_cvc: "credit_card_cvc",
                credit_card_pin: "credit_card_pin",
                credit_card_valid_through: "credit_card_valid_through",
                credit_card_notes: "credit_card_notes",

                bookmark_title: "bookmark_title",
                bookmark_url: "bookmark_url",
                bookmark_notes: "bookmark_notes",
                bookmark_url_filter: "bookmark_url_filter",

                elster_certificate_title: "elster_certificate_title",
                elster_certificate_file_content: "elster_certificate_file_content",
                elster_certificate_password: "elster_certificate_password",
                elster_certificate_retrieval_code: "elster_certificate_retrieval_code",
                elster_certificate_notes: "elster_certificate_notes",
            },
        ];

        function csv_helper(data, path) {
            var i;
            if (data.hasOwnProperty("folders")) {
                for (i = 0; i < data.folders.length; i++) {
                    csv_helper(data.folders[i], path + data.folders[i].name + "\\");
                }
            }
            if (data.hasOwnProperty("items")) {
                for (i = 0; i < data.items.length; i++) {
                    data.items[i]["path"] = path;
                    if (
                        data.items[i].type === "environment_variables" &&
                        data.items[i].hasOwnProperty("environment_variables_variables")
                    ) {
                        data.items[i]["environment_variables_variables"] = JSON.stringify(
                            data.items[i]["environment_variables_variables"]
                        );
                    }
                    helper_data.push(data.items[i]);
                }
            }
        }
        csv_helper(data, "\\");
        return Papa.unparse(helper_data, {
            header: false,
        });
    } else {
        return data;
    }
}

/**
 * Requests all secrets in our datastore and fills the datastore with the content
 *
 * @param {object} datastore The datastore structure with secrets
 * @param {boolean} includeTrashBinItems Should the items of the trash bin be included in the export
 * @param {boolean} includeSharedItems Should shared items be included in the export
 *
 * @returns {*} The datastore structure where all secrets have been filled
 */
function getAllSecrets(datastore, includeTrashBinItems, includeSharedItems) {
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
            if (items[i].hasOwnProperty("share_id") && !includeSharedItems) {
                continue
            }
            if (items[i].hasOwnProperty("secret_id") && items[i].hasOwnProperty("secret_key")) {
                if (!includeTrashBinItems && items[i].hasOwnProperty('deleted') && items[i]['deleted']) {
                    continue
                }
                fill_secret(items[i], items[i]["secret_id"], items[i]["secret_key"]);
            }
        }
    };

    const handle_folders = function (folders) {
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].hasOwnProperty("share_id") && !includeSharedItems) {
                continue
            }
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
 * @param {boolean} includeTrashBinItems Should the items of the trash bin be included in the export
 * @param {boolean} includeSharedItems Should shared items be included in the export
 *
 * @returns {Promise} Returns a promise with the exportable datastore content
 */
function fetchDatastore(type, id, includeTrashBinItems, includeSharedItems) {
    emit("export-started", {});

    return datastorePasswordService
        .getPasswordDatastore(id)
        .then(function (datastore) {
            return getAllSecrets(datastore, includeTrashBinItems, includeSharedItems);
        })
        .then(function (folder) {
            return filterDatastoreExport(folder, includeTrashBinItems, includeSharedItems);
        })
        .then(function (data) {
            emit("export-complete", {});
            return composeExport(data, type);
        });
}

/**
 * Returns a copy of the datastore
 *
 * @param {string} type The selected type of the export
 * @param {boolean} includeTrashBinItems Should the items of the trash bin be included in the export
 * @param {boolean} includeSharedItems Should shared items be included in the export
 * @param {string} [password] A password which if provided will be used to encrypt the datastore
 *
 * @returns {Promise} Returns a promise once the export is successful
 */
function exportDatastore(type, includeTrashBinItems, includeSharedItems, password) {
    return fetchDatastore(type, undefined, includeTrashBinItems, includeSharedItems)
        .then(async function (data) {
            if (password) {
                data = JSON.stringify(await cryptoLibraryService.encryptSecret(data, password, ""))
            }
            return downloadExport(data, type, !!password);
        })
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
