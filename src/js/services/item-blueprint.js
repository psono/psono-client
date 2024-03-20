/**
 * All the entry types and their various translations and functions.
 * Should be extended to simplify how new entry types are added
 */

import helperService from "./helper";
import store from "./store";

const _entryTypes = [
    {
        value: "website_password",
        title: "WEBSITE_PASSWORD",
        edit_title: "EDIT_WEBSITE_PASSWORD",
        show_title: "SHOW_WEBSITE_PASSWORD",
        show: () => store.getState().settingsDatastore.showWebsitePassword,
    },
    {
        value: "application_password",
        title: "APPLICATION_PASSWORD",
        edit_title: "EDIT_APPLICATION_PASSWORD",
        show_title: "SHOW_APPLICATION_PASSWORD",
        show: () => store.getState().settingsDatastore.showApplicationPassword,
    },
    {
        value: "totp",
        title: "TOTP_AUTHENTICATOR",
        edit_title: "EDIT_TOTP_AUTHENTICATOR",
        show_title: "SHOW_TOTP_AUTHENTICATOR",
        show: () => store.getState().settingsDatastore.showTOTPAuthenticator,
    },
    {
        value: "passkey",
        title: "PASSKEY",
        edit_title: "EDIT_PASSKEY",
        show_title: "SHOW_PASSKEY",
        show: () => store.getState().settingsDatastore.showPasskey,
    },
    {
        value: "note", title: "NOTE", edit_title: "EDIT_NOTE", show_title: "SHOW_NOTE",
        show: () => store.getState().settingsDatastore.showNote },
    {
        value: "environment_variables",
        title: "ENVIRONMENT_VARIABLES",
        edit_title: "EDIT_ENVIRONMENT_VARIABLES",
        show_title: "SHOW_ENVIRONMENT_VARIABLES",
        show: () => store.getState().settingsDatastore.showEnvironmentVariables,
    },
    {
        value: "ssh_own_key", title: "SSH_KEY", edit_title: "EDIT_SSH_KEY", show_title: "SHOW_SSH_KEY",
        show: () => store.getState().settingsDatastore.showSSHKey,
    },
    {
        value: "mail_gpg_own_key", title: "GPG_KEY", edit_title: "EDIT_GPG_KEY", show_title: "SHOW_GPG_KEY",
        show: () => store.getState().settingsDatastore.showGPGKey,
    },
    {
        value: "credit_card", title: "CREDIT_CARD", edit_title: "EDIT_CREDIT_CARD", show_title: "SHOW_CREDIT_CARD",
        show: () => store.getState().settingsDatastore.showCreditCard,
    },
    {
        value: "bookmark", title: "BOOKMARK", edit_title: "EDIT_BOOKMARK", show_title: "SHOW_BOOKMARK",
        show: () => store.getState().settingsDatastore.showBookmark,
    },
    {
        value: "elster_certificate", title: "ELSTER_CERTIFICATE", edit_title: "EDIT_ELSTER_CERTIFICATE", show_title: "SHOW_ELSTER_CERTIFICATE",
        show: () => store.getState().settingsDatastore.showElsterCertificate,
    },
];

/**
 * Returns all entry types
 * @param {boolean} hideHiddenEntryTypes
 * @returns {array} List of all entry types
 */
function getEntryTypes(hideHiddenEntryTypes=false) {
    const entryTypes = helperService.duplicateObject(_entryTypes.filter((entry) => !hideHiddenEntryTypes || entry.show()).map((entry) => ({
        'value': entry.value,
        'title': entry.title,
        'edit_title': entry.edit_title,
        'show_title': entry.show_title,
    })));

    if (store.getState().server.files && (!hideHiddenEntryTypes || store.getState().settingsDatastore.showFile)) {
        entryTypes.push({ value: "file", title: "FILE", edit_title: "EDIT_FILE" });
    }
    return entryTypes;
}

const itemBlueprintService = {
    getEntryTypes: getEntryTypes,
};
export default itemBlueprintService;
