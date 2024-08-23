/**
 * Service which handles the actual parsing of the exported JSON
 */
import * as OTPAuth from "otpauth";

const Papa = require('papaparse');
import helperService from './helper';
import cryptoLibrary from './crypto-library';

let INDEX_UUID = 0;
let INDEX_URL = 0;
let INDEX_URLS = 1;
let INDEX_USERNAME = 2;
let INDEX_PASSWORD = 3;
let INDEX_NOTES = 4;
let INDEX_NAME = 5;
let INDEX_TYPE = 6;
let INDEX_SCOPE = 7;
let INDEX_AUTOSUBMIT = 8;
let INDEX_OTHERS = []

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
        } else if(column_description === "urls") {
            INDEX_URLS = i;
        } else if(column_description === "username") {
            INDEX_USERNAME = i;
        } else if(column_description === "scope") {
            INDEX_SCOPE = i;
        } else if(column_description === "uuid") {
            INDEX_UUID = i;
        } else if(column_description === "autosubmit") {
            INDEX_AUTOSUBMIT = i;
        } else {
            INDEX_OTHERS.push(i);
        }
    }
}

function getNoteExtras(line) {

    const totpIndexes = getTotpIndexes(line);

    let extras = ''
    for (let i = 0; i < INDEX_OTHERS.length; i++) {
        if (!line[INDEX_OTHERS[i]]) {
            continue
        }
        if (totpIndexes.includes(INDEX_OTHERS[i])) {
            continue
        }
        extras = extras + "\n" + line[INDEX_OTHERS[i]];
    }
    return extras;
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
    const contains_url = line[INDEX_URL] || line[INDEX_URLS] ;
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
 * Checks whether one of the entries in the element is a totp string.
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
 * @returns {[]} The indexes as list
 */
function getTotpIndexes(line) {
    const indexes = []
    for (let i = 0; i < line.length; i++) {
        if (line[i].startsWith('otpauth://totp/')) {
            indexes.push(i)
        }
    }
    return indexes;
}

/**
 * Checks whether one of the entries in the element is a totp string.
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
 * @returns {boolean} Whether a totp field is present or not
 */
function hasTotp(line) {
    return typeof getTotpIndexes(line).length === 0
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
    if (line[INDEX_NOTES]) {
        note_notes = note_notes + line[INDEX_NOTES] + "\n";
    }

    note_notes = note_notes + getNoteExtras(line);

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
}

/**
 * Takes a line that should represent a bookmark and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a website password
 *
 * @returns {*} The website_password secret object
 */
function transferIntoBookmark(line) {
    const url = line[INDEX_URL] || line[INDEX_URLS];
    const parsed_url = helperService.parseUrl(url);

    return {
        id : cryptoLibrary.generateUuid(),
        type : "bookmark",
        name : line[INDEX_NAME],
        "urlfilter" : parsed_url.authority || undefined,
        "bookmark_url_filter" : parsed_url.authority || undefined,
        "bookmark_notes" : line[INDEX_NOTES] + getNoteExtras(line),
        "bookmark_url" : url,
        "bookmark_title" : line[INDEX_NAME]
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

    const url = line[INDEX_URL] || line[INDEX_URLS];
    const parsed_url = helperService.parseUrl(url);

    const websitePassword = {
        id : cryptoLibrary.generateUuid(),
        type : "website_password",
        name : line[INDEX_NAME],
        "description" : line[INDEX_USERNAME],
        "urlfilter" : parsed_url.authority || undefined,
        "website_password_url_filter" : parsed_url.authority || undefined,
        "website_password_password" : line[INDEX_PASSWORD],
        "website_password_username" : line[INDEX_USERNAME],
        "website_password_notes" : line[INDEX_NOTES] + getNoteExtras(line),
        "website_password_url" : url,
        "website_password_title" : line[INDEX_NAME]
    }

    const totpIndexes = getTotpIndexes(line);
    if (totpIndexes.length !== 0) {
        try {
            let parsedTotp = OTPAuth.URI.parse(line[totpIndexes[0]]);

            websitePassword['website_password_totp_period'] = parsedTotp.period;
            websitePassword['website_password_totp_algorithm'] = parsedTotp.algorithm;
            websitePassword['website_password_totp_digits'] = parsedTotp.digits;
            websitePassword['website_password_totp_code'] = parsedTotp.secret.base32;
        } catch (e) {
            // pass.
        }
    }

    return websitePassword
}

/**
 * Takes a line that should represent an application passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a application password
 *
 * @returns {*} The application_password secret object
 */
function transferIntoApplicationPassword(line) {

    return {
        id : cryptoLibrary.generateUuid(),
        type : "application_password",
        name : line[INDEX_NAME],
        "description" : line[INDEX_USERNAME],
        "application_password_password" : line[INDEX_PASSWORD],
        "application_password_username" : line[INDEX_USERNAME],
        "application_password_notes" : line[INDEX_NOTES] + getNoteExtras(line),
        "application_password_title" : line[INDEX_NAME]
    }
}


/**
 * Takes a line and transforms it into a totp secret
 *
 * @param {[]} line One of the lines
 *
 * @returns {*} The secrets object
 */
function transformToTotpCode(line, index) {
    let name = line[INDEX_NAME] + ' TOTP' + index;
    let totp_notes = line[INDEX_NOTES] + getNoteExtras(line);
    let totp_period = 30;
    let totp_algorithm = "SHA1";
    let totp_digits = "6";
    let totp_code = "";
    let totp_title = line[INDEX_NAME] + ' TOTP' + index;

    try {
        let parsedTotp = OTPAuth.URI.parse(line[index]);
        totp_period = parsedTotp.period;
        totp_algorithm = parsedTotp.algorithm;
        totp_digits = parsedTotp.digits;
        totp_code = parsedTotp.secret.base32;
    } catch (e) {
        // pass.
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "totp",
        name: name,
        totp_notes: totp_notes,
        totp_code: totp_code,
        totp_digits: totp_digits,
        totp_algorithm: totp_algorithm,
        totp_period: totp_period,
        totp_title: totp_title,
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
    if (type === 'note') {
        return transferIntoNote(line);
    } else if (type === 'bookmark') {
        return transferIntoBookmark(line);
    } else if (type === 'website_password') {
        return transferIntoWebsitePassword(line);
    } else if (type === 'application_password') {
        return transferIntoApplicationPassword(line);
    }
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

    for (let i = 0; i < csv.length; i++) {
        line = csv[i];

        if (i === 0) {
            identifyRows(line);
            continue;
        }

        if (line.length < 2) {
            continue
        }

        const secret = transformToSecret(line);

        const totpIndexes = getTotpIndexes(line);
        const start = (getType(line) === 'website_password') ? 1 : 0;

        for (let i = start; i < totpIndexes.length; i++) {
            const totpSecret = transformToTotpCode(line, totpIndexes[i]);
            if (totpSecret !== null) {
                secrets.push(totpSecret);
                datastore['items'].push(totpSecret);
            }
        }

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
        csv = parse_csv(data);
    } catch(err) {
        return null;
    }

    gather_secrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets
    }
}

const import1passwordCsvService = {
    parser,
};

export default import1passwordCsvService;
