/**
 * Fido / Webauthn and all the functions to create / edit / delete it ...
 */

import action from "../actions/bound-action-creators";
import apiClientService from "./api-client";
import helperService from "./helper";
import { getStore } from "./store";
import type {
	AuthResponse,
	SecondFactor,
	SerializedCreationOptions,
	SerializedRequestOptions,
} from "../../types/auth";

/**
 * Returns the current origin
 *
 * @returns {string} Returns the current origin
 */
function getOrigin(): string {
	const parsedUrl = helperService.parseUrl(window.location.href);
	return parsedUrl.base_url!;
}

/**
 * Creates a webauthn
 *
 * @param {string} title The title of the Webauthn
 *
 * @returns {Promise} Returns a promise with the user information
 */
function createWebauthn(
	title: string,
): Promise<{ id: string; options: SerializedCreationOptions } | void> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (
		request: AuthResponse<{ id: string; options: SerializedCreationOptions }>,
	) => request.data;
	const onError = () => {
		// pass
	};
	return apiClientService
		.createWebauthn(token, sessionSecretKey, title, getOrigin())
		.then(onSuccess, onError);
}

/**
 * Gets a list of all active webauthns
 *
 * @returns {Promise} Returns a promise with a list of all webauthns
 */
function readWebauthn(): Promise<SecondFactor[] | void> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = (request: AuthResponse<{ webauthns: SecondFactor[] }>) =>
		request.data["webauthns"];
	const onError = () => {
		// pass
	};
	return apiClientService
		.readWebauthn(token, sessionSecretKey)
		.then(onSuccess, onError);
}

/**
 * Activates a given webauthn
 *
 * @param {uuid} webauthnId The webauthn ID
 * @param {string} credential The credentials passed by the browser
 *
 * @returns {Promise} Returns a promise with true or false
 */
function activateWebauthn(
	webauthnId: string,
	credential: string,
): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => {
		action().setHasTwoFactor(true);
		return true;
	};
	const onError = (data: unknown) => {
		console.log(data);
		return false;
	};
	return apiClientService
		.activateWebauthn(token, sessionSecretKey, webauthnId, credential)
		.then(onSuccess, onError);
}

/**
 * Deletes a given webauthn
 *
 * @param {uuid} webauthnId The webauthn ID
 *
 * @returns {Promise} Returns a promise with true or false
 */
function deleteWebauthn(webauthnId: string): Promise<boolean> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onSuccess = () => true;
	const onError = (data: AuthResponse<unknown>) => Promise.reject(data.data);
	return apiClientService
		.deleteWebauthn(token, sessionSecretKey, webauthnId)
		.then(onSuccess, onError);
}

/**
 * Initiate the second factor authentication with webauthn
 *
 * @returns {Promise} Returns a promise with the user information
 */
function verifyWebauthnInit(): Promise<{ options: SerializedRequestOptions }> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (
		request: AuthResponse<{ options: SerializedRequestOptions }>,
	) => request.data;
	const onError = (request: AuthResponse<unknown>) =>
		Promise.reject(request.data);
	return apiClientService
		.webauthnVerifyInit(token, sessionSecretKey, getOrigin())
		.then(onSuccess, onError);
}

/**
 * Solve the second factor webauthn authentication
 *
 * @param {string} credential The credentials passed by the browser
 *
 * @returns {Promise} Returns a promise with the user information
 */
function verifyWebauthn(credential: string): Promise<unknown> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (request: AuthResponse<unknown>) => request.data;
	const onError = (request: AuthResponse<unknown>) =>
		Promise.reject(request.data);
	return apiClientService
		.webauthnVerify(token, sessionSecretKey, credential)
		.then(onSuccess, onError);
}

const webauthnService = {
	createWebauthn,
	readWebauthn,
	activateWebauthn,
	deleteWebauthn,
	verifyWebauthnInit,
	verifyWebauthn,
};

export default webauthnService;
