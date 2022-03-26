/**
 * Service that handles all the settings
 */

import datastoreSettingService from "./datastore-setting";
import datastoreService from "./datastore";

const registrations = {};

const _settings = {
    fields: [
        // Password Generator
        {
            key: "setting_password_length",
            field: "input",
            type: "text",
            title: "PASSWORD_LENGTH",
            placeholder: "PASSWORD_LENGTH",
            required: true,
            default: 16,
            tab: "password-generator",
        },
        {
            key: "setting_password_letters_uppercase",
            field: "input",
            type: "text",
            title: "LETTERS_UPPERCASE",
            placeholder: "LETTERS_UPPERCASE",
            default: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            tab: "password-generator",
        },
        {
            key: "setting_password_letters_lowercase",
            field: "input",
            type: "text",
            title: "LETTERS_LOWERCASE",
            placeholder: "LETTERS_LOWERCASE",
            default: "abcdefghijklmnopqrstuvwxyz",
            tab: "password-generator",
        },
        {
            key: "setting_password_numbers",
            field: "input",
            type: "text",
            title: "NUMBERS",
            placeholder: "NUMBERS",
            required: true,
            default: "0123456789",
            tab: "password-generator",
        },
        {
            key: "setting_password_special_chars",
            field: "input",
            type: "text",
            title: "SPECIAL_CHARS",
            placeholder: "SPECIAL_CHARS",
            default: ",.-;:_#'+*~!\"§$%&/@()=?{[]}\\",
            tab: "password-generator",
        },
        // Language
        {
            key: "language_language",
            field: "select",
            type: "select",
            title: "LANGUAGE",
            get_options: "get_language_options",
            get_default: "get_default_language",
            tab: "language",
            save: "",
            onChange: "on_change_language",
        },
        // GPG
        {
            key: "gpg_default_key",
            field: "select",
            type: "select",
            title: "DEFAULT_KEY",
            default: "",
            get_options: "get_gpg_default_key_options",
            tab: "gpg",
        },
        {
            key: "gpg_hkp_key_server",
            field: "input",
            type: "text",
            title: "HKP_SERVER",
            placeholder: "HKP_SERVER",
            default: "https://keyserver.ubuntu.com",
            tab: "gpg",
        },
        { key: "gpg_hkp_search", field: "input", type: "checkbox", title: "AUTOSEARCH_HKP", default: true, tab: "gpg" },
        // Notification
        {
            key: "enable_notification_copy",
            field: "input",
            type: "checkbox",
            title: "ENABLE_NOTIFICATION_COPY",
            default: true,
            tab: "notification",
        },
        // General
        {
            key: "disable_browser_pm",
            field: "input",
            type: "checkbox",
            title: "DISABLE_BROWSER_PM",
            default: true,
            tab: "general",
            onChange: "on_change_pm_lock",
        },
    ],
    get_gpg_default_key_options: function () {
        return new Promise(function (resolve) {
            registrations["get_password_datastore"]().then(function (datastore) {
                const own_pgp_secrets = [];

                datastoreService.filter(datastore, function (item) {
                    if (!item.hasOwnProperty("type") || item["type"] !== "mail_gpg_own_key") {
                        return;
                    }
                    own_pgp_secrets.push({
                        id: item.id,
                        label: item.name,
                    });
                });
                resolve(own_pgp_secrets);
            });
        });
    },
    get_language_options: function () {
        return new Promise(function (resolve) {
            const langs = languagePicker.get_language_array();
            const lang_options = [];
            for (let i = 0; i < langs.length; i++) {
                if (!langs[i]["active"]) {
                    continue;
                }
                lang_options.push({
                    id: langs[i]["code"],
                    label: langs[i]["lng_title_native"],
                });
            }
            resolve(lang_options);
        });
    },
    get_default_language: function () {
        const lang = languagePicker.get_active_language();
        return {
            id: lang["code"],
            label: lang["lng_title_native"],
        };
    },
    on_change_language: function (fields) {
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].key !== "language_language") {
                continue;
            }
            languagePicker.changeLanguage(fields[i].value.id);
        }
    },
    on_change_pm_lock: function (fields) {
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].key !== "disable_browser_pm") {
                continue;
            }
            browserClient.disable_browser_password_saving(fields[i].value);
        }
    },
};

// will be handled different, and not saved directly to the settings
const _config_settings = [];

/**
 * returns the setting with a specific key, applies default values
 *
 * @param {string} key They key of the setting one wants to fetch
 * @returns {*} Returns the setting
 */
function getSetting(key) {
    if (typeof key !== "undefined") {
        // key specified
        const s = storage.find_key("settings", key);
        if (s !== null) {
            // found in storage
            return s.value;
        } else {
            // not found in storage, lets look for a default value, otherwise return null
            for (let i = _settings["fields"].length - 1; i >= 0; i--) {
                if (_settings["fields"][i].key === key) {
                    if (typeof _settings["fields"][i].default !== "undefined") {
                        return _settings["fields"][i].default;
                    } else if (typeof _settings["fields"][i].get_default !== "undefined") {
                        return _settings[_settings["fields"][i].get_default]();
                    } else {
                        return null;
                    }
                }
            }
        }
    }
    return null;
}

/**
 * returns all settings with structure
 *
 * @returns {Array} Returns a list of all settings
 */
function getSettings() {
    function set_option(field) {
        if (!field.hasOwnProperty("get_options")) {
            return;
        }
        _settings[field["get_options"]]().then(function (options) {
            field["options"] = options;
        });
    }

    for (let i = _settings["fields"].length - 1; i >= 0; i--) {
        _settings["fields"][i].value = getSetting(_settings["fields"][i].key);
        set_option(_settings["fields"][i]);
    }
    return _settings;
}

/**
 * will update the storage with a given value for a specific setting
 *
 * @param key
 * @param value
 * @private
 */
function _setSetting(key, value) {
    const s = storage.find_key("settings", key);
    if (s !== null) {
        s.value = value;
        storage.update("settings", s);
    } else {
        storage.insert("settings", { key: key, value: value });
    }
}

/**
 * will update one setting specified as key value or many settings as a list of key value objects
 *
 * @param {string|Array} key The key of the setting one wants to update or a list of objects with key and value
 * @param {string} [value] The value of the setting
 */
function setSettings(key, value) {
    if (typeof value !== "undefined") {
        _setSetting(key, value);
    } else {
        for (let i = key.length - 1; i >= 0; i--) {
            if (key[i].hasOwnProperty("save")) {
                if (_settings.hasOwnProperty(key[i]["save"])) {
                    _settings[key[i]["save"]](key[i]);
                }
            } else {
                _setSetting(key[i].key, key[i].value);
            }
        }
    }

    const s = getSettings();
    const content = [];
    for (let k = 0; k < s["fields"].length; k++) {
        if (_config_settings.indexOf(s["fields"][k].key) > -1) {
            continue;
        }

        if (s["fields"][k].hasOwnProperty("save")) {
            continue;
        }

        content.push({
            key: s["fields"][k].key,
            value: s["fields"][k].value,
        });
    }
    datastoreSettingService.saveSettingsDatastore(content);
    storage.save();
}

/**
 * Saves the settings and might update the user data.
 *
 * @returns {Promise} Returns a promise with the status
 */
function save() {
    return new Promise(function (resolve, reject) {
        const specials = {};

        // lets search our settings for the interesting settings
        for (let i = _settings["fields"].length - 1; i >= 0; i--) {
            if (_config_settings.indexOf(_settings["fields"][i].key) > -1) {
                specials[_settings["fields"][i].key] = _settings["fields"][i];
            }
        }

        const totalSuccess = function () {
            for (let i = _config_settings.length - 1; i >= 0; i--) {
                specials[_config_settings[i]].value = "";
            }
            setSettings(_settings["fields"]);

            return resolve({ msgs: ["SAVE_SUCCESS"] });
        };
        return totalSuccess();
    });
}

/**x
 * used to register functions to bypass circular dependencies
 *
 * @param {string} key The key of the function (usually the function name)
 * @param {function} func The call back function
 */
function register(key, func) {
    registrations[key] = func;
}

const settingsService = {
    getSetting: getSetting,
    getSettings: getSettings,
    setSettings: setSettings,
    save: save,
    register: register,
};

export default settingsService;
