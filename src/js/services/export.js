/**
 * Service to manage the export of datastores
 */
import datastorePasswordService from "./datastore-password";
import secretService from "./secret";
import cryptoLibraryService from "./crypto-library";
import helperService from "./helper";
import converterService from "./converter";
const Papa = require("papaparse");

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
    let href = '';
    if (type === "json") {
        file_name = "export.json";
        data_type = "data:attachment/json,";
        if (isEncrypted) {
            file_name = file_name + '.encrypted'
        }
        href = data_type + encodeURI(data).replace(/#/g, "%23");
    }
    if (type === "csv") {
        file_name = "export.csv";
        data_type = "data:attachment/csv,";
        href = data_type + encodeURI(data).replace(/#/g, "%23");
    }
    if (type === "kdbxv4") {
        file_name = "export.kdbx";
        data_type = "application/octet-stream";
        const blob = new Blob([data], { type: data_type });
        href = URL.createObjectURL(blob);
    }

    const a = document.createElement("a");

    a.href = href

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
 * Converts Psono data structure to kdbx
 *
 * @param {object} passwordData The datastore data to compose
 * @param {string} [password] An optional password
 *
 * @returns {*} filtered folder
 */
async function exportToKdbxv4(passwordData, password) {
    const kdbxweb = await import('kdbxweb');
    const { argon2d, argon2id } = await import('@noble/hashes/argon2');

    kdbxweb.CryptoEngine.setArgon2Impl((password, salt,
                                         memory, iterations, length, parallelism, type, version) => new Promise((resolve, reject) => {
        const fnc = type === 0 ? argon2d : argon2id;
        try {
            const bytes = fnc(
                new Uint8Array(password),
                new Uint8Array(salt),
                {
                    t: iterations,
                    m: memory,
                    p: parallelism,
                    dkLen: length,
                    version,
                },
            );
            resolve(bytes.buffer);
        } catch (error) {
            reject(error);
        }
    }));

    const credentials = new kdbxweb.Credentials(kdbxweb.ProtectedValue.fromString(password));

    const db = kdbxweb.Kdbx.create(credentials);
    //db.setVersion(3);

    const rootGroup = db.getDefaultGroup();
    rootGroup.name = "Exported Passwords";

    function addWebsitePasswordEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.website_password_title || "Unnamed Entry");
        entry.fields.set("URL", item.website_password_url || "");
        entry.fields.set("UserName", item.website_password_username || "");
        entry.fields.set("Password", kdbxweb.ProtectedValue.fromString(item.website_password_password || ""));
        entry.fields.set("Notes", item.website_password_notes || "");

        if (item.website_password_totp_code) {
            const parsedUrl = helperService.parseUrl(item.website_password_url);
            const otp = "otpauth://totp/" +
                parsedUrl["full_domain_without_www"] +
                ":" +
                (item.website_password_username || "") +
                "?secret=" +
                item.website_password_totp_code +
                "&period=" +
                item.website_password_totp_period +
                "&digits=" +
                item.website_password_totp_digits +
                "&algorithm=" +
                item.website_password_totp_algorithm;
            entry.fields.set("otp", kdbxweb.ProtectedValue.fromString(otp));
            if (item.website_password_totp_algorithm === 'SHA1') {
                entry.fields.set("TimeOtp-Algorithm", 'HMAC-SHA-1');
            }
            if (item.website_password_totp_algorithm === 'SHA256') {
                entry.fields.set("TimeOtp-Algorithm", 'HMAC-SHA-256');
            }
            if (item.website_password_totp_algorithm === 'SHA512') {
                entry.fields.set("TimeOtp-Algorithm", 'HMAC-SHA-512');
            }
            entry.fields.set("TimeOtp-Length", item.website_password_totp_digits);
            entry.fields.set("TimeOtp-Period", item.website_password_totp_period);
            entry.fields.set("TimeOtp-Secret-Base32", kdbxweb.ProtectedValue.fromString(item.website_password_totp_code));
        }
    }

    function addTotpEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.totp_title || "Unnamed Entry");
        entry.fields.set("Notes", item.totp_notes || "");

        if (item.totp_code) {
            const otp = "otpauth://totp/" +
                //item.totp_title +
                "?secret=" +
                item.totp_code +
                "&period=" +
                item.totp_period +
                "&digits=" +
                item.totp_digits +
                "&algorithm=" +
                item.totp_algorithm;
            entry.fields.set("otp", kdbxweb.ProtectedValue.fromString(otp));
            if (item.totp_algorithm === 'SHA1') {
                entry.fields.set("TimeOtp-Algorithm", 'HMAC-SHA-1');
            }
            if (item.totp_algorithm === 'SHA256') {
                entry.fields.set("TimeOtp-Algorithm", 'HMAC-SHA-256');
            }
            if (item.totp_algorithm === 'SHA512') {
                entry.fields.set("TimeOtp-Algorithm", 'HMAC-SHA-512');
            }
            entry.fields.set("TimeOtp-Length", item.totp_digits);
            entry.fields.set("TimeOtp-Period", item.totp_period);
            entry.fields.set("TimeOtp-Secret-Base32", kdbxweb.ProtectedValue.fromString(item.totp_code));
        }
    }

    function addApplicationPasswordEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.application_password_title || "Unnamed Entry");
        entry.fields.set("UserName", item.application_password_username || "");
        entry.fields.set("Password", kdbxweb.ProtectedValue.fromString(item.application_password_password || ""));
        entry.fields.set("Notes", item.application_password_notes || "");
    }

    function addBookmarkEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.bookmark_title || "Unnamed Entry");
        entry.fields.set("URL", item.bookmark_url || "");
        entry.fields.set("Notes", item.bookmark_notes || "");
    }

    function addNoteEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.note_title || "Unnamed Entry");
        entry.fields.set("Notes", item.note_notes || "");
    }

    function addCreditCardEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.credit_card_title || "Unnamed Entry");
        entry.fields.set("Number", item.credit_card_number || "");
        entry.fields.set("CVC", item.credit_card_cvc || "");
        entry.fields.set("PIN", item.credit_card_pin || "");
        entry.fields.set("Name", item.credit_card_name || "");
        entry.fields.set("Valid Through", item.credit_card_valid_through || "");
        entry.fields.set("Notes", item.credit_card_notes || "");
    }

    function addMailGPGOwnKeyEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.mail_gpg_own_key_title || "Unnamed Entry");
        entry.fields.set("Name", item.mail_gpg_own_key_name || "");
        entry.fields.set("Email", item.mail_gpg_own_key_email || "");
        entry.fields.set("Public Key", item.mail_gpg_own_key_public || "");
        entry.fields.set("Private Key", item.mail_gpg_own_key_private || "");
    }

    function addSshOwnKeyEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.ssh_own_key_title || "Unnamed Entry");
        entry.fields.set("Public Key", item.ssh_own_key_public || "");
        entry.fields.set("Private Key", item.ssh_own_key_private || "");
        entry.fields.set("Notes", item.ssh_own_key_notes || "");
    }

    function addElsterCertificateEntry(group, item) {
        const entry = db.createEntry(group);
        entry.fields.set("Title", item.elster_certificate_title || "Unnamed Entry");
        entry.fields.set("Password", item.elster_certificate_password || "");
        entry.fields.set("Retrieval Code", item.elster_certificate_retrieval_code || "");
        entry.fields.set("Notes", item.elster_certificate_notes || "");

        entry.binaries.set("elster.pfx", converterService.fromHex(item.elster_certificate_file_content));
    }

    function addEnvironmentvariablesEntry(group, item) {
        const entry = db.createEntry(group);
        if (item.hasOwnProperty('environment_variables_title')) {
            entry.fields.set("Title", item.environment_variables_title || "Unnamed Entry");
        }
        if (item.hasOwnProperty('environment_variables_notes')) {
            entry.fields.set("Notes", item.environment_variables_notes || "");
        }
        if (item.hasOwnProperty('environment_variables_variables')) {
            item.environment_variables_variables.forEach((ev) => {
                entry.fields.set('EV:' + ev.key, ev.value);
            })
        }
    }

    function processItem(group, item) {
        if (item.type === "application_password") {
            addApplicationPasswordEntry(group, item);
        }
        if (item.type === "bookmark") {
            addBookmarkEntry(group, item);
        }
        if (item.type === "credit_card") {
            addCreditCardEntry(group, item);
        }
        if (item.type === "mail_gpg_own_key") {
            addMailGPGOwnKeyEntry(group, item);
        }
        if (item.type === "ssh_own_key") {
            addSshOwnKeyEntry(group, item);
        }
        if (item.type === "elster_certificate") {
            addElsterCertificateEntry(group, item);
        }
        if (item.type === "environment_variables") {
            addEnvironmentvariablesEntry(group, item);
        }
        if (item.type === "totp") {
            addTotpEntry(group, item);
        }
        if (item.type === "website_password") {
            addWebsitePasswordEntry(group, item);
        }
        if (item.type === "note") {
            addNoteEntry(group, item);
        }
    }

    if (passwordData.hasOwnProperty("items")) {
        passwordData.items.forEach(item => {
            processItem(rootGroup, item)
        });
    }

    function processFolders(parentGroup, folders) {
        folders.forEach(folder => {
            const newGroup = db.createGroup(parentGroup, folder.name || "Unnamed Folder");
            if (folder.items) {
                folder.items.forEach(item => {
                    processItem(newGroup, item)
                });
            }
            if (folder.folders) {
                processFolders(newGroup, folder.folders);
            }
        });
    }

    if (passwordData.folders) {
        processFolders(rootGroup, passwordData.folders);
    }

    return await db.save();
}

/**
 * compose the export structure
 *
 * @param {object} data The datastore data to compose
 * @param {string} type The selected type of the export
 * @param {string} [password] An optional password
 *
 * @returns {*} filtered folder
 */
async function composeExport(data, type, password) {
    if (type === "json") {
        return JSON.stringify(data);
    } else if (type === "kdbxv4") {
        return await exportToKdbxv4(data, password);
    } else if (type === "csv") {
        const helperData = [
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
                    helperData.push(data.items[i]);
                }
            }
        }

        csv_helper(data, "\\");
        return Papa.unparse(helperData, {
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
 * @returns {Promise} The datastore structure where all secrets have been filled
 */
async function getAllSecrets(datastore, includeTrashBinItems, includeSharedItems) {

    const secrets = {};

    const handleItems = function (items) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].hasOwnProperty("share_id") && !includeSharedItems) {
                continue
            }
            if (items[i].hasOwnProperty("secret_id") && items[i].hasOwnProperty("secret_key")) {
                if (!includeTrashBinItems && items[i].hasOwnProperty('deleted') && items[i]['deleted']) {
                    continue
                }
                secrets[items[i]["secret_id"]] = items[i]
            }
        }
    };

    const handleFolders = function (folders) {
        for (let i = 0; i < folders.length; i++) {
            if (folders[i].hasOwnProperty("share_id") && !includeSharedItems) {
                continue
            }
            if (folders[i].hasOwnProperty("folders")) {
                handleFolders(folders[i]["folders"]);
            }

            if (folders[i].hasOwnProperty("items")) {
                handleItems(folders[i]["items"]);
            }
        }
    };

    if (datastore.hasOwnProperty("folders")) {
        handleFolders(datastore["folders"]);
    }

    if (datastore.hasOwnProperty("items")) {
        handleItems(datastore["items"]);
    }
    const bulkObjects = Object.keys(secrets).map(secretId => [secretId, secrets[secretId]['secret_key']]);

    const decryptedSecrets = await secretService.readSecretBulk(bulkObjects);

    for (const s of decryptedSecrets) {
        for (let property in s) {
            if (!s.hasOwnProperty(property)) {
                continue;
            }
            secrets[s['id']][property] = s[property];
        }
    }

    return datastore;
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
 * @param {string} [password] An optional password
 *
 * @returns {Promise} Returns a promise with the exportable datastore content
 */
function fetchDatastore(type, id, includeTrashBinItems, includeSharedItems, password) {
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
            return composeExport(data, type, password);
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
    return fetchDatastore(type, undefined, includeTrashBinItems, includeSharedItems, password)
        .then(function (data) {
            if (password && type === 'json') {
                data = JSON.stringify(cryptoLibraryService.encryptSecret(data, password, ""))
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
