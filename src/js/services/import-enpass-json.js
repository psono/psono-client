/**
 * Service which handles the actual parsing of the exported JSON
 */

import cryptoLibrary from "./crypto-library";

/**
 * Analyzes an item and return its types
 *
 * @param {object} item The item to analyze
 */
function detect_type(item) {
    let contains_url = false;
    let contains_username = false;
    let contains_password = false;

    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "password" && item["fields"][i]["value"] !== "") {
                contains_password = true;
            }
            if (item["fields"][i]["type"] === "url" && item["fields"][i]["value"] !== "") {
                contains_url = true;
            }
            if (item["fields"][i]["type"] === "username" && item["fields"][i]["value"] !== "") {
                contains_username = true;
            }
        }
    }

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
 * Checks whether the provided item contains in addition a totp code
 *
 * @param {object} item The item to analyze
 */
function containsTotp(item) {
    let contains_totp_field = false;
    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "totp" && item["fields"][i]["value"] !== "") {
                contains_totp_field = true;
            }
        }
    }
    return contains_totp_field;
}

/**
 * Takes an item and transforms it into a website password entry
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToWebsitePassword(item) {
    let name = "";
    let urlfilter = "";
    let website_password_url_filter = "";
    let website_password_password = "";
    let website_password_username = "";
    let website_password_notes = "";
    let website_password_url = "";
    let website_password_title = "";

    if (item.hasOwnProperty("title")) {
        name = item["title"];
        if (item.hasOwnProperty("subtitle") && item["subtitle"] !== "") {
            name = name + " " + item["subtitle"];
        }
    }

    if (item.hasOwnProperty("note") && item["note"] !== "") {
        website_password_notes = item["note"] + "\n";
    }

    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "username" && website_password_username === "") {
                website_password_username = item["fields"][i]["value"];
            } else if (item["fields"][i]["type"] === "password" && website_password_password === "") {
                website_password_password = item["fields"][i]["value"];
            } else if (item["fields"][i]["type"] === "url" && website_password_url === "") {
                website_password_url = item["fields"][i]["value"];
            } else if (item["fields"][i]["type"] === "totp") {
                // don't do anything if we find a totp field as those are handled separately
            } else if (item["fields"][i]["value"] !== "") {
                website_password_notes =
                    website_password_notes + item["fields"][i]["label"] + ": " + item["fields"][i]["value"] + "\n";
            }
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: name,
        urlfilter: urlfilter,
        website_password_url_filter: website_password_url_filter,
        website_password_password: website_password_password,
        website_password_username: website_password_username,
        website_password_notes: website_password_notes,
        website_password_url: website_password_url,
        website_password_title: website_password_title,
    };
}

/**
 * Takes an item and transforms it into a application password entry
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToApplicationPassword(item) {
    let name = "";
    let application_password_password = "";
    let application_password_username = "";
    let application_password_notes = "";
    let application_password_title = "";

    if (item.hasOwnProperty("title")) {
        name = item["title"];
        if (item.hasOwnProperty("subtitle") && item["subtitle"] !== "") {
            name = name + " " + item["subtitle"];
        }
    }

    if (item.hasOwnProperty("note") && item["note"] !== "") {
        application_password_notes = item["note"] + "\n";
    }

    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "username" && application_password_username === "") {
                application_password_username = item["fields"][i]["value"];
            } else if (item["fields"][i]["type"] === "password" && application_password_password === "") {
                application_password_password = item["fields"][i]["value"];
            } else if (item["fields"][i]["type"] === "totp") {
                // don't do anything if we find a totp field as those are handled separately
            } else if (item["fields"][i]["value"] !== "") {
                application_password_notes =
                    application_password_notes + item["fields"][i]["label"] + ": " + item["fields"][i]["value"] + "\n";
            }
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "application_password",
        name: name,
        application_password_password: application_password_password,
        application_password_username: application_password_username,
        application_password_notes: application_password_notes,
        application_password_title: application_password_title,
    };
}

/**
 * Takes an item and transforms it into a bookmark entry
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToBookmark(item) {
    let name = "";
    let urlfilter = "";
    let bookmark_url_filter = "";
    let bookmark_notes = "";
    let bookmark_url = "";
    let bookmark_title = "";

    if (item.hasOwnProperty("title")) {
        name = item["title"];
        if (item.hasOwnProperty("subtitle") && item["subtitle"] !== "") {
            name = name + " " + item["subtitle"];
        }
    }

    if (item.hasOwnProperty("note") && item["note"] !== "") {
        bookmark_notes = item["note"] + "\n";
    }

    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "url" && bookmark_url === "") {
                bookmark_url = item["fields"][i]["value"];
            } else if (item["fields"][i]["type"] === "totp") {
                // don't do anything if we find a totp field as those are handled separately
            } else if (item["fields"][i]["value"] !== "") {
                bookmark_notes = bookmark_notes + item["fields"][i]["label"] + ": " + item["fields"][i]["value"] + "\n";
            }
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "bookmark",
        name: name,
        urlfilter: urlfilter,
        bookmark_url_filter: bookmark_url_filter,
        bookmark_notes: bookmark_notes,
        bookmark_url: bookmark_url,
        bookmark_title: bookmark_title,
    };
}

/**
 * Takes an item and transforms it into a note
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToNote(item) {
    let name = "";
    let note_notes = "";
    let note_title = "";

    if (item.hasOwnProperty("title")) {
        name = item["title"];
        if (item.hasOwnProperty("subtitle") && item["subtitle"] !== "") {
            name = name + " " + item["subtitle"];
        }
    }

    if (item.hasOwnProperty("note") && item["note"] !== "") {
        note_notes = item["note"] + "\n";
    }

    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "totp") {
                // don't do anything if we find a totp field as those are handled separately
            } else if (item["fields"][i]["value"] !== "") {
                note_notes = note_notes + item["fields"][i]["label"] + ": " + item["fields"][i]["value"] + "\n";
            }
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "note",
        name: name,
        note_notes: note_notes,
        note_title: note_title,
    };
}

/**
 * Takes an item and transforms it into a note
 *
 * @param {[]} item One item of the json
 *
 * @returns {*} The secrets object
 */
function transformToTotpCode(item) {
    let name = "";
    let totp_notes = "";
    let totp_code = "";
    let totp_title = "";

    if (item.hasOwnProperty("title")) {
        name = item["title"];
        if (item.hasOwnProperty("subtitle") && item["subtitle"] !== "") {
            name = name + " " + item["subtitle"];
        }
    }

    if (item.hasOwnProperty("note") && item["note"] !== "") {
        totp_notes = item["note"] + "\n";
    }

    if (item.hasOwnProperty("fields")) {
        for (let i = 0; i < item["fields"].length; i++) {
            if (item["fields"][i]["type"] === "totp" && totp_code === "") {
                totp_code = item["fields"][i]["value"];
            } else if (item["fields"][i]["value"] !== "") {
                totp_notes = totp_notes + item["fields"][i]["label"] + ": " + item["fields"][i]["value"] + "\n";
            }
        }
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "totp",
        name: name,
        totp_notes: totp_notes,
        totp_code: totp_code,
        totp_title: totp_title,
    };
}

/**
 * Searches a given parsedData recursive and puts them all into the provided secrets array
 *
 * @param {object} datastore The datastore to fill
 * @param {[]} secrets The array containing all the found secrets
 * @param {object} parsedData The objects
 */
function gatherSecrets(datastore, secrets, parsedData) {
    let i;
    const folder_index = {};

    if (parsedData.hasOwnProperty("folders")) {
        for (i = 0; i < parsedData["folders"].length; i++) {
            folder_index[parsedData["folders"][i]["uuid"]] = {
                id: cryptoLibrary.generateUuid(),
                name: parsedData["folders"][i]["title"],
                items: [],
            };
        }
    }

    if (parsedData.hasOwnProperty("items")) {
        for (i = 0; i < parsedData["items"].length; i++) {
            const detected_type = detect_type(parsedData["items"][i]);
            const contains_totp_code = containsTotp(parsedData["items"][i]);

            const crafted_secrets = [];

            if (detected_type === "website_password") {
                crafted_secrets.push(transformToWebsitePassword(parsedData["items"][i]));
            } else if (detected_type === "application_password") {
                crafted_secrets.push(transformToApplicationPassword(parsedData["items"][i]));
            } else if (detected_type === "bookmark") {
                crafted_secrets.push(transformToBookmark(parsedData["items"][i]));
            } else {
                crafted_secrets.push(transformToNote(parsedData["items"][i]));
            }

            if (contains_totp_code) {
                crafted_secrets.push(transformToTotpCode(parsedData["items"][i]));
            }

            let parent_folder = null;
            if (parsedData["items"][i].hasOwnProperty("folders")) {
                for (let ii = 0; ii < parsedData["items"][i]["folders"].length; ii++) {
                    if (folder_index.hasOwnProperty(parsedData["items"][i]["folders"][ii])) {
                        parent_folder = folder_index[parsedData["items"][i]["folders"][ii]];
                    }
                }
            }

            for (let iii = 0; iii < crafted_secrets.length; iii++) {
                if (parent_folder === null) {
                    datastore["items"].push(crafted_secrets[iii]);
                } else {
                    parent_folder["items"].push(crafted_secrets[iii]);
                }
                secrets.push(crafted_secrets[iii]);
            }
        }
    }

    for (let uuid in folder_index) {
        datastore["folders"].push(folder_index[uuid]);
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
    const d = new Date();
    const n = d.toISOString();

    const secrets = [];
    const datastore = {
        id: cryptoLibrary.generateUuid(),
        name: "Import " + n,
        folders: [],
        items: [],
    };

    let parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch (err) {
        return null;
    }

    gatherSecrets(datastore, secrets, parsedData);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importEnpassJsonService = {
    parser,
};

export default importEnpassJsonService;
