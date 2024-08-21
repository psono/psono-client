/**
 * Service which handles the parsing of the pwsafe.org CSV exports
 */
const Papa = require("papaparse");
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";

const INDEX_PROJECT_NAME = 0;
const INDEX_DESCRIPTION = 1;
const INDEX_URL = 2;
const INDEX_USERNAME = 3;
const INDEX_EMAIL = 4;
const INDEX_PASSWORD = 5;
const INDEX_NOTES = 6;
const INDEX_TAGS = 7;
const INDEX_CUSTOM_FIELDS = 8;
const CUSTOM_FIELD_OFFSET = 9;

/**
 * Takes a line and returns the correct description
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The description
 */
function getDescription(line) {
    let description = line[INDEX_DESCRIPTION];
    if (line[INDEX_TAGS]) {
        description = description + " (" + line[INDEX_TAGS] + ")";
    }
    return description;
}

/**
 * Takes a line and returns the correct notes
 *
 * Will first return the specified notes, an email if exists and then all custom fields in "key: value" format
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The description
 */
function getNotes(line) {
    let notes = line[INDEX_NOTES] + "\n";

    if (line[INDEX_EMAIL]) {
        notes = notes + "Email: " + line[INDEX_EMAIL] + "\n";
    }

    if (line[INDEX_CUSTOM_FIELDS]) {
        const custom_fields = line[INDEX_CUSTOM_FIELDS].split(",");
        for (let i = 0; i < custom_fields.length; i++) {
            //checks if the corresponding value is not empty
            if (!line[CUSTOM_FIELD_OFFSET + i]) {
                continue;
            }
            notes = notes + custom_fields[i] + ": " + line[CUSTOM_FIELD_OFFSET + i] + "\n";
        }
    }

    return notes;
}

/**
 * Takes a line and transforms it into a website password entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToWebsitePassword(line) {
    const parsed_url = helperService.parseUrl(line[INDEX_URL]);

    const description = getDescription(line);
    const notes = getNotes(line);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: description,
        description: line[INDEX_USERNAME],
        urlfilter: parsed_url.authority || undefined,
        website_password_url_filter: parsed_url.authority || undefined,
        website_password_password: line[INDEX_PASSWORD],
        website_password_username: line[INDEX_USERNAME],
        website_password_notes: notes,
        website_password_url: line[INDEX_URL],
        website_password_title: description,
    };
}

/**
 * Takes a line and transforms it into a application password entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToApplicationPassword(line) {
    const description = getDescription(line);
    const notes = getNotes(line);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "application_password",
        name: description,
        description: line[INDEX_USERNAME],
        application_password_password: line[INDEX_PASSWORD],
        application_password_username: line[INDEX_USERNAME],
        application_password_notes: notes,
        application_password_title: description,
    };
}

/**
 * Takes a line and transforms it into a bookmark entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToBookmark(line) {
    const parsed_url = helperService.parseUrl(line[INDEX_URL]);

    const description = getDescription(line);
    const notes = getNotes(line);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "bookmark",
        name: description,
        urlfilter: parsed_url.authority || undefined,
        bookmark_url_filter: parsed_url.authority || undefined,
        bookmark_notes: notes,
        bookmark_url: line[INDEX_URL],
        bookmark_title: description,
    };
}

/**
 * Takes a line and transforms it into a note entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToNote(line) {
    const description = getDescription(line);
    const notes = getNotes(line);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "note",
        name: description,
        note_notes: notes,
        note_title: description,
    };
}

/**
 * Analyzes an item and return its types
 *
 * @param {object} line The line to analyze
 */
function detectType(line) {
    const contains_url = line[INDEX_URL];
    const contains_username = line[INDEX_USERNAME];
    const contains_password = line[INDEX_PASSWORD];

    if (contains_url && (contains_username || contains_password)) {
        return "website_password";
    }
    if (contains_url) {
        return "bookmark";
    }
    if (contains_username || contains_password) {
        return "application_password";
    }

    return "note";
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

    next_folder_name = line[INDEX_PROJECT_NAME];

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

        const detected_type = detectType(line);

        let secret = null;
        if (detected_type === "website_password") {
            secret = transformToWebsitePassword(line);
        } else if (detected_type === "application_password") {
            secret = transformToApplicationPassword(line);
        } else if (detected_type === "bookmark") {
            secret = transformToBookmark(line);
        } else {
            secret = transformToNote(line);
        }

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
const importTeampassNetCsvService = {
    parser,
};

export default importTeampassNetCsvService;
