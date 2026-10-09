/**
 * Yubikey OTP and all the functions to create / edit / delete it ...
 */

import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import { getStore } from "./store";
import type { AuthResponse, SecondFactor } from "../../types/auth";

/**
 * creates a yubikey otp
 *
 * @param {string} title The title of the YubiKey OTP
 * @param {string} otp One YubikeKey OTP Code
 *
 * @returns {promise} Returns a promise with the user information
 */
function createYubikeyOtp(title: string, otp: string): Promise<{ id: string }> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = (request: AuthResponse<{ id: string }>) => {
		action().setHasTwoFactor(true);
		return {
			id: request.data["id"],
		};
	};
	const onError = (error: AuthResponse<unknown>) => Promise.reject(error.data);
	return apiClient
		.createYubikeyOtp(token, sessionSecretKey, title, otp)
		.then(onSuccess, onError);
}

/**
 * Gets a list of all active yubikey otps
 *
 * @returns {promise} Returns a promise with a list of all yubikey otps
 */
function readYubikeyOtp(): Promise<SecondFactor[] | void> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (request: AuthResponse<{ yubikey_otps: SecondFactor[] }>) =>
		request.data["yubikey_otps"];
	const onError = () => {
		// pass
	};
	return apiClient
		.readYubikeyOtp(token, sessionSecretKey)
		.then(onSuccess, onError);
}

/**
 * Activates a given YubiKey OTP
 *
 * @param {uuid} yubikeyId Yubikey ID
 * @param {string} yubikeyOtp One YubiKey COde
 *
 * @returns {promise} Returns a promise with true or false
 */
function activateYubikeyOtp(
	yubikeyId: string,
	yubikeyOtp: string,
): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => {
		action().setHasTwoFactor(true);
		return true;
	};
	const onError = () => false;
	return apiClient
		.activateYubikeyOtp(token, sessionSecretKey, yubikeyId, yubikeyOtp)
		.then(onSuccess, onError);
}

/**
 * Deletes a given YubiKey OTP
 *
 * @param {uuid} yubikeyOtpId Yubikey OTP ID
 *
 * @returns {promise} Returns a promise with true or false
 */
function deleteYubikeyOtp(yubikeyOtpId: string): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => true;
	const onError = (data: AuthResponse<unknown>) => Promise.reject(data.data);
	return apiClient
		.deleteYubikeyOtp(token, sessionSecretKey, yubikeyOtpId)
		.then(onSuccess, onError);
}

const yubikeyOtpService = {
	createYubikeyOtp,
	readYubikeyOtp,
	activateYubikeyOtp,
	deleteYubikeyOtp,
};

export default yubikeyOtpService;
