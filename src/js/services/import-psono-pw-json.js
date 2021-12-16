/**
 * Service which handles the actual parsing of the exported JSON
 */
import cryptoLibrary from "./crypto-library";

/**
 * Searches a given folder recursive inclusive all sub-folders and puts them all into the provided secrets array
 *
 * @param {object} folder The folder structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 */
function gather_secrets(folder, secrets) {
    var i;
    var subitem;

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
    try {
        var datastore = JSON.parse(data);
    } catch (err) {
        return null;
    }
    var secrets = [];

    var d = new Date();
    var n = d.toISOString();
    datastore["name"] = "Import " + n;

    gather_secrets(datastore, secrets);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const service = {
    parser,
};

export default service;
