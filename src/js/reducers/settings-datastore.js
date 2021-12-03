import { SETTINGS_DATASTORE_LOADED, SET_PASSWORD_CONFIG, SET_GPG_CONFIG, SET_GPG_DEFAULT_KEY } from "../actions/action-types";

function settingsDatastore(
    state = {
        passwordLength: 16,
        passwordLettersUppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        passwordLettersLowercase: "abcdefghijklmnopqrstuvwxyz",
        passwordNumbers: "0123456789",
        passwordSpecialChars: ",.-;:_#'+*~!\"§$%&/@()=?{[]}\\",
        gpgDefaultKey: "",
        gpgHkpKeyServer: "https://keyserver.ubuntu.com",
        gpgHkpSearch: true,
    },
    action
) {
    switch (action.type) {
        case SETTINGS_DATASTORE_LOADED:
            return Object.assign({}, state, {
                passwordLength: action.data.hasOwnProperty("setting_password_length") ? action.data.setting_password_length : 16,
                passwordLettersUppercase: action.data.hasOwnProperty("setting_password_letters_uppercase")
                    ? action.data.setting_password_letters_uppercase
                    : "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                passwordLettersLowercase: action.data.hasOwnProperty("setting_password_letters_lowercase")
                    ? action.data.setting_password_letters_lowercase
                    : "abcdefghijklmnopqrstuvwxyz",
                passwordNumbers: action.data.hasOwnProperty("setting_password_numbers") ? action.data.setting_password_numbers : "0123456789",
                passwordSpecialChars: action.data.hasOwnProperty("setting_password_special_chars")
                    ? action.data.setting_password_special_chars
                    : ",.-;:_#'+*~!\"§$%&/@()=?{[]}\\",
                gpgDefaultKey: action.data.hasOwnProperty("gpg_default_key") ? action.data.gpg_default_key : "",
                gpgHkpKeyServer: action.data.hasOwnProperty("gpg_hkp_key_server") ? action.data.gpg_hkp_key_server : "https://keyserver.ubuntu.com",
                gpgHkpSearch: action.data.hasOwnProperty("gpg_hkp_search") ? action.data.gpg_hkp_search : true,
            });
        case SET_PASSWORD_CONFIG:
            return Object.assign({}, state, {
                passwordLength: action.passwordLength,
                passwordLettersUppercase: action.passwordLettersUppercase,
                passwordLettersLowercase: action.passwordLettersLowercase,
                passwordNumbers: action.passwordNumbers,
                passwordSpecialChars: action.passwordSpecialChars,
            });
        case SET_GPG_CONFIG:
            return Object.assign({}, state, {
                gpgHkpKeyServer: action.gpgHkpKeyServer,
                gpgHkpSearch: action.gpgHkpSearch,
            });
        case SET_GPG_DEFAULT_KEY:
            return Object.assign({}, state, {
                gpgDefaultKey: action.gpgDefaultKey,
            });
        default:
            return state;
    }
}

export default settingsDatastore;
