/**
 * Service which handles the actual parsing of the exported JSON
 */
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";

let INDEX_NAME = 0;
let INDEX_USERNAME = 1;
let INDEX_PASSWORD = 2;
let INDEX_DESCRIPTION = 3;
let INDEX_URL = 4;
let INDEX_NOTES = 5;
let INDEX_DEPARTMENT = 6;

/**
 * Takes the first line of the csv and checks the columns and sets the indexes correctly for later field extraction.
 *
 * @param {[]} line First line of the CSV
 *
 * @returns {*} The secrets object
 */
function identifyRows(line) {
    for (let i = 0; i < line.length; i++) {
        const column_description = line[i].toLowerCase();
        if (column_description === "resource name") {
            INDEX_NAME = i;
        } else if(column_description === "user account") {
            INDEX_USERNAME = i;
        } else if(column_description === "password") {
            INDEX_PASSWORD = i;
        } else if(column_description === "description") {
            INDEX_DESCRIPTION = i;
        } else if(column_description === "resource url") {
            INDEX_URL = i;
        } else if(column_description === "notes") {
            INDEX_NOTES = i;
        } else if(column_description === "department") {
            INDEX_DEPARTMENT = i;
        }
    }
}

/**
 * Interprets a line and returns the folder name this entry should late belong to
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} The name of the folder this line belongs into
 */
function getFolderName(line) {
    if (
        line[INDEX_DEPARTMENT] === "" ||
        typeof line[INDEX_DEPARTMENT] === "undefined"
    ) {
        return "Undefined";
    } else {
        return line[INDEX_DEPARTMENT];
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
    if (line[INDEX_PASSWORD]) {
        note_notes = note_notes + line[INDEX_PASSWORD] + "\n";
    }
    if (line[INDEX_DESCRIPTION]) {
        note_notes = note_notes + line[INDEX_DESCRIPTION] + "\n";
    }
    if (line[INDEX_NOTES]) {
        note_notes = note_notes + line[INDEX_NOTES] + "\n";
    }

    if (!note_notes) {
        return null;
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "note",
        name: line[INDEX_NAME],
        note_title: line[INDEX_NAME],
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
    const parsed_url = helperService.parseUrl(line[INDEX_URL]);

    let website_password_notes = "";
    if (line[INDEX_DESCRIPTION]) {
        website_password_notes = website_password_notes + line[INDEX_DESCRIPTION] + "\n";
    }
    if (line[INDEX_NOTES]) {
        website_password_notes = website_password_notes + line[INDEX_NOTES] + "\n";
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: line[INDEX_NAME],
        description: line[INDEX_USERNAME],
        urlfilter: parsed_url.authority || undefined,
        website_password_url_filter: parsed_url.authority || undefined,
        website_password_password: line[INDEX_PASSWORD],
        website_password_username: line[INDEX_USERNAME],
        website_password_notes: website_password_notes,
        website_password_url: line[INDEX_URL],
        website_password_title: line[INDEX_NAME],
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
    const parsed_url = helperService.parseUrl(line[INDEX_URL]);

    let bookmark_notes = "";
    if (line[INDEX_DESCRIPTION]) {
        bookmark_notes = bookmark_notes + line[INDEX_DESCRIPTION] + "\n";
    }
    if (line[INDEX_NOTES]) {
        bookmark_notes = bookmark_notes + line[INDEX_NOTES] + "\n";
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "bookmark",
        name: line[INDEX_NAME],
        urlfilter: parsed_url.authority || undefined,
        bookmark_url_filter: parsed_url.authority || undefined,
        bookmark_notes: bookmark_notes,
        bookmark_url: line[INDEX_URL],
        bookmark_title: line[INDEX_NAME],
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

    let application_password_notes = "";
    if (line[INDEX_DESCRIPTION]) {
        application_password_notes = application_password_notes + line[INDEX_DESCRIPTION] + "\n";
    }
    if (line[INDEX_NOTES]) {
        application_password_notes = application_password_notes + line[INDEX_NOTES] + "\n";
    }
    return {
        id: cryptoLibrary.generateUuid(),
        type: "application_password",
        name: line[INDEX_NAME],
        description: line[INDEX_USERNAME],
        application_password_password: line[INDEX_PASSWORD],
        application_password_username: line[INDEX_USERNAME],
        application_password_notes: application_password_notes,
        application_password_title: line[INDEX_NAME],
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
            identifyRows(line);
            continue;
        }

        folder_name = getFolderName(line);
        const secret = transformToSecret(line);
        if (secret === null) {
            //empty line
            continue;
        }

        if (!folder_index.hasOwnProperty(folder_name)) {
            folder_index[folder_name] = [];
        }
        folder_index[folder_name].push(secret);
        secrets.push(secret);
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
 * @param {ArrayBuffer} data The raw data to parse
 * @returns {Array} The array of arrays representing the CSV
 */
async function parseXls(data) {
    const XLSX = await import('xlsx');

    const workbook = XLSX.read(data, {type: "array"});

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});

    if (jsonData.length > 0) {
        return jsonData
    }

    throw new Error("No data found");
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
 * @param {string} data The file content as text
 * @param {ArrayBuffer} binary The file content as binary
 *
 * @returns {{datastore, secrets: Array} | null}
 */
async function parser(data, binary) {
    const d = new Date();
    const n = d.toISOString();

    const secrets = [];
    const datastore = {
        id: cryptoLibrary.generateUuid(),
        name: "Import " + n,
        folders: [],
    };

    let jsonData;
    try {
        jsonData = await parseXls(binary);
    } catch (err) {
        return null;
    }

    gatherSecrets(datastore, secrets, jsonData);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importLastpassComCsvService = {
    parser,
};

export default importLastpassComCsvService;
