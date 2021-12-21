/**
 * linkShare collects all functions to edit / update / create link shares and to work with them.
 */

import helperService from "./helper";
import store from "./store";

const _entryTypes = [
    { value: "website_password", title: "WEBSITE_PASSWORD", edit_title: "EDIT_WEBSITE_PASSWORD" },
    { value: "application_password", title: "APPLICATION_PASSWORD", edit_title: "EDIT_APPLICATION_PASSWORD" },
    { value: "totp", title: "TOTP_AUTHENTICATOR", edit_title: "EDIT_TOTP_AUTHENTICATOR" },
    { value: "note", title: "NOTE", edit_title: "EDIT_NOTE" },
    { value: "environment_variables", title: "ENVIRONMENT_VARIABLES", edit_title: "EDIT_ENVIRONMENT_VARIABLES" },
    { value: "mail_gpg_own_key", title: "GPG_KEY", edit_title: "EDIT_GPG_KEY" },
    { value: "bookmark", title: "BOOKMARK", edit_title: "EDIT_BOOKMARK" },
];

/**
 * Returns all entry types
 *
 * @returns {array} List of all entry types
 */
function getEntryTypes() {
    const entryTypes = helperService.duplicateObject(_entryTypes);

    if (store.getState().server.files) {
        entryTypes.push({ value: "file", title: "FILE", edit_title: "EDIT_FILE" });
    }
    return entryTypes;
}

const itemBlueprintService = {
    getEntryTypes: getEntryTypes,
};
export default itemBlueprintService;
