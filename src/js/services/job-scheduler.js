/**
 * Service that is something like the base class for adf widgets
 */

import apiClient from "./api-client";
import cryptoLibraryService from "./crypto-library";
import hostService from "./host";
import offlineCache from "./offline-cache";
import { getStore } from "./store";

const intervalTime = 600000; // in ms, 600000 = 600s = 10min

const jobProcessors = {
	users_missing_admin_secrets: processUserMissingAdminSecret,
	groups_missing_admin_secrets: processGroupMissingAdminSecret,
	staff_missing_group_secrets: processStaffMissingGroupSecrets,
	memberships_missing_group_secrets: processMembershipMissingGroupSecret,
};

activate();

function activate() {
	setInterval(checkForJobs, intervalTime);
}

function getAdminRecoveryPublicKey(publicKey) {
	return typeof publicKey === "string" && /^[0-9a-fA-F]{64}$/.test(publicKey)
		? publicKey
		: null;
}

/**
 * Adds the logged-in user's keys to admin recovery.
 *
 * @returns {Promise} Returns a promise with the current job
 */
async function processUserMissingAdminSecret(_job, adminRecoveryPublicKey) {
	if (!canProcessJob()) {
		return;
	}

	const state = getStore().getState();
	if (!adminRecoveryPublicKey) {
		return;
	}

	const encryptedPrivateKey = cryptoLibraryService.encryptDataPublicKey(
		state.user.userPrivateKey,
		adminRecoveryPublicKey,
		state.user.userPrivateKey,
	);
	const encryptedSecretKey = cryptoLibraryService.encryptDataPublicKey(
		state.user.userSecretKey,
		adminRecoveryPublicKey,
		state.user.userPrivateKey,
	);

	await apiClient.createJobUserMissingAdminSecret(
		state.user.token,
		state.user.sessionSecretKey,
		encryptedPrivateKey.text,
		encryptedPrivateKey.nonce,
		encryptedSecretKey.text,
		encryptedSecretKey.nonce,
	);
}

/**
 * Decrypts a group's keys and adds them to admin recovery.
 *
 * @param {object} job The actual job details
 *
 * @returns {Promise} Returns a promise with the current job
 */
async function processGroupMissingAdminSecret(job, adminRecoveryPublicKey) {
	if (!canProcessJob()) {
		return;
	}

	const state = getStore().getState();
	if (!adminRecoveryPublicKey) {
		return;
	}

	let secretKey;
	if (job.secret_key_type === "symmetric") {
		secretKey = cryptoLibraryService.decryptSecretKey(
			job.secret_key,
			job.secret_key_nonce,
		);
	} else {
		secretKey = cryptoLibraryService.decryptPrivateKey(
			job.secret_key,
			job.secret_key_nonce,
			job.public_key,
		);
	}

	let privateKey;
	if (job.private_key_type === "symmetric") {
		privateKey = cryptoLibraryService.decryptSecretKey(
			job.private_key,
			job.private_key_nonce,
		);
	} else {
		privateKey = cryptoLibraryService.decryptPrivateKey(
			job.private_key,
			job.private_key_nonce,
			job.public_key,
		);
	}

	const encryptedPrivateKey = cryptoLibraryService.encryptDataPublicKey(
		privateKey,
		adminRecoveryPublicKey,
		privateKey,
	);
	const encryptedSecretKey = cryptoLibraryService.encryptDataPublicKey(
		secretKey,
		adminRecoveryPublicKey,
		privateKey,
	);

	await apiClient.createJobGroupMissingAdminSecret(
		state.user.token,
		state.user.sessionSecretKey,
		job.group_id,
		encryptedPrivateKey.text,
		encryptedPrivateKey.nonce,
		encryptedSecretKey.text,
		encryptedSecretKey.nonce,
	);
}

function canProcessJob() {
	const isLoggedIn = getStore().getState().user.isLoggedIn;
	const isOffline = offlineCache.isActive();

	return (
		isLoggedIn &&
		!isOffline &&
		hostService.isEE() &&
		hostService.isNewerOrEqualVersionThan("5.3.2")
	);
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
		secretKey = cryptoLibraryService.decryptSecretKey(
			job.secret_key,
			job.secret_key_nonce,
		);
	} else {
		secretKey = cryptoLibraryService.decryptPrivateKey(
			job.secret_key,
			job.secret_key_nonce,
			job.public_key,
		);
	}

	let privateKey;
	if (job.private_key_type === "symmetric") {
		privateKey = cryptoLibraryService.decryptSecretKey(
			job.private_key,
			job.private_key_nonce,
		);
	} else {
		privateKey = cryptoLibraryService.decryptPrivateKey(
			job.private_key,
			job.private_key_nonce,
			job.public_key,
		);
	}

	const encryptedSecretKey = cryptoLibraryService.encryptDataPublicKey(
		secretKey,
		job.missing_user_public_key,
		privateKey,
	);
	const encryptedPrivateKey = cryptoLibraryService.encryptDataPublicKey(
		privateKey,
		job.missing_user_public_key,
		privateKey,
	);

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
		);
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
		secretKey = cryptoLibraryService.decryptSecretKey(
			job.secret_key,
			job.secret_key_nonce,
		);
	} else {
		secretKey = cryptoLibraryService.decryptPrivateKey(
			job.secret_key,
			job.secret_key_nonce,
			job.public_key,
		);
	}

	let privateKey;
	if (job.private_key_type === "symmetric") {
		privateKey = cryptoLibraryService.decryptSecretKey(
			job.private_key,
			job.private_key_nonce,
		);
	} else {
		privateKey = cryptoLibraryService.decryptPrivateKey(
			job.private_key,
			job.private_key_nonce,
			job.public_key,
		);
	}

	const encryptedSecretKey = cryptoLibraryService.encryptDataPublicKey(
		secretKey,
		job.missing_user_public_key,
		privateKey,
	);
	const encryptedPrivateKey = cryptoLibraryService.encryptDataPublicKey(
		privateKey,
		job.missing_user_public_key,
		privateKey,
	);

	try {
		await apiClient.createMembershipMissingGroupSecret(
			token,
			sessionSecretKey,
			job.missing_user_membership_id,
			encryptedSecretKey.text,
			encryptedSecretKey.nonce,
			encryptedPrivateKey.text,
			encryptedPrivateKey.nonce,
		);
	} catch (e) {
		//pass
		console.log(e);
	}
}

/**
 * Queries the server for the current job of the user if the local cached job is outdated.
 *
 * @returns {Promise} Returns a promise with the current job
 */
function checkForJobs() {
	if (!canProcessJob()) {
		return Promise.resolve();
	}

	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const serverUrl = getStore().getState().server.url;

	const onError = () => {
		// pass
	};

	const onSuccess = async (content) => {
		const outstandingJobs = content.data;
		const hasAdminRecoveryJobs = [
			"users_missing_admin_secrets",
			"groups_missing_admin_secrets",
		].some(
			(jobId) =>
				Object.hasOwn(outstandingJobs, jobId) &&
				outstandingJobs[jobId].length > 0,
		);
		const adminRecoveryPublicKey = hasAdminRecoveryJobs
			? await getCurrentAdminRecoveryPublicKey(serverUrl, token)
			: null;

		for (const jobId in jobProcessors) {
			if (
				getStore().getState().server.url !== serverUrl ||
				getStore().getState().user.token !== token
			) {
				return;
			}
			if (
				(jobId === "users_missing_admin_secrets" ||
					jobId === "groups_missing_admin_secrets") &&
				!adminRecoveryPublicKey
			) {
				continue;
			}
			if (
				Object.hasOwn(outstandingJobs, jobId) &&
				outstandingJobs[jobId].length > 0
			) {
				for (let i = 0; i < outstandingJobs[jobId].length; i++) {
					if (
						getStore().getState().server.url !== serverUrl ||
						getStore().getState().user.token !== token ||
						((jobId === "users_missing_admin_secrets" ||
							jobId === "groups_missing_admin_secrets") &&
							getAdminRecoveryPublicKey(
								getStore().getState().server.adminRecoveryPublicKey,
							) !== adminRecoveryPublicKey)
					) {
						return;
					}
					try {
						await jobProcessors[jobId](
							outstandingJobs[jobId][i],
							adminRecoveryPublicKey,
						);
					} catch (e) {
						// A malformed job must not prevent later jobs from being processed.
						console.log(e);
					}
				}
			}
		}
	};

	return apiClient.readJob(token, sessionSecretKey).then(onSuccess, onError);
}

async function getCurrentAdminRecoveryPublicKey(
	expectedServerUrl,
	expectedToken,
) {
	const state = getStore().getState();
	const activePublicKey = getAdminRecoveryPublicKey(
		state.server.adminRecoveryPublicKey,
	);
	const serverUrl = state.server.url;
	const token = state.user.token;
	if (
		!activePublicKey ||
		!serverUrl ||
		serverUrl !== expectedServerUrl ||
		token !== expectedToken
	) {
		return null;
	}

	let result;
	try {
		result = await hostService.checkHost(serverUrl);
	} catch (_error) {
		return null;
	}
	const currentState = getStore().getState();
	if (
		result.status !== "matched" ||
		result.server_url !== serverUrl.toLowerCase() ||
		currentState.server.url !== serverUrl ||
		currentState.user.token !== token ||
		getAdminRecoveryPublicKey(result.admin_recovery_public_key) !==
			activePublicKey
	) {
		return null;
	}

	return activePublicKey;
}

const jobSchedulerService = {
	checkForJobs: checkForJobs,
};
export default jobSchedulerService;
