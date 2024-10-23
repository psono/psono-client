/**
 * All the entry types and their various translations and functions.
 * Should be extended to simplify how new entry types are added
 */

import helperService from "./helper";
import { getStore } from "./store";

const _entryTypes = [
    {
        value: "nosave",
        title: "NO_SAVE_MODE",
        edit_title: "EDIT_NO_SAVE_MODE",
        show_title: "SHOW_NO_SAVE_MODE",
        hideOnNewEntry: false,
        show: () => getStore().getState().settingsDatastore.noSaveMode,
    },
    {
        value: "nosavetoggle",
        title: "SHOW_SAVE_MODE_TOGGLE",
        edit_title: "EDIT_SHOW_SAVE_MODE_TOGGLE",
        show_title: "SHOW_SHOW_SAVE_MODE_TOGGLE",
        hideOnNewEntry: false,
        show: () => getStore().getState().settingsDatastore.showNoSaveToggle,
    },
    {
        value: "confirm_unsaved",
        title: "CONFIRM_ON_UNSAVED_CHANGES",
        edit_title: "EDIT_CONFIRM_ON_UNSAVED_CHANGES",
        show_title: "SHOW_CONFIRM_ON_UNSAVED_CHANGES",
        hideOnNewEntry: false,
        show: () => getStore().getState().settingsDatastore.confirmOnUnsavedChanges,
    },

];
  
/**
 * Returns all entry types
 * @param {boolean} hideHiddenEntryTypes
 * @param {boolean} hideHiddenOnNewEntry
 * @returns {array} List of all entry types
 */
function getEntryTypes(hideHiddenEntryTypes=false, hideHiddenOnNewEntry=false) {
    const entryTypes = helperService.duplicateObject(_entryTypes.filter((entry) => (!hideHiddenEntryTypes || entry.show()) && !(hideHiddenOnNewEntry && entry.hideOnNewEntry)).map((entry) => ({
        'value': entry.value,
        'title': entry.title,
        'edit_title': entry.edit_title,
        'show_title': entry.show_title,
    })));

    
    return entryTypes;
}

const optionBlueprintService = {
    getEntryTypes: getEntryTypes,
};
export default optionBlueprintService;
