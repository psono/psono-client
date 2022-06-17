/**
 * Service to manage the export of datastores
 */

import datastorePasswordService from "./datastore-password";
import secretService from "./secret";
import importPsonoPwJson from "./import-psono-pw-json";
import importChromeCsv from "./import-chrome-csv";
import importEnpassJson from "./import-enpass-json";
import importKeepassInfoCsv from "./import-keepass-info-csv";
import importKeepassInfoXml from "./import-keepass-info-xml";
import importKeepassxOrgCsv from "./import-keepassx-org-csv";
import importLastpassComCsv from "./import-lastpass-com-csv";
import importPwsafeOrgCsv from "./import-pwsafe-org-csv";
import importTeampassNetCsv from "./import-teampass-net-csv";

const _importer = {
    psono_pw_json: {
        name: "Psono.pw (JSON)",
        value: "psono_pw_json",
        parser: importPsonoPwJson.parser,
    },
    chrome_csv: {
        name: "Chrome (CSV)",
        help:
            "Open the following in your address bar and activate the export function:" +
            "<pre>chrome://flags/#password-import-export</pre>" +
            "Afterwards you can open the following in your address bar and export all passwords as a file:" +
            "<pre>chrome://settings/passwords</pre>" +
            "As a last step upload the file here.",
        value: "chrome_csv",
        parser: importChromeCsv.parser,
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
    lastpass_com_csv: {
        name: "LastPass.com (CSV)",
        value: "lastpass_com_csv",
        parser: importLastpassComCsv.parser,
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
function parseExport(data) {
    const parse = getParser(data["type"]);
    if (parse === null) {
        return Promise.reject({ errors: ["Parser not found."] });
    }

    const parsed_data = parse(data["data"]);
    if (parsed_data === null) {
        return Promise.reject({ errors: ["File format wrong."] });
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
 * creates all the necessary secrets
 *
 * @param {object} parsedData The parsed data object
 * @param {string} datastoreId The ID of the password datastore
 *
 * @returns {*} Returns the parsed data on completion
 */
function createSecret(parsedData, datastoreId) {
    if (parsedData["data"]["secrets"].length < 1) {
        return parsedData;
    }

    const popped_secret = parsedData["data"]["secrets"].pop();

    // now lets construct our new secret
    const secret = {};
    for (let property in popped_secret) {
        if (!popped_secret.hasOwnProperty(property)) {
            continue;
        }
        if (!property.startsWith(popped_secret["type"])) {
            continue;
        }
        secret[property] = popped_secret[property];
        delete popped_secret[property];
    }

    return secretService.createSecret(secret, popped_secret["id"], datastoreId, undefined).then(function (e) {
        popped_secret["secret_id"] = e.secret_id;
        popped_secret["secret_key"] = e.secret_key;

        emit("create-secret-complete", {});
        return createSecret(parsedData, datastoreId);
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
    for (let i = 0; i < parsedData["data"]["secrets"].length; i++) {
        emit("create-secret-started", {});
    }

    return datastorePasswordService.getPasswordDatastore().then(function (datastore) {
        return createSecret(parsedData, datastore["datastore_id"]);
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
 * Imports a datastore
 *
 * @param {string} type The type of the import
 * @param {string} data The data of the import
 *
 * @returns {Promise} Returns a promise with the result of the import
 */
function importDatastore(type, data) {
    emit("import-started", {});

    return Promise.resolve({ type: type, data: data })
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
    importDatastore: importDatastore,
};

export default importService;
