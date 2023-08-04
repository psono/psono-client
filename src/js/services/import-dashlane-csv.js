/**
 * Service which handles the actual parsing of the exported JSON
 */
const Papa = require("papaparse");
import cryptoLibrary from "./crypto-library";
import * as OTPAuth from "otpauth";
import helperService from "./helper";

const INDEX_USERNAME = 0;
const INDEX_USERNAME2 = 1;
const INDEX_USERNAME3 = 2;
const INDEX_TITLE = 3;
const INDEX_PASSWORD = 4;
const INDEX_NOTE = 5;
const INDEX_URL = 6;
const INDEX_CATEGORY = 7;
const INDEX_OTP_SECRET = 8;

/**
 * Interprets a line and returns the folder name this entry should late belong to
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} The name of the folder this line belongs into
 */
function getFolderName(line) {
    if (
        line[INDEX_CATEGORY] === "" ||
        typeof line[INDEX_CATEGORY] === "undefined"
    ) {
        return "Undefined";
    } else {
        return line[INDEX_CATEGORY];
    }
}
/**
 * Interprets a line and returns the title
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} The name of the title
 */
function getTitle(line) {
    if (
        line[INDEX_TITLE] === "" ||
        typeof line[INDEX_TITLE] === "undefined"
    ) {
        if (
            line[INDEX_URL] === "" ||
            typeof line[INDEX_URL] === "undefined"
        ) {
            return "Undefined";
        } else {
            return line[INDEX_URL];
        }
    } else {
        return line[INDEX_TITLE];
    }
}

/**
 * Returns the type of a line
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Returns the appropriate type (note or website_password)
 */
function getType(line) {
    const contains_url = line[INDEX_URL];
    const contains_username = line[INDEX_USERNAME] || line[INDEX_USERNAME2] || line[INDEX_USERNAME3];
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
 * Returns the type of a line
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Returns the appropriate type (note or website_password)
 */
function getUrl(line) {
    let url = line[INDEX_URL];
    if (url.includes('://')) {
        return url;
    }
    // if the url doesn't contain :// we assume that its just a domain and prepend https://
    return "https://"+url;
}

/**
 * Takes a line that should represent a note and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a note
 *
 * @returns {*} The note secret object
 */
function transformIntoNote(line) {
    let note_notes = "";
    if (line[INDEX_USERNAME]) {
        note_notes = note_notes + line[INDEX_USERNAME] + "\n";
    }
    if (line[INDEX_USERNAME2]) {
        note_notes = note_notes + line[INDEX_USERNAME2] + "\n";
    }
    if (line[INDEX_USERNAME3]) {
        note_notes = note_notes + line[INDEX_USERNAME3] + "\n";
    }
    if (line[INDEX_PASSWORD]) {
        note_notes = note_notes + line[INDEX_PASSWORD] + "\n";
    }
    if (line[INDEX_NOTE]) {
        note_notes = note_notes + line[INDEX_NOTE] + "\n";
    }
    if (line[INDEX_URL]) {
        note_notes = note_notes + line[INDEX_URL] + "\n";
    }

    if (!note_notes) {
        return null;
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "note",
        name: getTitle(line),
        note_title: getTitle(line),
        note_notes: note_notes,
    };
}

/**
 * Takes a line that should represent a website passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a website password
 *
 * @returns {*} The website_password secret object
 */
function transformIntoWebsitePassword(line) {
    const parsed_url = helperService.parseUrl(getUrl(line));

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: getTitle(line),
        urlfilter: parsed_url.authority,
        website_password_url_filter: parsed_url.authority,
        website_password_password: line[INDEX_PASSWORD],
        website_password_username: line[INDEX_USERNAME2] || line[INDEX_USERNAME] || line[INDEX_USERNAME3],
        website_password_notes: line[INDEX_NOTE],
        website_password_url: getUrl(line),
        website_password_title: getTitle(line),
    };
}

/**
 * Takes a line that should represent a bookmark and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a bookmark
 *
 * @returns {*} The bookmark secret object
 */
function transformIntoBookmark(line) {
    const parsed_url = helperService.parseUrl(getUrl(line));

    return {
        id: cryptoLibrary.generateUuid(),
        type: "bookmark",
        name: getTitle(line),
        urlfilter: parsed_url.authority,
        bookmark_url_filter: parsed_url.authority,
        bookmark_notes: line[INDEX_NOTE],
        bookmark_url: getUrl(line),
        bookmark_title: getTitle(line),
    };
}

/**
 * Takes a line that should represent a application passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a application password
 *
 * @returns {*} The application_password secret object
 */
function transformIntoApplicationPassword(line) {
    return {
        id: cryptoLibrary.generateUuid(),
        type: "application_password",
        name: getTitle(line),
        application_password_password: line[INDEX_PASSWORD],
        application_password_username: line[INDEX_USERNAME2] || line[INDEX_USERNAME] || line[INDEX_USERNAME3],
        application_password_notes: line[INDEX_NOTE],
        application_password_title: getTitle(line),
    };
}

/**
 * Takes a line, checks its type and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToSecret(line) {
    const type = getType(line);
    if (type === "note") {
        return transformIntoNote(line);
    } else if (type === "application_password") {
        return transformIntoApplicationPassword(line);
    } else if (type === "bookmark") {
        return transformIntoBookmark(line);
    } else {
        return transformIntoWebsitePassword(line);
    }
}

/**
 * Takes a line and transforms it into a totp if it contains a totp
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
function transformToTotp(line) {
    let totp_period = 30;
    let totp_algorithm = "SHA1";
    let totp_digits = "6";
    let totp_code = "";

    if (!line[INDEX_OTP_SECRET]) {
        return null;
    }
    try {
        let parsedTotp = OTPAuth.URI.parse(line[INDEX_OTP_SECRET]);
        totp_period = parsedTotp.period;
        totp_algorithm = parsedTotp.algorithm;
        totp_digits = parsedTotp.digits;
        totp_code = parsedTotp.secret.base32;
    } catch (e) {
        return null;
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "totp",
        name: getTitle(line) + ' TOTP',
        totp_notes: line[INDEX_NOTE],
        totp_code: totp_code,
        totp_digits: totp_digits,
        totp_algorithm: totp_algorithm,
        totp_period: totp_period,
        totp_title: getTitle(line) + ' TOTP',
    };
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
    let folder_name;
    const folder_index = {};

    for (let i = 0; i < csv.length; i++) {
        line = csv[i];
        if (i === 0) {
            continue;
        }

        folder_name = getFolderName(line);
        const secret = transformToSecret(line);
        if (secret !== null) {
            if (!folder_index.hasOwnProperty(folder_name)) {
                folder_index[folder_name] = [];
            }
            folder_index[folder_name].push(secret);
            secrets.push(secret);
        }
        const totp = transformToTotp(line);
        if (totp !== null) {
            if (!folder_index.hasOwnProperty(folder_name)) {
                folder_index[folder_name] = [];
            }
            folder_index[folder_name].push(totp);
            secrets.push(totp);
        }
    }

    for (let name in folder_index) {
        datastore["folders"].push({
            id: cryptoLibrary.generateUuid(),
            name: name,
            items: folder_index[name],
        });
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

const importDashlaneCsvService = {
    parser,
};

export default importDashlaneCsvService;
