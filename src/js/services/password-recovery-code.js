/**
 * Recovery codes and all the functions to create / edit / delete them ...
 */

import store from "./store";
import helperService from "./helper";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";

/**
 * Encrypts the recovery data and sends it to the server.
 *
 * @returns {promise} Returns a promise with the username, recovery_code_id and private_key to decrypt the saved data
 */
function recoveryGenerateInformation() {
    const token = store.getState().user.token;
    const sessionSecretKey = store.getState().user.sessionSecretKey;

    const recoveryPassword = cryptoLibrary.generateRecoveryCode();
    const recoveryAuthkey = cryptoLibrary.generateAuthkey(store.getState().user.username, recoveryPassword["base58"]);
    const recoverySauce = cryptoLibrary.generateUserSauce();

    const recovery_data_dec = {
        user_private_key: store.getState().user.userPrivateKey,
        user_secret_key: store.getState().user.userSecretKey,
    };

    const recovery_data = cryptoLibrary.encryptSecret(JSON.stringify(recovery_data_dec), recoveryPassword["base58"], recoverySauce);

    const onSuccess = function () {
        return {
            username: store.getState().user.username,
            recovery_password: helperService.splitStringInChunks(recoveryPassword["base58_checksums"], 13).join("-"),
            recovery_words: recoveryPassword["words"].join(" "),
        };
    };

    return apiClient.writeRecoverycode(token, sessionSecretKey, recoveryAuthkey, recovery_data.text, recovery_data.nonce, recoverySauce).then(onSuccess);
}

const service = {
    recoveryGenerateInformation,
};

export default service;
