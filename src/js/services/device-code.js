import apiClient from './api-client';
import cryptoLibrary from './crypto-library';
import { getStore } from './store';

/**
 * Claims a device code by sending an encrypted JSON blob of user secrets to the backend.
 *
 * @param {string} deviceCodeId The ID of the device code to claim.
 * @param {string} deviceCodeSecretBoxKey The symmetric key to encrypt the secrets.
 *
 * @returns {Promise} The promise from the API call.
 */
async function claimDeviceCode(deviceCodeId, deviceCodeSecretBoxKey) {
    const store = getStore();
    const state = store.getState();

    const {
        userPrivateKey,
        userSecretKey,
        userSauce,
        token,
        sessionSecretKey,
    } = state.user;

    if (!userPrivateKey || !userSecretKey || !userSauce) {
        console.error("User secrets not available in store for device code claim.");
        return Promise.reject({data: {detail: "MISSING_DEVICE_CODE_INFORMATION"}});
    }

    if (!token || !sessionSecretKey) {
        console.error("Authentication token or session secret key not available for device code claim.");
        return Promise.reject({data: {detail: "USER_AUTHENTICATION_REQUIRED"}});
    }

    const credentialsToEncrypt = {
        user_private_key: userPrivateKey,
        user_secret_key: userSecretKey,
        user_sauce: userSauce,
    };

    let encryptedCredentials;
    try {
        encryptedCredentials = cryptoLibrary.encryptData(JSON.stringify(credentialsToEncrypt), deviceCodeSecretBoxKey);
    } catch (error) {
        console.error("Error encrypting credentials bundle for device code claim:", error);
        // Likely caused by an invalid or malformed secret in the device code link
        return Promise.reject({data: {detail: "DEVICE_CODE_SECRET_INVALID"}});
    }

    return apiClient.claimDeviceCode(
        token,
        sessionSecretKey,
        deviceCodeId, 
        encryptedCredentials.text, 
        encryptedCredentials.nonce
    );
}

const deviceCodeService = {
    claimDeviceCode,
};

export default deviceCodeService; 
