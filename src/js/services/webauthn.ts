/**
 * Fido / Webauthn and all the functions to create / edit / delete it ...
 */

import action from "../actions/bound-action-creators";
import apiClientService from "./api-client";
import converterService from "./converter";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import { getStore } from "./store";
import type {
	AuthResponse,
	SecondFactor,
	SerializedCreationOptions,
	WebauthnVerificationOptions,
} from "../../types/auth";

/**
 * Returns the current origin
 *
 * @returns {string} Returns the current origin
 */
function getOrigin(): string {
	if (TARGET === "firefox") {
		// WebAuthn uses the SHA-256 of the add-on ID, encoded with digits a-p,
		// rather than Firefox's per-installation moz-extension://UUID URL.
		const id = cryptoLibrary
			.sha256(browser.runtime.id)
			.replace(/[0-9a-f]/g, (digit) =>
				String.fromCharCode(97 + parseInt(digit, 16)),
			);
		return "moz-extension://" + id;
	}
	const parsedUrl = helperService.parseUrl(window.location.href);
	return parsedUrl.base_url!;
}

function getRpId(): string | undefined {
	// Firefox 150+ and Chromium 122+ can claim a host-permitted domain RP ID.
	// Use the web_client advertised by /info/, stored as server.webClient.
	return TARGET === "firefox" || TARGET === "chrome"
		? new URL(getStore().getState().server.webClient!).hostname
		: undefined;
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
		.createWebauthn(token, sessionSecretKey, title, getOrigin(), getRpId())
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
function verifyWebauthnInit(
	legacy = false,
): Promise<WebauthnVerificationOptions> {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (request: AuthResponse<WebauthnVerificationOptions>) =>
		request.data;
	const onError = (request: AuthResponse<unknown>) =>
		Promise.reject(request.data);
	return apiClientService
		.webauthnVerifyInit(token, sessionSecretKey, getOrigin(), getRpId(), legacy)
		.then(onSuccess, onError);
}

/** Request a credential, transparently trying the old Chromium scope once. */
async function getCredential(
	webauthn: WebauthnVerificationOptions,
	signal?: AbortSignal,
): Promise<PublicKeyCredential> {
	const token = getStore().getState().user.token;
	if (!token || signal?.aborted) {
		throw new DOMException("Login was cancelled", "AbortError");
	}
	const request = async (data: WebauthnVerificationOptions) => {
		const options: PublicKeyCredentialRequestOptions = {
			...data.options,
			challenge: Uint8Array.from(data.options.challenge, (c) =>
				c.charCodeAt(0),
			),
			allowCredentials: data.options.allowCredentials!.map((credential) => ({
				...credential,
				id: converterService.base64UrlToArrayBuffer(credential.id),
			})),
		};
		const credential = await navigator.credentials.get({
			publicKey: options,
			...(signal ? { signal } : {}),
		});
		if (signal?.aborted || getStore().getState().user.token !== token) {
			throw new DOMException("Login was cancelled", "AbortError");
		}
		if (!credential) {
			throw new DOMException("No credential returned", "NotAllowedError");
		}
		return credential as PublicKeyCredential;
	};
	try {
		return await request(webauthn);
	} catch (error) {
		if (
			TARGET !== "chrome" ||
			signal?.aborted ||
			!webauthn.legacy_available ||
			!(error instanceof DOMException) ||
			!["NotAllowedError", "NotSupportedError", "SecurityError"].includes(
				error.name,
			) ||
			getStore().getState().user.token !== token
		) {
			throw error;
		}
		const fallback = await verifyWebauthnInit(true);
		// Logout/account changes during initialization must not reopen a prompt.
		if (signal?.aborted || getStore().getState().user.token !== token) {
			throw error;
		}
		return request(fallback);
	}
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
	getCredential,
	verifyWebauthn,
};

export default webauthnService;
