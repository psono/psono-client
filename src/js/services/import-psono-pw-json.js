/**
 * Service which handles the actual parsing of the exported JSON
 */
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";

/**
 * Searches a given folder recursive inclusive all sub-folders and puts them all into the provided secrets array
 *
 * @param {object} folder The folder structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 */
function gather_secrets(folder, secrets) {
    let i;
    let subitem;

    folder["id"] = cryptoLibrary.generateUuid();

    if (folder.hasOwnProperty("folders")) {
        for (i = 0; i < folder["folders"].length; i++) {
            gather_secrets(folder["folders"][i], secrets);
        }
    }

    if (folder.hasOwnProperty("items")) {
        for (i = 0; i < folder["items"].length; i++) {
            subitem = folder["items"][i];
            subitem["id"] = cryptoLibrary.generateUuid();

            secrets.push(subitem);
        }
    }
}

/**
 * Takes a list of secrets and validates that they are correctly formatted
 *
 * @param {[]} secrets The array containing all the found secrets
 */
function validate_secrets(secrets) {
    let parsedUrl = '';
    for (let i = secrets.length - 1; i >= 0; i--) {
        if (!secrets[i].hasOwnProperty('type')) {
            continue;
        }
        if (secrets[i]['type'] === 'website_password') {
            if (secrets[i].hasOwnProperty('website_password_url') && secrets[i]['website_password_url'] && (!secrets[i].hasOwnProperty('urlfilter') || !secrets[i]['urlfilter'])) {
                parsedUrl = helperService.parseUrl(secrets[i]['website_password_url']);
                secrets[i]['urlfilter'] = parsedUrl.authority || "";
            }
            if (secrets[i].hasOwnProperty('website_password_url') && secrets[i]['website_password_url'] && (!secrets[i].hasOwnProperty('website_password_url_filter') || !secrets[i]['website_password_url_filter'])) {
                parsedUrl = helperService.parseUrl(secrets[i]['website_password_url']);
                secrets[i]['website_password_url_filter'] = parsedUrl.authority || "";
            }
        }
        if (secrets[i]['type'] === 'bookmark') {
            if (secrets[i].hasOwnProperty('bookmark_url') && secrets[i]['bookmark_url'] && (!secrets[i].hasOwnProperty('urlfilter') || !secrets[i]['urlfilter'])) {
                parsedUrl = helperService.parseUrl(secrets[i]['bookmark_url']);
                secrets[i]['urlfilter'] = parsedUrl.authority || "";
            }
            if (secrets[i].hasOwnProperty('bookmark_url') && secrets[i]['bookmark_url'] && (!secrets[i].hasOwnProperty('bookmark_url_filter') || !secrets[i]['bookmark_url_filter'])) {
                parsedUrl = helperService.parseUrl(secrets[i]['bookmark_url']);
                secrets[i]['bookmark_url_filter'] = parsedUrl.authority || "";
            }
        }

    }
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
    let datastore;
    try {
        datastore = JSON.parse(data);
    } catch (err) {
        return null;
    }
    const secrets = [];

    const d = new Date();
    const n = d.toISOString();
    datastore["name"] = "Import " + n;

    gather_secrets(datastore, secrets);
    validate_secrets(secrets);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importPsonoPwJsonService = {
    parser,
};

export default importPsonoPwJsonService;
