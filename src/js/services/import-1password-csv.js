/**
 * Service which handles the actual parsing of the exported JSON
 */

const Papa = require('papaparse');
import helper from './helper';
import cryptoLibrary from './crypto-library';

var importer_code = '1password_csv';
var importer = {
    name: '1Password (CSV)',
    value: importer_code,
    parser: parser
};

var INDEX_URL = 0;
var INDEX_USERNAME = 1;
var INDEX_PASSWORD = 2;
var INDEX_NOTES = 3;
var INDEX_NAME = 4;
var INDEX_TYPE = 5;


// activate();
//
// function activate() {
//     managerImport.register_importer(importer_code, importer);
// }

/**
 * Takes the first line of the csv and checks the columns and sets the indexes correctly for later field extraction.
 *
 * @param {[]} line First line of the CSV
 *
 * @returns {*} The secrets object
 */
var identify_rows = function(line) {
    for (var i = 0; i < line.length; i++) {
        var column_description = line[i].toLowerCase();
        if (column_description === "notes") {
            INDEX_NOTES = i;
        } else if(column_description === "password") {
            INDEX_PASSWORD = i;
        } else if(column_description === "title") {
            INDEX_NAME = i;
        } else if(column_description === "type") {
            INDEX_TYPE = i;
        } else if(column_description === "url") {
            INDEX_URL = i;
        } else if(column_description === "username") {
            INDEX_USERNAME = i;
        }
    }
};

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
var get_type = function(line) {
    var type = line[INDEX_TYPE].toLowerCase();
    if (type === 'secure note') {
        return 'note'
    }
    if (type === 'identity') {
        // we currently don't have "identities" with address and so on, so we map it to a note
        return 'note';
    }
    if (type === 'password') {
        return 'website_password';
    }
    if (type === 'login') {
        return 'website_password';
    }
    if (type === 'credit card') {
        // we currently don't have "credit cards", so we map it to a note
        return 'note';
    }
    if (type === 'server') {
        return 'application_password';
    }

    return 'note';
};

/**
 * Takes a line that should represent a note and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a note
 *
 * @returns {*} The note secret object
 */
var transfer_into_note = function(line) {

    var note_notes = '';
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
var transfer_into_website_password = function(line) {

    var parsed_url = helper.parseUrl(line[INDEX_URL]);

    return {
        id : cryptoLibrary.generateUuid(),
        type : "website_password",
        name : line[INDEX_NAME],
        "urlfilter" : parsed_url.authority,
        "website_password_url_filter" : parsed_url.authority,
        "website_password_password" : line[INDEX_PASSWORD],
        "website_password_username" : line[INDEX_USERNAME],
        "website_password_notes" : line[INDEX_NOTES],
        "website_password_url" : line[INDEX_URL],
        "website_password_title" : line[INDEX_NAME]
    }
};

/**
 * Takes a line that should represent an application passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a application password
 *
 * @returns {*} The application_password secret object
 */
var transfer_into_application_password = function(line) {

    return {
        id : cryptoLibrary.generateUuid(),
        type : "application_password",
        name : line[INDEX_NAME],
        "application_password_password" : line[INDEX_PASSWORD],
        "application_password_username" : line[INDEX_USERNAME],
        "application_password_notes" : line[INDEX_NOTES],
        "application_password_title" : line[INDEX_NAME]
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
        return transfer_into_note(line);
    } else if (type === 'website_password') {
        return transfer_into_website_password(line);
    } else if (type === 'application_password') {
        return transfer_into_application_password(line);
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

    for (var i = 0; i < csv.length; i++) {
        line = csv[i];

        if (i === 0) {
            identify_rows(line);
            continue;
        }

        if (line.length < 2) {
            continue
        }

        var secret = transform_to_secret(line);

        if (secret === null) {
            //empty line
            continue;
        }
        secrets.push(secret);
        datastore['items'].push(secret);
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
        'items': []
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
