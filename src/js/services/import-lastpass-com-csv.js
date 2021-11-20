/**
 * Service which handles the actual parsing of the exported JSON
 */
const Papa = require('papaparse');
import cryptoLibrary from './crypto-library';
import helperService from './helper';

const importer_code = 'lastpass_com_csv';
const importer = {
    name: 'LastPass.com (CSV)',
    value: importer_code,
    parser: parser
};

const INDEX_URL = 0;
const INDEX_USERNAME = 1;
const INDEX_PASSWORD = 2;
const INDEX_EXTRA = 3;
const INDEX_NAME = 4;
const INDEX_GROUPING = 5;
const INDEX_FAV = 6; // not used yet ...


// activate();
//
// function activate() {
//
//     managerImport.register_importer(importer_code, importer);
// }

/**
 * Interprets a line and returns the folder name this entry should late belong to
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} The name of the folder this line belongs into
 */
function get_folder_name(line) {
    if (line[INDEX_GROUPING] === '' ||
        typeof line[INDEX_GROUPING] === 'undefined' ||
        line[INDEX_GROUPING] === '(none)' ||
        line[INDEX_GROUPING] === '(keine)') {

        return "Undefined";
    } else {
        return line[INDEX_GROUPING];
    }
}

/**
 * Returns the type of a line
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Returns the appropriate type (note or website_password)
 */
var get_type = function(line) {
    if (line[INDEX_URL] === 'http://sn') {
        // its a license, so lets return a note as we don't have this object class yet
        return 'note'
    }
    if (line[INDEX_URL].trim() === '') {
        // empty url, should be a note
        return 'note'
    } else {
        // Should have an url, so should be a password
        return 'website_password'
    }
};

/**
 * Takes a line that should represent a note and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a note
 *
 * @returns {*} The note secret object
 */
var transfor_into_note = function(line) {

    var note_notes = '';
    if (line[INDEX_USERNAME]) {
        note_notes = note_notes + line[INDEX_USERNAME] + "\n";
    }
    if (line[INDEX_PASSWORD]) {
        note_notes = note_notes + line[INDEX_PASSWORD] + "\n";
    }
    if (line[INDEX_EXTRA]) {
        note_notes = note_notes + line[INDEX_EXTRA] + "\n";
    }

    if (! line[INDEX_NAME] && ! note_notes) {
        return null
    }

    return {
        id : cryptoLibrary.generateUuid(),
        type : "note",
        name : line[INDEX_NAME],
        note_title: line[INDEX_NAME],
        note_notes: note_notes
    }
};

/**
 * Takes a line that should represent a website passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a website password
 *
 * @returns {*} The website_password secret object
 */
var transfor_into_website_password = function(line) {

    var parsed_url = helperService.parseUrl(line[INDEX_URL]);

    return {
        id : cryptoLibrary.generateUuid(),
        type : "website_password",
        name : line[INDEX_NAME],
        "urlfilter" : parsed_url.authority,
        "website_password_url_filter" : parsed_url.authority,
        "website_password_password" : line[INDEX_PASSWORD],
        "website_password_username" : line[INDEX_USERNAME],
        "website_password_notes" : line[INDEX_EXTRA],
        "website_password_url" : line[INDEX_URL],
        "website_password_title" : line[INDEX_NAME]
    }
};

/**
 * Takes a line, checks its type and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
var transform_to_secret = function(line) {
    var type = get_type(line);
    if (type === 'note') {
        return transfor_into_note(line);
    } else {
        return transfor_into_website_password(line);
    }
};


/**
 * Fills the datastore with folders their content and together with the secrets object
 *
 * @param {object} datastore The datastore structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 * @param {[]} csv The array containing all the found secrets
 */
function gather_secrets(datastore, secrets, csv) {
    var line;
    var folder_name;
    var folder_index = {};

    for (let i = 0; i < csv.length; i++) {
        line = csv[i];
        if (i === 0) {
            continue;
        }

        folder_name = get_folder_name(line);
        var secret = transform_to_secret(line);
        if (secret === null) {
            //empty line
            continue;
        }

        if (! folder_index.hasOwnProperty(folder_name)) {
            folder_index[folder_name] = []
        }
        folder_index[folder_name].push(secret);
        secrets.push(secret);
    }

    for (let name in folder_index) {
        datastore['folders'].push({
            id: cryptoLibrary.generateUuid(),
            name: name,
            items: folder_index[name]
        })
    }
}

/**
 * Parse the raw data into an array of arrays
 *
 * @param {string} data The raw data to parse
 * @returns {Array} The array of arrays representing the CSV
 */
function parse_csv(data) {
    var csv = Papa.parse(data);

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

    var d = new Date();
    var n = d.toISOString();

    var secrets = [];
    var datastore = {
        'id': cryptoLibrary.generateUuid(),
        'name': 'Import ' + n,
        'folders': []
    };

    try {
        var csv = parse_csv(data);
    } catch(err) {
        return null;
    }

    gather_secrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets
    }
}


const service = {
    parser,
};

export default service;
