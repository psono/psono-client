/**
 * Service which handles the actual parsing of the exported JSON
 */

import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
const Papa = require("papaparse");

const INDEX_GROUP = 0;
const INDEX_TITLE = 1;
const INDEX_USERNAME = 2;
const INDEX_PASSWORD = 3;
const INDEX_URL = 4;
const INDEX_NOTES = 5;

/**
 * Little helper function that will search a folder recursive for a given path and creates the path if it doesn't
 * yet exist. Once the specified folder has been reached, it will return it.
 *
 * @param {Array} path Array of folder names to search
 * @param {object} folder A folder object that needs to contain the items and folders attribute
 *
 * @returns {*} Returns the specified folder object, containing items and folders
 */
function getFolderHelper(path, folder) {
    let next_folder_name;
    let next_folder;

    if (path.length === 0) {
        return folder;
    }
    next_folder_name = path.shift();

    for (let i = 0; i < folder["folders"].length; i++) {
        if (folder["folders"][i].name === next_folder_name) {
            next_folder = folder["folders"][i];
            break;
        }
    }

    if (typeof next_folder === "undefined") {
        next_folder = {
            id: cryptoLibrary.generateUuid(),
            name: next_folder_name,
            folders: [],
            items: [],
        };
        folder["folders"].push(next_folder);
    }

    return getFolderHelper(path, next_folder);
}

/**
 * Creates the folder if it doesn't exists and returns it.
 *
 * @param {[]} line One line of the CSV import
 * @param {object} datastore The full datastore object
 *
 * @returns {object} Returns the folder
 */
function getFolder(line, datastore) {
    let path = line[INDEX_GROUP].split("/");
    path.shift(); // Drop "Root" element

    return getFolderHelper(path, datastore);
}

/**
 * Takes a line and transforms it into a password entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToSecret(line) {
    const parsed_url = helperService.parseUrl(line[INDEX_URL]);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: line[INDEX_TITLE],
        urlfilter: parsed_url.authority,
        website_password_url_filter: parsed_url.authority,
        website_password_password: line[INDEX_PASSWORD],
        website_password_username: line[INDEX_USERNAME],
        website_password_notes: line[INDEX_NOTES],
        website_password_url: line[INDEX_URL],
        website_password_title: line[INDEX_TITLE],
    };
}

/**
 * Fills the datastore with folders their content and together with the secrets object
 *
 * @param {object} datastore The datastore structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 * @param {[]} csv The array containing all the found secrets
 */
function gather_secrets(datastore, secrets, csv) {
    let line;
    let folder;

    for (let i = 0; i < csv.length; i++) {
        line = csv[i];
        if (i === 0) {
            continue;
        }
        if (line.length < 6) {
            continue;
        }

        folder = getFolder(line, datastore);
        const secret = transformToSecret(line);
        if (secret === null) {
            //empty line
            continue;
        }
        folder["items"].push(secret);
        secrets.push(secret);
    }
}

/**
 * Parse the raw data into an array of arrays
 *
 * @param {string} data The raw data to parse
 * @returns {Array} The array of arrays representing the CSV
 */
function parseCsv(data) {
    const csv = Papa.parse(data);

    if (csv["errors"].length > 0) {
        throw new Error(csv["errors"][0]["message"]);
    }

    return csv["data"];
}

/**
 * The main function of this parser. Will take the content of the JSON export of a psono.pw client and will
 * return the usual output of a parser (or null):
 *     {
 *         datastore: {
 *             name: 'Import TIMESTAMP'
 *         },
 *         secrets: Array
 *     }
 *
 * @param {string} data The JSON export of a psono.pw client
 *
 * @returns {{datastore, secrets: Array} | null}
 */
function parser(data) {
    const d = new Date();
    const n = d.toISOString();

    const secrets = [];
    const datastore = {
        id: cryptoLibrary.generateUuid(),
        name: "Import " + n,
        folders: [],
        items: [],
    };

    let csv;
    try {
        csv = parseCsv(data);
    } catch (err) {
        return null;
    }

    gather_secrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importKeepassxOrgCsvService = {
    parser,
};

export default importKeepassxOrgCsvService;
