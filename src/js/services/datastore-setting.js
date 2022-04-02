/**
 * Service to manage the setting datastore
 */

import datastore from "./datastore";
import store from "./store";
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
        const data = {
            setting_password_length: 16,
            setting_password_letters_uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            setting_password_letters_lowercase: "abcdefghijklmnopqrstuvwxyz",
            setting_password_numbers: "0123456789",
            setting_password_special_chars: ",.-;:_#'+*~!\"§$%&/@()=?{[]}\\",
        };
        if (typeof store.getState().server.compliancePasswordGeneratorDefaultPasswordLength !== "undefined") {
            data["setting_password_length"] = store.getState().server.compliancePasswordGeneratorDefaultPasswordLength;
        }
        if (typeof store.getState().server.compliancePasswordGeneratorDefaultLettersUppercase !== "undefined") {
            data["setting_password_letters_uppercase"] =
                store.getState().server.compliancePasswordGeneratorDefaultLettersUppercase;
        }
        if (typeof store.getState().server.compliancePasswordGeneratorDefaultLettersLowercase !== "undefined") {
            data["setting_password_letters_lowercase"] =
                store.getState().server.compliancePasswordGeneratorDefaultLettersLowercase;
        }
        if (typeof store.getState().server.compliancePasswordGeneratorDefaultNumbers !== "undefined") {
            data["setting_password_numbers"] = store.getState().server.compliancePasswordGeneratorDefaultNumbers;
        }
        if (typeof store.getState().server.compliancePasswordGeneratorDefaultSpecialChars !== "undefined") {
            data["setting_password_special_chars"] =
                store.getState().server.compliancePasswordGeneratorDefaultSpecialChars;
        }
        action.settingsDatastoreLoaded(data);

        if (Array.isArray(results)) {
            // if the user has no settings datastore then this function will return an dict, e.g. {'datastore_id': '...'}
            results.forEach((result) => (data[result["key"]] = result["value"]));
            action.settingsDatastoreLoaded(data);
        }

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

const datastoreSettingService = {
    getSettingsDatastore: getSettingsDatastore,
    saveSettingsDatastore: saveSettingsDatastore,
};
export default datastoreSettingService;
