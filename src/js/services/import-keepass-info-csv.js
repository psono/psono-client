/**
 * Service which handles the parsing of the KeePass.info CSV exports
 */
const Papa = require('papaparse');
import cryptoLibrary from './crypto-library';
import helper from './helper';

var importer_code = 'keepass_info_csv';
var importer = {
    name: 'KeePass.info (CSV)',
    value: importer_code,
    parser: parser
};

var INDEX_ACCOUNT = 0;
var INDEX_LOGIN_NAME = 1;
var INDEX_PASSWORD = 2;
var INDEX_WEB_SITE = 3;
var INDEX_COMMENTS = 4;


// activate();
//
// function activate() {
//
//     managerImport.register_importer(importer_code, importer);
// }

/**
 * Takes a line and transforms it into a password entry
 * Honors Keepass escaping of \ and " with backslashes
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
var transform_to_secret = function(line) {

    var parsed_url = helper.parseUrl(line[INDEX_WEB_SITE]);

    return {
        id : cryptoLibrary.generateUuid(),
        type : "website_password",
        name : line[INDEX_ACCOUNT],
        "urlfilter" : parsed_url.authority,
        "website_password_url_filter" : parsed_url.authority,
        "website_password_password" : line[INDEX_PASSWORD].replace(/(?:\\(.))/g, '$1'),
        "website_password_username" : line[INDEX_LOGIN_NAME].replace(/(?:\\(.))/g, '$1'),
        "website_password_notes" : line[INDEX_COMMENTS].replace(/(?:\\(.))/g, '$1'),
        "website_password_url" : line[INDEX_WEB_SITE],
        "website_password_title" : line[INDEX_ACCOUNT].replace(/(?:\\(.))/g, '$1')
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
            continue;
        }
        if (line.length < 5) {
            continue;
        }

        var secret = transform_to_secret(line);
        if (secret === null) {
            //empty line
            continue;
        }
        datastore['items'].push(secret);
        secrets.push(secret);
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
        console.log(data);
        console.log(err);
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