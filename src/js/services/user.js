/**
 * Users service, everything about login / logout ...
 */

import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import helper from "./helper";
import host from "./host";
import notification from "./notification";
import store from "./store";
import device from "./device";

let session_password = "";
let verification = {};
let redirectOnTwoFaMissing;

/**
 * Updates the global state with username, server, remember_me and trust_device
 * Returns the result of check_host
 *
 * @param username
 * @param server
 * @param remember_me
 * @param trust_device
 * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
 *
 * @returns {Promise}
 */
function initiateLogin(username, server, remember_me, trust_device, two_fa_redirect) {
    redirectOnTwoFaMissing = two_fa_redirect;
    action.setServerUrl(server);
    let parsed_url = helper.parseUrl(server);

    username = helper.formFullUsername(username, parsed_url["full_domain"]);
    action.setUserUsername(username);
    action.setUserInfo1(remember_me, trust_device, "AUTHKEY");

    return host.checkHost(server).then((response) => {
        return response;
    });
}

/**
 * Checks if an autologin for saml needs to be triggered
 */
function onPotentialSamlAutologin() {
    if (typeof $routeParams.saml_autologin_provider_id === "undefined") {
        return;
    }
    for (var i = 0; i < $scope.saml_provider.length; i++) {
        if ($scope.saml_provider[i].provider_id.toString() !== $routeParams.saml_autologin_provider_id) {
            continue;
        }
        initiateSamlLogin(
            $scope.saml_provider[i],
            $routeParams.remember === "true",
            $routeParams.trust_device === "true",
            $routeParams.two_fa_redirect === "true"
        );
        $location.path("/");
        return;
    }
}

/**
 * Checks if an autologin for oidc needs to be triggered
 */
function onPotentialOidcAutologin() {
    if (typeof $routeParams.oidc_autologin_provider_id === "undefined") {
        return;
    }
    for (var i = 0; i < $scope.oidc_provider.length; i++) {
        if ($scope.oidc_provider[i].provider_id.toString() !== $routeParams.oidc_autologin_provider_id) {
            continue;
        }
        initiateOidcLogin(
            $scope.oidc_provider[i],
            $routeParams.remember === "true",
            $routeParams.trust_device === "true",
            $routeParams.two_fa_redirect === "true"
        );
        $location.path("/");
        return;
    }
}

/**
 * Triggered once someone clicks the login button for a SAML provider in the panel and will initiate the
 * login sequence in a new tab
 *
 * @param {string} provider The provider config from config.json passed down
 * @param {boolean|undefined} remember Remember username and server
 * @param {boolean|undefined} trustDevice Trust the device for 30 days or logout when browser closes
 * @param {boolean} twoFaFedirect Redirect user to enforce-two-fa.html or let another controller handle it
 */
function initiateSamlLoginNewTab(provider, remember, trustDevice, twoFaFedirect) {
    browserClient.openTab(
        "index.html#!/initiate-saml-login/" + provider.provider_id + "/" + (remember === true) + "/" + (trustDevice === true) + "/" + (twoFaFedirect === true)
    );
}

/**
 * Triggered once someone clicks the login button for a OIDC provider in the panel and will initiate the
 * login sequence in a new tab
 *
 * @param {string} provider The provider config from config.json passed down
 * @param {boolean|undefined} remember Remember username and server
 * @param {boolean|undefined} trust_device Trust the device for 30 days or logout when browser closes
 * @param {boolean} two_fa_redirect Redirect user to enforce-two-fa.html or let another controller handle it
 */
function initiateOidcLoginNewTab(provider, remember, trust_device, two_fa_redirect) {
    browserClient.open_tab(
        "index.html#!/initiate-oidc-login/" +
            provider.provider_id +
            "/" +
            (remember === true) +
            "/" +
            (trust_device === true) +
            "/" +
            (two_fa_redirect === true)
    );
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
    const server_public_key = store.getState().server.publicKey;
    const session_keys = cryptoLibrary.generatePublicPrivateKeypair();
    const onSuccess = function (response) {
        response.data = JSON.parse(
            cryptoLibrary.decryptDataPublicKey(response.data.login_info, response.data.login_info_nonce, server_public_key, session_keys.private_key)
        );
        const server_session_public_key = response.data.server_session_public_key;

        response.data = JSON.parse(
            cryptoLibrary.decryptDataPublicKey(response.data.data, response.data.data_nonce, server_session_public_key, session_keys.private_key)
        );

        // decrypt user private key
        const user_private_key = cryptoLibrary.decryptSecret(
            response.data.user.private_key,
            response.data.user.private_key_nonce,
            response.data.password,
            response.data.user.user_sauce
        );
        session_password = response.data.password;

        // decrypt the user_validator
        const user_validator = cryptoLibrary.decryptDataPublicKey(
            response.data.user_validator,
            response.data.user_validator_nonce,
            server_session_public_key,
            user_private_key
        );

        // encrypt the validator as verification
        verification = cryptoLibrary.encryptData(user_validator, response.data.session_secret_key);

        action.setUserUsername(response.data.user.username);

        action.setUserInfo2(
            user_private_key,
            response.data.user.public_key,
            response.data.session_secret_key,
            response.data.token,
            response.data.user.user_sauce
        );

        return response.data.required_multifactors;
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
    const loginInfoEnc = cryptoLibrary.encryptDataPublicKey(login_info, server_public_key, session_keys.private_key);

    let sessionDuration = 24 * 60 * 60;

    return apiClient.samlLogin(loginInfoEnc["text"], loginInfoEnc["nonce"], session_keys.public_key, sessionDuration).then(onSuccess, onError);
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
    action.setServerUrl(server);
    action.setUserInfo1(rememberMe, trustDevice, "SAML");

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
    const server_public_key = store.getState().server.publicKey;
    const session_keys = cryptoLibrary.generatePublicPrivateKeypair();
    const onSuccess = function (response) {
        response.data = JSON.parse(
            cryptoLibrary.decryptDataPublicKey(response.data.login_info, response.data.login_info_nonce, server_public_key, session_keys.private_key)
        );
        const server_session_public_key = response.data.server_session_public_key;

        response.data = JSON.parse(
            cryptoLibrary.decryptDataPublicKey(response.data.data, response.data.data_nonce, server_session_public_key, session_keys.private_key)
        );

        // decrypt user private key
        const user_private_key = cryptoLibrary.decryptSecret(
            response.data.user.private_key,
            response.data.user.private_key_nonce,
            response.data.password,
            response.data.user.user_sauce
        );
        session_password = response.data.password;

        // decrypt the user_validator
        const user_validator = cryptoLibrary.decryptDataPublicKey(
            response.data.user_validator,
            response.data.user_validator_nonce,
            server_session_public_key,
            user_private_key
        );

        // encrypt the validator as verification
        verification = cryptoLibrary.encryptData(user_validator, response.data.session_secret_key);

        action.setUserUsername(response.data.user.username);

        action.setUserInfo2(
            user_private_key,
            response.data.user.public_key,
            response.data.session_secret_key,
            response.data.token,
            response.data.user.user_sauce
        );

        return response.data.required_multifactors;
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
    const loginInfoEnc = cryptoLibrary.encryptDataPublicKey(login_info, server_public_key, session_keys.private_key);

    let sessionDuration = 24 * 60 * 60;

    return apiClient.oidcLogin(loginInfoEnc["text"], loginInfoEnc["nonce"], session_keys.public_key, sessionDuration).then(onSuccess, onError);
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
    action.setServerUrl(server);
    action.setUserInfo1(rememberMe, trustDevice, "OIDC");

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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

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
 * @param {string} yubikey_otp The YubiKey OTP token
 *
 * @returns Promise Returns a promise with the login status
 */
function yubikeyOtpVerify(yubikey_otp) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    return apiClient.yubikeyOtpVerify(token, yubikey_otp, sessionSecretKey).catch((response) => {
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
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;
    const user_sauce = store.getState().user.userSauce;

    const onSuccess = function (activation_data) {
        // decrypt user secret key
        const user_secret_key = cryptoLibrary.decryptSecret(
            activation_data.data.user.secret_key,
            activation_data.data.user.secret_key_nonce,
            session_password,
            user_sauce
        );

        action.setUserInfo3(activation_data.data.user.id, activation_data.data.user.email, user_secret_key);

        // no need anymore for the public / private session keys
        session_password = "";
        verification = {};

        return {
            response: "success",
        };
    };

    return apiClient.activateToken(token, verification.text, verification.nonce, sessionSecretKey).then(onSuccess);
}

/**
 * handles the response of the login with all the necessary cryptography and returns the required multifactors
 *
 * @param {object} response The login response
 * @param {string} password The password
 * @param {object} session_keys The session keys
 * @param {string} server_public_key The server's public key
 *
 * @returns {Array} The list of required multifactor challenges to solve
 */
function handleLoginResponse(response, password, session_keys, server_public_key) {
    response.data = JSON.parse(
        cryptoLibrary.decryptDataPublicKey(response.data.login_info, response.data.login_info_nonce, server_public_key, session_keys.private_key)
    );

    const token = response.data.token;
    const user_sauce = response.data.user.user_sauce;
    const user_public_key = response.data.user.public_key;
    session_password = password;

    // decrypt the session key
    const sessionSecretKey = cryptoLibrary.decryptDataPublicKey(
        response.data.session_secret_key,
        response.data.session_secret_key_nonce,
        response.data.session_public_key,
        session_keys.private_key
    );

    // decrypt user private key
    const user_private_key = cryptoLibrary.decryptSecret(response.data.user.private_key, response.data.user.private_key_nonce, password, user_sauce);

    // decrypt the user_validator
    const user_validator = cryptoLibrary.decryptDataPublicKey(
        response.data.user_validator,
        response.data.user_validator_nonce,
        response.data.session_public_key,
        user_private_key
    );

    // encrypt the validator as verification
    verification = cryptoLibrary.encryptData(user_validator, sessionSecretKey);

    action.setUserInfo2(user_private_key, user_public_key, sessionSecretKey, token, user_sauce);

    return response.data["required_multifactors"];
}

function login(password, server_info, send_plain) {
    const username = store.getState().user.username;
    const trust_device = store.getState().user.trustDevice;
    const server_public_key = server_info.info.public_key;

    const authkey = cryptoLibrary.generateAuthkey(username, password);

    const session_keys = cryptoLibrary.generatePublicPrivateKeypair();

    const onSuccess = function (response) {
        return handleLoginResponse(response, password, session_keys, server_public_key);
    };

    const onError = function (response) {
        if (response.hasOwnProperty("data") && response.data.hasOwnProperty("non_field_errors")) {
            return Promise.reject(response.data.non_field_errors);
        } else {
            return Promise.reject(response);
        }
    };

    let login_info = {
        username: username,
        authkey: authkey,
        device_time: new Date().toISOString(),
        device_fingerprint: device.getDeviceFingerprint(),
        device_description: device.getDeviceDescription(),
    };

    if (send_plain) {
        login_info["password"] = password;
    }

    login_info = JSON.stringify(login_info);

    // encrypt the login infos
    const login_info_enc = cryptoLibrary.encryptDataPublicKey(login_info, server_public_key, session_keys.private_key);

    let session_duration = 24 * 60 * 60;
    if (trust_device) {
        session_duration = 24 * 60 * 60 * 30;
    }

    return apiClient.login(login_info_enc["text"], login_info_enc["nonce"], session_keys.public_key, session_duration).then(onSuccess, onError);
}

/**
 * Initiates the logout, deletes all data including user tokens and session secrets
 *
 * @param {string} msg An optional message to display
 */
function logout(msg = "") {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    apiClient.logout(token, sessionSecretKey);
    action.logout(store.getState().user.rememberMe);
    if (msg) {
        notification.infoSend(msg);
    }
}

/**
 * Checks if a user is logged in
 *
 * @returns {boolean} Returns whether a user is logged in
 */
function isLoggedIn() {
    return store.getState().user.isLoggedIn;
}

/**
 * Deletes an account
 *
 * @param {string} password The old password
 *
 * @returns {Promise} Returns a promise with the result
 */
function deleteAccount(password) {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const authkey = cryptoLibrary.generateAuthkey(store.getState().user.username, password);

    const onSuccess = function () {
        logout();
    };

    const onError = function (data) {
        return Promise.reject(data.data);
    };

    let pass;
    if (store.getState().user.authentication === "LDAP") {
        pass = password;
    }

    return apiClient.deleteAccount(token, sessionSecretKey, authkey, pass).then(onSuccess, onError);
}

const service = {
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
    onPotentialSamlAutologin,
    onPotentialOidcAutologin,
    initiateSamlLoginNewTab,
    initiateOidcLoginNewTab,
    isLoggedIn,
    deleteAccount,
};

export default service;