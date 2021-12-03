/**
 * Service to manage the setting datastore
 */

import datastore from "./datastore";
import action from "../actions/bound-action-creators";

/**
 * Returns the settings datastore.
 *
 * @returns {Promise} Returns the settings datastore
 */
function getSettingsDatastore() {
    const type = "settings";
    const description = "key-value-settings";

    const onSuccess = function (results) {
        action.settingsDatastoreLoaded(results);

        return results;
    };
    const onError = function () {
        // pass
    };
    return datastore.getDatastore(type).then(onSuccess, onError);
}

/**
 * Saves the settings datastore with given content
 *
 * @param {TreeObject} content The real object you want to encrypt in the datastore
 * @returns {Promise} Promise with the status of the save
 */
function saveSettingsDatastore(content) {
    const type = "settings";
    const description = "key-value-settings";

    return datastore.saveDatastoreContent(type, description, content);
}

const service = {
    getSettingsDatastore: getSettingsDatastore,
    saveSettingsDatastore: saveSettingsDatastore,
};
export default service;
