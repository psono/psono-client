/**
 * The Datastore service collects all functions to edit / update / create a datastore and to work with it.
 */

import store from "./store";
import storage from "./storage";
import cryptoLibrary from "./crypto-library";
import browserClient from "./browser-client";
import helperService from "./helper";
import apiClient from "./api-client";

let registrations = {};
let tempDatastoreKeyStorage = {};
let tempDatastoreOverview = false;

/**
 * Returns the overview of all datastores that belong to this user
 *
 * @param {boolean} [forceFresh] (optional) Force fresh call to the backend
 *
 * @returns {Promise} Promise with the datastore overview
 */
function getDatastoreOverview(forceFresh) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    if ((typeof forceFresh === "undefined" || forceFresh === false) && tempDatastoreOverview) {
        // we have them in cache, so lets save the query
        return new Promise(function (resolve) {
            resolve(tempDatastoreOverview);
        });
    } else {
        // we dont have them in cache, so lets query and save them in cache for next time
        const onSuccess = function (result) {
            tempDatastoreOverview = result;
            emit("on_datastore_overview_update", undefined);
            return result;
        };
        const onError = function () {
            // pass
        };

        return apiClient.readDatastore(token, sessionSecretKey).then(onSuccess, onError);
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
        if (typeof result === "undefined") {
            return;
        }

        const stores = result.data["datastores"];

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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        const datastore_secret_key = cryptoLibrary.decryptSecretKey(result.data.secret_key, result.data.secret_key_nonce);

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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    //datastore does really not exist, lets create one and return it
    const secretKey = cryptoLibrary.generateSecretKey();
    const cipher = cryptoLibrary.encryptSecretKey(secretKey);

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (result) {
        if (tempDatastoreOverview) {
            if (isDefault) {
                // New datastore is the new default, so update the existing list
                for (let i = 0; i < tempDatastoreOverview.data.datastores.length; i++) {
                    if (tempDatastoreOverview.data.datastores[i].type !== type) {
                        continue;
                    }
                    tempDatastoreOverview.data.datastores[i].is_default = false;
                }
            }

            tempDatastoreOverview.data.datastores.push({
                id: result.data.datastore_id,
                description: description,
                type: type,
                is_default: isDefault,
            });
            emit("on_datastore_overview_update", undefined);
        }
        return result;
    };

    return apiClient.createDatastore(token, sessionSecretKey, type, description, "", "", isDefault, cipher.text, cipher.nonce).then(onSuccess, onError);
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const authkey = cryptoLibrary.generateAuthkey(store.getState().user.username, password);

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
 * @param {uuid} datastore_id The datastore id
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 *
 * @returns {Promise} Promise with the status of the save
 */
function encryptDatastore(datastore_id, content) {
    const json_content = JSON.stringify(content);

    function encrypt(datastore_id, json_content) {
        const secret_key = tempDatastoreKeyStorage[datastore_id];

        return cryptoLibrary.encryptData(json_content, secret_key);
    }

    if (tempDatastoreKeyStorage.hasOwnProperty(datastore_id)) {
        // datastore secret key exists in temp datastore key storage, but we have to return a promise :/
        return new Promise(function (resolve) {
            resolve(encrypt(datastore_id, json_content));
        });
    } else {
        const onError = function (result) {
            // pass
        };

        const onSuccess = function (datastore_id) {
            // datastore_secret key should now exist in temp datastore key storage
            return encrypt(datastore_id, json_content);
        };

        return getDatastoreWithId(datastore_id).then(onSuccess, onError);
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

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

        return apiClient.writeDatastore(token, sessionSecretKey, datastoreId, data.text, data.nonce).then(onSuccess, onError);
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const onError = function (result) {
        // pass
    };
    const onSuccess = function (result) {
        // update our datastore overview cache
        let update_happened = false;
        for (let i = 0; i < tempDatastoreOverview.data.datastores.length; i++) {
            if (
                tempDatastoreOverview.data.datastores[i].id === datastoreId &&
                tempDatastoreOverview.data.datastores[i].description === description &&
                tempDatastoreOverview.data.datastores[i].is_default === isDefault
            ) {
                break;
            }

            if (tempDatastoreOverview.data.datastores[i].id === datastoreId) {
                tempDatastoreOverview.data.datastores[i].description = description;
                tempDatastoreOverview.data.datastores[i].is_default = isDefault;
                update_happened = true;
            }
            if (tempDatastoreOverview.data.datastores[i].id !== datastoreId && isDefault) {
                tempDatastoreOverview.data.datastores[i].is_default = false;
            }
        }
        if (update_happened) {
            emit("on_datastore_overview_update", undefined);
        }
        return result.data;
    };

    return apiClient
        .writeDatastore(token, sessionSecretKey, datastoreId, undefined, undefined, undefined, undefined, description, isDefault)
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
    if (content.hasOwnProperty("datastore_id")) {
        return saveDatastoreContentWithId(content["datastore_id"], content);
    }

    const onError = function (result) {
        // pass
    };

    const onSuccess = function (datastore_id) {
        return saveDatastoreContentWithId(datastore_id, content);
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
 * Creates a copy of content and filters some attributes out, to save some storage or fix some missbehaviour
 *
 * @param {TreeObject} content The datastore content to filter
 *
 * @returns {TreeObject} Filtered copy of the content
 */
function filterDatastoreContent(content) {
    const contentCopy = helperService.duplicateObject(content);

    const filter = ["expanded", "expanded_temporary", "is_expanded", "filter", "hidden", "share_rights", "path", "parent_share_id", "parent_datastore_id"];

    const filterContent = function (content, filter) {
        let i, m;

        // test attributes in content
        for (m = 0; m < filter.length; m++) {
            if (content.hasOwnProperty(filter[m])) {
                delete content[filter[m]];
            }
        }

        // test items
        for (i = 0; content.hasOwnProperty("items") && i < content.items.length; i++) {
            for (m = 0; m < filter.length; m++) {
                if (content.items[i].hasOwnProperty(filter[m])) {
                    delete content.items[i][filter[m]];
                }
            }
        }
        // call self recursivly for folders
        for (i = 0; content.hasOwnProperty("folders") && i < content.folders.length; i++) {
            filterContent(content.folders[i], filter);
        }
    };

    filterContent(contentCopy, filter);

    return contentCopy;
}

/**
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function
 * @param {function} func The call back function
 */
function register(key, func) {
    if (!registrations.hasOwnProperty(key)) {
        registrations[key] = [];
    }
    registrations[key].push(func);
}

/**
 * Small wrapper to execute all functions that have been registered for an event once the event is triggered
 *
 * @param {string} key The key of the event
 * @param {*} payload The payload of the event
 */
function emit(key, payload) {
    if (registrations.hasOwnProperty(key)) {
        for (let i = 0; i < registrations[key].length; i++) {
            registrations[key][i](payload);
        }
    }
}

function onLogout() {
    tempDatastoreKeyStorage = {};
    tempDatastoreOverview = false;
}

browserClient.on("logout", onLogout);

const service = {
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
    filterDatastoreContent: filterDatastoreContent,
    register: register,
};
export default service;
