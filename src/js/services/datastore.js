/**
 * The Datastore service collects all functions to edit / update / create a datastore and to work with it.
 */

import { getStore } from "./store";
import action from "../actions/bound-action-creators";
import storage from "./storage";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import apiClient from "./api-client";

let tempDatastoreKeyStorage = {};

function _getDatastoreOverview() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    // we dont have them in cache, so lets query and save them in cache for next time
    const onSuccess = function (result) {
        action().setUserDatastoreOverview(result.data);
        return result.data;
    };
    const onError = function () {
        // pass
    };

    return apiClient.readDatastore(token, sessionSecretKey).then(onSuccess, onError);
}

const datastoreOverview = {};
/**
 returns a promise with the version string
 * @returns {Promise}
 * @private
 */
function _getDatastoreOverviewSingleton() {
    const userId = getStore().getState().user.userId;
    if (!datastoreOverview.hasOwnProperty(userId) || !datastoreOverview[userId]) {
        datastoreOverview[userId] = _getDatastoreOverview();
    }
    return datastoreOverview[userId];
}

/**
 * Returns the overview of all datastores that belong to this user
 *
 * @param {boolean} [forceFresh] (optional) Force fresh call to the backend
 *
 * @returns {Promise} Promise with the datastore overview
 */
function getDatastoreOverview(forceFresh) {
    const userDatastoreOverview = getStore().getState().user.userDatastoreOverview;

    if ((typeof forceFresh === "undefined" || forceFresh === false) && userDatastoreOverview.datastores.length > 0) {
        // we have them in cache, so lets save the query
        return new Promise(function (resolve) {
            resolve(userDatastoreOverview);
        });
    } else if (typeof forceFresh === "undefined" || forceFresh === false) {
        // we have them in cache, so lets save the query
        return _getDatastoreOverviewSingleton()
    } else {
        return _getDatastoreOverview();
    }
}

/**
 * Returns the datastore_id for the given type
 *
 * @param {string} type The type of the datastore that we are looking for
 * @param {boolean|undefined} [forceFresh] (optional) if you want to force a fresh query to the backend
 *
 * @returns {Promise} Promise with the datastore id
 */
function getDatastoreId(type, forceFresh) {
    const onSuccess = function (result) {

        const stores = result.datastores;

        const datastoreId = "";
        for (let i = 0; i < stores.length; i++) {
            if (stores[i].type !== type || !stores[i].is_default) {
                continue;
            }
            return stores[i].id;
        }
        return datastoreId;
    };
    const onError = function () {
        // pass
    };

    return getDatastoreOverview(forceFresh).then(onSuccess, onError);
}

/**
 * Returns the datastore for a given id
 *
 * @param {uuid} datastoreId The datastore id
 *
 * @returns {Promise} Promise with the datastore that belongs to the given id
 */
function getDatastoreWithId(datastoreId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        const datastore_secret_key = cryptoLibrary.decryptSecretKey(
            result.data.secret_key,
            result.data.secret_key_nonce
        );

        tempDatastoreKeyStorage[datastoreId] = datastore_secret_key;

        let datastore = {};

        if (result.data.data !== "") {
            const data = cryptoLibrary.decryptData(result.data.data, result.data.data_nonce, datastore_secret_key);

            datastore = JSON.parse(data);
        }

        datastore["datastore_id"] = datastoreId;

        return datastore;
    };

    return apiClient.readDatastore(token, sessionSecretKey, datastoreId).then(onSuccess, onError);
}

/**
 * Creates a datastore with the given type, description and default status
 *
 * @param {string} type The type of the datastore
 * @param {string} description The description
 * @param {boolean} isDefault Is it a default datastore or not?
 *
 * @returns {Promise} A promise with result of the operation
 */
function createDatastore(type, description, isDefault) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    //datastore does really not exist, lets create one and return it
    const secretKey = cryptoLibrary.generateSecretKey();
    const cipher = cryptoLibrary.encryptSecretKey(secretKey);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        const userDatastoreOverview = getStore().getState().user.userDatastoreOverview;
        if (userDatastoreOverview) {
            if (isDefault) {
                // New datastore is the new default, so update the existing list
                for (let i = 0; i < userDatastoreOverview.datastores.length; i++) {
                    if (userDatastoreOverview.datastores[i].type !== type) {
                        continue;
                    }
                    userDatastoreOverview.datastores[i].is_default = false;
                }
            }

            userDatastoreOverview.datastores.push({
                id: result.data.datastore_id,
                description: description,
                type: type,
                is_default: isDefault,
            });

            action().setUserDatastoreOverview({
                ...userDatastoreOverview,
            })
        }
        return result;
    };

    return apiClient
        .createDatastore(token, sessionSecretKey, type, description, "", "", isDefault, cipher.text, cipher.nonce)
        .then(onSuccess, onError);
}

/**
 * Deletes a datastore
 *
 * @param {uuid} datastoreId The id of the datastore
 * @param {string} password The user's password
 *
 * @returns {Promise} A promise with result of the operation
 */
function deleteDatastore(datastoreId, password) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const authkey = cryptoLibrary.generateAuthkey(getStore().getState().user.username, password);

    const onError = function (result) {
        return Promise.reject(result.data);
    };

    const onSuccess = function (data) {
        // pass
    };

    return apiClient.deleteDatastore(token, sessionSecretKey, datastoreId, authkey).then(onSuccess, onError);
}

/**
 * Sets the "path" attribute for all folders and items
 *
 * @param datastore
 * @param parentPath
 */
function updatePathsRecursive(datastore, parentPath) {
    let i;
    if (datastore.hasOwnProperty("items")) {
        for (i = 0; i < datastore["items"].length; i++) {
            datastore["items"][i]["path"] = parentPath.slice();
            datastore["items"][i]["path"].push(datastore["items"][i]["id"]);
        }
    }
    if (datastore.hasOwnProperty("folders")) {
        for (i = 0; i < datastore["folders"].length; i++) {
            datastore["folders"][i]["path"] = parentPath.slice();
            datastore["folders"][i]["path"].push(datastore["folders"][i]["id"]);
            const parent_path_copy = parentPath.slice();
            parent_path_copy.push(datastore["folders"][i]["id"]);
            updatePathsRecursive(datastore["folders"][i], parent_path_copy);
        }
    }
}

/**
 * Sets the shareRights for folders and items, based on the users rights on the share.
 * Calls recursive itself for all folders and skips nested shares.
 *
 * @param {TreeObject} obj The tree object to update
 * @param {RightObject} shareRights The share rights to update it with.
 */
function updateShareRightsOfFoldersAndItems(obj, shareRights) {
    let n;

    if (obj.hasOwnProperty("datastore_id")) {
        // pass
    } else if (obj.hasOwnProperty("share_id")) {
        shareRights["read"] = obj["share_rights"]["read"];
        shareRights["write"] = obj["share_rights"]["write"];
        shareRights["grant"] = obj["share_rights"]["grant"] && obj["share_rights"]["write"];
        shareRights["delete"] = obj["share_rights"]["write"];
    }

    // check all folders recursive
    if (obj.hasOwnProperty("folders")) {
        for (n = 0; n < obj.folders.length; n++) {
            // lets not go inside of a new share, and don't touch the shareRights as they will come directly from the share
            if (obj.folders[n].hasOwnProperty("share_id")) {
                continue;
            }
            obj.folders[n]["share_rights"] = shareRights;
            updateShareRightsOfFoldersAndItems(obj.folders[n], shareRights);
        }
    }
    // check all items
    if (obj.hasOwnProperty("items")) {
        for (n = 0; n < obj.items.length; n++) {
            if (obj.items[n].hasOwnProperty("share_id")) {
                continue;
            }
            obj.items[n]["share_rights"] = shareRights;
        }
    }
}

/**
 * Returns the datastore for the given type and and description
 *
 * @param {string} type The type of the datastore
 * @param {uuid} [id] The id of a datastore
 *
 * @returns {Promise} Promise with the datastore's content
 */
function getDatastore(type, id) {
    const onError = function (result) {
        // pass
    };

    const onSuccess = function (datastore_id) {
        if (datastore_id === "") {
            //datastore does not exist, lets force a fresh query to make sure

            const onSuccess = function (datastore_id) {
                if (datastore_id === "") {
                    //datastore does really not exist, lets create one and return it

                    const onError = function (result) {
                        // pass
                        console.log(result);
                    };

                    const onSuccess = function (result) {
                        return getDatastoreWithId(result.data.datastore_id);
                    };

                    return createDatastore(type, "Default", true).then(onSuccess, onError);
                } else {
                    // okay, cache was out of date, so lets get this datastore now
                    return getDatastoreWithId(datastore_id);
                }
            };

            const onError = function (result) {
                // pass
            };

            return getDatastoreId(type, true).then(onSuccess, onError);
        } else {
            return getDatastoreWithId(datastore_id);
        }
    };

    if (id) {
        return onSuccess(id);
    } else {
        return getDatastoreId(type).then(onSuccess, onError);
    }
}

/**
 * Adds a node to the storage
 *
 * @param {string} db The database to add the item to
 * @param {TreeObject} folder The Tree object
 * @param {Array} map The map with key / value
 * @param {function} [filter] A function to filter
 */
function addNodeToStorage(db, folder, map, filter) {
    if (typeof folder === "undefined") {
        return;
    }

    if (folder.hasOwnProperty("deleted") && folder["deleted"]) {
        return;
    }

    let i;
    for (i = 0; folder.hasOwnProperty("folders") && i < folder.folders.length; i++) {
        addNodeToStorage(db, folder.folders[i], map, filter);
    }

    for (i = 0; folder.hasOwnProperty("items") && i < folder.items.length; i++) {
        if (folder.items[i].hasOwnProperty("deleted") && folder.items[i]["deleted"]) {
            continue;
        }
        if (filter && !filter(folder.items[i])) {
            continue;
        }

        const item = {};

        for (let m = 0; m < map.length; m++) {
            item[map[m][0]] = folder.items[i][map[m][1]];
        }

        item["type"] = folder.items[i].type;

        storage.upsert(db, item);
    }
}

/**
 * Fills the local datastore with given name
 *
 * @param {string} db The database to add the item to
 * @param {TreeObject} datastore The Tree object
 * @param {Array} map The map with key / value
 * @param {function} [filter] A function to filter
 */
function fillStorage(db, datastore, map, filter) {
    storage.removeAll(db);

    addNodeToStorage(db, datastore, map, filter);

    storage.save();
}

/**
 * Encrypts the content for a datastore with given id. The function will check if the secret key of the
 * datastore is already known, otherwise it will query the server for the details.
 *
 * @param {uuid} datastoreId The datastore id
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 *
 * @returns {Promise} Promise with the status of the save
 */
function encryptDatastore(datastoreId, content) {
    const jsonContent = JSON.stringify(content);

    function encrypt(datastoreId, json_content) {
        const secret_key = tempDatastoreKeyStorage[datastoreId];

        return cryptoLibrary.encryptData(json_content, secret_key);
    }

    if (tempDatastoreKeyStorage.hasOwnProperty(datastoreId)) {
        // datastore secret key exists in temp datastore key storage, but we have to return a promise :/
        return new Promise(function (resolve) {
            resolve(encrypt(datastoreId, jsonContent));
        });
    } else {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (datastore_id) {
            // datastore_secret key should now exist in temp datastore key storage
            return encrypt(datastore_id, jsonContent);
        };

        return getDatastoreWithId(datastoreId).then(onSuccess, onError);
    }
}

/**
 * Saves some content in a datastore
 *
 * @param {uuid} datastoreId The datastore id
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 *
 * @returns {Promise} Promise with the status of the save
 */
function saveDatastoreContentWithId(datastoreId, content) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };
    const onSuccess = function (data) {
        const onError = function (result) {
            // pass
        };
        const onSuccess = function (result) {
            return result.data;
        };

        return apiClient
            .writeDatastore(token, sessionSecretKey, datastoreId, data.text, data.nonce)
            .then(onSuccess, onError);
    };

    return encryptDatastore(datastoreId, content).then(onSuccess, onError);
}

/**
 * Updates the meta of a datastore specified by the datastore id
 *
 * @param {uuid} datastoreId The id of the datastore to update
 * @param {string} description The new description
 * @param {boolean} isDefault Is this the new default datastore
 *
 * @returns {Promise} Promise with the status of the save
 */
function saveDatastoreMeta(datastoreId, description, isDefault) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };
    const onSuccess = function (result) {
        // update our datastore overview cache
        let update_happened = false;
        const userDatastoreOverview = getStore().getState().user.userDatastoreOverview;
        for (let i = 0; i < userDatastoreOverview.datastores.length; i++) {
            if (
                userDatastoreOverview.datastores[i].id === datastoreId &&
                userDatastoreOverview.datastores[i].description === description &&
                userDatastoreOverview.datastores[i].is_default === isDefault
            ) {
                break;
            }

            if (userDatastoreOverview.datastores[i].id === datastoreId) {
                userDatastoreOverview.datastores[i].description = description;
                userDatastoreOverview.datastores[i].is_default = isDefault;
                update_happened = true;
            }
            if (userDatastoreOverview.datastores[i].id !== datastoreId && isDefault) {
                userDatastoreOverview.datastores[i].is_default = false;
            }
        }

        action().setUserDatastoreOverview({
            ...userDatastoreOverview,
        })
        return result.data;
    };

    return apiClient
        .writeDatastore(
            token,
            sessionSecretKey,
            datastoreId,
            undefined,
            undefined,
            undefined,
            undefined,
            description,
            isDefault
        )
        .then(onSuccess, onError);
}

/**
 * Saves some content in a datastore specified with type and description
 *
 * @param {string} type The type of the datastore that we want to save
 * @param {string} description The description of the datastore we want to save
 * @param {TreeObject} content The content of the datastore
 *
 * @returns {Promise} Promise with the status of the save
 */
function saveDatastoreContent(type, description, content) {

    const duplicate = helperService.duplicateObject(content);
    hideSubShareContent(duplicate);
    normalizeShareContent(duplicate);

    if (duplicate.hasOwnProperty("datastore_id")) {
        return saveDatastoreContentWithId(duplicate["datastore_id"], duplicate);
    }

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (datastore_id) {
        return saveDatastoreContentWithId(datastore_id, duplicate);
    };

    return getDatastoreId(type).then(onSuccess, onError);
}

/**
 * used to filter a datastore
 *
 * @param {string} folder The key of the function
 * @param {function} func The call back function
 */
function filter(folder, func) {
    let i;
    if (!folder) {
        return;
    }
    if (folder.hasOwnProperty("folders")) {
        for (i = 0; i < folder["folders"].length; i++) {
            filter(folder["folders"][i], func);
        }
    }

    if (folder.hasOwnProperty("items")) {
        for (i = 0; i < folder["items"].length; i++) {
            func(folder["items"][i]);
        }
    }
}


/**
 * Searches a folder and expects to find an element (item or folder) with a specific searchId.
 * It will return a tuple with the list of elements holding the element together with the index.
 *
 * @param {object} folder The folder to search
 * @param {uuid} searchId The id of the element one is looking for
 *
 * @returns {[]} Returns a tuple of the containing list and index or raises an error if not found
 */
function findObject(folder, searchId) {
    let n, l;

    if (folder.hasOwnProperty("folders")) {
        // check if the object is a folder, if yes return the folder list and the index
        for (n = 0, l = folder.folders.length; n < l; n++) {
            if (folder.folders[n].id === searchId) {
                return [folder.folders, n];
            }
        }
    }
    if (folder.hasOwnProperty("items")) {
        // check if its a file, if yes return the file list and the index
        for (n = 0, l = folder.items.length; n < l; n++) {
            if (folder.items[n].id === searchId) {
                return [folder.items, n];
            }
        }
    }
    // something went wrong, couldn't find the item / folder here
    throw new RangeError("ObjectNotFound");
}

/**
 * Go through the datastore recursive to find the object specified with the path
 *
 * @param {Array} path The path to the object you search as list of ids (length > 0)
 * @param {TreeObject} datastore The datastore object tree
 *
 * @returns {boolean|Array} False if not present or a list of two objects where the first is the List Object (items or folder container) containing the searchable object and the second the index
 */
function findInDatastore(path, datastore) {
    const to_search = path[0];
    let n, l;
    const rest = path.slice(1);

    if (rest.length === 0) {
        // found the parent
        return findObject(datastore, to_search);
    }

    for (n = 0, l = datastore.folders.length; n < l; n++) {
        if (datastore.folders[n].id === to_search) {
            return findInDatastore(rest, datastore.folders[n]);
        }
    }
    throw new RangeError("ObjectNotFound");
}

/**
 * Searches all sub shares and hides (deletes) the content of those
 *
 * @param {TreeObject} share The share tree object which we want to modify
 */
function hideSubShareContent(share) {
    const allowedProps = ["id", "name", "share_id", "share_secret_key", "deleted"];

    if (!share || !share.hasOwnProperty("share_index")) {
        return
    }

    for (let share_id in share.share_index) {
        if (!share.share_index.hasOwnProperty(share_id)) {
            continue;
        }

        for (let i = share.share_index[share_id].paths.length - 1; i >= 0; i--) {
            const path_copy = share.share_index[share_id].paths[i].slice();
            const search = findInDatastore(path_copy, share);

            const obj = search[0][search[1]];

            for (let prop in obj) {
                if (!obj.hasOwnProperty(prop)) {
                    continue;
                }
                if (allowedProps.indexOf(prop) > -1) {
                    continue;
                }
                delete obj[prop];
            }
        }
    }
}

/**
 * Goes through the whole tree structure and removes artificially generated helper variables
 *
 * @param {TreeObject} share The share tree object which we want to modify
 */
function normalizeShareContent(share) {
    let i;
    const artificalProps = ["path", "is_folder", "hidden", "parent_share_id", "parent_datastore_id", "expanded", "expanded_temporary", "share_rights", "filter"];

    for (const prop of artificalProps) {
        if (share.hasOwnProperty(prop)) {
            delete share[prop];
        }
    }

    if (share.hasOwnProperty("items")) {
        for (const item of share["items"]) {
            for (const prop of artificalProps) {
                if (item.hasOwnProperty(prop)) {
                    delete item[prop];
                }
            }
        }
    }

    if (share.hasOwnProperty("folders")) {
        for (const folder of share["folders"]) {
            normalizeShareContent(folder);
        }
    }
}

const datastoreService = {
    getDatastoreOverview: getDatastoreOverview,
    getDatastoreId: getDatastoreId,
    getDatastoreWithId: getDatastoreWithId,
    createDatastore: createDatastore,
    deleteDatastore: deleteDatastore,
    updatePathsRecursive: updatePathsRecursive,
    updateShareRightsOfFoldersAndItems: updateShareRightsOfFoldersAndItems,
    getDatastore: getDatastore,
    addNodeToStorage: addNodeToStorage,
    fillStorage: fillStorage,
    saveDatastoreContent: saveDatastoreContent,
    saveDatastoreContentWithId: saveDatastoreContentWithId,
    saveDatastoreMeta: saveDatastoreMeta,
    encryptDatastore: encryptDatastore,
    filter: filter,
    hideSubShareContent: hideSubShareContent,
    normalizeShareContent: normalizeShareContent,
    findInDatastore: findInDatastore,
};
export default datastoreService;
