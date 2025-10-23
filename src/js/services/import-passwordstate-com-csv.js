/**
 * Service which handles the actual parsing of the exported CSV from Passwordstate
 */
const Papa = require("papaparse");
import cryptoLibrary from "./crypto-library";
import * as OTPAuth from "otpauth";
import helperService from "./helper";

// Column indices based on Passwordstate CSV export format
const INDEX_PASSWORD_LIST_ID = 0;
const INDEX_PASSWORD_LIST = 1;
const INDEX_TREE_PATH = 2;
const INDEX_PASSWORD_ID = 3;
const INDEX_TITLE = 4;
const INDEX_DOMAIN_OR_HOST = 5;
const INDEX_USERNAME = 6;
const INDEX_DESCRIPTION = 7;
const INDEX_ACCOUNT_TYPE = 8;
const INDEX_NOTES = 9;
const INDEX_URL = 10;
const INDEX_PASSWORD = 11;
const INDEX_EXPIRY_DATE = 12;
const INDEX_OTP_URI = 13;
const INDEX_LICENCE_KEY = 14;

/**
 * Parses the TreePath and returns an array of folder names
 *
 * @param {string} treePath The tree path like "\System\Folder\Subfolder"
 *
 * @returns {string[]} Array of folder names
 */
function parseTreePath(treePath) {
    if (!treePath || treePath === "") {
        return [];
    }

    // Split by backslash and filter out empty strings
    const parts = treePath.split("\\").filter(part => part.trim() !== "");
    return parts;
}

/**
 * Gets the full folder path as a string for indexing
 *
 * @param {string[]} pathParts Array of folder names
 * @param {string} passwordListName The password list name
 *
 * @returns {string} The full path string for indexing
 */
function getFolderPathKey(pathParts, passwordListName) {
    const fullPath = [...pathParts, passwordListName];
    return fullPath.join("\\");
}

/**
 * Returns the title for an entry
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} The title
 */
function getTitle(line) {
    if (line[INDEX_TITLE] && line[INDEX_TITLE].trim() !== "") {
        return line[INDEX_TITLE];
    }
    if (line[INDEX_URL] && line[INDEX_URL].trim() !== "") {
        return line[INDEX_URL];
    }
    return "Undefined";
}

/**
 * Returns the type of a line
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Returns the appropriate type (note, website_password, application_password, bookmark)
 */
function getType(line) {
    const contains_url = line[INDEX_URL] && line[INDEX_URL].trim() !== "";
    const contains_username = line[INDEX_USERNAME] && line[INDEX_USERNAME].trim() !== "";
    const contains_password = line[INDEX_PASSWORD] && line[INDEX_PASSWORD].trim() !== "";

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
 * Returns the URL with proper protocol
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Returns the URL with protocol
 */
function getUrl(line) {
    let url = line[INDEX_URL];
    if (!url) {
        return "";
    }
    if (url.includes('://')) {
        return url;
    }
    // if the url doesn't contain :// we assume that its just a domain and prepend https://
    return "https://" + url;
}

/**
 * Builds notes content including Description and Licence Key
 *
 * @param {[]} line One line of the CSV import
 *
 * @returns {string} Combined notes content
 */
function buildNotes(line) {
    let notes = "";

    if (line[INDEX_NOTES] && line[INDEX_NOTES].trim() !== "") {
        notes += line[INDEX_NOTES];
    }

    if (line[INDEX_DESCRIPTION] && line[INDEX_DESCRIPTION].trim() !== "") {
        if (notes !== "") {
            notes += "\n\n";
        }
        notes += "Description: " + line[INDEX_DESCRIPTION];
    }

    if (line[INDEX_LICENCE_KEY] && line[INDEX_LICENCE_KEY].trim() !== "") {
        if (notes !== "") {
            notes += "\n\n";
        }
        notes += "License Key: " + line[INDEX_LICENCE_KEY];
    }

    return notes;
}

/**
 * Takes a line that should represent a note and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a note
 *
 * @returns {*} The note secret object
 */
function transformIntoNote(line) {
    let note_notes = buildNotes(line);

    if (line[INDEX_USERNAME] && line[INDEX_USERNAME].trim() !== "") {
        if (note_notes !== "") {
            note_notes += "\n\n";
        }
        note_notes += "Username: " + line[INDEX_USERNAME];
    }

    if (line[INDEX_PASSWORD] && line[INDEX_PASSWORD].trim() !== "") {
        if (note_notes !== "") {
            note_notes += "\n\n";
        }
        note_notes += "Password: " + line[INDEX_PASSWORD];
    }

    if (!note_notes) {
        return null;
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "note",
        name: getTitle(line),
        note_title: getTitle(line),
        note_notes: note_notes,
    };
}

/**
 * Takes a line that should represent a website password and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a website password
 *
 * @returns {*} The website_password secret object
 */
function transformIntoWebsitePassword(line) {
    const url = getUrl(line);
    const parsed_url = helperService.parseUrl(url);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "website_password",
        name: getTitle(line),
        description: line[INDEX_USERNAME] || "",
        urlfilter: parsed_url.authority || undefined,
        website_password_url_filter: parsed_url.authority || undefined,
        website_password_password: line[INDEX_PASSWORD] || "",
        website_password_username: line[INDEX_USERNAME] || "",
        website_password_notes: buildNotes(line),
        website_password_url: url,
        website_password_title: getTitle(line),
    };
}

/**
 * Takes a line that should represent a bookmark and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents a bookmark
 *
 * @returns {*} The bookmark secret object
 */
function transformIntoBookmark(line) {
    const url = getUrl(line);
    const parsed_url = helperService.parseUrl(url);

    return {
        id: cryptoLibrary.generateUuid(),
        type: "bookmark",
        name: getTitle(line),
        urlfilter: parsed_url.authority || undefined,
        bookmark_url_filter: parsed_url.authority || undefined,
        bookmark_notes: buildNotes(line),
        bookmark_url: url,
        bookmark_title: getTitle(line),
    };
}

/**
 * Takes a line that should represent an application password and transforms it into a proper secret object
 *
 * @param {[]} line One line of the CSV that represents an application password
 *
 * @returns {*} The application_password secret object
 */
function transformIntoApplicationPassword(line) {
    return {
        id: cryptoLibrary.generateUuid(),
        type: "application_password",
        name: getTitle(line),
        description: line[INDEX_USERNAME] || "",
        application_password_password: line[INDEX_PASSWORD] || "",
        application_password_username: line[INDEX_USERNAME] || "",
        application_password_notes: buildNotes(line),
        application_password_title: getTitle(line),
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
    if (type === "note") {
        return transformIntoNote(line);
    } else if (type === "application_password") {
        return transformIntoApplicationPassword(line);
    } else if (type === "bookmark") {
        return transformIntoBookmark(line);
    } else {
        return transformIntoWebsitePassword(line);
    }
}

/**
 * Takes a line and transforms it into a TOTP if it contains an OTPUri
 *
 * @param {[]} line One line of the CSV
 *
 * @returns {*} The TOTP secret object or null
 */
function transformToTotp(line) {
    let totp_period = 30;
    let totp_algorithm = "SHA1";
    let totp_digits = "6";
    let totp_code = "";

    if (!line[INDEX_OTP_URI] || line[INDEX_OTP_URI].trim() === "") {
        return null;
    }

    try {
        let parsedTotp = OTPAuth.URI.parse(line[INDEX_OTP_URI]);
        totp_period = parsedTotp.period;
        totp_algorithm = parsedTotp.algorithm;
        totp_digits = parsedTotp.digits;
        totp_code = parsedTotp.secret.base32;
    } catch (e) {
        return null;
    }

    return {
        id: cryptoLibrary.generateUuid(),
        type: "totp",
        name: getTitle(line) + ' TOTP',
        totp_notes: buildNotes(line),
        totp_code: totp_code,
        totp_digits: totp_digits,
        totp_algorithm: totp_algorithm,
        totp_period: totp_period,
        totp_title: getTitle(line) + ' TOTP',
    };
}

/**
 * Checks if a line is valid (has required data)
 *
 * @param {[]} line One line of the CSV import
 * @param {number} lineIndex The index of the line
 *
 * @returns {boolean} True if the line is valid
 */
function isValidLine(line, lineIndex) {
    // Skip header lines
    if (lineIndex === 0) {
        return false;
    }

    // Skip lines that are just headers repeated (check if it's a header row)
    if (line[INDEX_PASSWORD_LIST_ID] === "PasswordListID" ||
        line[INDEX_PASSWORD_LIST_ID] === "") {
        return false;
    }

    // Skip lines that don't have a title, username, password, or URL
    const hasTitle = line[INDEX_TITLE] && line[INDEX_TITLE].trim() !== "";
    const hasUsername = line[INDEX_USERNAME] && line[INDEX_USERNAME].trim() !== "";
    const hasPassword = line[INDEX_PASSWORD] && line[INDEX_PASSWORD].trim() !== "";
    const hasUrl = line[INDEX_URL] && line[INDEX_URL].trim() !== "";
    const hasPasswordList = line[INDEX_PASSWORD_LIST] && line[INDEX_PASSWORD_LIST].trim() !== "";

    return (hasTitle || hasUsername || hasPassword || hasUrl) && hasPasswordList;
}

/**
 * Creates nested folder structure recursively
 *
 * @param {string[]} pathParts Array of folder names to create
 * @param {number} index Current index in pathParts
 * @param {object} folderIndex Index to track created folders
 *
 * @returns {object} The deepest folder in the path
 */
function createNestedFolders(pathParts, index, folderIndex) {
    if (index >= pathParts.length) {
        return null;
    }

    const currentPath = pathParts.slice(0, index + 1).join("\\");
    const folderName = pathParts[index];

    // If this folder doesn't exist, create it
    if (!folderIndex[currentPath]) {
        folderIndex[currentPath] = {
            id: cryptoLibrary.generateUuid(),
            name: folderName,
            folders: [],
            items: []
        };

        // If this is not the root level, add to parent
        if (index > 0) {
            const parentPath = pathParts.slice(0, index).join("\\");
            const parent = folderIndex[parentPath];
            if (parent) {
                parent.folders.push(folderIndex[currentPath]);
            }
        }
    }

    // If there are more levels, create them
    if (index < pathParts.length - 1) {
        return createNestedFolders(pathParts, index + 1, folderIndex);
    }

    return folderIndex[currentPath];
}

/**
 * Fills the datastore with folders their content and together with the secrets object
 *
 * @param {object} datastore The datastore structure to populate
 * @param {[]} secrets The array containing all the found secrets
 * @param {[]} csv The array containing all the CSV lines
 */
function gatherSecrets(datastore, secrets, csv) {
    const folderIndex = {};
    const itemsIndex = {};

    // First pass: collect all items by their folder path
    for (let i = 0; i < csv.length; i++) {
        const line = csv[i];

        if (!isValidLine(line, i)) {
            continue;
        }

        const treePath = parseTreePath(line[INDEX_TREE_PATH]);
        const passwordListName = line[INDEX_PASSWORD_LIST];
        const fullPath = getFolderPathKey(treePath, passwordListName);

        if (!itemsIndex[fullPath]) {
            itemsIndex[fullPath] = {
                treePath: treePath,
                passwordListName: passwordListName,
                items: []
            };
        }

        const secret = transformToSecret(line);
        if (secret !== null) {
            itemsIndex[fullPath].items.push(secret);
            secrets.push(secret);
        }

        const totp = transformToTotp(line);
        if (totp !== null) {
            itemsIndex[fullPath].items.push(totp);
            secrets.push(totp);
        }
    }

    // Second pass: create folder structure
    for (let fullPath in itemsIndex) {
        const data = itemsIndex[fullPath];
        const treePath = data.treePath;
        const passwordListName = data.passwordListName;

        // Create the nested folder structure up to the tree path
        if (treePath.length > 0) {
            createNestedFolders(treePath, 0, folderIndex);
        }

        // Create the password list folder
        const passwordListPath = getFolderPathKey(treePath, passwordListName);
        if (!folderIndex[passwordListPath]) {
            const passwordListFolder = {
                id: cryptoLibrary.generateUuid(),
                name: passwordListName,
                items: data.items
            };

            folderIndex[passwordListPath] = passwordListFolder;

            // Add to parent or root
            if (treePath.length > 0) {
                const parentPath = treePath.join("\\");
                const parent = folderIndex[parentPath];
                if (parent) {
                    if (!parent.folders) {
                        parent.folders = [];
                    }
                    parent.folders.push(passwordListFolder);
                }
            } else {
                // No tree path, add directly to root
                datastore.folders.push(passwordListFolder);
            }
        } else {
            // Folder already exists, just add items
            folderIndex[passwordListPath].items.push(...data.items);
        }
    }

    // Add root level folders to datastore
    for (let path in folderIndex) {
        // Only add top-level folders (those without backslashes)
        if (!path.includes("\\") || path.indexOf("\\") === path.lastIndexOf("\\")) {
            const folder = folderIndex[path];
            // Check if this is a root folder (doesn't have a parent in the structure)
            const isRootFolder = path.split("\\").length === 1;
            if (isRootFolder && !datastore.folders.includes(folder)) {
                datastore.folders.push(folder);
            }
        }
    }
}

/**
 * Parse the raw data into an array of arrays
 *
 * @param {string} data The raw data to parse
 * @returns {Array} The array of arrays representing the CSV
 */
function parseCsv(data) {
    const csv = Papa.parse(data);

    if (csv["errors"].length > 0) {
        throw new Error(csv["errors"][0]["message"]);
    }

    return csv["data"];
}

/**
 * The main function of this parser. Will take the content of the CSV export from Passwordstate and will
 * return the usual output of a parser (or null):
 *     {
 *         datastore: {
 *             name: 'Import TIMESTAMP'
 *         },
 *         secrets: Array
 *     }
 *
 * @param {string} data The CSV export from Passwordstate
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
    };

    let csv;
    try {
        csv = parseCsv(data);
    } catch (err) {
        return null;
    }

    gatherSecrets(datastore, secrets, csv);

    return {
        datastore: datastore,
        secrets: secrets,
    };
}

const importPasswordstateComCsvService = {
    parser,
};

export default importPasswordstateComCsvService;
