import {
    LOGOUT,
    SET_CLIENT_URL,
    ENABLE_OFFLINE_MODE,
    DISABLE_OFFLINE_MODE,
    SET_OFFLINE_CACHE_ENCRYPTION_INFO,
    SET_NOTIFICATION_ON_COPY,
    SET_DISABLE_BROWSER_PM,
    SET_HIDE_DOWNLOAD_BANNER,
    SET_LAST_POPUP_SEARCH,
} from "../actions/action-types";

const default_url = "";

function client(
    state = {
        url: default_url,
        offlineMode: false,
        offlineCacheEncryptionKey: null,
        offlineCacheEncryptionSalt: null,
        notificationOnCopy: true,
        disableBrowserPm: true,
        hideDownloadBanner: false,
        lastPopupSearch: "",
    },
    action
) {
    switch (action.type) {
        case LOGOUT:
            return Object.assign({}, state, {
                url: default_url.toLowerCase(),
            });
        case SET_CLIENT_URL:
            return Object.assign({}, state, {
                url: action.url.toLowerCase(),
            });
        case ENABLE_OFFLINE_MODE:
            return Object.assign({}, state, {
                offlineMode: true,
            });
        case DISABLE_OFFLINE_MODE:
            return Object.assign({}, state, {
                offlineMode: false,
            });
        case SET_OFFLINE_CACHE_ENCRYPTION_INFO:
            return Object.assign({}, state, {
                offlineCacheEncryptionKey: action.offlineCacheEncryptionKey,
                offlineCacheEncryptionSalt: action.offlineCacheEncryptionSalt,
            });
        case SET_NOTIFICATION_ON_COPY:
            return Object.assign({}, state, {
                notificationOnCopy: action.notificationOnCopy,
            });
        case SET_DISABLE_BROWSER_PM:
            return Object.assign({}, state, {
                disableBrowserPm: action.disableBrowserPm,
            });
        case SET_HIDE_DOWNLOAD_BANNER:
            return Object.assign({}, state, {
                hideDownloadBanner: action.hideDownloadBanner,
            });
        case SET_LAST_POPUP_SEARCH:
            return Object.assign({}, state, {
                lastPopupSearch: action.lastPopupSearch,
            });
        default:
            return state;
    }
}

export default client;
