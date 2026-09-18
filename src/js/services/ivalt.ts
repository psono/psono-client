/**
 * Ivalt and all the functions to create / edit / delete it ...
 */

import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import { getStore } from "./store";
import type {
	AuthErrorData,
	AuthResponse,
	FactorEnrollment,
	IvaltFactor,
} from "../../types/auth";

function createIvalt(mobile?: string): Promise<FactorEnrollment> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = (
		request: AuthResponse<{ id: string; activation_code: string }>,
	) => ({
		id: request.data["id"],
		uri: request.data["activation_code"],
	});
	const onError = (request: AuthResponse<unknown>) =>
		Promise.reject(request.data);
	return apiClient
		.createIvalt(token, sessionSecretKey, mobile)
		.then(onSuccess, onError);
}

function validateIvalt(mobile?: string): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => true;
	const onError = (request: AuthResponse<unknown>) =>
		Promise.reject(request.data);
	return apiClient
		.validateIvalt(token, sessionSecretKey, mobile)
		.then(onSuccess, onError);
}

/**
 * Gets a list of all active ivalts
 *
 * @returns {Promise} Returns a promise with a list of all ivalts
 */
function readIvalt(): Promise<IvaltFactor[] | void> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = (request: AuthResponse<{ ivalt: IvaltFactor[] }>) => {
		// console.log("reading ivalts success...:", request.data)
		return request.data["ivalt"];
	};
	const onError = () => {
		// pass
		// console.error(err)
	};
	return apiClient.readIvalt(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Activates a given Ivalt
 *
 * @param {uuid} ivaltId The ivalt ID
 * @param {string} [ivaltToken] (optional) One ivalt token
 *
 * @returns {Promise} Returns a promise with true or false
 */
function activateIvalt(ivaltId: string, ivaltToken?: string): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => {
		// Preserve the legacy activation callback's property lookup on the factory.
		(
			action as typeof action & {
				setHasTwoFactor: (enabled: boolean) => void;
			}
		).setHasTwoFactor(true);
		return true;
	};
	const onError = () => false;
	// This legacy method is absent from the current API client. Keep the existing
	// lookup/failure behavior instead of inventing an activation endpoint.
	return (
		apiClient as typeof apiClient & {
			activateIvalt: (
				token: string,
				key: string,
				id: string,
				code?: string,
			) => Promise<AuthResponse<unknown>>;
		}
	)
		.activateIvalt(token, sessionSecretKey, ivaltId, ivaltToken)
		.then(onSuccess, onError);
}

/**
 * Deletes a given Ivalt
 *
 * @param {string|null} ivaltId The ivalt ID or the pending enrollment's null sentinel
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteIvalt(ivaltId: string | null): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => true;
	const onError = (data: AuthResponse<unknown>) => Promise.reject(data.data);
	return apiClient
		.deleteIvalt(token, sessionSecretKey, ivaltId)
		.then(onSuccess, onError);
}

function sendTwoFactorNotification(): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => true;
	const onError = () => false;
	return apiClient
		.validateIvaltTwoFactor(token, sessionSecretKey, "notification")
		.then(onSuccess, onError);
}

function validateIvaltTwoFactor(): Promise<AuthResponse<AuthErrorData>> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = (res: AuthResponse<AuthErrorData>) => res;
	const onError = (res: AuthResponse<AuthErrorData>) => res;
	return apiClient
		.validateIvaltTwoFactor(token, sessionSecretKey, "verification")
		.then(onSuccess, onError);
}

const ivaltService = {
	createIvalt,
	readIvalt,
	activateIvalt,
	deleteIvalt,
	validateIvalt,
	sendTwoFactorNotification,
	validateIvaltTwoFactor,
};

export default ivaltService;
