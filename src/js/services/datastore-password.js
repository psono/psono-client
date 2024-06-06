/**
 * Service to manage the password datastore
 */

import helperService from "./helper";
import datastoreService from "./datastore";
import secretService from "./secret";
import shareService from "./share";
import shareLinkService from "./share-link";
import cryptoLibrary from "./crypto-library";
import browserClient from "./browser-client";
import i18n from "../i18n";
import { getStore } from "./store";

const registrations = {};
let _shareIndex = {};

const uppercaseMinCount = 1;
const lowercaseMinCount = 1;
const numberMinCount = 1;
const specialMinCount = 1;

/**
 * checks if the given password complies with the minimal complexity
 *
 * @param password
 * @returns {*}
 */
function isStrongEnough(password) {
    if (
        uppercaseMinCount + lowercaseMinCount + numberMinCount + specialMinCount >
        getStore().getState().settingsDatastore.passwordLength
    ) {
        //password can never comply, so we skip check
        return true;
    }

    const {
        passwordLettersUppercase = '',
        passwordLettersLowercase = '',
        passwordNumbers = '',
        passwordSpecialChars = '',
    } = getStore().getState().settingsDatastore;

    const uc = password.match(
        new RegExp("([" + escapeRegExp(passwordLettersUppercase) + "])", "g")
    );
    const lc = password.match(
        new RegExp("([" + escapeRegExp(passwordLettersLowercase) + "])", "g")
    );
    const n = password.match(
        new RegExp("([" + escapeRegExp(passwordNumbers) + "])", "g")
    );
    const sc = password.match(
        new RegExp("([" + escapeRegExp(passwordSpecialChars) + "])", "g")
    );

    const uc_test_result =
        passwordLettersUppercase.length === 0 ||
        (uc && uc.length >= uppercaseMinCount);
    const lc_test_result =
        passwordLettersLowercase.length === 0 ||
        (lc && lc.length >= lowercaseMinCount);
    const n_test_result =
        passwordNumbers.length === 0 || (n && n.length >= numberMinCount);
    const sc_test_result =
        passwordSpecialChars.length === 0 || (sc && sc.length >= specialMinCount);

    return uc_test_result && lc_test_result && n_test_result && sc_test_result;
}

/**
 * escapes regex string
 *
 * @param str
 * @returns {*}
 */
function escapeRegExp(str) {
    // from sindresorhus/escape-string-regexp under MIT License

    if (typeof str !== "string") {
        throw new TypeError("Expected a string");
    }

    return str.replace(new RegExp("[|\\\\{}()[\\]^$+*?.-]", "g"), "\\$&");
}

/**
 * generates a password based on the length requirement and a string with all allowed characters
 *
 * @param {int}  length The length of the password
 * @param {string}  allowedCharacters A string containing all allowed characters
 *
 * @returns {string} Returns the password
 */
function generatePassword(length, allowedCharacters) {
    const allowed_characters_length = allowedCharacters.length;
    let password = "";

    for (let i = 0; i < length; i++) {
        const pos = Math.floor(cryptoLibrary.random() * allowed_characters_length);
        password = password + allowedCharacters.charAt(pos);
    }

    return password;
}

/**
 *
 * Main function to generate a random password based on the specified settings.
 *
 * @param [passwordLength]
 * @param [passwordLettersUppercase]
 * @param [passwordLettersLowercase]
 * @param [passwordNumbers]
 * @param [passwordSpecialChars]
 *
 * @returns {string} Returns the generated random password
 */
function generate(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars) {
    let password = "";

    if (typeof(passwordLength) === "undefined") {
        passwordLength = getStore().getState().settingsDatastore.passwordLength
    }

    if (typeof(passwordLettersUppercase) === "undefined") {
        passwordLettersUppercase = getStore().getState().settingsDatastore.passwordLettersUppercase
    }

    if (typeof(passwordLettersLowercase) === "undefined") {
        passwordLettersLowercase = getStore().getState().settingsDatastore.passwordLettersLowercase
    }

    if (typeof(passwordNumbers) === "undefined") {
        passwordNumbers = getStore().getState().settingsDatastore.passwordNumbers
    }

    if (typeof(passwordSpecialChars) === "undefined") {
        passwordSpecialChars = getStore().getState().settingsDatastore.passwordSpecialChars
    }

    while (!isStrongEnough(password)) {
        password = generatePassword(
            passwordLength,
            passwordLettersUppercase +
            passwordLettersLowercase +
            passwordNumbers +
            passwordSpecialChars
        );
    }
    return password;
}

/**
 * Sets the parent for folders and items, based on the obj and obj parents.
 * Calls recursive itself for all folders and skips nested shares
 *
 * @param {TreeObject} obj The tree object to update
 * @param {uuid} parentShareId The id of the parent share
 * @param {uuid} parentDatastoreId The id of the parent datastore
 */
function updateParents(obj, parentShareId, parentDatastoreId) {
    let n;

    let new_parent_share_id = parentShareId;
    let new_parent_datastore_id = parentDatastoreId;

    if (obj.hasOwnProperty("datastore_id")) {
        obj["parent_share_id"] = undefined;
        obj["parent_datastore_id"] = undefined;
        new_parent_share_id = undefined;
        new_parent_datastore_id = obj.datastore_id;
    } else if (obj.hasOwnProperty("share_id")) {
        obj["parent_share_id"] = parentShareId;
        obj["parent_datastore_id"] = parentDatastoreId;
        new_parent_share_id = obj.share_id;
        new_parent_datastore_id = undefined;
    }

    // check all folders recursive
    if (obj.hasOwnProperty("folders")) {
        for (n = 0; n < obj.folders.length; n++) {
            obj.folders[n]["parent_share_id"] = new_parent_share_id;
            obj.folders[n]["parent_datastore_id"] = new_parent_datastore_id;

            // lets not go inside of a new share, and dont touch the parents there
            if (obj.folders[n].hasOwnProperty("share_id")) {
                continue;
            }
            updateParents(obj.folders[n], new_parent_share_id, new_parent_datastore_id);
        }
    }
    // check all items
    if (obj.hasOwnProperty("items")) {
        for (n = 0; n < obj.items.length; n++) {
            if (obj.items[n].hasOwnProperty("share_id")) {
                continue;
            }
            obj.items[n]["parent_share_id"] = new_parent_share_id;
            obj.items[n]["parent_datastore_id"] = new_parent_datastore_id;
        }
    }
}

/**
 * Updates some datastore folders or share folders with content.
 * Will calculate the delete property in the right object.
 *
 * @param {TreeObject} datastore The current datastore to update
 * @param {Array} path The location of the new subtree
 * @param {TreeObject} content The actual data for this path
 * @param {RightObject} parentShareRights The parental rights
 * @param {uuid} parentShareId The parent's share id
 * @param {uuid} parentDatastoreId THe parent's datastore id
 */
function updatePathsWithData(datastore, path, content, parentShareRights, parentShareId, parentDatastoreId) {
    const path_copy = path.slice();
    const search = datastoreService.findInDatastore(path_copy, datastore);
    const obj = search[0][search[1]];

    // update share_rights in share object
    obj["share_rights"] = content.rights;
    obj["share_rights"]["delete"] = parentShareRights["write"];

    // update data (folder and items) in share object
    for (let prop in content.data) {
        if (!content.data.hasOwnProperty(prop)) {
            continue;
        }
        if (prop == 'share_rights') {
            continue;
        }
        obj[prop] = content.data[prop];
    }

    // update share_rights in folders and items
    updateParents(obj, parentShareId, parentDatastoreId);
    datastoreService.updateShareRightsOfFoldersAndItems(obj, {
        read: true,
        write: true,
        grant: true,
        delete: true,
    });
}

/**
 * Queries shares recursive
 *
 * @param {TreeObject} datastore The datastore tree
 * @param {object} shareRightsDict Dictionary of shares and their share rights
 * @returns {Promise} Returns promise that resolves either when the initial datastore is loaded or when all shares with subshares are loaded
 */
function _readShares(datastore, shareRightsDict) {
    return new Promise(function (resolve) {
        let open_calls = 0;
        const all_calls = [];
        const all_share_data = {};
        let content;
        const share_index = datastore.share_index;

        let localResolve = function () {};

        const parent_share_rights = {
            read: true,
            write: true,
            grant: false,
            delete: false,
        };

        const readSharesRecursive = function (
            datastore,
            share_rights_dict,
            share_index,
            all_share_data,
            parent_share_rights,
            parent_share_id,
            parent_datastore_id,
            parent_share_stack
        ) {
            if (typeof share_index === "undefined") {
                return datastore;
            }

            const readShareHelper = function (
                share_id,
                sub_datastore,
                path,
                parent_share_id,
                parent_datastore_id,
                parent_share_stack
            ) {
                const onSuccess = function (content) {
                    if (typeof content === "undefined") {
                        open_calls--;
                        localResolve();
                        return;
                    }
                    all_share_data[share_id] = content;


                    updatePathsWithData(
                        datastore,
                        path,
                        content,
                        parent_share_rights,
                        parent_share_id,
                        parent_datastore_id
                    );

                    readSharesRecursive(
                        sub_datastore,
                        share_rights_dict,
                        content.data.share_index,
                        all_share_data,
                        content.rights,
                        share_id,
                        undefined,
                        parent_share_stack
                    );
                    open_calls--;
                    localResolve();
                };

                const onError = function () {
                    open_calls--;
                    localResolve();
                };
                open_calls++;
                return shareService.readShare(share_id, _shareIndex[share_id]).then(onSuccess, onError);
            };

            for (let share_id in share_index) {
                if (!share_index.hasOwnProperty(share_id)) {
                    continue;
                }
                _shareIndex[share_id] = share_index[share_id].secret_key;
                let new_parent_share_stack = helperService.duplicateObject(parent_share_stack);
                new_parent_share_stack.push(share_id);

                for (let i = share_index[share_id].paths.length - 1; i >= 0; i--) {
                    const path_copy = share_index[share_id].paths[i].slice();
                    const search = datastoreService.findInDatastore(path_copy, datastore);
                    const sub_datastore = search[0][search[1]];

                    // Break potential loops
                    if (parent_share_stack.indexOf(share_id) !== -1) {
                        content = {
                            rights: {
                                read: false,
                                write: false,
                                grant: false,
                            },
                        };
                        updatePathsWithData(
                            datastore,
                            share_index[share_id].paths[i],
                            content,
                            parent_share_rights,
                            parent_share_id,
                            undefined
                        );
                        continue;
                    }

                    // Test if we already have it cached
                    if (all_share_data.hasOwnProperty(share_id)) {
                        updatePathsWithData(
                            datastore,
                            share_index[share_id].paths[i],
                            all_share_data[share_id],
                            parent_share_rights,
                            parent_share_id,
                            undefined
                        );
                        continue;
                    }

                    // Let's check if we have read writes for this share, and skip it if we don't have read rights
                    if (share_rights_dict.hasOwnProperty(share_id) && !share_rights_dict[share_id].read) {
                        content = {
                            rights: {
                                read: share_rights_dict[share_id].read,
                                write: share_rights_dict[share_id].write,
                                grant: share_rights_dict[share_id].grant,
                            },
                        };

                        updatePathsWithData(
                            datastore,
                            share_index[share_id].paths[i],
                            content,
                            parent_share_rights,
                            parent_share_id,
                            undefined
                        );
                        continue;
                    }

                    // No specific share rights for this share, lets assume inherited rights and check if we have parent read rights
                    if (!share_rights_dict.hasOwnProperty(share_id) && !parent_share_rights.read) {
                        content = {
                            rights: helperService.duplicateObject(parent_share_rights),
                        };

                        updatePathsWithData(
                            datastore,
                            share_index[share_id].paths[i],
                            content,
                            parent_share_rights,
                            parent_share_id,
                            undefined
                        );
                        continue;
                    }

                    // No specific share rights for this share and datastore as parent (no inheritance possible) we a assume a share where we lost access rights
                    if (!share_rights_dict.hasOwnProperty(share_id) && typeof parent_datastore_id !== "undefined") {
                        continue;
                    }

                    all_calls.push(
                        readShareHelper(
                            share_id,
                            sub_datastore,
                            share_index[share_id].paths[i],
                            parent_share_id,
                            parent_datastore_id,
                            new_parent_share_stack
                        )
                    );
                }
            }
        };

        // Read shares recursive. We start from the datastore, so delete is allowed in the datastore
        readSharesRecursive(
            datastore,
            shareRightsDict,
            share_index,
            all_share_data,
            parent_share_rights,
            undefined,
            datastore.datastore_id,
            []
        );
        updateParents(datastore, undefined, datastore.datastore_id);
        datastoreService.updateShareRightsOfFoldersAndItems(datastore, {
            read: true,
            write: true,
            grant: true,
            delete: true,
        });

        return Promise.all(all_calls).then(function (ret) {
            localResolve = function () {
                if (open_calls === 0) {
                    resolve(datastore);
                }
            };
            localResolve();
        });
    });
}

/**
 * Sets the "path" attribute for all folders and items
 *
 * @param datastore
 * @param parentPath
 */
function updatePathsRecursive(datastore, parentPath) {
    return datastoreService.updatePathsRecursive(datastore, parentPath);
}

/**
 * Returns the password datastore. In addition this function triggers the generation of the local datastore
 * storage to.
 *
 * @param {uuid} [id] The id of the datastore
 *
 * @returns {Promise} Returns a promise with the datastore
 */
function getPasswordDatastore(id) {
    const type = "password";
    const description = "default";

    const onSuccess = function (datastore) {
        const onSuccess = function (data) {
            if (typeof data === "undefined") {
                return;
            }

            const share_rights_dict = {};
            for (let i = data.share_rights.length - 1; i >= 0; i--) {
                share_rights_dict[data.share_rights[i].share_id] = data.share_rights[i];
            }

            const onSuccess = function (datastore) {
                updatePathsRecursive(datastore, []);

                fillStorage(datastore);

                return datastore;
            };
            const onError = function (datastore) {
                // pass
                console.log(datastore);
                return Promise.reject(datastore);
            };

            return _readShares(datastore, share_rights_dict).then(onSuccess, onError);
        };

        const onError = function (data) {
            // pass
            console.log(data);
            return Promise.reject(data);
        };

        return shareService.readShareRightsOverview().then(onSuccess, onError);
    };
    const onError = function (data) {
        // pass
        console.log(data);
        return Promise.reject(data);
    };

    return datastoreService.getDatastore(type, id).then(onSuccess, onError);
}

/**
 * Alias for getPasswordDatastore
 *
 * @param {uuid} id The id of the datastore
 *
 * @returns {Promise} Returns a promise with the datastore
 */
function getDatastoreWithId(id) {
    return getPasswordDatastore(id);
}

/**
 * Fills the datastore-password-leafs and datastore-file-leafs storage
 *
 * @param {TreeObject} datastore The datastore tree
 */
function fillStorage(datastore) {
    // datastore has changed, so lets regenerate local lookup
    datastoreService.fillStorage(
        "datastore-password-leafs",
        datastore,
        [
            ["key", "secret_id"],
            ["secret_id", "secret_id"],
            ["secret_key", "secret_key"],
            ["name", "name"],
            ["urlfilter", "urlfilter"],
            ["autosubmit", "autosubmit"],
            ["search", "urlfilter"],
        ],
        function (item) {
            return !item.type || item.type !== "file";
        }
    );

    datastoreService.fillStorage(
        "datastore-file-leafs",
        datastore,
        [
            ["key", "id"],
            ["file_id", "file_id"],
            ["file_shard_id", "file_shard_id"],
            ["file_repository_id", "file_repository_id"],
            ["file_size", "file_size"],
            ["file_secret_key", "file_secret_key"],
            ["file_chunks", "file_chunks"],
            ["file_title", "file_title"],
        ],
        function (item) {
            return item.type && item.type === "file";
        }
    );
}

/**
 * Updates the local storage and triggers the 'saveDatastoreContent' to reflect the changes
 *
 * @param {TreeObject} datastore The datastore tree
 */
function handleDatastoreContentChanged(datastore) {
    const datastore_copy = helperService.duplicateObject(datastore);

    updatePathsRecursive(datastore_copy, []);

    // datastore has changed, so lets regenerate local lookup
    fillStorage(datastore);
}

/**
 * Saves the password datastore with given content (including shares) based on the "paths" of all changed
 * elements
 *
 * Responsible for hiding content that doesn't belong into the datastore (like the content of secrets).
 *
 * @param {TreeObject} datastore The real tree object you want to encrypt in the datastore
 * @param {Array} paths The list of paths to the changed elements
 */
function saveDatastoreContent(datastore, paths) {
    const type = "password";
    const description = "default";

    datastore = datastoreService.filterDatastoreContent(datastore);

    const closest_shares = {};

    for (let i = paths.length - 1; i >= 0; i--) {
        const closest_share_info = shareService.getClosestParentShare(paths[i], datastore, datastore, 0);
        const closest_share = closest_share_info["closest_share"];
        if (typeof closest_share.id === "undefined") {
            // its the datastore
            closest_shares["datastore"] = datastore;
        } else {
            closest_shares[closest_share.id] = closest_share;
        }
    }

    const promises = [];
    for (let prop in closest_shares) {
        if (!closest_shares.hasOwnProperty(prop)) {
            continue;
        }

        const duplicate = helperService.duplicateObject(closest_shares[prop]);
        datastoreService.hideSubShareContent(duplicate);
        if (prop === "datastore") {
            promises.push(datastoreService.saveDatastoreContent(type, description, duplicate));
        } else {
            const share_id = duplicate.share_id;
            const secret_key = duplicate.share_secret_key;

            delete duplicate.share_id;
            delete duplicate.secret_key;
            delete duplicate.share_rights;

            promises.push(shareService.writeShare(share_id, duplicate, secret_key));
        }
    }

    return Promise.all(promises);
}

/**
 * Generates a new password for a given url and saves the password in the datastore.
 *
 * @param {object} secretObject The constructed secret object
 * @param {object} datastoreObject The constructed datastore object
 *
 * @returns {Promise} Returns a promise with the status
 */
function saveInDatastore(secretObject, datastoreObject) {
    const link_id = cryptoLibrary.generateUuid();

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (datastore) {
        return secretService
            .createSecret(secretObject, link_id, datastore.datastore_id, undefined)
            .then(async function (data) {
                if (!datastore.hasOwnProperty("items")) {
                    datastore["items"] = [];
                }

                datastoreObject["id"] = link_id;
                datastoreObject["secret_id"] = data.secret_id;
                datastoreObject["secret_key"] = data.secret_key;
                datastore.items.push(datastoreObject);

                await saveDatastoreContent(datastore, [[]]);
                handleDatastoreContentChanged(datastore);

                return datastoreObject;
            }, onError);
    };

    return getPasswordDatastore().then(onSuccess, onError);
}

/**
 * Stores credential for a given url, username and password in the datastore
 *
 * @param {string} url The URL of the site for which the password has been generated
 * @param {string} username The username to store
 * @param {string} password The password to store
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function savePassword(url, username, password) {
    const parsed_url = helperService.parseUrl(url);

    const secret_object = {
        website_password_title: parsed_url.authority_without_www || i18n.t("UNKNOWN"),
        website_password_url: url,
        website_password_username: username || "",
        website_password_password: password || "",
        website_password_notes: "",
        website_password_auto_submit: false,
        website_password_url_filter: parsed_url.authority || "",
    };

    const datastore_object = {
        type: "website_password",
        name: parsed_url.authority_without_www || i18n.t("UNKNOWN"),
        urlfilter: parsed_url.authority || "",
    };

    const onError = function (data) {
        console.log(data);
    };

    const onSuccess = function (datastoreObject) {
        // we return a promise. We do not yet have a proper error handling and returning
        // a promise might make it easier later to wait or fix errors
        return new Promise(function (resolve) {
            resolve(datastoreObject);
        });
    };

    return saveInDatastore(secret_object, datastore_object).then(onSuccess, onError);
}

/**
 * Stores a passkey in the datastore
 *
 * @param {string} passkey_id The id of the passkey in Hex notation
 * @param {string} passkey_rp_id The RPID e.g. a domain or ip address
 * @param {string} passkey_public_key The public key in jwk format
 * @param {string} passkey_private_key The private key in jwk format
 * @param {string} passkey_user_handle The user handle
 * @param {string} username The username
 * @param {object} passkey_algorithm The algorithm object e.g { 'name': "ECDSA", 'namedCurve': "P-256" }
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function savePasskey(passkey_id, passkey_rp_id, passkey_public_key, passkey_private_key, passkey_user_handle, username, passkey_algorithm) {
    const title = (passkey_rp_id + " " + username).trim() || i18n.t("UNKNOWN");
    const urlfilter = passkey_rp_id + '#' + passkey_id;

    const secret_object = {
        passkey_title: title,
        passkey_rp_id: passkey_rp_id,
        passkey_id: passkey_id,
        passkey_public_key: passkey_public_key,
        passkey_private_key: passkey_private_key,
        passkey_user_handle: passkey_user_handle,
        passkey_algorithm: passkey_algorithm,
        passkey_url_filter: urlfilter,
        passkey_auto_submit: false,
    };

    const datastore_object = {
        type: "passkey",
        name: title,
        urlfilter: urlfilter,
    };

    const onError = function (data) {
        console.log(data);
    };

    const onSuccess = function (datastoreObject) {
        // we return a promise. We do not yet have a proper error handling and returning
        // a promise might make it easier later to wait or fix errors
        return new Promise(function (resolve) {
            resolve(datastoreObject);
        });
    };

    return saveInDatastore(secret_object, datastore_object).then(onSuccess, onError);
}

/**
 * Generates a password for the active tab
 *
 * @param {string} password The password to store
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function savePasswordActiveTab(username, password) {
    const onError = function () {
        console.log("could not find out the url of the active tab");
    };

    const onSuccess = function (url) {
        const onError = function (result) {
            //pass
        };
        const onSuccess = function (datastore_object) {
            return datastore_object;
        };

        return savePassword(url, username, password).then(onSuccess, onError);
    };

    return browserClient.getActiveTabUrl().then(onSuccess, onError);
}

/**
 * Bookmarks the active tab
 *
 * @returns {Promise} Returns a promise with the datastore object
 */
function bookmarkActiveTab() {
    const onError = function () {
        console.log("could not find out the url of the active tab");
    };

    const onSuccess = function (url) {
        const parsed_url = helperService.parseUrl(url);

        const secret_object = {
            bookmark_title: parsed_url.authority_without_www || i18n.t("UNKNOWN"),
            bookmark_url: url,
            bookmark_notes: "",
            bookmark_url_filter: parsed_url.authority || "",
        };

        const datastore_object = {
            type: "bookmark",
            name: parsed_url.authority_without_www || i18n.t("UNKNOWN"),
            urlfilter: parsed_url.authority || "",
        };

        const onError = function () {
            // pass
        };

        const onSuccess = function (datastoreObject) {
            // we return a promise. We do not yet have a proper error handling and returning
            // a promise might make it easier later to wait or fix errors
            return new Promise(function (resolve) {
                resolve(datastoreObject);
            });
        };

        return saveInDatastore(secret_object, datastore_object).then(onSuccess, onError);
    };

    return browserClient.getActiveTabUrl().then(onSuccess, onError);
}

/**
 * Searches a datastore and returns the paths
 *
 * @param {*} toSearch The thing to search
 * @param {TreeObject} datastore The datastore object tree
 * @param {TreeObject} cmpFct The compare function
 *
 * @returns {Array} a list of the paths
 */
function searchInDatastore(toSearch, datastore, cmpFct) {
    let i, n, l;
    const paths = [];
    let tmp_paths;

    if (datastore.hasOwnProperty("items")) {
        for (n = 0, l = datastore.items.length; n < l; n++) {
            if (!cmpFct(toSearch, datastore.items[n])) {
                continue;
            }
            paths.push([datastore.items[n].id]);
        }
    }

    if (datastore.hasOwnProperty("folders")) {
        for (n = 0, l = datastore.folders.length; n < l; n++) {
            tmp_paths = searchInDatastore(toSearch, datastore.folders[n], cmpFct);
            for (i = 0; i < tmp_paths.length; i++) {
                tmp_paths[i].unshift(datastore.folders[n].id);
                paths.push(tmp_paths[i]);
            }
            if (!cmpFct(toSearch, datastore.folders[n])) {
                continue;
            }
            paths.push([datastore.folders[n].id]);
        }
    }
    return paths;
}

/**
 * fills otherChildren with all child shares of a given path
 *
 * @param {TreeObject|undefined} obj the object to search
 * @param {int|undefined} shareDistance hare_distance the distance in shares to search (-1 = unlimited search, 0 stop search)
 * @param {Array} otherChildren The list of found children that will be updated with new findings
 * @param {Array} [path] (optional)  The path to prepend, if not provided an empty path will be assumed.
 */
function getAllChildShares(obj, shareDistance, otherChildren, path) {
    if (typeof path === "undefined") {
        path = [];
    }

    let n, l, new_path;
    if (shareDistance === 0) {
        return;
    }
    //search in folders
    if (obj.hasOwnProperty("folders")) {
        for (n = 0, l = obj.folders.length; n < l; n++) {
            new_path = path.slice();
            new_path.push(obj.folders[n].id);
            if (typeof obj.folders[n].share_id !== "undefined") {
                otherChildren.push({
                    share: obj.folders[n],
                    path: new_path,
                });
                getAllChildShares(obj.folders[n], shareDistance - 1, otherChildren, new_path);
            } else {
                getAllChildShares(obj.folders[n], shareDistance, otherChildren, new_path);
            }
        }
    }
    // search in items
    if (obj.hasOwnProperty("items")) {
        for (n = 0, l = obj.items.length; n < l; n++) {
            new_path = path.slice();
            new_path.push(obj.items[n].id);
            if (typeof obj.items[n].share_id !== "undefined") {
                otherChildren.push({
                    share: obj.items[n],
                    path: new_path,
                });
            }
        }
    }
}

/**
 * fills otherChildren with all child shares of a given path
 *
 * @param {Array} path The path to search for child shares
 * @param {TreeObject|undefined} [datastore] (optional) if obj provided
 * @param {Array} otherChildren The list of found children that will be updated with new findings
 * @param {TreeObject|undefined} [obj] (optional)  if not provided we will search it in the datastore according to the provided path first
 */
function getAllChildSharesByPath(path, datastore, otherChildren, obj) {
    if (typeof obj === "undefined") {
        const path_copy = path.slice();
        const search = datastoreService.findInDatastore(path_copy, datastore);
        obj = search[0][search[1]];
        return getAllChildShares(obj, 1, otherChildren, path);
    } else if (obj === false) {
        // TODO Handle not found
        console.log("HANDLE not found!");
    } else {
        getAllChildShares(obj, 1, otherChildren, path);
    }
}

/**
 * returns searches an element recursive for items with a property. Doesn't cross share borders.
 *
 * @param {object} element the tree structure with shares to search
 * @param {string} property the property to search for
 * @returns {Array} List of element ids and the paths
 */
function getAllElementsWithProperty(element, property) {
    const links = [];

    /**
     * helper function, that searches an element recursive for secret links. Doesn't cross share borders.
     *
     * @param {object} element the element to search
     * @param {Array} links
     * @param {Array} path
     */
    function get_all_elements_with_property_recursive(element, links, path) {
        let n, l;
        const new_path = path.slice();
        new_path.push(element.id);

        if (element.hasOwnProperty("share_id")) {
            return;
        }

        // check if the element itself has the property
        if (element.hasOwnProperty(property)) {
            links.push({
                id: element.id,
                path: new_path,
            });
        }

        // search items recursive, skip shares
        if (element.hasOwnProperty("items")) {
            for (n = 0, l = element.items.length; n < l; n++) {
                if (element.items[n].hasOwnProperty("share_id")) {
                    continue;
                }
                get_all_elements_with_property_recursive(element.items[n], links, new_path);
            }
        }

        // search folders recursive, skip shares
        if (element.hasOwnProperty("folders")) {
            for (n = 0, l = element.folders.length; n < l; n++) {
                if (element.folders[n].hasOwnProperty("share_id")) {
                    continue;
                }
                get_all_elements_with_property_recursive(element.folders[n], links, new_path);
            }
        }
    }

    get_all_elements_with_property_recursive(element, links, []);

    return links;
}

/**
 * returns all secret links in element. Doesn't cross share borders.
 *
 * @param {object} element the element to search
 * @returns {Array} List of secret links
 */
function getAllSecretLinks(element) {
    if (element.hasOwnProperty("share_id")) {
        return [];
    }
    return getAllElementsWithProperty(element, "secret_id");
}

/**
 * returns all file links in element. Doesn't cross share borders.
 *
 * @param {object} element the element to search
 * @returns {Array} List of secret links
 */
function getAllFileLinks(element) {
    if (element.hasOwnProperty("share_id")) {
        return [];
    }
    return getAllElementsWithProperty(element, "file_id");
}

/**
 * Translates the absolute path to a relative path
 *
 * @param {TreeObject} share The share to search in the absolute path
 * @param {Array} absolutePath The absolute path
 * @returns {Array} Returns the relative path
 */
function getRelativePath(share, absolutePath) {
    const path_copy = absolutePath.slice();

    // lets create the relative path in the share
    let relative_path = [];

    if (typeof share.id === "undefined") {
        // we have the datastore, so we need the complete path
        relative_path = path_copy;
    } else {
        let passed = false;
        for (let i = 0, l = path_copy.length; i < l; i++) {
            if (passed) {
                relative_path.push(path_copy[i]);
            } else if (share.id === path_copy[i]) {
                passed = true;
            }
        }
    }

    return relative_path;
}

/**
 * triggered once a new share is added. Searches the datastore for the closest share (or the datastore if no
 * share) and adds it to the share_index
 *
 * @param {uuid} shareId The share id that was added
 * @param {Array} path The path to the new share
 * @param {TreeObject} datastore The datastore it was added to
 * @param {int} distance Some logic to get the correct parent share to update
 *
 * @returns {Array} Returns the paths to update
 */
function onShareAdded(shareId, path, datastore, distance) {
    const changed_paths = [];
    let i, l;

    const path_copy = path.slice();
    const path_copy2 = path.slice();
    const path_copy3 = path.slice();
    const path_copy4 = path.slice();

    const closest_share_info = shareService.getClosestParentShare(path_copy, datastore, datastore, distance);
    const parent_share = closest_share_info["closest_share"];

    if (parent_share === false) {
        console.log(path_copy);
        console.log(datastore);
        console.log(distance);
    }

    // create share_index object if not exists
    if (typeof parent_share.share_index === "undefined") {
        parent_share.share_index = {};
    }
    let share;
    // add the the entry for the share in the share_index if not yet exists
    if (typeof parent_share.share_index[shareId] === "undefined") {
        const search = datastoreService.findInDatastore(path_copy2, datastore);
        share = search[0][search[1]];

        parent_share.share_index[shareId] = {
            paths: [],
            secret_key: share.share_secret_key,
        };
    }

    const parent_share_path = [];
    for (i = 0, l = path_copy3.length; i < l; i++) {
        if (typeof parent_share.id === "undefined" || path_copy3[i] === parent_share.id) {
            break;
        }
        parent_share_path.push(path_copy3[i]);
    }
    changed_paths.push(parent_share_path);

    // lets create the relative path in the share
    const relative_path = getRelativePath(parent_share, path_copy3);

    parent_share.share_index[shareId].paths.push(relative_path);

    let share_changed = false;

    for (let old_share_id in parent_share.share_index) {
        if (!parent_share.share_index.hasOwnProperty(old_share_id)) {
            continue;
        }
        if (old_share_id === shareId) {
            continue;
        }

        for (i = 0, l = parent_share.share_index[old_share_id].paths.length; i < l; i++) {
            if (!helperService.arrayStartsWith(parent_share.share_index[old_share_id].paths[i], relative_path)) {
                continue;
            }
            const new_relative_path = parent_share.share_index[old_share_id].paths[i].slice(relative_path.length);

            parent_share.share_index[old_share_id].paths.splice(i, 1);

            if (typeof share.share_index === "undefined") {
                share.share_index = {};
            }

            if (typeof share.share_index[old_share_id] === "undefined") {
                share.share_index[old_share_id] = {
                    paths: [],
                    secret_key: parent_share.share_index[old_share_id].secret_key,
                };
            }
            share.share_index[old_share_id].paths.push(new_relative_path);

            if (parent_share.share_index[old_share_id].paths.length === 0) {
                delete parent_share.share_index[old_share_id];
            }

            if (Object.keys(parent_share.share_index).length === 0) {
                delete parent_share.share_index;
            }
            share_changed = true;
        }
    }

    if (share_changed) {
        changed_paths.push(path_copy4);
    }

    return changed_paths;
}

/**
 * The function that actually adjusts the share_index object and deletes the shares
 *
 * @param share the share holding the share_index
 * @param shareId the shareId of the share, that we want to remove from the share_index
 * @param relativePath the relative path inside the share
 */
function deleteFromShareIndex(share, shareId, relativePath) {
    let already_found = false;

    for (let i = share.share_index[shareId].paths.length - 1; i >= 0; i--) {
        // delete the path from the share index entry
        if (helperService.arrayStartsWith(share.share_index[shareId].paths[i], relativePath)) {
            share.share_index[shareId].paths.splice(i, 1);
            already_found = true;
        }
        // if no paths are empty, we delete the whole share_index entry
        if (share.share_index[shareId].paths.length === 0) {
            delete share.share_index[shareId];
        }
        // if the share_index holds no entries anymore, we delete the share_index
        if (Object.keys(share.share_index).length === 0) {
            delete share.share_index;
        }

        if (already_found) {
            return;
        }
    }
}

/**
 * triggered once a share is deleted. Searches the datastore for the closest share (or the datastore if no
 * share) and removes it from the share_index
 *
 * @param {uuid} shareId the shareId to delete
 * @param {Array} path The path to the deleted share
 * @param {TreeObject} datastore The datastore it was deleted from
 * @param {int} distance Some logic to get the correct parent share to update
 *
 * @returns {Array} Returns the paths to update
 */
function onShareDeleted(shareId, path, datastore, distance) {
    const path_copy = path.slice();
    const closest_share_info = shareService.getClosestParentShare(path_copy, datastore, datastore, distance);
    const parent_share = closest_share_info["closest_share"];
    const relative_path = getRelativePath(parent_share, path.slice());

    // Share_id specified, so lets delete the specified one
    deleteFromShareIndex(parent_share, shareId, relative_path);

    return [path];
}

/**
 * triggered once a share moved. handles the update of the share_index
 *
 * @param {uuid} shareId The id of the share that moved
 * @param {Array} oldPath The old path
 * @param {Array} newPath The new path
 * @param {TreeObject} datastore The affected datastore
 * @param {int} addDistance Some logic to get the correct parent share to update in on_share_added()
 * @param {int} deleteDistance Some logic to get the correct parent share to update in on_share_deleted()
 * @returns {Array} Returns the paths to update
 */
function onShareMoved(shareId, oldPath, newPath, datastore, addDistance, deleteDistance) {
    const paths_updated1 = onShareAdded(shareId, newPath, datastore, addDistance);
    const paths_updated2 = onShareDeleted(shareId, oldPath, datastore, deleteDistance);

    return paths_updated1.concat(paths_updated2);
}

/**
 * used to trigger all registered functions on event
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} value The value with which to call the function
 */
function triggerRegistration(key, value) {
    if (!registrations.hasOwnProperty(key)) {
        registrations[key] = [];
    }
    for (let i = registrations[key].length - 1; i >= 0; i--) {
        registrations[key][i](value);
    }
}

/**
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key, func) {
    if (!registrations.hasOwnProperty(key)) {
        registrations[key] = [];
    }
    registrations[key].push(func);
}

/**
 * used to unregister functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function unregister(key, func) {
    if (!registrations.hasOwnProperty(key)) {
        registrations[key] = [];
    }
    for (let i = registrations[key].length - 1; i >= 0; i--) {
        if (registrations[key][i] !== func) {
            continue;
        }
        registrations[key].splice(i, 1);
    }
}

/**
 * Analyzes the breadcrumbs and returns some info about them like e.g parent_share_id
 *
 * @param {object} breadcrumbs The breadcrumbs to follow
 * @param {TreeObject} datastore The corresponding datastore to analyze
 *
 * @returns {object} The info about the object
 */
function analyzeBreadcrumbs(breadcrumbs, datastore) {
    let path;
    let parent_path;
    let parent_share;

    let target;
    let parent_share_id;
    let parent_datastore_id;

    if (typeof breadcrumbs.id_breadcrumbs !== "undefined" && breadcrumbs.id_breadcrumbs.length > 0) {
        path = breadcrumbs.id_breadcrumbs.slice();
        const path_copy = breadcrumbs.id_breadcrumbs.slice();
        parent_path = breadcrumbs.id_breadcrumbs.slice();
        // find drop zone
        const val1 = datastoreService.findInDatastore(breadcrumbs.id_breadcrumbs, datastore);
        target = val1[0][val1[1]];

        // get the parent (share or datastore)
        const closest_share_info = shareService.getClosestParentShare(path_copy, datastore, datastore, 0);
        parent_share = closest_share_info["closest_share"];
        if (parent_share.hasOwnProperty("datastore_id")) {
            parent_datastore_id = parent_share.datastore_id;
        } else if (parent_share.hasOwnProperty("share_id")) {
            parent_share_id = parent_share.share_id;
        } else {
            alert("Wupsi, that should not happen: d6da43af-e0f5-46ba-ae5b-d7e5ccd2fa92");
        }
    } else {
        path = [];
        parent_path = [];
        target = datastore;
        parent_share = datastore;
        parent_datastore_id = target.datastore_id;
    }

    return {
        path: path,
        parent_path: parent_path,
        parent_share: parent_share,
        target: target,
        parent_share_id: parent_share_id,
        parent_datastore_id: parent_datastore_id,
    };
}

/**
 * Adds a single share to the password datastore, triggers the creation of the necessary share links and returns
 * changed paths
 *
 * @param {object} share The share to add
 * @param {object} target The target folder to add the share to
 * @param {array} path The path of the target folder
 * @param {uuid} parentShareId The parent Share ID (if the parent is a share)
 * @param {uuid} parentDatastoreId The parent Datastore ID (if the parent is a datastore)
 * @param {TreeObject} datastore The complete password datastore
 * @param {TreeObject} parentShare The target share or datastore
 *
 * @returns {Array} The paths of changes
 */
function createShareLinkInDatastore(share, target, path, parentShareId, parentDatastoreId, datastore, parentShare) {
    if (
        parentShare.hasOwnProperty("share_index") &&
        parentShare["share_index"].hasOwnProperty(share.share_id) &&
        parentShare["share_index"][share.share_id].hasOwnProperty("paths") &&
        parentShare["share_index"][share.share_id]["paths"].length > 0
    ) {
        // share already exists in this parent share / datastore, so we prevent creation of duplicates
        return [];
    }

    const link_id = cryptoLibrary.generateUuid();

    share.id = link_id;

    if (typeof share.type === "undefined") {
        //its a folder, lets add it to folders
        if (typeof target.folders === "undefined") {
            target.folders = [];
        }
        target.folders.push(share);
    } else {
        // its an item, lets add it to items
        if (typeof target.items === "undefined") {
            target.items = [];
        }
        target.items.push(share);
    }

    shareLinkService.createShareLink(link_id, share.share_id, parentShareId, parentDatastoreId);

    path.push(share.id);

    return onShareAdded(share.share_id, path, datastore, 1);
}

/**
 * Adds multiple shares to the password datastore and triggers the save of the password datastore
 *
 * @param {array} shares An array of shares to add to the datastore
 * @param {object} target The target folder to add the shares to
 * @param {array} parentPath The path to the parent datastore or share
 * @param {array} path The path to the target
 * @param {uuid} parentShareId The parent Share ID (if the parent is a share)
 * @param {uuid} parentDatastoreId The parent Datastore ID (if the parent is a datastore)
 * @param {TreeObject} datastore The complete password datastore
 * @param {TreeObject} parentShare The target share or datastore
 *
 * @returns {Promise} Returns a promise with the success of the action
 */
function createShareLinksInDatastore(
    shares,
    target,
    parentPath,
    path,
    parentShareId,
    parentDatastoreId,
    datastore,
    parentShare
) {
    const changedPaths = [parentPath];

    for (let i = 0; i < shares.length; i++) {
        let share = shares[i];

        changedPaths.concat(
            createShareLinkInDatastore(
                share,
                target,
                helperService.duplicateObject(path),
                parentShareId,
                parentDatastoreId,
                datastore,
                parentShare
            )
        );
    }

    return saveDatastoreContent(datastore, changedPaths);
}

/**
 * Walks through the folder structure and sets "hidden" to false
 *
 * @param {TreeObject} searchTree The part of the datastore to show recursive
 */
function showFolderContentRecursive(searchTree) {
    let i;
    if (searchTree.hasOwnProperty("folders")) {
        for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
            showFolderContentRecursive(searchTree.folders[i]);
        }
    }
    if (searchTree.hasOwnProperty("items")) {
        for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
            searchTree.items[i].hidden = false;
        }
    }
    searchTree.hidden = false;
}

/**
 * searches a tree and marks all folders / items as invisible, only leaving nodes with search
 *
 * @param {string} newValue The new string from the search box
 * @param {TreeObject} searchTree The part of the datastore to search
 */
function modifyTreeForSearch(newValue, searchTree) {
    if (typeof newValue === "undefined" || typeof searchTree === "undefined" || searchTree === null) {
        return;
    }

    if (newValue.length < 3) {
        newValue = "";
    }

    let show = false;

    let i;
    if (searchTree.hasOwnProperty("folders")) {
        for (i = searchTree.folders.length - 1; searchTree.folders && i >= 0; i--) {
            show = modifyTreeForSearch(newValue, searchTree.folders[i]) || show;
        }
    }

    const password_filter = helperService.getPasswordFilter(newValue);

    // Test title of the items
    if (searchTree.hasOwnProperty("items")) {
        for (i = searchTree.items.length - 1; searchTree.items && i >= 0; i--) {
            if (password_filter(searchTree.items[i])) {
                searchTree.items[i].hidden = false;
                show = true;
            } else {
                searchTree.items[i].hidden = true;
            }
        }
    }
    // Test title of the folder
    if (typeof searchTree.name !== "undefined") {
        if (password_filter(searchTree)) {
            show = true;
            showFolderContentRecursive(searchTree);
        }
    }
    searchTree.hidden = !show;
    searchTree.expanded_temporary = newValue !== "";
    searchTree.is_expanded = searchTree.expanded_temporary || searchTree.expanded;

    return show;
}

/**
 * Takes a list of shares and will check which ones are accessible or not.
 * It will return a list of shares that are not accessible.
 *
 * @param {Array} shareList The list of shares (objects with share_id attribute)
 *
 * @returns {Array} A list of the objects that are not accessible
 */
async function getInaccessibleShares(shareList) {
    // returns an empty list if the password datastore hasn't been read yet
    await getPasswordDatastore();

    const inaccessibleShares = [];

    for (let i = 0; i < shareList.length; i++) {
        if (_shareIndex.hasOwnProperty(shareList[i].share_id)) {
            continue;
        }
        inaccessibleShares.push(shareList[i]);
    }

    return inaccessibleShares;
}

/**
 * Reads the password datastore and returns all own pgp private keys as array
 *
 * @returns {Promise} A list of all own pgp keys
 */
function getAllOwnPgpKeys() {
    return new Promise(function (resolve) {
        getPasswordDatastore().then(function (datastore) {
            const ownPgpSecrets = [];
            const ownPgpKeys = [];
            let failed = 0;

            datastoreService.filter(datastore, function (item) {
                if (!item.hasOwnProperty("type") || item["type"] !== "mail_gpg_own_key") {
                    return;
                }
                ownPgpSecrets.push(item);
            });

            if (ownPgpSecrets.length === 0) {
                resolve(ownPgpKeys);
            }

            const trigger_potential_return = function () {
                if (ownPgpKeys.length + failed === ownPgpSecrets.length) {
                    resolve(ownPgpKeys);
                }
            };

            const onError = function (result) {
                failed = failed + 1;
                trigger_potential_return();
            };

            const onSuccess = function (secret) {
                ownPgpKeys.push(secret["mail_gpg_own_key_private"]);
                trigger_potential_return();
            };

            for (let i = 0; i < ownPgpSecrets.length; i++) {
                secretService
                    .readSecret(ownPgpSecrets[i].secret_id, ownPgpSecrets[i].secret_key)
                    .then(onSuccess, onError);
            }
        });
    });
}

/**
 * Collapse all the folders in datastore.
 * Calls recursive itself for all folders
 *
 * @param {TreeObject} obj The tree object
 * @returns {TreeObject} Returns an immutable datastore
 */
function collapseFoldersRecursive(obj) {
    if (obj.hasOwnProperty("folders")) {
        return {
            ...obj,
            expanded: undefined,
            folders: obj.folders.map(item => collapseFoldersRecursive(item))
        }
    }

    if (obj.hasOwnProperty("items")) {
        return {
            ...obj,
            expanded: undefined,
            items: obj.items.map(item => collapseFoldersRecursive(item))
        }
    }

    return {
        ...obj,
        expanded: undefined,
    };
}

shareService.register("get_all_child_shares", getAllChildShares);

const datastorePasswordService = {
    generatePassword: generatePassword,
    generate: generate,
    escapeRegExp: escapeRegExp,
    getPasswordDatastore: getPasswordDatastore,
    getDatastoreWithId: getDatastoreWithId,
    saveDatastoreContent: saveDatastoreContent,
    handleDatastoreContentChanged: handleDatastoreContentChanged,
    savePassword: savePassword,
    savePasswordActiveTab: savePasswordActiveTab,
    savePasskey: savePasskey,
    bookmarkActiveTab: bookmarkActiveTab,
    searchInDatastore: searchInDatastore,
    getAllChildSharesByPath: getAllChildSharesByPath,
    getAllChildShares: getAllChildShares,
    getAllSecretLinks: getAllSecretLinks,
    getAllFileLinks: getAllFileLinks,
    onShareAdded: onShareAdded,
    onShareMoved: onShareMoved,
    onShareDeleted: onShareDeleted,
    deleteFromShareIndex: deleteFromShareIndex,
    updateParents: updateParents,
    register: register,
    unregister: unregister,
    analyzeBreadcrumbs: analyzeBreadcrumbs,
    createShareLinksInDatastore: createShareLinksInDatastore,
    modifyTreeForSearch: modifyTreeForSearch,
    getInaccessibleShares: getInaccessibleShares,
    getAllOwnPgpKeys: getAllOwnPgpKeys,
    updatePathsRecursive: updatePathsRecursive,
    collapseFoldersRecursive: collapseFoldersRecursive,
};

export default datastorePasswordService;
