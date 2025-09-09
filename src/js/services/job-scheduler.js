/**
 * Service that is something like the base class for adf widgets
 */

import apiClient from "./api-client";
import offlineCache from "./offline-cache";
import { getStore } from "./store";
import hostService from "./host";
import cryptoLibraryService from "./crypto-library";
const intervalTime = 600000; // in ms, 600000 = 600s = 10min

const jobProcessors = {
    'staff_missing_group_secrets': processStaffMissingGroupSecrets,
    'memberships_missing_group_secrets': processMembershipMissingGroupSecret,
}

activate();

function activate() {
    setInterval(checkForJobs, intervalTime);
}

function canProcessJob() {

    const isLoggedIn = getStore().getState().user.isLoggedIn;
    const isOffline = offlineCache.isActive();

    return isLoggedIn && !isOffline && hostService.isEE() && hostService.isNewerOrEqualVersionThan('5.3.2');
}

/**
 * Processes staff missing group secrets jobs
 *
 * @param {object} job The actual job details
 *
 * @returns {Promise} Returns a promise with the current job
 */
async function processStaffMissingGroupSecrets(job) {
    if (!canProcessJob()) {
        return Promise.resolve();
    }

    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    let secretKey;
    if (job.secret_key_type === "symmetric") {
        secretKey = cryptoLibraryService.decryptSecretKey(job.secret_key, job.secret_key_nonce);
    } else {
        secretKey = cryptoLibraryService.decryptPrivateKey(
            job.secret_key,
            job.secret_key_nonce,
            job.public_key
        );
    }

    let privateKey;
    if (job.private_key_type === "symmetric") {
        privateKey = cryptoLibraryService.decryptSecretKey(job.private_key, job.private_key_nonce);
    } else {
        privateKey = cryptoLibraryService.decryptPrivateKey(
            job.private_key,
            job.private_key_nonce,
            job.public_key
        );
    }

    const encryptedSecretKey = cryptoLibraryService.encryptDataPublicKey(secretKey, job.missing_user_public_key, privateKey);
    const encryptedPrivateKey = cryptoLibraryService.encryptDataPublicKey(privateKey, job.missing_user_public_key, privateKey);

    try {
        await apiClient.createJobStaffMissingGroupSecret(
            token,
            sessionSecretKey,
            job.missing_user_user_id,
            job.group_id,
            encryptedSecretKey.text,
            encryptedSecretKey.nonce,
            encryptedPrivateKey.text,
            encryptedPrivateKey.nonce,

        )
    } catch (e) {
        //pass
        console.log(e);
    }

}


/**
 Processes membership missing group secrets
 *
 * @param {object} job The actual job details
 *
 * @returns {Promise} Returns a promise with the current job
 */
async function processMembershipMissingGroupSecret(job) {
    if (!canProcessJob()) {
        return Promise.resolve();
    }

    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;

    let secretKey;
    if (job.secret_key_type === "symmetric") {
        secretKey = cryptoLibraryService.decryptSecretKey(job.secret_key, job.secret_key_nonce);
    } else {
        secretKey = cryptoLibraryService.decryptPrivateKey(
            job.secret_key,
            job.secret_key_nonce,
            job.public_key
        );
    }

    let privateKey;
    if (job.private_key_type === "symmetric") {
        privateKey = cryptoLibraryService.decryptSecretKey(job.private_key, job.private_key_nonce);
    } else {
        privateKey = cryptoLibraryService.decryptPrivateKey(
            job.private_key,
            job.private_key_nonce,
            job.public_key
        );
    }

    const encryptedSecretKey = cryptoLibraryService.encryptDataPublicKey(secretKey, job.missing_user_public_key, privateKey);
    const encryptedPrivateKey = cryptoLibraryService.encryptDataPublicKey(privateKey, job.missing_user_public_key, privateKey);

    try {
        await apiClient.createMembershipMissingGroupSecret(
            token,
            sessionSecretKey,
            job.missing_user_membership_id,
            encryptedSecretKey.text,
            encryptedSecretKey.nonce,
            encryptedPrivateKey.text,
            encryptedPrivateKey.nonce,
        )
    } catch (e) {
        //pass
        console.log(e);
    }

}


/**
 * Queries the server for the current job of the user if the local cached job is outdated.
 *
 * @param {boolean} [forceFresh] Whether a fresh result should be fetched or a cache will do fine
 *
 * @returns {Promise} Returns a promise with the current job
 */
function checkForJobs(forceFresh) {

    if (!canProcessJob()) {
        return Promise.resolve();
    }

    const token = getStore().getState().user.token;
    const sessionSecretKey = getStore().getState().user.sessionSecretKey;


    const onError = function (result) {
        // pass
    };

    const onSuccess = async function (content) {
        const outstandingJobs = content.data;

        for (const jobId in jobProcessors) {
            if (outstandingJobs.hasOwnProperty(jobId) && outstandingJobs[jobId].length > 0) {
                for (let i = 0; i < outstandingJobs[jobId].length; i++) {
                    await jobProcessors[jobId](outstandingJobs[jobId][i]);
                }
            }
        }

    };

    return apiClient.readJob(token, sessionSecretKey).then(onSuccess, onError);

}

const jobSchedulerService = {
    checkForJobs: checkForJobs,
};
export default jobSchedulerService;
