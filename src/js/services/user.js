/**
 * Users service, everything about login / logout ...
 */

import action from "../actions/bound-action-creators";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import host from "./host";
import notification from "./notification";
import { getStore } from "./store";
import device from "./device";
import storage from "./storage";
import apiClient from "./api-client";
import browserClientService from "./browser-client";

import i18n from "../i18n";
import accountService from "./account";
import avatarService from "./avatar";

let sessionPassword = "";
let verification = {};
let redirectOnTwoFaMissing;

/**
 * Activates a user account with the provided activation code after registration
 *
 * @param {string} activationCode The activation code sent via mail
 * @param {string} server The server to send the activation code to
 *
 * @returns {Promise} Returns a promise with the activation status
 */
function activateCode(activationCode, server) {

    action().setServerUrl(server);

    const onSuccess = function () {
        return {
            response:"success"
        };
    };

    const onError = function(response){

        return {
            response:"error",
            error_data: response.data
        };
    };

    return apiClient.verifyEmail(activationCode)
        .then(onSuccess, onError);
}

/**
 * Updates the global state with username, server, rememberMe and trustDevice
 * Returns the result of check_host
 *
 * @param username
 * @param server
 * @param rememberMe
 * @param trustDevice
 * @param {boolean} twoFaRedirect Redirect user to enforce-two-fa.html or let another controller handle it
 *
 * @returns {Promise}
 */
function initiateLogin(username, server, rememberMe, trustDevice, twoFaRedirect) {
    redirectOnTwoFaMissing = twoFaRedirect;
    action().setServerUrl(server);
    let parsedUrl = helperService.parseUrl(server);

    username = helperService.formFullUsername(username, parsedUrl["full_domain_without_www"]);
    action().setUserUsername(username);
    action().setUserInfo1(rememberMe, trustDevice, "AUTHKEY");

    return host.checkHost(server).then((response) => {
        return response;
    });
}



/**
 * Triggered once someone comes back from a redirect to a index.html#!/saml/token/... url
 * Will try to use the token to authenticate and login
 *
 * @param {string} samlTokenId The saml token id
 *
 * @returns {Promise}
 */
function samlLogin(samlTokenId) {
    const serverPublicKey = getStore().getState().server.publicKey;
    const sessionKeys = cryptoLibrary.generatePublicPrivateKeypair();
    const password = '';

    const onSuccess = function (response) {
        return handleLoginResponse(response, password, sessionKeys, serverPublicKey, 'SAML');
    };

    const onError = function (response) {
        return Promise.reject(response.data.non_field_errors);
    };

    let login_info = {
        saml_token_id: samlTokenId,
        device_time: new Date().toISOString(),
        device_fingerprint: device.getDeviceFingerprint(),
        device_description: device.getDeviceDescription(),
    };

    login_info = JSON.stringify(login_info);

    // encrypt the login infos
    const loginInfoEnc = cryptoLibrary.encryptDataPublicKey(login_info, serverPublicKey, sessionKeys.private_key);

    let sessionDuration = 24 * 60 * 60;
    const trustDevice = getStore().getState().user.trustDevice;
    if (trustDevice) {
        sessionDuration = 24 * 60 * 60 * 30;
    }

    return apiClient
        .samlLogin(loginInfoEnc["text"], loginInfoEnc["nonce"], sessionKeys.public_key, sessionDuration)
        .then(onSuccess, onError);
}

/**
 * Updates the global state with server, remember_me and trust_device
 * Returns the result of check_host
 *
 * @param server
 * @param rememberMe
 * @param trustDevice
 * @param {boolean} twoFaRedirect Redirect user to enforce-two-fa.html or let another controller handle it
 *
 * @returns {Promise}
 */
function initiateSamlLogin(server, rememberMe, trustDevice, twoFaRedirect) {
    redirectOnTwoFaMissing = twoFaRedirect;
    action().setServerUrl(server);
    action().setUserInfo1(rememberMe, trustDevice, "SAML");

    return host.checkHost(server).then((response) => {
        return response;
    });
}

/**
 * Takes the provider id and returns (as a promise) the redirect url to initiate the saml auth flow
 *
 * @param providerId
 *
 * @returns {Promise}
 */
function getSamlRedirectUrl(providerId) {
    const returnToUrl = browserClient.getSamlReturnToUrl();

    return apiClient.samlInitiateLogin(providerId, returnToUrl).then((result) => {
        return result.data;
    });
}

/**
 * Triggered once someone comes back from a redirect to a index.html#!/oidc/token/... url
 * Will try to use the token to authenticate and login
 *
 * @param {string} oidcTokenId The oidc token id
 *
 * @returns {Promise}
 */
function oidcLogin(oidcTokenId) {
    const serverPublicKey = getStore().getState().server.publicKey;
    const sessionKeys = cryptoLibrary.generatePublicPrivateKeypair();
    const password = '';

    const onSuccess = function (response) {
        return handleLoginResponse(response, password, sessionKeys, serverPublicKey, 'OIDC');
    };

    const onError = function (response) {
        return Promise.reject(response.data.non_field_errors);
    };

    let login_info = {
        oidc_token_id: oidcTokenId,
        device_time: new Date().toISOString(),
        device_fingerprint: device.getDeviceFingerprint(),
        device_description: device.getDeviceDescription(),
    };

    login_info = JSON.stringify(login_info);

    // encrypt the login infos
    const loginInfoEnc = cryptoLibrary.encryptDataPublicKey(login_info, serverPublicKey, sessionKeys.private_key);

    let sessionDuration = 24 * 60 * 60;
    const trustDevice = getStore().getState().user.trustDevice;
    if (trustDevice) {
        sessionDuration = 24 * 60 * 60 * 30;
    }

    return apiClient
        .oidcLogin(loginInfoEnc["text"], loginInfoEnc["nonce"], sessionKeys.public_key, sessionDuration)
        .then(onSuccess, onError);
}

/**
 * Updates the global state with server, remember_me and trust_device
 * Returns the result of check_host
 *
 * @param server
 * @param rememberMe
 * @param trustDevice
 * @param {boolean} twoFaRedirect Redirect user to enforce-two-fa.html or let another controller handle it
 *
 * @returns {Promise}
 */
function initiateOidcLogin(server, rememberMe, trustDevice, twoFaRedirect) {
    redirectOnTwoFaMissing = twoFaRedirect;
    action().setServerUrl(server);
    action().setUserInfo1(rememberMe, trustDevice, "OIDC");

    return host.checkHost(server).then((response) => {
        return response;
    });
}

/**
 * Takes the provider id and returns (as a promise) the redirect url to initiate the oidc auth flow
 *
 * @param providerId
 *
 * @returns {Promise}
 */
function getOidcRedirectUrl(providerId) {
    const returnToUrl = browserClient.getOidcReturnToUrl();

    return apiClient.oidcInitiateLogin(providerId, returnToUrl).then((result) => {
        return result.data;
    });
}

/**
 * Ajax POST request to the backend with the token
 *
 * @param {string} gaToken The GA Token
 *
 * @returns Promise Returns a promise with the login status
 */
function gaVerify(gaToken) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    return apiClient.gaVerify(token, gaToken, sessionSecretKey).catch((response) => {
        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("non_field_errors")) {
            return Promise.reject(response.data.non_field_errors);
        } else {
            return Promise.reject(response);
        }
    });
}

/**
 * Ajax POST request to the backend with the token
 *
 * @param {string} [duoToken] (optional) The Duo Token
 *
 * @returns Promise Returns a promise with the login status
 */
function duoVerify(duoToken) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    return apiClient.duoVerify(token, duoToken, sessionSecretKey).catch((response) => {
        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("non_field_errors")) {
            return Promise.reject(response.data.non_field_errors);
        } else {
            return Promise.reject(response);
        }
    });
}

/**
 * Ajax POST request to the backend with the token
 *
 * @param {string} yubikeyOtp The YubiKey OTP token
 *
 * @returns Promise Returns a promise with the login status
 */
function yubikeyOtpVerify(yubikeyOtp) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    return apiClient.yubikeyOtpVerify(token, yubikeyOtp, sessionSecretKey).catch((response) => {
        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("non_field_errors")) {
            return Promise.reject(response.data.non_field_errors);
        } else {
            return Promise.reject(response);
        }
    });
}

/**
 * Handles the validation of the token with the server by solving the cryptographic puzzle
 *
 * @returns Promise Returns a promise with the the final activate token was successful or not
 */
function activateToken() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    const userSauce = getStore().getState().user.userSauce;

    const onSuccess = function (activationData) {
        // decrypt user secret key
        const userSecretKey = cryptoLibrary.decryptSecret(
            activationData.data.user.secret_key,
            activationData.data.user.secret_key_nonce,
            sessionPassword,
            userSauce
        );

        let serverSecretExists = ['SAML', 'OIDC', 'LDAP'].includes(activationData.data.user.authentication)
        if (activationData.data.user.hasOwnProperty('server_secret_exists')) {
            serverSecretExists = activationData.data.user.server_secret_exists;
        }

        action().setUserInfo3(activationData.data.user.id, activationData.data.user.email, userSecretKey, serverSecretExists);

        // no need anymore for the public / private session keys
        sessionPassword = "";
        verification = {};

        browserClient.emit("login", null);

        return {
            response: "success",
        };
    };

    return apiClient
        .activateToken(token, verification.text, verification.nonce, sessionSecretKey)
        .then(onSuccess);
}

/**
 * handles the response of the login with all the necessary cryptography and returns the required multifactors
 *
 * @param {object} response The login response
 * @param {string} password The password
 * @param {object} sessionKeys The session keys
 * @param {string} serverPublicKey The server's public key
 * @param {string} defaultAuthentication The default authentication if not provided by the server
 *
 * @returns {Array} The list of required multifactor challenges to solve
 */
function handleLoginResponse(response, password, sessionKeys, serverPublicKey, defaultAuthentication) {
    let decrypted_response_data = JSON.parse(
        cryptoLibrary.decryptDataPublicKey(
            response.data.login_info,
            response.data.login_info_nonce,
            serverPublicKey,
            sessionKeys.private_key
        )
    );
    const server_session_public_key = decrypted_response_data.server_session_public_key || decrypted_response_data.session_public_key;

    if (decrypted_response_data.hasOwnProperty('data') && decrypted_response_data.hasOwnProperty('data_nonce')) {
        decrypted_response_data = JSON.parse(
            cryptoLibrary.decryptDataPublicKey(
                decrypted_response_data.data,
                decrypted_response_data.data_nonce,
                server_session_public_key,
                sessionKeys.private_key
            )
        );
    }
    sessionPassword = (password || !decrypted_response_data.hasOwnProperty("password")) ? password : decrypted_response_data.password;

    // decrypt the session key
    let sessionSecretKey = decrypted_response_data.session_secret_key;
    if (decrypted_response_data.hasOwnProperty('session_secret_key_nonce')) {
        sessionSecretKey = cryptoLibrary.decryptDataPublicKey(
            decrypted_response_data.session_secret_key,
            decrypted_response_data.session_secret_key_nonce,
            decrypted_response_data.session_public_key,
            sessionKeys.private_key
        );
    }

    const authentication = decrypted_response_data.user.authentication ? decrypted_response_data.user.authentication : defaultAuthentication;

    let user_private_key;
    try {
        // decrypt user private key which may fail if the user server's password isn't correct and the user
        // needs to enter one
        user_private_key = cryptoLibrary.decryptSecret(
            decrypted_response_data.user.private_key,
            decrypted_response_data.user.private_key_nonce,
            sessionPassword,
            decrypted_response_data.user.user_sauce
        );
    } catch (error) {
        return {
            'require_password': (password) => handleLoginResponse(response, password, sessionKeys, serverPublicKey, defaultAuthentication)
        }
    }

    // decrypt the user_validator
    const user_validator = cryptoLibrary.decryptDataPublicKey(
        decrypted_response_data.user_validator,
        decrypted_response_data.user_validator_nonce,
        server_session_public_key,
        user_private_key
    );

    // encrypt the validator as verification
    verification = cryptoLibrary.encryptData(user_validator, sessionSecretKey);

    action().setUserUsername(decrypted_response_data.user.username);

    action().setUserInfo2(
        user_private_key,
        decrypted_response_data.user.public_key,
        sessionSecretKey,
        decrypted_response_data.token,
        decrypted_response_data.user.user_sauce,
        authentication
    );

    if (decrypted_response_data.user.hasOwnProperty('language') && i18n.options.supportedLngs.includes(decrypted_response_data.user.language)) {
        i18n.changeLanguage(decrypted_response_data.user.language).then(() => {
            browserClientService.emitSec("language-changed", decrypted_response_data.user.language, function () {});
        });
    }

    if (decrypted_response_data.user.policies) {
        action().setServerPolicy(decrypted_response_data.user.policies);
    }

    action().setHasTwoFactor(decrypted_response_data.required_multifactors > 0);

    return decrypted_response_data;
}

function login(password, serverInfo, sendPlain) {
    const username = getStore().getState().user.username;
    const trustDevice = getStore().getState().user.trustDevice;
    const serverPublicKey = serverInfo.info.public_key;

    const authkey = cryptoLibrary.generateAuthkey(username, password);
    const sessionKeys = cryptoLibrary.generatePublicPrivateKeypair();

    const onSuccess = function (response) {
        return handleLoginResponse(response, password, sessionKeys, serverPublicKey, 'AUTHKEY');
    };

    const onError = function (response) {
        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("non_field_errors")) {
            return Promise.reject(response.data.non_field_errors);
        } else {
            return Promise.reject(response);
        }
    };

    let loginInfo = {
        username: username,
        authkey: authkey,
        device_time: new Date().toISOString(),
        device_fingerprint: device.getDeviceFingerprint(),
        device_description: device.getDeviceDescription(),
    };

    if (sendPlain) {
        loginInfo["password"] = password;
    }

    loginInfo = JSON.stringify(loginInfo);

    // encrypt the login infos
    const loginInfoEnc = cryptoLibrary.encryptDataPublicKey(loginInfo, serverPublicKey, sessionKeys.private_key);

    let sessionDuration = 24 * 60 * 60;
    if (trustDevice) {
        sessionDuration = 24 * 60 * 60 * 30;
    }

    return apiClient
        .login(loginInfoEnc["text"], loginInfoEnc["nonce"], sessionKeys.public_key, sessionDuration)
        .then(onSuccess, onError);
}

/**
 * Initiates the logout, deletes all data including user tokens and session secrets
 *
 * @param {string} msg An optional message to display
 * @param {string|undefined} [postLogoutRedirectUri] An optional post logout redirect url
 * @returns {Promise} Returns a promise with the result
 */
function logout(msg = "", postLogoutRedirectUri = undefined) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    async function logoutLocal() {
        await accountService.updateInfoCurrent({
            'username': "",
            'isLoggedIn': false,
            'server': "",
            'avatar': '',
        });
        await accountService.logoutAll()
        action().disableOfflineMode();
        storage.removeAll();
        storage.save();
        action().logout(getStore().getState().user.rememberMe);
        if (msg) {
            notification.infoSend(msg);
        }
    }

    const onSuccess = async function (result) {
        await logoutLocal();

        accountService.broadcastReinitializeAppEvent();
        accountService.broadcastReinitializeBackgroundEvent();

        const response = {
            "response": "success",
        }

        if (result.data.hasOwnProperty('redirect_url')) {
            response['redirect_url'] = result.data['redirect_url']
        }

        return response;
    };

    const onError = async function () {
        //session expired, so let's delete the local data
        await logoutLocal();

        return {
            "response": "success",
        };
    };

    return apiClient.logout(token, sessionSecretKey, undefined, postLogoutRedirectUri).then(onSuccess, onError);
}

/**
 * Checks if a user is logged in
 *
 * @returns {boolean} Returns whether a user is logged in
 */
function isLoggedIn() {
    return getStore().getState().user.isLoggedIn;
}

/**
 * Deletes an account
 *
 * @param {string} password The old password
 *
 * @returns {Promise} Returns a promise with the result
 */
function deleteAccount(password) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const authkey = cryptoLibrary.generateAuthkey(getStore().getState().user.username, password);

    const onSuccess = function () {
        logout();
    };

    const onError = function (data) {
        return Promise.reject(data.data);
    };

    let pass;
    if (getStore().getState().user.authentication === "LDAP") {
        pass = password;
    }

    return apiClient.deleteAccount(token, sessionSecretKey, authkey, pass).then(onSuccess, onError);
}

/**
 * Update user base settings
 *
 * @param {string|null} email The email of the user
 * @param {string|null} authkey The new authkey of the user
 * @param {string} authkeyOld The old authkey of the user
 * @param {string|null} privateKey The encrypted private key of the user (hex format)
 * @param {string|null} privateKeyNonce The nonce of the private key (hex format)
 * @param {string|null} secretKey The encrypted secret key of the user (hex format)
 * @param {string|null} secretKeyNonce The nonce of the secret key (hex format)
 * @param {string|null} language The new language
 *
 * @returns {Promise} Returns a promise with the update status
 */
function updateUser(email, authkey, authkeyOld, privateKey, privateKeyNonce, secretKey, secretKeyNonce, language) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;
    return apiClient.updateUser(
        token,
        sessionSecretKey,
        email,
        authkey,
        authkeyOld,
        privateKey,
        privateKeyNonce,
        secretKey,
        secretKeyNonce,
        language,
    );
}

/**
 * Saves a new password
 *
 * @param {string} newPassword The new password
 * @param {string} newPasswordRepeat The new password (repeated)
 * @param {string} oldPassword The old password
 *
 * @returns {Promise} Returns a promise with the result
 */
function saveNewPassword(newPassword, newPasswordRepeat, oldPassword) {
    return host.info().then(
        function (info) {
            let authkeyOld,
                newAuthkey,
                userPrivateKey,
                userSecretKey,
                userSauce,
                privKeyEnc,
                secretKeyEnc,
                onSuccess,
                onError;
            const test_error = helperService.isValidPassword(
                newPassword,
                newPasswordRepeat,
                info.data["decoded_info"]["compliance_min_master_password_length"],
                info.data["decoded_info"]["compliance_min_master_password_complexity"]
            );
            if (test_error) {
                return Promise.reject({ errors: [test_error] });
            }

            if (oldPassword === null || oldPassword.length === 0) {
                return Promise.reject({ errors: ["OLD_PASSWORD_REQUIRED"] });
            }

            authkeyOld = cryptoLibrary.generateAuthkey(getStore().getState().user.username, oldPassword);
            newAuthkey = cryptoLibrary.generateAuthkey(getStore().getState().user.username, newPassword);
            userPrivateKey = getStore().getState().user.userPrivateKey;
            userSecretKey = getStore().getState().user.userSecretKey;
            userSauce = getStore().getState().user.userSauce;

            privKeyEnc = cryptoLibrary.encryptSecret(userPrivateKey, newPassword, userSauce);
            secretKeyEnc = cryptoLibrary.encryptSecret(userSecretKey, newPassword, userSauce);

            onSuccess = function (data) {
                return { msgs: ["SAVE_SUCCESS"] };
            };
            onError = function () {
                return Promise.reject({ errors: ["OLD_PASSWORD_INCORRECT"] });
            };

            return updateUser(
                null,
                newAuthkey,
                authkeyOld,
                privKeyEnc.text,
                privKeyEnc.nonce,
                secretKeyEnc.text,
                secretKeyEnc.nonce,
                undefined,
            ).then(onSuccess, onError);
        },
        function (data) {
            console.log(data);
            // handle server is offline
            return Promise.reject({ errors: ["SERVER_OFFLINE"] });
        }
    );
}

/**
 * Saves a new email
 *
 * @param {string} newEmail The new email
 * @param {string|null} verificationPassword The password for verification
 *
 * @returns {Promise} Returns a promise with the result
 */
function saveNewEmail(newEmail, verificationPassword) {
    if (verificationPassword === null || verificationPassword.length === 0) {
        return Promise.reject({ errors: ["OLD_PASSWORD_REQUIRED"] });
    }

    const authkeyOld = cryptoLibrary.generateAuthkey(getStore().getState().user.username, verificationPassword);

    const onSuccess = function (data) {
        action().setEmail(newEmail);
        return { msgs: ["SAVE_SUCCESS"] };
    };
    const onError = function () {
        return Promise.reject({ errors: ["OLD_PASSWORD_INCORRECT"] });
    };
    return updateUser(
        newEmail,
        null,
        authkeyOld,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        ).then(onSuccess, onError);
}

/**
 * Saves a new language
 *
 * @param {string} language The new language
 *
 * @returns {Promise} Returns a promise with the result
 */
function saveNewLanguage(language) {
    const onSuccess = function (data) {
        return { msgs: ["SAVE_SUCCESS"] };
    };
    const onError = function (result) {
        return Promise.reject(result);
    };
    return updateUser(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        language,
    ).then(onSuccess, onError);
}

/**
 * Ajax POST request to destroy the token and recovery_enable the user
 *
 * @param {string} username The username of the user
 * @param {string} recoveryCode The recovery code in base58 format
 * @param {string} server The server to send the recovery code to
 *
 * @returns {Promise} Returns a promise with the recovery_enable status
 */
function recoveryEnable(username, recoveryCode, server) {
    action().setUserUsername(username);
    action().setServerUrl(server);

    const onSuccess = function (data) {
        const recovery_data = JSON.parse(
            cryptoLibrary.decryptSecret(
                data.data.recovery_data,
                data.data.recovery_data_nonce,
                recoveryCode,
                data.data.recovery_sauce
            )
        );

        if (data.data.policies) {
            action().setServerPolicy(data.data.policies);
        }

        return {
            user_private_key: recovery_data.user_private_key,
            user_secret_key: recovery_data.user_secret_key,
            user_sauce: data.data.user_sauce,
            verifier_public_key: data.data.verifier_public_key,
            verifier_time_valid: data.data.verifier_time_valid,
        };
    };
    const recoveryAuthkey = cryptoLibrary.generateAuthkey(username, recoveryCode);

    return apiClient.enableRecoverycode(username, recoveryAuthkey).then(onSuccess);
}

/**
 * Encrypts the recovered data with the new password and initiates the save of this data
 *
 * @param {string} username the account's username e.g dummy@example.com
 * @param {string} recoveryCode The recovery code in base58 format
 * @param {string} password The new password
 * @param {string} userPrivateKey The user's private key
 * @param {string} userSecretKey The user's secret key
 * @param {string} userSauce The user's userSauce
 * @param {string} verifierPublicKey The "verifier" one needs, that the server accepts this new password
 *
 * @returns {Promise} Returns a promise with the set_password status
 */
function setPassword(username, recoveryCode, password, userPrivateKey, userSecretKey, userSauce, verifierPublicKey) {
    const privKeyEnc = cryptoLibrary.encryptSecret(userPrivateKey, password, userSauce);
    const secretKeyEnc = cryptoLibrary.encryptSecret(userSecretKey, password, userSauce);

    const updateRequest = JSON.stringify({
        authkey: cryptoLibrary.generateAuthkey(username, password),
        private_key: privKeyEnc.text,
        private_key_nonce: privKeyEnc.nonce,
        secret_key: secretKeyEnc.text,
        secret_key_nonce: secretKeyEnc.nonce,
    });

    const updateRequestEnc = cryptoLibrary.encryptDataPublicKey(updateRequest, verifierPublicKey, userPrivateKey);

    const onSuccess = function (data) {
        return data;
    };

    const onError = function (data) {
        return data;
    };

    const recovery_authkey = cryptoLibrary.generateAuthkey(username, recoveryCode);

    return apiClient
        .setPassword(username, recovery_authkey, updateRequestEnc.text, updateRequestEnc.nonce)
        .then(onSuccess, onError);
}

/**
 * Ajax POST request to activate the emergency code
 *
 * @param {string} username The username of the user
 * @param {string} emergencyCode The emergency code in base58 format
 * @param {string} server The server to send the recovery code to
 * @param {object} serverInfo Some info about the server including its public key
 * @param {object} verifyKey The signature of the server
 *
 * @returns {Promise} Returns a promise with the emergency code activation status
 */
function armEmergencyCode(username, emergencyCode, server, serverInfo, verifyKey) {
    action().setUserUsername(username);
    action().setServerUrl(server);

    let userSauce;
    let policies;
    let userSecretKey;

    const emergencyAuthkey = cryptoLibrary.generateAuthkey(username, emergencyCode);

    const onSuccess = function (data) {
        if (data.data.status === "started" || data.data.status === "waiting") {
            return data.data;
        }

        const emergency_data = JSON.parse(
            cryptoLibrary.decryptSecret(
                data.data.emergency_data,
                data.data.emergency_data_nonce,
                emergencyCode,
                data.data.emergency_sauce
            )
        );

        userSauce = data.data.user_sauce;
        userSecretKey = emergency_data.user_secret_key;
        policies = data.data.policies;
        const authentication = data.data.authentication ? data.data.authentication : 'AUTHKEY';

        const sessionKey = cryptoLibrary.generatePublicPrivateKeypair();

        const loginInfo = JSON.stringify({
            device_time: new Date().toISOString(),
            device_fingerprint: device.getDeviceFingerprint(),
            device_description: device.getDeviceDescription(),
            session_public_key: sessionKey.public_key,
        });

        const update_request_enc = cryptoLibrary.encryptDataPublicKey(
            loginInfo,
            data.data.verifier_public_key,
            emergency_data.user_private_key
        );

        const onSuccess = function (data) {
            const loginInfo = JSON.parse(
                cryptoLibrary.decryptDataPublicKey(
                    data.data.login_info,
                    data.data.login_info_nonce,
                    serverInfo["public_key"],
                    sessionKey.private_key
                )
            );

            action().setUserInfo2(
                emergency_data.user_private_key,
                loginInfo.user_public_key,
                loginInfo.session_secret_key,
                loginInfo.token,
                userSauce,
                authentication,
            );
            if (policies) {
                action().setServerPolicy(policies);
            }

            let serverSecretExists = false;
            if (loginInfo.hasOwnProperty('authentication')) {
                serverSecretExists = ['SAML', 'OIDC', 'LDAP'].includes(loginInfo.authentication)
                if (loginInfo.hasOwnProperty('server_secret_exists')) {
                    serverSecretExists = loginInfo.server_secret_exists;
                }
            }

            action().setUserInfo3(loginInfo.user_id, loginInfo.user_email, userSecretKey, serverSecretExists);

            return {
                status: "active",
            };
        };

        const onError = function (data) {
            return Promise.reject(data);
        };

        return apiClient
            .activateEmergencyCode(username, emergencyAuthkey, update_request_enc.text, update_request_enc.nonce)
            .then(onSuccess, onError);
    };

    return apiClient.armEmergencyCode(username, emergencyAuthkey).then(onSuccess);
}

/**
 * Checks if the user needs to setup a second factor
 *
 * @return {boolean} Returns whether the user should be forced to setup two factor
 */
function requireTwoFaSetup() {
    return !getStore().getState().user.hasTwoFactor
        && getStore().getState().server.complianceEnforce2fa
        && getStore().getState().server.allowedSecondFactors.length > 0;
}

/**
 * Checks if a server secret is needed or not
 *
 * @return {boolean} Returns whether the user should be forced to configure a server secret or not
 */
function requireServerSecret() {
    const authentication = getStore().getState().user.authentication;
    const complianceServerSecrets = getStore().getState().server.complianceServerSecrets.toLowerCase();

    const lookupTable = {
        'auto': {
            'LDAP': true,
            'SAML': true,
            'OIDC': true,
            'AUTHKEY': false,
        },
        'noone': {
            'LDAP': false,
            'SAML': false,
            'OIDC': false,
            'AUTHKEY': false,
        },
        'all': {
            'LDAP': true,
            'SAML': true,
            'OIDC': true,
            'AUTHKEY': true,
        }
    }

    if (!lookupTable.hasOwnProperty(complianceServerSecrets)) {
        return false;
    }

    if (!lookupTable[complianceServerSecrets].hasOwnProperty(authentication)) {
        return false;
    }

    return lookupTable[complianceServerSecrets][authentication];
}

/**
 * Checks if the user needs to setup a second factor
 *
 * @return {boolean} Returns whether the user should be forced to setup two factor
 */
function requireServerSecretModification() {
    const serverSecretExists = getStore().getState().user.serverSecretExists;
    return requireServerSecret() !== serverSecretExists;
}


/**
 * loads the sessions
 *
 * @returns {Promise} Returns a promise with the sessions
 */
function getSessions() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        return request.data["sessions"];
    };
    const onError = function () {
        // pass
    };
    return apiClient.getSessions(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Deletes an sessions
 *
 * @param {string} sessionId The id of the session to delete
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteSession(sessionId) {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const onSuccess = function (request) {
        // pass
    };
    const onError = function () {
        // pass
    };
    return apiClient.logout(token, sessionSecretKey, sessionId, '').then(onSuccess, onError);
}

/**
 * Responsible for the registration. Generates the users public-private-key-pair together with the secret
 * key and the user sauce. Encrypts the sensible data before initiating the register call with the api client.
 *
 * @param {email} email The email to register with
 * @param {string} username The username to register with
 * @param {string} password The password to register with
 * @param {string} server The server to send the registration to
 *
 * @returns {Promise} promise
 */
function register(email, username, password, server) {

    const onSuccess = function(base_url){

        //managerBase.delete_local_data();

        // storage.upsert('config', {key: 'user_email', value: email});
        // storage.upsert('config', {key: 'user_username', value: username});
        // storage.upsert('config', {key: 'server', value: server});

        const pair = cryptoLibrary.generatePublicPrivateKeypair();
        const userSauce = cryptoLibrary.generateUserSauce();

        const privateKeyEncrypted = cryptoLibrary.encryptSecret(pair.private_key, password, userSauce);
        const secretKeyEncrypted = cryptoLibrary
            .encryptSecret(cryptoLibrary.generateSecretKey(), password, userSauce);

        const onSuccess = function () {

            storage.save();

            return {
                response:"success"
            };
        };

        const onError = function(response){

            // storage.remove('config', storage.find_key('config', 'user_email'));
            // storage.remove('config', storage.find_key('config', 'server'));
            storage.save();

            return {
                response:"error",
                error_data: response.data
            };
        };

        return apiClient.register(email, username, cryptoLibrary.generateAuthkey(username, password), pair.public_key,
            privateKeyEncrypted.text, privateKeyEncrypted.nonce, secretKeyEncrypted.text, secretKeyEncrypted.nonce, userSauce,
            base_url)
            .then(onSuccess, onError);

    };

    const onError = function(){

    };

    return browserClient.getBaseUrl().then(onSuccess, onError)

}

const userService = {
    activateCode,
    initiateLogin,
    samlLogin,
    initiateSamlLogin,
    getSamlRedirectUrl,
    oidcLogin,
    initiateOidcLogin,
    getOidcRedirectUrl,
    login,
    activateToken,
    gaVerify,
    duoVerify,
    yubikeyOtpVerify,
    logout,
    isLoggedIn,
    deleteAccount,
    saveNewPassword,
    saveNewEmail,
    saveNewLanguage,
    recoveryEnable,
    setPassword,
    armEmergencyCode,
    requireTwoFaSetup,
    requireServerSecret,
    requireServerSecretModification,
    getSessions,
    deleteSession,
    register,
};

export default userService;
