/**
 * Service which handles the actual parsing of the exported JSON
 */

const Papa = require("papaparse");
import helperService from "./helper";
import cryptoLibrary from "./crypto-library";

const INDEX_NAME = 0;
const INDEX_URL = 1;
const INDEX_USERNAME = 2;
const INDEX_PASSWORD = 3;

/**
 * Takes a line and transforms it into a password entry
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The secrets object
 */
var transform_to_secret = function (line) {
    var parsed_url = helperService.parseUrl(line[INDEX_URL]);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: line[INDEX_NAME],
        urlfilter: parsed_url.authority,
        website_password_url_filter: parsed_url.authority,
        website_password_password: line[INDEX_PASSWORD],
        website_password_username: line[INDEX_USERNAME],
        website_password_notes: "",
        website_password_url: line[INDEX_URL],
        website_password_title: line[INDEX_NAME],
    };
};

/**
 * Fills the datastore with their content, together with the secrets object
 *
 * @param {object} datastore The datastore structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 * @param {[]} csv The array containing all the found secrets
 */
function gather_secrets(datastore, secrets, csv) {
    var line;
    for (let i = 0; i < csv.length; i++) {
        line = csv[i];
        if (i === 0) {
            continue;
        }
        if (line.length < 4) {
            continue;
        }

        var secret = transform_to_secret(line);
        if (secret === null) {
            //empty line
            continue;
        }
        datastore["items"].push(secret);
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
    var d = new Date();
    var n = d.toISOString();

    var secrets = [];
    var datastore = {
        id: cryptoLibrary.generateUuid(),
        name: "Import " + n,
        folders: [],
        items: [],
    };

    try {
        var csv = parse_csv(data);
    } catch (err) {
        return null;
    }

    gather_secrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const service = {
    parser,
};

export default service;
