/**
 * Service which handles the actual parsing of the exported JSON
 */

const Papa = require('papaparse');
import helperService from './helper';
import cryptoLibrary from './crypto-library';

let INDEX_LABEL = 0;
let INDEX_USERNAME = 1;
let INDEX_PASSWORD = 2;
let INDEX_NOTES = 3;
let INDEX_URL = 4;
let INDEX_CUSTOM_FIELDS = 5;
let INDEX_FOLDER = 6;
let INDEX_FOLDER_ID = 7;

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

        if (column_description === "label") {
            INDEX_LABEL = i;
        } else if(column_description === "username") {
            INDEX_USERNAME = i;
        } else if(column_description === "password") {
            INDEX_PASSWORD = i;
        } else if(column_description === "notes") {
            INDEX_NOTES = i;
        } else if(column_description === "url") {
            INDEX_URL = i;
        } else if(column_description === "custom fields") {
            INDEX_CUSTOM_FIELDS = i;
        } else if(column_description === "folder") {
            INDEX_FOLDER = i;
        } else if(column_description === "folder id") {
            INDEX_FOLDER_ID = i;
        }
    }
}

/**
 * Returns the type of a line.
 *
 * Known types are:
 *      Secure Note -> note
 *      Identity
 *      Password
 *      Login
 *      Credit Card
 *      Server
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Returns the appropriate type (note or website_password)
 */
function getType(line) {
    if (line[INDEX_USERNAME] || line[INDEX_PASSWORD] || line[INDEX_URL]) {
        return 'website_password'
    }

    return 'note';
}

/**
 * Takes a line that should represent a note and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a note
 *
 * @returns {*} The note secret object
 */
function transferIntoNote(line) {

    let note_notes = '';
    if (line[INDEX_USERNAME]) {
        note_notes = note_notes + line[INDEX_USERNAME] + "\n";
    }
    if (line[INDEX_PASSWORD]) {
        note_notes = note_notes + line[INDEX_PASSWORD] + "\n";
    }
    if (line[INDEX_URL]) {
        note_notes = note_notes + line[INDEX_URL] + "\n";
    }
    if (line[INDEX_NOTES]) {
        note_notes = note_notes + line[INDEX_NOTES] + "\n";
    }
    if (line[INDEX_CUSTOM_FIELDS]) {
        note_notes = note_notes + line[INDEX_CUSTOM_FIELDS] + "\n";
    }

    if (! line[INDEX_LABEL] && ! note_notes) {
        return null
    }

    return {
        id : cryptoLibrary.generateUuid(),
        type : "note",
        name : line[INDEX_LABEL],
        note_title: line[INDEX_LABEL],
        note_notes: note_notes
    }
}

/**
 * Takes a line that should represent a website passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a website password
 *
 * @returns {*} The website_password secret object
 */
function transferIntoWebsitePassword(line) {

    const parsed_url = helperService.parseUrl(line[INDEX_URL]);

    let notes = line[INDEX_NOTES]
    if (line[INDEX_CUSTOM_FIELDS]) {
        notes = notes + line[INDEX_CUSTOM_FIELDS] + "\n";
    }

    return {
        id : cryptoLibrary.generateUuid(),
        type : "website_password",
        name : line[INDEX_LABEL],
        description : line[INDEX_USERNAME],
        "urlfilter" : parsed_url.authority || undefined,
        "website_password_url_filter" : parsed_url.authority || undefined,
        "website_password_password" : line[INDEX_PASSWORD],
        "website_password_username" : line[INDEX_USERNAME],
        "website_password_notes" : notes,
        "website_password_url" : line[INDEX_URL],
        "website_password_title" : line[INDEX_LABEL]
    }
}

/**
 * Creates the folder if it doesn't exists and returns it.
 *
 * @param {[]} line One line of the CSV import
 * @param {object} datastore The full datastore object
 * @param {object} folderIndex Index over the existing folders
 *
 * @returns {object} Returns the folder
 */
function getFolder(line, datastore, folderIndex) {
    const folderName = line[INDEX_FOLDER];
    const folderId = line[INDEX_FOLDER_ID];

    if (folderId === '00000000-0000-0000-0000-000000000000') {
        return datastore;
    }

    if (folderIndex.hasOwnProperty(folderId)) {
        return folderIndex[folderId]
    }
    const newFolder = {
        id: cryptoLibrary.generateUuid(),
        name: folderName,
        folders: [],
        items: [],
    };
    if (!datastore.hasOwnProperty('folders')) {
        datastore["folders"] = [];
    }
    datastore["folders"].push(newFolder);
    folderIndex[folderId] = newFolder;

    return newFolder;
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
    if (type === 'note') {
        return transferIntoNote(line);
    } else if (type === 'website_password') {
        return transferIntoWebsitePassword(line);
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
    let folder;

    const folderIndex = {}

    for (let i = 0; i < csv.length; i++) {
        line = csv[i];

        if (i === 0) {
            identifyRows(line);
            continue;
        }

        if (line.length < 2) {
            continue
        }
        folder = getFolder(line, datastore, folderIndex);

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

    if (csv['errors'].length > 0) {
        throw new Error(csv['errors'][0]['message']);
    }

    return csv['data'];
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
        'id': cryptoLibrary.generateUuid(),
        'name': 'Import ' + n,
        'items': []
    };

    let csv;
    try {
        csv = parseCsv(data);
    } catch(err) {
        return null;
    }

    gatherSecrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets
    }
}

const importNextcloudCsvService = {
    parser,
};

export default importNextcloudCsvService;
