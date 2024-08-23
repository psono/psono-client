/**
 * Service which handles the parsing of the pwsafe.org CSV exports
 */
const Papa = require("papaparse");
import cryptoLibrary from "./crypto-library";

const INDEX_ORGANISATION_UNIT = 0;
const INDEX_DESCRIPTION = 1;
const INDEX_USERNAME = 2;
const INDEX_PASSWORD = 3;
const INDEX_INFORMATIONS = 4;

/**
 * Takes a line and transforms it into a password entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToSecret(line) {
    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: line[INDEX_DESCRIPTION],
        description: line[INDEX_USERNAME],
        urlfilter: "",
        website_password_url_filter: "",
        website_password_password: line[INDEX_PASSWORD],
        website_password_username: line[INDEX_USERNAME],
        website_password_notes: line[INDEX_INFORMATIONS],
        website_password_url: "",
        website_password_title: line[INDEX_DESCRIPTION],
    };
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
    let next_folder_name;
    let next_folder;

    next_folder_name = line[INDEX_ORGANISATION_UNIT];

    for (let i = 0; i < datastore["folders"].length; i++) {
        if (datastore["folders"][i].name === next_folder_name) {
            next_folder = datastore["folders"][i];
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
        datastore["folders"].push(next_folder);
    }

    return next_folder;
}

/**
 * Fills the datastore with folders their content and together with the secrets object
 *
 * @param {object} datastore The datastore structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 * @param {[]} csv The array containing all the found secrets
 */
function gatherSecrets(datastore, secrets, csv) {
    let line;
    let folder;

    for (let i = 0; i < csv.length; i++) {
        line = csv[i];
        if (i === 0) {
            continue;
        }
        if (line.length < 5) {
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
        items: [],
        folders: [],
    };

    let csv;
    try {
        csv = parseCsv(data);
    } catch (err) {
        return null;
    }

    gatherSecrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importPwsafeOrgCsvService = {
    parser,
};

export default importPwsafeOrgCsvService;
