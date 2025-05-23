/**
 * Service which handles the actual parsing of a proton pass CSV export
 */
import * as OTPAuth from "otpauth";

const Papa = require('papaparse');
import helperService from './helper';
import cryptoLibrary from './crypto-library';

let INDEX_TYPE = 0;
let INDEX_NAME = 1;
let INDEX_URL = 2;
let INDEX_EMAIL = 3;
let INDEX_USERNAME = 4;
let INDEX_PASSWORD = 5;
let INDEX_NOTE = 6;
let INDEX_TOTP = 7;
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
        if (column_description === "note") {
            INDEX_NOTE = i;
        } else if(column_description === "password") {
            INDEX_PASSWORD = i;
        } else if(column_description === "name") {
            INDEX_NAME = i;
        } else if(column_description === "type") {
            INDEX_TYPE = i;
        } else if(column_description === "url") {
            INDEX_URL = i;
        } else if(column_description === "username") {
            INDEX_USERNAME = i;
        } else if(column_description === "email") {
            INDEX_EMAIL = i;
        } else {
            INDEX_OTHERS.push(i);
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

    if (line[INDEX_TYPE] === 'alias') {
        return "note";
    }
    if (line[INDEX_TYPE] === 'note') {
        return "note";
    }
    if (line[INDEX_TYPE] === 'login' && line[INDEX_URL]) {
        return "website_password";
    }
    if (line[INDEX_TYPE] === 'login' && !line[INDEX_URL]) {
        return "application_password";
    }
    if (line[INDEX_TYPE] === 'creditCard') {
        return "credit_card";
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
function transferIntoNote(line) {

    let note_notes = '';
    if (line[INDEX_NOTE]) {
        note_notes = note_notes + line[INDEX_NOTE] + "\n";
    }
    if (line[INDEX_EMAIL]) {
        note_notes = note_notes  + "Email: " + line[INDEX_EMAIL] + "\n";
    }
    if (line[INDEX_USERNAME]) {
        note_notes = note_notes  + "Username: " + line[INDEX_USERNAME] + "\n";
    }
    if (line[INDEX_PASSWORD]) {
        note_notes = note_notes  + "Password: " + line[INDEX_PASSWORD] + "\n";
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
 * Takes a line that should represent a website passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a website password
 *
 * @returns {*} The website_password secret object
 */
function transferIntoWebsitePassword(line) {

    const url = line[INDEX_URL];
    const parsed_url = helperService.parseUrl(url);

    let note = '';
    if (line[INDEX_NOTE]) {
        note = note  + line[INDEX_NOTE] + "\n";
    }
    if (line[INDEX_USERNAME] && line[INDEX_EMAIL]) {
        note = note  + "Email: " + line[INDEX_EMAIL] + "\n";
    }

    const websitePassword = {
        id : cryptoLibrary.generateUuid(),
        type : "website_password",
        name : line[INDEX_NAME],
        "description" : line[INDEX_USERNAME] || line[INDEX_EMAIL],
        "urlfilter" : parsed_url.authority || undefined,
        "website_password_url_filter" : parsed_url.authority || undefined,
        "website_password_password" : line[INDEX_PASSWORD],
        "website_password_username" : line[INDEX_USERNAME] || line[INDEX_EMAIL],
        "website_password_notes" : note,
        "website_password_url" : url,
        "website_password_title" : line[INDEX_NAME]
    }

    if (line[INDEX_TOTP]) {
        try {
            let parsedTotp = OTPAuth.URI.parse(line[INDEX_TOTP]);

            websitePassword['website_password_totp_period'] = parsedTotp.period;
            websitePassword['website_password_totp_algorithm'] = parsedTotp.algorithm;
            websitePassword['website_password_totp_digits'] = parsedTotp.digits;
            websitePassword['website_password_totp_code'] = parsedTotp.secret.base32;
        } catch (e) {
            // pass.
        }
    }

    return websitePassword;
}

/**
 * Takes a line that should represent an application passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a application password
 *
 * @returns {*} The application_password secret object
 */
function transferIntoApplicationPassword(line) {

    let note = '';
    if (line[INDEX_NOTE]) {
        note = note  + line[INDEX_NOTE] + "\n";
    }
    if (line[INDEX_USERNAME] && line[INDEX_EMAIL]) {
        note = note  + "Email: " + line[INDEX_EMAIL] + "\n";
    }

    return {
        id : cryptoLibrary.generateUuid(),
        type : "application_password",
        name : line[INDEX_NAME],
        "description" : line[INDEX_USERNAME] || line[INDEX_EMAIL],
        "application_password_password" : line[INDEX_PASSWORD],
        "application_password_username" : line[INDEX_USERNAME] || line[INDEX_EMAIL],
        "application_password_notes" : note,
        "application_password_title" : line[INDEX_NAME]
    }
}

/**
 * Takes a line that should represent an application passwords and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a application password
 *
 * @returns {*} The application_password secret object
 */
function transferIntoCreditCard(line) {

    let data;
    try {
        data = JSON.parse(line[INDEX_NOTE])
    } catch (err) {
        return null;
    }
    if (!data.hasOwnProperty('cardholderName') ||!data.hasOwnProperty('number') ||!data.hasOwnProperty('verificationNumber') ||!data.hasOwnProperty('expirationDate') ||!data.hasOwnProperty('pin')) {
        return null;
    }

    let note = '';
    if ( !data.hasOwnProperty('note')) {
        note = data['note'] + "\n";
    }

    let expirationDate = '';
    if (data['expirationDate'] && data['expirationDate'].includes('-') && data['expirationDate'].length === 7) {
        const expirationDateParts = data['expirationDate'].split('-');
        expirationDate = expirationDateParts[1] + expirationDateParts[0].slice(2);
    } else {
        note = note + "Expiration date:" + data['expirationDate'] + "\n";
    }

    const creditCardNumber = data['number'].replace(/\s/g,'');

    return {
        id : cryptoLibrary.generateUuid(),
        type : "credit_card",
        name : line[INDEX_NAME],
        "description" : creditCardNumber.replace(/.(?=.{4})/g, 'x'),
        "credit_card_number" : creditCardNumber,
        "credit_card_name" : data['cardholderName'],
        "credit_card_cvc" : data['verificationNumber'],
        "credit_card_valid_through" : expirationDate,
        "credit_card_pin" : data['pin'],
        "credit_card_notes" : note,
        "credit_card_title" : line[INDEX_NAME]
    }
}


/**
 * Takes an item and transforms it into a note
 *
 * @param {[]} line One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToTotpCode(line) {
    let name = line[INDEX_NAME] + ' TOTP';
    let totp_notes = "";
    let totp_period = 30;
    let totp_algorithm = "SHA1";
    let totp_digits = "6";
    let totp_code = "";
    let totp_title = line[INDEX_NAME] + ' TOTP';

    try {
        let parsedTotp = OTPAuth.URI.parse(line[INDEX_TOTP]);
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
    } else if (type === 'website_password') {
        return transferIntoWebsitePassword(line);
    } else if (type === 'application_password') {
        return transferIntoApplicationPassword(line);
    } else if (type === 'credit_card') {
        return transferIntoCreditCard(line);
    }
}

function needsSeparateTotp(line) {
    const type = getType(line);
    const hasTotp = Boolean(line[INDEX_TOTP]);

    return hasTotp && type !== "website_password"
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

        if (needsSeparateTotp(line)) {
            const totpEntry = transformToTotpCode(line);
            if (totpEntry !== null) {
                secrets.push(totpEntry);
                datastore['items'].push(totpEntry);
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

const importProtonPassCsvService = {
    parser,
};

export default importProtonPassCsvService;
