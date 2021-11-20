/**
 * Service to manage the setting datastore
 */

import datastore from "./datastore";

/**
 * Returns the settings datastore.
 *
 * @returns {Promise} Returns the settings datastore
 */
function getSettingsDatastore() {
    const type = "settings";
    const description = "key-value-settings";

    const onSuccess = function (results) {
        console.log(results);

        // for (let i = results.length - 1; i >= 0; i--) {
        //     var s = storage.find_key('settings', results[i].key);
        //     if (s !== null) {
        //         s.value = results[i].value;
        //         storage.update('settings', s);
        //     } else {
        //         storage.insert('settings', {key: results[i].key, value: results[i].value});
        //     }
        // }
        // storage.save();

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
