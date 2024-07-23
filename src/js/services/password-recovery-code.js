/**
 * Recovery codes and all the functions to create / edit / delete them ...
 */

import { getStore } from "./store";
import helperService from "./helper";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";

/**
 * Encrypts the recovery data and sends it to the server.
 *
 * @returns {promise} Returns a promise with the username, recovery_code_id and private_key to decrypt the saved data
 */
async function recoveryGenerateInformation() {
    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    const recoveryPassword = cryptoLibrary.generateRecoveryCode();
    const recoveryAuthkey = await cryptoLibrary.generateAuthkey(getStore().getState().user.username, recoveryPassword["base58"]);
    const recoverySauce = cryptoLibrary.generateUserSauce();

    const recovery_data_dec = {
        user_private_key: getStore().getState().user.userPrivateKey,
        user_secret_key: getStore().getState().user.userSecretKey,
    };

    const recovery_data = await cryptoLibrary.encryptSecret(
        JSON.stringify(recovery_data_dec),
        recoveryPassword["base58"],
        recoverySauce
    );

    const onSuccess = function () {
        return {
            username: getStore().getState().user.username,
            recovery_password: helperService.splitStringInChunks(recoveryPassword["base58_checksums"], 13).join("-"),
            recovery_words: recoveryPassword["words"].join(" "),
        };
    };

    return apiClient
        .writeRecoverycode(
            token,
            sessionSecretKey,
            recoveryAuthkey,
            recovery_data.text,
            recovery_data.nonce,
            recoverySauce
        )
        .then(onSuccess);
}

const passwordRecoveryCodeService = {
    recoveryGenerateInformation,
};

export default passwordRecoveryCodeService;
