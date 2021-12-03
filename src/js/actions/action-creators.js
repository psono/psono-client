import {
    SET_KNOWN_HOSTS,
    SET_USER_USERNAME,
    SET_USER_INFO_1,
    SET_USER_INFO_2,
    SET_USER_INFO_3,
    SET_HAS_TWO_FACTOR,
    LOGOUT,
    SET_SERVER_URL,
    SET_SERVER_INFO,
    SET_CLIENT_URL,
    ENABLE_OFFLINE_MODE,
    DISABLE_OFFLINE_MODE,
    SET_NOTIFICATION_ON_COPY,
    SETTINGS_DATASTORE_LOADED,
    SET_PASSWORD_CONFIG,
    SET_ADMIN_CLIENT_CONFIG,
    NOTIFICATION_SEND,
    NOTIFICATION_SET,
    SET_REMOTE_CONFIG_JSON,
    SET_FINGERPRINT,
    SET_EMAIL,
} from "./action-types";

function setUserUsername(username) {
    return (dispatch) => {
        dispatch({
            type: SET_USER_USERNAME,
            username,
        });
    };
}

function setUserInfo1(rememberMe, trustDevice, authentication) {
    return (dispatch) => {
        dispatch({
            type: SET_USER_INFO_1,
            rememberMe,
            trustDevice,
            authentication,
        });
    };
}
function setUserInfo2(userPrivateKey, userPublicKey, sessionSecretKey, token, userSauce) {
    return (dispatch) => {
        dispatch({
            type: SET_USER_INFO_2,
            userPrivateKey: userPrivateKey,
            userPublicKey: userPublicKey,
            sessionSecretKey: sessionSecretKey,
            token,
            userSauce: userSauce,
        });
    };
}
function setUserInfo3(userId, userEmail, userSecretKey) {
    return (dispatch) => {
        dispatch({
            type: SET_USER_INFO_3,
            userId: userId,
            userEmail,
            userSecretKey,
        });
    };
}
function setHasTwoFactor(hasTwoFactor) {
    return (dispatch) => {
        dispatch({
            type: SET_HAS_TWO_FACTOR,
            hasTwoFactor: hasTwoFactor,
        });
    };
}

function setEmail(userEmail) {
    return (dispatch) => {
        dispatch({
            type: SET_EMAIL,
            userEmail,
        });
    };
}

function logout(rememberMe) {
    return (dispatch) => {
        dispatch({
            type: LOGOUT,
            rememberMe,
        });
    };
}

function setServerInfo(info, verifyKey) {
    return (dispatch) => {
        dispatch({
            type: SET_SERVER_INFO,
            info,
            verifyKey,
        });
    };
}

function setServerUrl(url) {
    return (dispatch) => {
        dispatch({
            type: SET_SERVER_URL,
            url: url,
        });
    };
}

function setClientUrl(url) {
    return (dispatch) => {
        dispatch({
            type: SET_CLIENT_URL,
            url: url,
        });
    };
}
function enableOfflineMode() {
    return (dispatch) => {
        dispatch({
            type: ENABLE_OFFLINE_MODE,
        });
    };
}
function disableOfflineMode() {
    return (dispatch) => {
        dispatch({
            type: DISABLE_OFFLINE_MODE,
        });
    };
}
function setNotificationOnCopy(notificationOnCopy) {
    return (dispatch) => {
        dispatch({
            type: SET_NOTIFICATION_ON_COPY,
            notificationOnCopy,
        });
    };
}
function settingsDatastoreLoaded(data) {
    return (dispatch) => {
        dispatch({
            type: SETTINGS_DATASTORE_LOADED,
            data,
        });
    };
}
function setPasswordConfig(passwordLength, passwordLettersUppercase, passwordLettersLowercase, passwordNumbers, passwordSpecialChars) {
    return (dispatch) => {
        dispatch({
            type: SET_PASSWORD_CONFIG,
            passwordLength,
            passwordLettersUppercase,
            passwordLettersLowercase,
            passwordNumbers,
            passwordSpecialChars,
        });
    };
}

function setAdminClientConfig(config) {
    return (dispatch) => {
        dispatch({
            type: SET_ADMIN_CLIENT_CONFIG,
            config: config,
        });
    };
}

function setKnownHosts(knownHosts) {
    return (dispatch) => {
        dispatch({
            type: SET_KNOWN_HOSTS,
            knownHosts: knownHosts,
        });
    };
}

function setFingerprint(fingerprint) {
    return (dispatch) => {
        dispatch({
            type: SET_FINGERPRINT,
            fingerprint,
        });
    };
}

function setRemoteConfigJson(remoteConfigJson) {
    return (dispatch) => {
        dispatch({
            type: SET_REMOTE_CONFIG_JSON,
            remoteConfigJson: remoteConfigJson,
        });
    };
}

function sendNotification(message, messageType) {
    return (dispatch) => {
        dispatch({
            type: NOTIFICATION_SEND,
            message: message,
            messageType: messageType,
        });
    };
}

function setNotifications(messages) {
    return (dispatch) => {
        dispatch({
            type: NOTIFICATION_SET,
            messages: messages,
        });
    };
}

const actionCreators = {
    setUserUsername,
    setUserInfo1,
    setUserInfo2,
    setUserInfo3,
    setHasTwoFactor,
    setEmail,
    logout,
    setServerInfo,
    setServerUrl,
    setClientUrl,
    disableOfflineMode,
    enableOfflineMode,
    setNotificationOnCopy,
    setPasswordConfig,
    settingsDatastoreLoaded,
    setAdminClientConfig,
    setKnownHosts,
    setFingerprint,
    setRemoteConfigJson,
    sendNotification,
    setNotifications,
};

export default actionCreators;
