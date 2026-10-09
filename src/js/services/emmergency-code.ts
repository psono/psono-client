/**
 * Emergency codes and all the functions to create / edit / delete them ...
 */

import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import { getStore } from "./store";
import {
	generateEmergencyCode,
	LEGACY_EMERGENCY_PARAMETERS,
} from "./emergency-code-format";
import type { AuthResponse, EmergencyCode } from "../../types/auth";

/**
 * Returns a list of configured emergency codes
 *
 * @returns {Promise} Returns a promise with the emergency codes
 */
function readEmergencyCodes(): Promise<EmergencyCode[] | void> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (
		request: AuthResponse<{ emegency_codes: EmergencyCode[] }>,
	) => request.data["emegency_codes"];
	const onError = () => {
		// pass
	};
	return apiClient
		.readEmergencyCodes(token, sessionSecretKey)
		.then(onSuccess, onError);
}

/**
 * Creates the emergency code. Will
 *
 * @param {string} title The title of the emergency code
 * @param {int} leadTime The lead time till someone can activate this code in seconds
 *
 * @returns {Promise} Returns a promise with the emergency code
 */
async function createEmergencyCode(
	title: string,
	leadTime: number,
): Promise<{
	username: string;
	emergency_password: string;
	emergency_words: string;
}> {
	const state = getStore().getState();
	if (state.client?.offlineMode) {
		throw new Error("Leave offline mode before creating emergency codes.");
	}
	const token = state.user.token;
	const sessionSecretKey = state.user.sessionSecretKey;
	const username = state.user.username;
	const settings = await apiClient.readEmergencyCodes(token, sessionSecretKey);

	const hashingAlgorithm =
		settings.data.default_hashing_algorithm ??
		state.user.defaultHashingAlgorithm ??
		"scrypt";
	const hashingParameters = {
		...LEGACY_EMERGENCY_PARAMETERS,
		...(settings.data.default_hashing_parameters ??
			state.user.defaultHashingParameters),
	};
	const emergencyPassword = generateEmergencyCode(
		hashingAlgorithm,
		hashingParameters,
	);
	const emergencyAuthkey = cryptoLibrary.generateAuthkey(
		username,
		emergencyPassword["base58"],
		hashingAlgorithm,
		hashingParameters,
	);
	const emergencySauce = cryptoLibrary.generateUserSauce();

	const emergencyDataDec = {
		user_private_key: state.user.userPrivateKey,
		user_secret_key: state.user.userSecretKey,
	};

	const emergency_data = cryptoLibrary.encryptSecret(
		JSON.stringify(emergencyDataDec),
		emergencyPassword["base58"],
		emergencySauce,
		hashingAlgorithm,
		hashingParameters,
	);

	const onSuccess = () => ({
		username: username,
		emergency_password: helperService
			.splitStringInChunks(emergencyPassword["base58_checksums"], 13)
			.join("-"),
		emergency_words: emergencyPassword["words"].join(" "),
	});
	const onError = (request: AuthResponse<unknown>) =>
		Promise.reject(request.data);
	if (
		getStore().getState().user.token !== token ||
		getStore().getState().server.url !== state.server.url
	) {
		throw new Error("REQUEST_CANCELLED");
	}
	return apiClient
		.createEmergencyCode(
			token,
			sessionSecretKey,
			title,
			leadTime,
			emergencyAuthkey,
			emergency_data.text,
			emergency_data.nonce,
			emergencySauce,
		)
		.then(onSuccess, onError);
}

/**
 * Deletes an emergency code
 *
 * @param {uuid} emergencyCodeId The id of the emergency code to delete
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteEmergencyCode(emergencyCodeId: string): Promise<void> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = () => {
		// pass
	};
	const onError = () => {
		// pass
	};
	return apiClient
		.deleteEmergencyCode(token, sessionSecretKey, emergencyCodeId)
		.then(onSuccess, onError);
}

const emergencyCodeService = {
	readEmergencyCodes,
	createEmergencyCode,
	deleteEmergencyCode,
};

export default emergencyCodeService;
