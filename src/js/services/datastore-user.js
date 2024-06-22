/**
 * Service to manage the user datastore and user related functions
 */

import datastoreService from "./datastore";
import helper from "./helper";
import { getStore } from "./store";
import apiClient from "./api-client";
import datastorePasswordService from "./datastore-password";

/**
 * Sets the "path" attribute for all folders and items
 *
 * @param datastore
 * @param parent_path
 */
function updatePathsRecursive(datastore, parent_path) {
    return datastoreService.updatePathsRecursive(datastore, parent_path);
}

/**
 * Returns the user datastore. In addition this function triggers the generation of the local datastore
 * storage to
 *
 * @returns {Promise} Returns a promise with the user datastore
 */
function getUserDatastore() {
    const type = "user";
    const description = "default";

    const onSuccess = function (datastore) {
        datastoreService.updateShareRightsOfFoldersAndItems(datastore, {
            read: true,
            write: true,
            grant: true,
            delete: true,
        });
        updatePathsRecursive(datastore, []);

        return datastore;
    };
    const onError = function () {
        // pass
    };

    return datastoreService.getDatastore(type).then(onSuccess, onError);
}

/**
 * Alias for get_password_datastore
 *
 * @param {uuid} id The id of the datastore
 *
 * @returns {Promise} Returns a promise with the datastore
 */
function getDatastoreWithId(id) {
    return getUserDatastore();
}

/**
 * searches the user datastore for a user, based on the id or email
 *
 * @param {uuid|undefined} [userId] (optional) userId to search for
 * @param {email|undefined} [email] (optional) email to search for
 * @returns {Promise} Returns a promise with the user
 */
function searchUserDatastore(userId, email) {
    const onSuccess = function (userDataStore) {
        const users = [];
        let idMatch = null;
        let emailMatch = null;

        helper.createList(userDataStore, users);

        for (let i = users.length - 1; i >= 0; i--) {
            if (users[i].data.user_id === userId) {
                idMatch = users[i];
            }
            if (users[i].data.user_email === email) {
                emailMatch = users[i];
            }
        }

        if (idMatch === null && emailMatch === null) {
            // no match found
            return null;
        } else if (idMatch !== null && emailMatch !== null && idMatch.id === emailMatch.id) {
            // id match and email match is the same user
            return idMatch;
        } else if (idMatch !== null) {
            // only idMatch is set
            return idMatch;
        } else if (emailMatch !== null) {
            // only emailMatch is set
            return emailMatch;
        } else {
            // no match found, or id and email match are different
            return null;
        }
    };
    const onError = function () {
        // pass
    };

    return getUserDatastore().then(onSuccess, onError);
}

/**
 * Updates the local storage and triggers the 'saveDatastoreContent' to reflect the changes
 *
 * @param {TreeObject} datastore The datastore tree
 */
function handleDatastoreContentChanged(datastore) {
    // don't do anything
}

/**
 * Saves the user datastore with given content
 *
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 * @param {Array} paths The list of paths to the changed elements
 * @returns {Promise} Promise with the status of the save
 */
function saveDatastoreContent(content, paths) {
    const type = "user";
    const description = "default";

    return datastoreService.saveDatastoreContent(type, description, content);
}

/**
 * searches a user in the database according to his username
 *
 * @param {string} [username] (optional) The username to search
 * @param {string} [email] (optional) The email to search
 * @returns {Promise} Returns a promise with the user information
 */
function searchUser(username, email) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    return apiClient.searchUser(token, sessionSecretKey, undefined, username, email);
}

/**
 * Adds a new user to the datastore
 *
 * @param {TreeObject} userDatastore The content of the existing user datastore
 * @param {object} userObject The user object
 * @param {TreeObject} [targetParent] (optional) The potential parent to add the user to
 * @returns {Promise} Returns a promise with the user information
 */
function addUserToDatastore(userDatastore, userObject, targetParent) {
    let parent;
    if (targetParent) {
        parent = targetParent;
    } else {
        parent = userDatastore;
    }
    if (typeof parent.items === "undefined") {
        parent.items = [];
    }

    // check if we do not already have the user in our trusted user datastore
    // skip if we already have it
    const existingLocations = datastorePasswordService.searchInDatastore(userObject, userDatastore, function (a, b) {
        if (!a.hasOwnProperty("data")) {
            return false;
        }
        if (!b.hasOwnProperty("data")) {
            return false;
        }
        if (!a["data"].hasOwnProperty("user_public_key")) {
            return false;
        }
        if (!b["data"].hasOwnProperty("user_public_key")) {
            return false;
        }
        return a["data"]["user_public_key"] === b["data"]["user_public_key"];
    });

    if (existingLocations.length < 1) {
        parent.items.push(userObject);
        datastoreService.updateShareRightsOfFoldersAndItems(userDatastore, {
            read: true,
            write: true,
            grant: true,
            delete: true,
        });
        return saveDatastoreContent(userDatastore);
    }
}

const datastoreUserService = {
    getUserDatastore: getUserDatastore,
    getDatastoreWithId: getDatastoreWithId,
    searchUserDatastore: searchUserDatastore,
    handleDatastoreContentChanged: handleDatastoreContentChanged,
    saveDatastoreContent: saveDatastoreContent,
    searchUser: searchUser,
    addUserToDatastore: addUserToDatastore,
};
export default datastoreUserService;
