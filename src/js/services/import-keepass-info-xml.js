/**
 * Service which handles the parsing of the KeePass.info XML exports
 */
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
const { XMLParser} = require("fast-xml-parser");

function unescapeValue(value) {
    if (typeof value === 'number') {
        value = value.toString();
    }
    value = value.replace(/&lt;/g, "<");
    value = value.replace(/&gt;/g, ">");
    value = value.replace(/&amp;/g, "&");

    return value;
}

/**
 * Takes a line and transforms it into a password entry
 *
 * @param {[]} line One line of the XML
 *
 * @returns {*} The secrets object
 */
function transformToSecret(line) {
    if (!line.hasOwnProperty("String") || !line.String) {
        return null;
    }
    const secret = {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: "",
        urlfilter: "",
        website_password_url_filter: "",
        website_password_password: "",
        website_password_username: "",
        website_password_notes: "",
        website_password_url: "",
        website_password_title: "",
    };
    
    if (line.hasOwnProperty("Tags") && line.Tags) {
        secret["tags"] = line.Tags.split(',');
    }

    for (let i = 0; i < line.String.length; i++) {
        const value = line.String[i];
        if (!value.hasOwnProperty("Key")) {
            continue;
        }
        if (!value.hasOwnProperty("Value")) {
            continue;
        }
        const key = value["Key"];
        const val = unescapeValue(value["Value"]);

        if (key === "Notes") {
            secret["website_password_notes"] = val;
        }

        if (key === "Password") {
            secret["website_password_password"] = val;
        }

        if (key === "Title") {
            secret["name"] = val;
            secret["website_password_title"] = val;
        }

        if (key === "URL") {
            const parsed_url = helperService.parseUrl(val);
            secret["urlfilter"] = parsed_url.authority || "";
            secret["website_password_url_filter"] = parsed_url.authority || "";
            secret["website_password_url"] = val;
        }

        if (key === "UserName") {
            secret["website_password_username"] = val;
            secret["description"] = val;
        }
    }

    return secret;
}

/**
 * Fills the datastore with folders their content and together with the secrets object
 *
 * @param {object} datastore The datastore structure to search recursive
 * @param {[]} secrets The array containing all the found secrets
 * @param {Document} xml The parsed XML document
 */
function gatherSecrets(datastore, secrets, xml) {
    let i;
    let next_folder;
    let entries;
    if (xml.hasOwnProperty("Entry")) {
        if (Object.prototype.toString.call(xml.Entry) === "[object Array]") {
            entries = xml.Entry;
        } else {
            entries = [xml.Entry];
        }

        for (i = 0; i < entries.length; i++) {
            const secret = transformToSecret(entries[i]);
            if (secret === null) {
                //empty line
                continue;
            }
            datastore["items"].push(secret);
            secrets.push(secret);
        }
    }

    if (xml.hasOwnProperty("Group")) {
        if (Object.prototype.toString.call(xml.Group) === "[object Array]") {
            entries = xml.Group;
        } else {
            entries = [xml.Group];
        }

        for (i = 0; i < entries.length; i++) {
            if (!entries[i].hasOwnProperty("Name")) {
                continue;
            }
            next_folder = {
                id: cryptoLibrary.generateUuid(),
                name: entries[i]["Name"],
                folders: [],
                items: [],
            };
            gatherSecrets(next_folder, secrets, entries[i]);
            datastore["folders"].push(next_folder);
        }
    }
}

/**
 * Parse the raw data into an xml Document object
 *
 * Source: https://stackoverflow.com/a/20294226/4582775
 *
 * @param {string} xmlString The raw data to parse
 * @returns {object} The array of arrays representing the XML
 */
function parseXml(xmlString) {
    const parser = new XMLParser();
    const parsedXml = parser.parse(xmlString, { parseNodeValue: false });
    if (
        !parsedXml.hasOwnProperty("KeePassFile") ||
        !parsedXml["KeePassFile"].hasOwnProperty("Root") ||
        !parsedXml["KeePassFile"]["Root"].hasOwnProperty("Group")
    ) {
        throw new Error("Error parsing XML");
    }
    return parsedXml["KeePassFile"]["Root"]["Group"];
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
        id: cryptoLibrary.generateUuid(),
        name: "Import " + n,
        items: [],
        folders: [],
    };

    let xml;
    try {
        xml = parseXml(data);
    } catch (err) {
        return null;
    }

    gatherSecrets(datastore, secrets, xml);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importKeepassInfoXmlService = {
    parser,
};

export default importKeepassInfoXmlService;
