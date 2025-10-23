/**
 * Service to manage the export of datastores
 */
import React from "react";
import datastorePasswordService from "./datastore-password";
import secretService from "./secret";
import importPsonoJson from "./import-psono-json";
import importChromeCsv from "./import-chrome-csv";
import importFirefoxCsvService from "./import-firefox-csv";
import importSafariCsvService from "./import-safari-csv";
import importBitwardenJson from "./import-bitwarden-json";
import importDashlaneCsv from "./import-dashlane-csv";
import importEnpassJson from "./import-enpass-json";
import importKeepassInfoCsv from "./import-keepass-info-csv";
import importKeepassInfoXml from "./import-keepass-info-xml";
import importKeepassxOrgCsv from "./import-keepassx-org-csv";
import importKeepassXCOrgCsv from "./import-keepassxc-org-csv";
import importLastpassComCsv from "./import-lastpass-com-csv";
import importPwsafeOrgCsv from "./import-pwsafe-org-csv";
import importPasswordManagerProXls from "./import-password-pamanager-pro-xls";
import importTeampassNetCsv from "./import-teampass-net-csv";
import importNextcloudCsvService from "./import-nextcloud-csv";
import import1passwordV7CsvService from "./import-1password-v7-csv";
import import1passwordV8CsvService from "./import-1password-v8-csv";
import importProtonPassCsvService from "./import-protonpass-csv";
import importPasswordstateComCsv from "./import-passwordstate-com-csv";
import cryptoLibraryService from "./crypto-library";
import i18n from "../i18n";

const _importer = {
    psono_pw_json: {
        name: "Psono.pw (JSON)",
        value: "psono_pw_json",
        parser: importPsonoJson.parser,
    },
    one_password_v8: {
        name: "1Password v8 (CSV)",
        value: "one_password_v8",
        parser: import1passwordV8CsvService.parser,
    },
    one_password_v7: {
        name: "1Password v7 (CSV)",
        value: "one_password_v7",
        parser: import1passwordV7CsvService.parser,
    },
    chrome_csv: {
        name: "Chrome (CSV)",
        help: function () {
            return (<>{i18n.t("CHROME_EXPORT_OPEN_THE_FOLLOWING_IN_YOUR_ADDRESS_BAR_AND_ACTIVATE_THE_EXPORT_FUNCTION")}
                <pre>chrome://flags/#password-import-export</pre>
                {i18n.t("CHROME_EXPORT_AFTERWARDS_OPEN_THE_FOLLOWING_AND_EXPORT_ALL_PASSWORDS")}
                <pre>chrome://settings/passwords</pre></>)
        },
        value: "chrome_csv",
        parser: importChromeCsv.parser,
    },
    firefox_csv: {
        name: "Firefox (CSV)",
        value: "firefox_csv",
        parser: importFirefoxCsvService.parser,
    },
    protonpass_csv: {
        name: "Proton Pass (CSV)",
        value: "protonpass_csv",
        parser: importProtonPassCsvService.parser,
    },
    safari_csv: {
        name: "Safari (CSV)",
        value: "safari_csv",
        parser: importSafariCsvService.parser,
    },
    bitwarden_json: {
        name: "Bitwarden (JSON, unencrypted)",
        value: "bitwarden_json",
        parser: importBitwardenJson.parser,
    },
    dashlane_csv: {
        name: "Dashlane (CSV)",
        value: "dashlane_csv",
        parser: importDashlaneCsv.parser,
    },
    enpass_json: {
        name: "Enpass (JSON)",
        value: "enpass_json",
        parser: importEnpassJson.parser,
    },
    keepass_info_csv: {
        name: "KeePass.info (CSV)",
        value: "keepass_info_csv",
        parser: importKeepassInfoCsv.parser,
    },
    keepass_info_xml: {
        name: "KeePass.info (XML)",
        value: "keepass_info_xml",
        parser: importKeepassInfoXml.parser,
    },
    keepassx_org_csv: {
        name: "KeePassX.org (CSV)",
        value: "keepassx_org_csv",
        parser: importKeepassxOrgCsv.parser,
    },
    keepassxc_org_csv: {
        name: "KeePassXC.org (CSV)",
        value: "keepassxc_org_csv",
        parser: importKeepassXCOrgCsv.parser,
    },
    lastpass_com_csv: {
        name: "LastPass.com (CSV)",
        value: "lastpass_com_csv",
        parser: importLastpassComCsv.parser,
    },
    password_manager_pro_xls: {
        name: "Password Manager Pro (XLS)",
        value: "password_manager_pro_xls",
        parser: importPasswordManagerProXls.parser,
    },
    pwsafe_org_csv: {
        name: "Password Safe (CSV)",
        value: "pwsafe_org_csv",
        parser: importPwsafeOrgCsv.parser,
    },
    teampass_net_csv: {
        name: "Teampass (CSV)",
        value: "teampass_net_csv",
        parser: importTeampassNetCsv.parser,
    },
    nextcloud_csv: {
        name: "Nextcloud (CSV)",
        help: function () {
            return i18n.t("NEXTCLOUD_EXPORT_EXTRACT_ZIP_AND_UPLOAD_THE_PASSWORD_CSV")
        },
        value: "nextcloud_csv",
        parser: importNextcloudCsvService.parser,
    },
    passwordstate_com_csv: {
        name: "Passwordstate (CSV)",
        value: "passwordstate_com_csv",
        parser: importPasswordstateComCsv.parser,
    },
};
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
 * Searches all possible parsers for the parser of this type
 *
 * @param {string} type The type of the parser
 *
 * @returns {function|null} returns the parser or null
 */
function getParser(type) {
    if (!_importer.hasOwnProperty(type)) {
        return null;
    }

    return _importer[type]["parser"];
}

/**
 * Parse the raw input and returns a data structure with folder and items that we can import
 *
 * @param {string} data The data to parse
 *
 * @returns {*} Returns a tree structure with folders and items
 */
async function parseExport(data) {
    const parse = getParser(data["type"]);
    if (parse === null) {
        return Promise.reject({errors: ["PARSER_NOT_FOUND"]});
    }

    const parsed_data = await parse(data["data"], data["binary"]);
    if (parsed_data === null) {
        return Promise.reject({errors: ["FILE_FORMAT_WRONG"]});
    }

    data["data"] = parsed_data;

    return data;
}

/**
 * gets the datastore and updates it
 *
 * @param {object} parsedData The parsed data object
 *
 * @returns {*} Returns the parsed data on completion
 */
function updateDatastore(parsedData) {
    return datastorePasswordService.getPasswordDatastore().then(function (datastore) {
        if (!datastore.hasOwnProperty("folders")) {
            datastore["folders"] = [];
        }

        datastore["folders"].push(parsedData["data"]["datastore"]);

        datastorePasswordService.handleDatastoreContentChanged(datastore);
        datastorePasswordService.saveDatastoreContent(datastore, [[]]);

        emit("import-complete", {});

        return Promise.resolve(parsedData);
    });
}


/**
 * Initiates the creation of all secrets and links it to the password datastore
 *
 * @param {object} parsedData The parsed data object
 *
 * @returns {*} Returns the parsed data on completion
 */
function createSecrets(parsedData) {
    emit("create-secret-started", {});

    return datastorePasswordService.getPasswordDatastore().then(function (datastore) {
        const objects = parsedData["data"]["secrets"].map(function(poppedSecret) {
            const content = {};
            const linkId = poppedSecret['id'];
            let tags = undefined;
            if (poppedSecret.hasOwnProperty('tags') && poppedSecret['tags'] && poppedSecret['tags'].length > 0) {
                tags = poppedSecret['tags'];
            }
            let customFields = undefined;
            if (poppedSecret.hasOwnProperty('custom_fields') && poppedSecret['custom_fields'] && poppedSecret['custom_fields'].length > 0) {
                customFields = poppedSecret['custom_fields'];
                delete poppedSecret['custom_fields'];
            }
            for (let property in poppedSecret) {
                if (!poppedSecret.hasOwnProperty(property)) {
                    continue;
                }
                if (!property.startsWith(poppedSecret["type"])) {
                    continue;
                }
                content[property] = poppedSecret[property];
                delete poppedSecret[property];
            }
            if (tags) {
                content['tags'] = tags;
            }
            if (customFields) {
                content['custom_fields'] = customFields;
            }
            
            // Calculate password_hash for website_password and application_password types
            if (poppedSecret["type"] === "website_password" && content.hasOwnProperty("website_password_password")) {
                const password = content["website_password_password"];
                if (password) {
                    const passwordSha1 = cryptoLibraryService.sha1(password);
                    poppedSecret["password_hash"] = passwordSha1.substring(0, 5).toLowerCase();
                } else {
                    poppedSecret["password_hash"] = "";
                }
            } else if (poppedSecret["type"] === "application_password" && content.hasOwnProperty("application_password_password")) {
                const password = content["application_password_password"];
                if (password) {
                    const passwordSha1 = cryptoLibraryService.sha1(password);
                    poppedSecret["password_hash"] = passwordSha1.substring(0, 5).toLowerCase();
                } else {
                    poppedSecret["password_hash"] = "";
                }
            }
            
            const myObject = {
                'linkId': linkId,
                'content': content,
                'callbackUrl': undefined,
                'callbackUser': undefined,
                'callbackPass': undefined,
            };
            if (tags) {
                myObject['tags'] = tags;
            }
            return myObject;
        })

        return secretService.createSecretBulk(objects, datastore["datastore_id"], undefined).then(function (dbSecrets) {
            const lookupIndex = {};
            for (var i = 0; i < dbSecrets.length; i++) {
                lookupIndex[dbSecrets[i]['link_id']] = {
                    'secret_id': dbSecrets[i]['secret_id'],
                    'secret_key': dbSecrets[i]['secret_key'],
                }
            }

            parsedData["data"]["secrets"].map(function(poppedSecret) {
                poppedSecret["secret_id"] = lookupIndex[poppedSecret.id]['secret_id'];
                poppedSecret["secret_key"] = lookupIndex[poppedSecret.id]['secret_key'];
            })
            emit("create-secret-complete", {});
            return parsedData;
        }, function (result) {
            return Promise.reject(result)
        });
    });
}

/**
 * Returns a list with all possible importer
 *
 * @returns {[]} List of all possible importer
 */
function getImporter() {
    const importer_array = [];

    for (let parser in _importer) {
        if (!_importer.hasOwnProperty(parser)) {
            continue;
        }
        importer_array.push(_importer[parser]);
    }

    return importer_array;
}

/**
 * Returns the help text for a given importer
 *
 * @param {string} type The type of the import
 *
 * @returns {function} The help text for this importer
 */
function getImporterHelp(type) {
    if (_importer.hasOwnProperty(type) && _importer[type].hasOwnProperty('help')) {
        return _importer[type]['help'];
    }

    return undefined;
}

/**
 * Imports a datastore
 *
 * @param {string} type The type of the import
 * @param {string} data The data as text of the import
 * @param {string} binary The data as binary of the import
 * @param {string} [password] The password to decrypt the datastore
 *
 * @returns {Promise} Returns a promise with the result of the import
 */
function importDatastore(type, data, binary, password) {
    emit("import-started", {});

    if (password) {
        let decryptedJson = ''
        try {
            decryptedJson = JSON.parse(data)
        } catch (e) {
            // datastore was not json encoded and as such cannot be an encrypted Export
        }
        if (decryptedJson && decryptedJson.hasOwnProperty("text") && decryptedJson.hasOwnProperty("nonce")) {
            try{
                data = cryptoLibraryService.decryptSecret(decryptedJson['text'], decryptedJson['nonce'], password, "")
            } catch(e) {
                return Promise.reject({ errors: ["DECRYPTION_OF_EXPORT_FAILED_WRONG_PASSWORD"] })
            }
        }
    }

    return Promise.resolve({ type: type, data: data, binary: binary})
        .then(parseExport)
        .then(createSecrets)
        .then(updateDatastore)
        .then(function () {
            return { msgs: ["IMPORT_SUCCESSFUL"] };
        });
}

const importService = {
    on: on,
    emit: emit,
    getImporter: getImporter,
    getImporterHelp: getImporterHelp,
    importDatastore: importDatastore,
};

export default importService;
