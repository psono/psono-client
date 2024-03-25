/**
 * Checks weather a string is a valid ipv4 address
 *
 * @param {string} address An potential ipv4 address that we want to check as string
 * @returns {boolean} Returns the split up url
 */
function is_ipv4_address(address) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        address
    );
}

// /**
//  * parses an URL and returns an object with all details separated
//  *
//  * @param {url} url The url to be parsed
//  * @returns {SplittedUrl} Returns the split up url
//  */
// function parseUrl(url) {
//     let authority;
//     let splitted_authority;
//     let full_domain;
//     let base_url;
//     let schema;
//     let port = null;
//
//     // According to RFC http://www.ietf.org/rfc/rfc3986.txt Appendix B
//     const pattern = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
//     const matches = url.match(pattern);
//
//     schema = matches[2];
//     base_url = matches[2] + "://";
//
//     if (typeof matches[4] !== "undefined") {
//         base_url = base_url + matches[4];
//         authority = matches[4];
//         splitted_authority = authority.split(":");
//     }
//
//     if (typeof splitted_authority !== "undefined" && splitted_authority.length === 2) {
//         port = splitted_authority[splitted_authority.length - 1];
//     }
//     if (typeof splitted_authority !== "undefined") {
//         full_domain = splitted_authority[0];
//     }
//
//     return {
//         scheme: schema,
//         base_url: base_url,
//         authority: authority,
//         authority_without_www: authority ? authority.replace(/^(www\.)/, ""): authority, //remove leading www.
//         full_domain: full_domain,
//         full_domain_without_www: full_domain ? full_domain.replace(/^(www\.)/, "") : full_domain,
//         port: port,
//         path: matches[5],
//         query: matches[7],
//         fragment: matches[9],
//     };
// }

/**
 * parses an URL and returns an object with all details separated
 *
 * @param {String} url The url to be parsed
 * @returns {SplittedUrl} Returns the split up url
 */
function parseUrl(url) {
    if (!url) {
        return {
            scheme: null,
            authority: null,
            authority_without_www: null,
            base_url: null,
            full_domain: null,
            full_domain_without_www: null,
            port: null,
            path: null,
            query: null,
            fragment: null
        };
    }

    if (!url.includes("://")) {
        // Its supposed to be an url but doesn't include a schema so let's prefix it with http://
        url = 'http://' + url;
    }

    const parsedUrl = new URL(url);

    return {
        scheme: parsedUrl.protocol.slice(0,-1),
        base_url: parsedUrl.protocol + '//' + parsedUrl.host,
        authority: parsedUrl.host,
        authority_without_www: parsedUrl.host ? parsedUrl.host.replace(/^(www\.)/, ""): parsedUrl.host, //remove leading www.
        full_domain: parsedUrl.hostname,
        full_domain_without_www: parsedUrl.hostname ? parsedUrl.hostname.replace(/^(www\.)/, "") : parsedUrl.hostname,
        port: parsedUrl.port || null,
        path: parsedUrl.pathname,
        query: parsedUrl.search || null,
        fragment: parsedUrl.hash ? parsedUrl.hash.substring(1) : null,
    };
}

/**
 * Returns weather we have a valid url or not
 *
 * @param url
 * @returns {boolean}
 */
function isValidUrl(url) {
    try {
        new URL(url);
    } catch (_) {
        return false;
    }
    return true;
}

/**
 * Returns weather we have a valid json or not
 *
 * @param str
 * @returns {boolean}
 */
function isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Returns weather we have a valid email or not. We accept everything that follow x@x.
 *
 * @param email
 * @returns {boolean}
 */
function isValidEmail(email) {
    const splitted = email.split("@");
    if (splitted.length !== 2 || splitted[0].length === 0 || splitted[1].length === 0) {
        return false;
    }

    return true;
}

/**
 * Returns weather we have a valid TOTP code or not. A code needs to be base32 encoded and 10 bytes / 80 bits long.
 *
 * @param b32str
 * @returns {boolean}
 */
function isValidTotpCode(b32str) {
    return true;
    const pattern = new RegExp("^[A-Z2-7=]+$");
    if (b32str.length % 2 !== 0 || !pattern.test(b32str)) {
        return false;
    }
    return true;
}

/**
 * Parses an URL to get the full domain from it.
 * example: https://docs.google.com -> docs.google.com
 *
 * @param {url} url The URL we want to parse
 * @returns {string} The full domain of the url
 */
function getDomainWithoutWww(url) {
    const parsed_url = parseUrl(url);
    return parsed_url.full_domain_without_www;
}

/**
 * Checks if array1 starts with array2
 *
 * @param {array} array1 The array that should contain array2
 * @param {array} array2 The array that should be part of array1
 * @returns {boolean} Returns if array1 starts with array2
 */
function arrayStartsWith(array1, array2) {
    if (!(array1 instanceof Array)) {
        return false;
    }
    if (!(array2 instanceof Array)) {
        return false;
    }

    if (array1.length < array2.length) {
        return false;
    }

    for (let i = 0; i < array1.length; i++) {
        if (i === array2.length) {
            return true;
        }
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            if (!array1[i].equals(array2[i])) {
                return false;
            }
        } else if (array1[i] !== array2[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Creates a list of items that are in a given datastore tree object
 *
 * @param {object} obj The datastore tree object
 * @param {array} list The list object we want to fill
 */
function createList(obj, list) {
    let i;
    for (i = 0; obj.items && i < obj.items.length; i++) {
        list.push(obj.items[i]);
    }
    for (i = 0; obj.folders && i < obj.folders.length; i++) {
        createList(obj.folders[i], list);
    }
}

/**
 * Takes an object and duplicates it
 *
 * @param {*} obj initial object that we want to duplicate
 *
 * @returns {*} Returns a duplicate of object
 */
function duplicateObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks that the username does not start with forbidden chars
 *
 * @param {string} username The username
 * @param {Array} forbidden_chars The forbidden chars
 * @returns {string} The error message, if it matches
 */
function validateUsernameStart(username, forbidden_chars) {
    for (let i = 0; i < forbidden_chars.length; i++) {
        if (username.substring(0, forbidden_chars[i].length) === forbidden_chars[i]) {
            return 'Usernames may not start with "' + forbidden_chars[i] + '"';
        }
    }
}

/**
 * Checks that the username does not end with forbidden chars
 *
 * @param {string} username The username
 * @param {Array} forbidden_chars The forbidden chars
 * @returns {string} The error message, if it matches
 */
function validateUsernameEnd(username, forbidden_chars) {
    for (let i = 0; i < forbidden_chars.length; i++) {
        if (username.substring(username.length - forbidden_chars[i].length) === forbidden_chars[i]) {
            return 'Usernames may not end with "' + forbidden_chars[i] + '"';
        }
    }
}

/**
 * Checks that the username does not contain forbidden chars
 *
 * @param {string} username The username
 * @param {Array} forbidden_chars The forbidden chars
 * @returns {string} The error message, if it matches
 */
function validateUsernameContain(username, forbidden_chars) {
    for (let i = 0; i < forbidden_chars.length; i++) {
        if (username.indexOf(forbidden_chars[i]) !== -1) {
            return 'Usernames may not contain "' + forbidden_chars[i] + '"';
        }
    }
}

/**
 * Checks that the group name does not contain forbidden chars
 *
 * @param {string} group_name The group name
 * @param {Array} forbidden_chars The forbidden chars
 * @returns {string} The error message, if it matches
 */
function validateGroupNameContain(group_name, forbidden_chars) {
    for (let i = 0; i < forbidden_chars.length; i++) {
        if (group_name.indexOf(forbidden_chars[i]) !== -1) {
            return 'Group name may not contain "' + forbidden_chars[i] + '"';
        }
    }
}

/**
 * Forms the full username out of the username (potentially already containing an  @domain part) and a domain
 *
 * @param {string} username The username
 * @param {string} domain The domain part of the username
 * @returns {string} The full username
 */
function formFullUsername(username, domain) {
    if (username.indexOf("@") === -1) {
        return username + "@" + domain;
    } else {
        return username;
    }
}

/**
 * Determines if the username is a valid username (validates only the front part before any @).
 * If not, the function returns an error string
 *
 * @param {string} username A string that could be a valid username
 *
 * @returns {null|string} Returns true or a string with the error
 */
function isValidUsername(username) {
    const res = username.split("@");
    username = res[0];

    const USERNAME_REGEXP = /^[a-z0-9.\-]*$/i;
    let error;
    if (!USERNAME_REGEXP.test(username)) {
        return "USERNAME_VALIDATION_NAME_CONTAINS_INVALID_CHARS";
    }

    if (username.length < 2) {
        return "USERNAME_VALIDATION_NAME_TOO_SHORT";
    }

    error = validateUsernameStart(username, [".", "-"]);
    if (error) {
        return error;
    }

    error = validateUsernameEnd(username, [".", "-"]);
    if (error) {
        return error;
    }

    error = validateUsernameContain(username, ["..", "--", ".-", "-."]);
    if (error) {
        return error;
    }

    return null;
}

/**
 * Determines if the group name is a valid group name. It should not contain "@" and be shorter than 3 chars
 *
 * @param {string} group_name A string that could be a valid group name
 *
 * @returns {boolean|string} Returns true or a string with the error
 */
function isValidGroupName(group_name) {
    let error;

    if (group_name.length < 3) {
        return "GROUP_NAME_TOO_SHORT";
    }

    error = validateGroupNameContain(group_name, ["@"]);
    if (error) {
        return error;
    }

    return true;
}

/**
 * Determines if a string contains a number.
 *
 * @param {string} some_string A string that could be a password
 */
function hasNumber(some_string) {
    return /\d/.test(some_string);
}

/**
 * Determines if a string contains an uppercase letter.
 *
 * @param {string} some_string A string that could be a password
 */
function hasUppercaseLetter(some_string) {
    return /[A-Z]/.test(some_string);
}

/**
 * Determines if a string contains a lowercase letter.
 *
 * @param {string} some_string A string that could be a password
 */
function hasLowercaseLetter(some_string) {
    return /[a-z]/.test(some_string);
}

/**
 * Determines if a string contains a special character.
 *
 * @param {string} some_string A string that could be a password
 */
function hasSpecialCharacter(some_string) {
    return /[ !@#$%^&*§()_+\-=\[\]{};':"\\|,.<>\/?]/.test(some_string);
}

/**
 * Determines if the password is a valid password.
 * If not, the function returns an error string
 *
 * @param {string} password A string that could be a valid password
 * @param {string} password2 The second password that needs to match the first
 * @param {int} min_length The minimum password length
 * @param {int} min_complexity The minimum password complexity (required character groups)
 *
 * @returns {string|null} Returns a string with the error or null
 */
function isValidPassword(password, password2, min_length, min_complexity) {
    if (typeof min_length === "undefined") {
        min_length = 14;
    }
    if (typeof min_complexity === "undefined") {
        min_complexity = 2;
    }

    if (password.length < min_length) {
        return "PASSWORD_TOO_SHORT";
    }

    if (password !== password2) {
        return "PASSWORDS_DONT_MATCH";
    }

    if (min_complexity > 0) {
        let complexity = 0;

        if (hasNumber(password)) {
            complexity = complexity + 1;
        }
        if (hasUppercaseLetter(password)) {
            complexity = complexity + 1;
        }
        if (hasLowercaseLetter(password)) {
            complexity = complexity + 1;
        }
        if (hasSpecialCharacter(password)) {
            complexity = complexity + 1;
        }

        if (complexity < min_complexity) {
            return "PASSWORD_NOT_COMPLEX_ENOUGH";
        }
    }

    return null;
}

/**
 * Splits a string into several chunks
 *
 * @param {string} str The string to split
 * @param {int} len The length of the chunks
 *
 * @returns {Array} Returns the chunks with length "len" as array
 */
function splitStringInChunks(str, len) {
    const size = Math.ceil(str.length / len);
    const chunks = new Array(size);
    let offset = 0;

    for (let i = 0; i < size; ++i, offset += len) {
        chunks[i] = str.substring(offset, offset + len);
    }

    return chunks;
}

/**
 * Search an array for an item
 *
 * @param {Array} array The array to search
 * @param {*} search The item to remove
 * @param {function|undefined} [cmp_fct] (optional) Compare function
 */
function removeFromArray(array, search, cmp_fct) {
    if (!array) {
        return;
    }
    if (typeof cmp_fct === "undefined") {
        cmp_fct = function (a, b) {
            return a === b;
        };
    }
    for (let i = array.length - 1; i >= 0; i--) {
        if (cmp_fct(array[i], search)) {
            array.splice(i, 1);
        }
    }
}

/**
 * Checks if a string ends with a special suffix
 *
 * @param {string} to_test The string to test if it ends with the provided suffix
 * @param {string} suffix The suffix we want the string to end with
 *
 * @returns {boolean} Whether the string ends with the suffix or not
 */
function endsWith(to_test, suffix) {
    return (
        typeof to_test !== "undefined" &&
        typeof suffix !== "undefined" &&
        suffix !== "" &&
        to_test.indexOf(suffix, to_test.length - suffix.length) !== -1
    );
}

/**
 * Checks if a provided urlfilter and authority fit together
 *
 * @param {string} authority The "authority" of the current website, e.g. www.example.com:80
 * @param {string} urlFilter The url filter, e.g. *.example.com or www.example.com
 *
 * @returns {boolean} Whether the string ends with the suffix or not
 */
function isUrlFilterMatch(authority, urlFilter) {
    if (!authority || !urlFilter) {
        return false
    }
    authority = authority.toLowerCase();
    urlFilter = urlFilter.toLowerCase();
    let directMatch = authority === urlFilter;
    let wildcardMatch = urlFilter.startsWith('*.') && authority.endsWith(urlFilter.substring(1));

    return directMatch || wildcardMatch
}

/**
 * Returns a test function that can be used to filter according to the name and urlfilter
 *
 * @param {string} test Testable string
 */
function getPasswordFilter(test) {
    const searchStrings = test.toLowerCase().split(" ");

    function filter(datastore_entry) {
        let containCounter = 0;
        for (let ii = searchStrings.length - 1; ii >= 0; ii--) {
            if (typeof datastore_entry.name === "undefined") {
                continue;
            }
            if (datastore_entry.hasOwnProperty("deleted") && datastore_entry["deleted"]) {
                continue;
            }
            if (
                datastore_entry.hasOwnProperty("name") &&
                datastore_entry["name"] &&
                datastore_entry["name"].toLowerCase().indexOf(searchStrings[ii]) > -1
            ) {
                containCounter++;
            } else if (
                datastore_entry.hasOwnProperty("urlfilter") &&
                datastore_entry["urlfilter"] &&
                datastore_entry["urlfilter"].toLowerCase().indexOf(searchStrings[ii]) > -1
            ) {
                containCounter++;
            } else if (datastore_entry.hasOwnProperty("id") && datastore_entry["id"] === searchStrings[ii]) {
                containCounter++;
            } else if (
                datastore_entry.hasOwnProperty("secret_id") &&
                datastore_entry["secret_id"] === searchStrings[ii]
            ) {
                containCounter++;
            } else if (datastore_entry.hasOwnProperty("file_id") && datastore_entry["file_id"] === searchStrings[ii]) {
                containCounter++;
            } else if (
                datastore_entry.hasOwnProperty("share_id") &&
                datastore_entry["share_id"] === searchStrings[ii]
            ) {
                containCounter++;
            }
        }
        return containCounter === searchStrings.length;
    }

    return filter;
}

const helperService = {
    parseUrl: parseUrl,
    isValidUrl: isValidUrl,
    isValidJson: isValidJson,
    isValidEmail: isValidEmail,
    isValidTotpCode: isValidTotpCode,
    getDomainWithoutWww: getDomainWithoutWww,
    arrayStartsWith: arrayStartsWith,
    createList: createList,
    duplicateObject: duplicateObject,
    formFullUsername: formFullUsername,
    isValidUsername: isValidUsername,
    isValidGroupName: isValidGroupName,
    isValidPassword: isValidPassword,
    splitStringInChunks: splitStringInChunks,
    removeFromArray: removeFromArray,
    endsWith: endsWith,
    getPasswordFilter: getPasswordFilter,
    isUrlFilterMatch: isUrlFilterMatch,
};

export default helperService;
