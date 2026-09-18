/**
 * Service to talk to the psono REST api
 */

import type {
	ApiDetailOrList,
	ApiEndpointData,
	ApiHeaders,
	ApiRecord,
	ApiResponse,
	AuthToken,
	BulkSecretInput,
	CreatedSecret,
	EncryptedPayload,
	EncryptedSecret,
	GatewayCluster,
	GatewayLaunch,
	HashingParameters,
	HttpMethod,
	PreloginResponse,
	ResponseSideEffect,
	SecurityReportEntry,
	ServerInfo,
	SessionSecretKey,
} from "../../types/api";
import type { LinkShareReadLimitInput } from "../../types/vault";
import i18n from "../i18n";
import cryptoLibrary from "./crypto-library";
import device from "./device";
import offlineCache from "./offline-cache";
import { getStore } from "./store";
import user from "./user";

// TODO add later for audit log again
//let AUDIT_LOG_HEADER = 'Audit-Log';

const decryptData = (
	sessionSecretKey: SessionSecretKey,
	data: unknown,
	url: string,
	method: HttpMethod,
): unknown => {
	// The envelope and ciphertext are checked before decrypting. JSON payload
	// schemas belong to individual endpoints, not the transport layer.
	const response = data as ApiResponse<unknown>;
	if (
		sessionSecretKey &&
		data !== null &&
		Object.hasOwn(data as object, "data") &&
		response.data !== "" &&
		(!Object.hasOwn(response.data as object, "text") ||
			!Object.hasOwn(response.data as object, "nonce"))
	) {
		// we expected an encrypted response, yet the response was unencrypted, so we don't trust it.
		console.log("UNENCRYPTED_RESPONSE_RECEIVED", response.data);
		throw new Error("UNENCRYPTED_RESPONSE_RECEIVED");
	}
	if (
		sessionSecretKey &&
		data !== null &&
		Object.hasOwn(data as object, "data") &&
		response.data !== "" &&
		Object.hasOwn(response.data as object, "text") &&
		Object.hasOwn(response.data as object, "nonce")
	) {
		const encrypted = response.data as EncryptedPayload;
		response.data = JSON.parse(
			cryptoLibrary.decryptData(
				encrypted.text,
				encrypted.nonce,
				sessionSecretKey,
			),
		);
	}
	offlineCache.set(url, method, data);
	return data;
};

function _statelessCall<T = ApiRecord>(
	method: HttpMethod,
	endpoint: string,
	body: object | null,
	headers: ApiHeaders | null,
	sessionSecretKey: SessionSecretKey,
	serverUrl: string,
	deviceFingerprint: string,
	sideEffect?: ResponseSideEffect,
): Promise<ApiResponse<T>> {
	const url = serverUrl + endpoint;

	if (sessionSecretKey && body !== null) {
		body = cryptoLibrary.encryptData(JSON.stringify(body), sessionSecretKey);
	}

	if (sessionSecretKey && headers && Object.hasOwn(headers, "Authorization")) {
		const validator = {
			request_time: new Date().toISOString(),
			request_device_fingerprint: deviceFingerprint,
		};
		headers["Authorization-Validator"] = JSON.stringify(
			cryptoLibrary.encryptData(JSON.stringify(validator), sessionSecretKey),
		);
	}

	// TODO add later for audit log again
	// let log_audit = storage.find_key('config','server_info')
	// if (log_audit) {
	//     log_audit = log_audit.value['log_audit']
	// }
	//
	// if (sessionSecretKey && headers && headers.hasOwnProperty(AUDIT_LOG_HEADER) && log_audit) {
	//     headers[AUDIT_LOG_HEADER] = JSON.stringify(cryptoLibrary.encryptData(JSON.stringify(headers[AUDIT_LOG_HEADER]), sessionSecretKey));
	// } else if (headers && headers.hasOwnProperty(AUDIT_LOG_HEADER)) {
	//     delete headers[AUDIT_LOG_HEADER];
	// }

	const req: RequestInit & { method: HttpMethod } = {
		method,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
	};

	if (body != null) {
		req["body"] = JSON.stringify(body);
	}

	return offlineCache.get(url, req.method).then((cached) => {
		if (cached !== null) {
			return cached as ApiResponse<T>;
		}

		return new Promise<ApiResponse<T>>(async (resolve, reject) => {
			let rawResponse;
			try {
				rawResponse = await fetch(url, req);
			} catch (e) {
				console.log(e);
				reject({ errors: ["SERVER_OFFLINE"] });
				return;
			}

			if (typeof sideEffect === "function") {
				sideEffect(rawResponse);
			}

			let data: unknown = await rawResponse.text();
			if (data) {
				try {
					data = JSON.parse(data as string);
				} catch (e) {
					// pass
				}
			}

			let decryptedData: unknown;

			// compatibility to old axios library
			if (data) {
				data = {
					data,
				};
			}

			if (!rawResponse.ok) {
				console.log(rawResponse);
				console.log(data);
				if (rawResponse.status === 404) {
					if (rawResponse.statusText) {
						return reject(rawResponse.statusText);
					}
					return reject({ errors: ["RESOURCE_NOT_FOUND"] });
				}

				if (rawResponse.status >= 500) {
					if (rawResponse.statusText) {
						return reject(rawResponse.statusText);
					}
					return reject({ errors: ["SERVER_OFFLINE"] });
				}
				// received error 400. We fall through here and check below with rawResponse.ok whether we have to return
				// a success or failed response
			}

			try {
				decryptedData = decryptData(sessionSecretKey, data, url, req.method);
			} catch (e) {
				return reject({ errors: ["UNENCRYPTED_RESPONSE_RECEIVED"] });
			}
			if (rawResponse.ok) {
				// Preserve the server's legacy empty-body result as well as JSON
				// envelopes; the endpoint determines the expected response schema.
				return resolve(decryptedData as ApiResponse<T>);
			} else {
				return reject(decryptedData);
			}
		});
	});
}

function call<T = ApiRecord>(
	method: HttpMethod,
	endpoint: string,
	body: object | null,
	headers: ApiHeaders | null,
	sessionSecretKey?: SessionSecretKey,
): Promise<ApiResponse<T>> {
	const serverUrl = getStore().getState().server.url;
	const deviceFingerprint = device.getDeviceFingerprint();
	const sideEffect: ResponseSideEffect = (rawResponse) => {
		// The request was made and the server responded with a status code
		// that falls out of the range of 2xx
		if (rawResponse.status === 401 && endpoint !== "/authentication/logout/") {
			const currentToken = getStore().getState().user.token;
			if (
				currentToken &&
				headers?.Authorization === `Token ${currentToken}` &&
				user.isLoggedIn()
			) {
				// session expired, lets log the user out
				user.logout(i18n.t("SESSION_EXPIRED"), undefined, currentToken);
			}
		}
		if (rawResponse.status === 423 && user.isLoggedIn()) {
			// server error, lets log the user out
			user.logout(rawResponse.statusText);
		}
		if (rawResponse.status === 502 && user.isLoggedIn()) {
			// server error, lets log the user out
			user.logout(rawResponse.statusText);
		}
		if (rawResponse.status === 503 && user.isLoggedIn()) {
			// server error, lets log the user out
			user.logout(rawResponse.statusText);
		}
	};
	return _statelessCall<T>(
		method,
		endpoint,
		body,
		headers,
		sessionSecretKey,
		serverUrl,
		deviceFingerprint,
		sideEffect,
	);
}

/**
 * Ajax GET request to get the server info
 *
 * @returns {Promise} Returns a promise with server's public information
 */
function info() {
	const endpoint = "/info/";
	const method = "GET";
	const data = null;
	const headers = null;

	return call<ServerInfo>(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with username to get the password hashing algorithm infos of the user
 *
 * @param {string} username The username
 *
 * @returns {Promise} Returns a promise with the login status
 */
const prelogin = (username: string) => {
	const endpoint = "/authentication/prelogin/";
	const method = "POST";
	const data = {
		username: username,
	};
	const headers = null;

	return call<PreloginResponse>(method, endpoint, data, headers);
};

/**
 * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
 * and all the different keys of a user in the apidata storage
 *
 * @param {string} login_info The encrypted login info (username, authkey, device fingerprint, device description)
 * @param {string} login_info_nonce The nonce of the login info
 * @param {string} public_key The session public key
 * @param {int} session_duration The time the session should be valid for in seconds
 *
 * @returns {Promise} Returns a promise with the login status
 */
const login = (
	login_info: string,
	login_info_nonce: string,
	public_key: string,
	session_duration: number,
) => {
	const endpoint = "/authentication/login/";
	const method = "POST";
	const data = {
		login_info: login_info,
		login_info_nonce: login_info_nonce,
		public_key: public_key,
		session_duration: session_duration,
	};
	const headers = null;

	return call<ApiEndpointData["login"]>(method, endpoint, data, headers);
};

/**
 * Ajax POST request to the backend with saml_provider_id and return_to_url. Will return an url where we have
 * to redirect the user to.
 *
 * @param {int} saml_provider_id The saml provider id
 * @param {string} return_to_url The url to index.html
 *
 * @returns {Promise} Returns a promise with the login status
 */
function samlInitiateLogin(
	saml_provider_id: string | number,
	return_to_url: string,
) {
	const endpoint = "/saml/" + saml_provider_id + "/initiate-login/";
	const method = "POST";
	const data = {
		return_to_url: return_to_url,
	};
	const headers = null;

	return call<{ saml_redirect_url: string }>(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with oidc_provider_id and return_to_url. Will return an url where we have
 * to redirect the user to.
 *
 * @param {int} oidc_provider_id The oidc provider id
 * @param {string} return_to_url The url to index.html
 *
 * @returns {Promise} Returns a promise with the login status
 */
function oidcInitiateLogin(
	oidc_provider_id: string | number,
	return_to_url: string,
) {
	const endpoint = "/oidc/" + oidc_provider_id + "/initiate-login/";
	const method = "POST";
	const data = {
		return_to_url: return_to_url,
	};
	const headers = null;

	return call<{ oidc_redirect_url: string }>(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
 * and all the different keys of a user in the apidata storage
 *
 * @param {string} login_info The encrypted login info (username, authkey, device fingerprint, device description)
 * @param {string} login_info_nonce The nonce of the login info
 * @param {string} public_key The session public key
 * @param {int} session_duration The time the session should be valid for in seconds
 *
 * @returns {Promise} Returns a promise with the login status
 */
function samlLogin(
	login_info: string,
	login_info_nonce: string,
	public_key: string,
	session_duration: number,
) {
	const endpoint = "/saml/login/";
	const method = "POST";
	const data = {
		login_info: login_info,
		login_info_nonce: login_info_nonce,
		public_key: public_key,
		session_duration: session_duration,
	};
	const headers = null;

	return call<ApiEndpointData["login"]>(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with email and authkey for login, saves a token together with user_id
 * and all the different keys of a user in the apidata storage
 *
 * @param {string} login_info The encrypted login info (username, authkey, device fingerprint, device description)
 * @param {string} login_info_nonce The nonce of the login info
 * @param {string} public_key The session public key
 * @param {int} session_duration The time the session should be valid for in seconds
 *
 * @returns {Promise} Returns a promise with the login status
 */
function oidcLogin(
	login_info: string,
	login_info_nonce: string,
	public_key: string,
	session_duration: number,
) {
	const endpoint = "/oidc/login/";
	const method = "POST";
	const data = {
		login_info: login_info,
		login_info_nonce: login_info_nonce,
		public_key: public_key,
		session_duration: session_duration,
	};
	const headers = null;

	return call<ApiEndpointData["login"]>(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with the OATH-TOTP Token
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} ga_token The OATH-TOTP Token
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with the verification status
 */
function gaVerify(
	token: AuthToken,
	ga_token: string,
	sessionSecretKey: SessionSecretKey,
) {
	const endpoint = "/authentication/ga-verify/";
	const method = "POST";
	const data = {
		ga_token: ga_token,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to the backend with the Duo Token
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} [duoToken] (optional) The Duo token
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with the verification status
 */
function duoVerify(
	token: AuthToken,
	duoToken?: string | null,
	sessionSecretKey?: SessionSecretKey,
) {
	const endpoint = "/authentication/duo-verify/";
	const method = "POST";
	const data = {
		duo_token: duoToken,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to the backend with the YubiKey OTP Token
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} yubikey_otp The YubiKey OTP
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with the verification status
 */
function yubikeyOtpVerify(
	token: AuthToken,
	yubikey_otp: string,
	sessionSecretKey: SessionSecretKey,
) {
	const endpoint = "/authentication/yubikey-otp-verify/";
	const method = "POST";
	const data = {
		yubikey_otp: yubikey_otp,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to activate the token
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} verification hex of first decrypted user_validator (from login) the re-encrypted with session key
 * @param {string} verification_nonce hex of the nonce of the verification
 * @param {string} sessionSecretKey The session secret key
 * @param {string} zoneinfo The timezone of the user
 *
 * @returns {Promise} promise
 */
function activateToken(
	token: AuthToken,
	verification: string,
	verification_nonce: string,
	sessionSecretKey: SessionSecretKey,
	zoneinfo?: string,
) {
	const endpoint = "/authentication/activate-token/";
	const method = "POST";
	const data = {
		verification: verification,
		verification_nonce: verification_nonce,
		zoneinfo: zoneinfo,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["activateToken"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request get all sessions
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
function getSessions(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/authentication/sessions/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["sessions"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request get all emergency codes
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
function readEmergencyCodes(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) {
	const endpoint = "/emergencycode/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["emergencyCodes"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request to create a datatore with the token as authentication and optional already some data,
 * together with the encrypted secret key and nonce
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @param {string} description The description of the emergency code
 * @param {int} activation_delay The delay till someone can activate this code in seconds
 * @param {string} emergency_authkey The emergency_authkey (derivative of the emergency_password)
 * @param {string} emergency_data The Recovery Data, an encrypted json object
 * @param {string} emergency_data_nonce The nonce used for the encryption of the data
 * @param {string} emergency_sauce The random sauce used as salt
 *
 * @returns {Promise} promise
 */
function createEmergencyCode(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	description: string,
	activation_delay: number,
	emergency_authkey: string,
	emergency_data: string,
	emergency_data_nonce: string,
	emergency_sauce: string,
) {
	const endpoint = "/emergencycode/";
	const method = "POST";
	const data = {
		description: description,
		activation_delay: activation_delay,
		emergency_authkey: emergency_authkey,
		emergency_data: emergency_data,
		emergency_data_nonce: emergency_data_nonce,
		emergency_sauce: emergency_sauce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax DELETE request to delete a given emergency code
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} emergencyCodeId The emergency code id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
function deleteEmergencyCode(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	emergencyCodeId: string,
) {
	const endpoint = "/emergencycode/";
	const method = "DELETE";
	const data = {
		emergency_code_id: emergencyCodeId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to destroy the token and logout the user
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string|undefined} [sessionId] An optional session ID to log out
 * @param {string|undefined} [postLogoutRedirectUri] An optional url to redirect to upon logout
 *
 * @returns {Promise} Returns a promise with the logout status
 */
function logout(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	sessionId?: string | null,
	postLogoutRedirectUri?: string | null,
) {
	const endpoint = "/authentication/logout/";
	const method = "POST";
	const data = {
		session_id: sessionId,
		post_logout_redirect_uri: postLogoutRedirectUri,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to destroy the token and logout the user
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string|undefined} [sessionId] An optional session ID to log out
 * @param {string|undefined} [postLogoutRedirectUri] An optional url to redirect to upon logout
 * @param {string} serverUrl The URL of the server e.g. https://example.com/server
 * @param {string} deviceFingerprint The deviceFingerprint used during the creation of the session
 * @param {function|undefined} [sideEffect] The a function that receives the raw response and may be used to trigger side effects, like the logout of a user based on the response's status code
 *
 * @returns {Promise} Returns a promise with the logout status
 */
function statelessLogout(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	sessionId: string | null | undefined,
	postLogoutRedirectUri: string | null | undefined,
	serverUrl: string,
	deviceFingerprint: string,
	sideEffect?: ResponseSideEffect,
) {
	const endpoint = "/authentication/logout/";
	const method = "POST";
	const data = {
		session_id: sessionId,
		post_logout_redirect_uri: postLogoutRedirectUri,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return _statelessCall(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
		serverUrl,
		deviceFingerprint,
		sideEffect,
	);
}

/**
 * Ajax POST request to the backend with the email and authkey, returns nothing but an email is sent to the user
 * with an activation_code for the email
 *
 * @param {string} email email address of the user
 * @param {string} username username of the user (in email format)
 * @param {string} authkey authkey gets generated by generate_authkey(email, password)
 * @param {string} publicKey publicKey of the public/private key pair for asymmetric encryption (sharing)
 * @param {string} privateKey private_key of the public/private key pair, encrypted with encrypt_secret
 * @param {string} privateKeyNonce the nonce for decrypting the encrypted private_key
 * @param {string} secretKey secretKey for symmetric encryption, encrypted with encrypt_secret
 * @param {string} secretKeyNonce the nonce for decrypting the encrypted secretKey
 * @param {string} userSauce the random user sauce used
 * @param {string|null|void} baseUrl the base url for the activation link creation, forwarded as supplied by the browser
 * @param {string} hashingAlgorithm the hashing algorithm e.g. scrypt
 * @param {object} hashingParameters the hashing parameters for the algorithm
 *
 * @returns {Promise} promise
 */
function register(
	email: string,
	username: string,
	authkey: string,
	publicKey: string,
	privateKey: string,
	privateKeyNonce: string,
	secretKey: string,
	secretKeyNonce: string,
	userSauce: string,
	baseUrl: string | null | void,
	hashingAlgorithm: string,
	hashingParameters: HashingParameters,
) {
	const endpoint = "/authentication/register/";
	const method = "POST";
	const data = {
		email: email,
		username: username,
		authkey: authkey,
		public_key: publicKey,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		user_sauce: userSauce,
		base_url: baseUrl,
		hashing_algorithm: hashingAlgorithm,
		hashing_parameters: hashingParameters,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with the email or username, returns nothing but an email is sent to the user
 * with an account deletion code
 *
 * @param {string} username username of the user (in email format)
 * @param {string} email email address of the user
 * @param {string|null|void} baseUrl the base url for the account deletion link, forwarded as supplied by the browser
 *
 * @returns {Promise} promise
 */
function unregister(
	username: string | null | undefined,
	email: string | null | undefined,
	baseUrl: string | null | void,
) {
	const endpoint = "/authentication/unregister/";
	const method = "POST";
	const data = {
		email: email,
		username: username,
		base_url: baseUrl,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with the unregistration_code for the email
 *
 * @param {string} unregisterCode The unregistration code that has been sent via email
 *
 * @returns {Promise} Returns a promise with the unregistration status
 */
function unregisterConfirm(unregisterCode: string) {
	const endpoint = "/authentication/unregister/";
	const method = "PUT";
	const data = {
		unregister_code: unregisterCode,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
}

/**
 * Ajax POST request to the backend with the activation_code for the email, returns nothing. If successful the user
 * can login afterwards
 *
 * @param {string} activation_code The activation code that has been sent via email
 *
 * @returns {Promise} Returns a promise with the activation status
 */
function verifyEmail(activation_code: string) {
	const endpoint = "/authentication/verify-email/";
	const method = "POST";
	const data = {
		activation_code: activation_code,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
}

/**
 * AJAX PUT request to the backend with new user informations like for example a new password (means new
 * authkey) or new public key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} email New email address
 * @param {string} authkey The new authkey
 * @param {string} authkey_old The old authkey
 * @param {string} private_key The (encrypted) private key
 * @param {string} privateKeyNonce The nonce for the private key
 * @param {string} secretKey The (encrypted) secret key
 * @param {string} secretKeyNonce The nonce for the secret key
 * @param {string} language The language
 * @param {string} hashingAlgorithm the hashing algorithm e.g. scrypt
 * @param {object} hashingParameters the hashing parameters for the algorithm
 *
 * @returns {Promise} Returns a promise with the update status
 */
function updateUser(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	email?: string | null,
	authkey?: string | null,
	authkey_old?: string | null,
	private_key?: string | null,
	privateKeyNonce?: string | null,
	secretKey?: string | null,
	secretKeyNonce?: string | null,
	language?: string | null,
	hashingAlgorithm?: string | null,
	hashingParameters?: HashingParameters | null,
) {
	const endpoint = "/user/update/";
	const method = "PUT";
	const data = {
		email: email,
		authkey: authkey,
		authkey_old: authkey_old,
		private_key: private_key,
		private_key_nonce: privateKeyNonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		language: language,
		hashing_algorithm: hashingAlgorithm,
		hashing_parameters: hashingParameters,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * AJAX PUT request to the backend with the encrypted data (private_key, and secret_key) for recovery purposes
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} recovery_authkey The recovery_authkey (derivative of the recovery_password)
 * @param {string} recovery_data The Recovery Data, an encrypted json object
 * @param {string} recovery_data_nonce The nonce used for the encryption of the data
 * @param {string} recovery_sauce The random sauce used as salt
 *
 * @returns {Promise} Returns a promise with the recovery_data_id
 */
function writeRecoverycode(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	recovery_authkey: string,
	recovery_data: string,
	recovery_data_nonce: string,
	recovery_sauce: string,
) {
	const endpoint = "/recoverycode/";
	const method = "POST";
	const data = {
		recovery_authkey: recovery_authkey,
		recovery_data: recovery_data,
		recovery_data_nonce: recovery_data_nonce,
		recovery_sauce: recovery_sauce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * AJAX POST request to the backend with the recovery_authkey to initiate the reset of the password
 *
 * @param {string} username the account's username e.g dummy@example.com
 * @param {string} recovery_authkey The recovery_authkey (derivative of the recovery_password)
 *
 * @returns {Promise} Returns a promise with the recovery_data
 */
function enableRecoverycode(username: string, recovery_authkey: string) {
	const endpoint = "/password/";
	const method = "POST";
	const data = {
		username: username,
		recovery_authkey: recovery_authkey,
	};
	const headers = null;

	return call<ApiEndpointData["recovery"]>(method, endpoint, data, headers);
}

/**
 * AJAX POST request to the backend with the emergency_code_authkey to initiate the activation of the emergency code
 *
 * @param {string} username the account's username e.g dummy@example.com
 * @param {string} emergency_authkey The emergency_code (derivative of the recovery_password)
 *
 * @returns {Promise} Returns a promise with the recovery_data
 */
function armEmergencyCode(username: string, emergency_authkey: string) {
	const endpoint = "/emergency-login/";
	const method = "POST";
	const data = {
		username: username,
		emergency_authkey: emergency_authkey,
	};
	const headers = null;

	return call<ApiEndpointData["emergency"]>(method, endpoint, data, headers);
}

/**
 * AJAX POST request to the backend to actually actually activate the emergency code and get an active session back
 *
 * @param {string} username the account's username e.g dummy@example.com
 * @param {string} emergency_authkey The emergency_authkey (derivative of the recovery_password)
 * @param {string} update_data The private and secret key object encrypted with the verifier
 * @param {string} update_data_nonce The nonce of the encrypted private and secret key object
 *
 * @returns {Promise} Returns a promise with the recovery_data
 */
function activateEmergencyCode(
	username: string,
	emergency_authkey: string,
	update_data: string,
	update_data_nonce: string,
) {
	const endpoint = "/emergency-login/";
	const method = "PUT";
	const data = {
		username: username,
		emergency_authkey: emergency_authkey,
		update_data: update_data,
		update_data_nonce: update_data_nonce,
	};
	const headers = null;

	return call<ApiEndpointData["login"]>(method, endpoint, data, headers);
}

/**
 * AJAX POST request to the backend to actually set the new encrypted private and secret key
 *
 * @param {string} username the account's username e.g dummy@example.com
 * @param {string} recovery_authkey The recovery_authkey (derivative of the recovery_password)
 * @param {string} update_data The private and secret key object encrypted with the verifier
 * @param {string} update_data_nonce The nonce of the encrypted private and secret key object
 * @param {string} hashingAlgorithm the hashing algorithm e.g. scrypt
 * @param {object} hashingParameters the hashing parameters for the algorithm
 *
 * @returns {Promise} Returns a promise with the recovery_data
 */
function setPassword(
	username: string,
	recovery_authkey: string,
	update_data: string,
	update_data_nonce: string,
	hashingAlgorithm: string,
	hashingParameters: HashingParameters,
) {
	const endpoint = "/password/";
	const method = "PUT";
	const data = {
		username: username,
		recovery_authkey: recovery_authkey,
		update_data: update_data,
		update_data_nonce: update_data_nonce,
		hashing_algorithm: hashingAlgorithm,
		hashing_parameters: hashingParameters,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
}

/**
 * Ajax GET request with the token as authentication to get the current user's datastore
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid|undefined} [datastoreId=null] (optional) the datastore ID
 *
 * @returns {Promise} Returns a promise with the encrypted datastore
 */
function readDatastore<Id extends string | null | undefined = undefined>(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	datastoreId?: Id,
): Promise<
	ApiResponse<
		ApiDetailOrList<
			Id,
			ApiEndpointData["datastore"],
			ApiEndpointData["datastores"]
		>
	>
> {
	const endpoint = "/datastore/" + (!datastoreId ? "" : datastoreId + "/");
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Returns the gateway clusters available to the current user.
 */
function getGatewayClusters(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) {
	const endpoint = "/gateway/clusters/";
	const method = "GET";
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ clusters: GatewayCluster[] }>(
		method,
		endpoint,
		null,
		headers,
		sessionSecretKey,
	);
}

/**
 * Creates an encrypted gateway launch.
 */
function launchGateway(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	clusterId: string,
	secretId: string,
	encryptedData: string,
	encryptedDataNonce: string,
) {
	const endpoint = "/gateway/launch/";
	const method = "POST";
	const data = {
		cluster_id: clusterId,
		secret_id: secretId,
		data: encryptedData,
		data_nonce: encryptedDataNonce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<GatewayLaunch>(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax GET request with the token as authentication to read the history for a secret as a list
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} secretId the secret ID
 *
 * @returns {Promise} promise
 */
function readSecretHistory(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secretId: string,
) {
	const endpoint = "/secret/history/" + secretId + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["history"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request with the token as authentication to get the details of a history entry
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} secret_history_id the secret ID
 *
 * @returns {Promise} promise
 */
function readHistory(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secret_history_id: string,
) {
	const endpoint = "/history/" + secret_history_id + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["historyDetail"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request to create a datatore with the token as authentication and optional already some data,
 * together with the encrypted secret key and nonce
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} type the type of the datastore
 * @param {string} description the description of the datastore
 * @param {string|undefined} [encryptedData] (optional) data for the new datastore
 * @param {string|undefined} [encryptedDataNonce] (optional) nonce for data, necessary if data is provided
 * @param {string|undefined} [isDefault] (optional) Is the new default datastore of this type
 * @param {string} encryptedDataSecretKey encrypted secret key
 * @param {string} encryptedDataSecretKeyNonce nonce for secret key
 *
 * @returns {Promise} promise
 */
function createDatastore(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	type: string,
	description: string,
	encryptedData: string | null | undefined,
	encryptedDataNonce: string | null | undefined,
	isDefault: boolean | undefined,
	encryptedDataSecretKey: string,
	encryptedDataSecretKeyNonce: string,
) {
	const endpoint = "/datastore/";
	const method = "PUT";
	const data = {
		type: type,
		description: description,
		data: encryptedData,
		data_nonce: encryptedDataNonce,
		is_default: isDefault,
		secret_key: encryptedDataSecretKey,
		secret_key_nonce: encryptedDataSecretKeyNonce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ datastore_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax DELETE request with the token as authentication to delete a datastore
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} datastoreId The datastore id
 * @param {string} authkey The authkey of the user
 *
 * @returns {Promise} Returns a promise with the status of the delete operation
 */
function deleteDatastore(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	datastoreId: string,
	authkey: string,
) {
	const endpoint = "/datastore/";
	const method = "DELETE";
	const data = {
		datastore_id: datastoreId,
		authkey: authkey,
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request with the token as authentication and the datastore's new content
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} datastoreId the datastore ID
 * @param {string|undefined} [encryptedData] (optional) data for the datastore
 * @param {string|undefined} [encryptedDataNonce] (optional) nonce for data, necessary if data is provided
 * @param {string|undefined} [encryptedDataSecretKey] (optional) encrypted secret key, wont update on the server if not provided
 * @param {string|undefined} [encryptedDataSecretKeyNonce] (optional) nonce for secret key, wont update on the server if not provided
 * @param {string|undefined} [description] (optional) The new description of the datastore
 * @param {boolean|undefined} [is_default] (optional) Is this the new default datastore
 * @param {string|undefined} [oldWriteDate] (optional) The write_date before the update
 *
 * @returns {Promise} promise
 */
function writeDatastore(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	datastoreId: string,
	encryptedData?: string | null,
	encryptedDataNonce?: string | null,
	encryptedDataSecretKey?: string | null,
	encryptedDataSecretKeyNonce?: string | null,
	description?: string | null,
	is_default?: boolean | null,
	oldWriteDate?: string | null,
) {
	const endpoint = "/datastore/";
	const method = "POST";
	const data = {
		datastore_id: datastoreId,
		data: encryptedData,
		data_nonce: encryptedDataNonce,
		secret_key: encryptedDataSecretKey,
		secret_key_nonce: encryptedDataSecretKeyNonce,
		description: description,
		is_default: is_default,
		old_write_date: oldWriteDate,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax GET request with the token as authentication to get the current user's secret
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} secretId secret ID
 *
 * @returns {Promise} promise
 */
function readSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secretId: string,
) {
	const endpoint = "/secret/" + secretId + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	// headers[AUDIT_LOG_HEADER] = {
	//     'test': 'something secret'
	// }

	return call<EncryptedSecret>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request to create a secret with the token as authentication together with the encrypted data and nonce
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} encryptedData data for the new secret
 * @param {string} encryptedDataNonce nonce for data, necessary if data is provided
 * @param {string} linkId the local id of the share in the datastructure
 * @param {string|undefined} [parentDatastoreId] (optional) id of the parent datastore, may be left empty if the share resides in a share
 * @param {string|undefined} [parentShareId] (optional) id of the parent share, may be left empty if the share resides in the datastore
 * @param {string} callback_url The callback ULR
 * @param {string} callback_user The callback user
 * @param {string} callback_pass The callback password
 *
 * @returns {Promise} Returns a promise with the new secretId
 */
function createSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	encryptedData: string,
	encryptedDataNonce: string,
	linkId: string,
	parentDatastoreId?: string | null,
	parentShareId?: string | null,
	callback_url?: string | null,
	callback_user?: string | null,
	callback_pass?: string | null,
) {
	const endpoint = "/secret/";
	const method = "PUT";
	const data = {
		data: encryptedData,
		data_nonce: encryptedDataNonce,
		link_id: linkId,
		parent_datastore_id: parentDatastoreId,
		parent_share_id: parentShareId,
		callback_url: callback_url,
		callback_user: callback_user,
		callback_pass: callback_pass,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ secret_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request to create a secret with the token as authentication together with the encrypted data and nonce
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {array} secrets The secrets with their content to create
 * @param {string|undefined} [parentDatastoreId] (optional) id of the parent datastore, may be left empty if the share resides in a share
 * @param {string|undefined} [parentShareId] (optional) id of the parent share, may be left empty if the share resides in the datastore
 *
 * @returns {Promise} Returns a promise with the new secretId
 */
function createSecretBulk(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secrets: BulkSecretInput[],
	parentDatastoreId?: string | null,
	parentShareId?: string | null,
) {
	const endpoint = "/bulk-secret/";
	const method = "PUT";
	const data = {
		parent_datastore_id: parentDatastoreId,
		parent_share_id: parentShareId,
		secrets: secrets,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ secrets: CreatedSecret[] }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request to create a secret with the token as authentication together with the encrypted data and nonce
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {array} secretIds The ids of the secrets to read
 *
 * @returns {Promise} Returns a promise with the new secretId
 */
function readSecretBulk(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secretIds: string[],
) {
	const endpoint = "/bulk-secret-read/";
	const method = "POST";
	const data = {
		secret_ids: secretIds,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ secrets: EncryptedSecret[] }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request with the token as authentication and the new secret content
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} secretId the secret ID
 * @param {string|undefined} [encryptedData] (optional) data for the new secret
 * @param {string|undefined} [encryptedDataNonce] (optional) nonce for data, necessary if data is provided
 * @param {string} callback_url The callback ULR
 * @param {string} callback_user The callback user
 * @param {string} callback_pass The callback password
 *
 * @returns {Promise} promise
 */
function writeSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secretId: string,
	encryptedData?: string | null,
	encryptedDataNonce?: string | null,
	callback_url?: string | null,
	callback_user?: string | null,
	callback_pass?: string | null,
) {
	const endpoint = "/secret/";
	const method = "POST";
	const data = {
		secret_id: secretId,
		data: encryptedData,
		data_nonce: encryptedDataNonce,
		callback_url: callback_url,
		callback_user: callback_user,
		callback_pass: callback_pass,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ secret_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request with the token as authentication to move a link between a secret and a datastore or a share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId the link id
 * @param {uuid|undefined} [newParentShareId=null] (optional) new parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) new datastore ID, necessary if no newParentShareId is provided
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveSecretLink(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
	newParentShareId?: string | null,
	newParentDatastoreId?: string | null,
) {
	const endpoint = "/secret/link/";
	const method = "POST";
	const data = {
		link_id: linkId,
		new_parent_share_id: newParentShareId,
		new_parent_datastore_id: newParentDatastoreId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax DELETE request with the token as authentication to delete the secret link
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId The link id
 * @param {string} logAuditTitle The title for the audit log
 *
 * @returns {Promise} Returns a promise with the status of the delete operation
 */
function deleteSecretLink(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
	logAuditTitle?: string,
) {
	const endpoint = "/secret/link/";
	const method = "DELETE";
	const data = {
		link_id: linkId,
		log_audit_title: getStore().getState().server.logAudit ? logAuditTitle : "",
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request with the token as authentication to move a link between a file and a datastore or a share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId the link id
 * @param {uuid|undefined} [newParentShareId=null] (optional) new parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) new datastore ID, necessary if no newParentShareId is provided
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveFileLink(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
	newParentShareId?: string | null,
	newParentDatastoreId?: string | null,
) {
	const endpoint = "/file/link/";
	const method = "POST";
	const data = {
		link_id: linkId,
		new_parent_share_id: newParentShareId,
		new_parent_datastore_id: newParentDatastoreId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax DELETE request with the token as authentication to delete the file link
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId The link id
 *
 * @returns {Promise} Returns a promise with the status of the delete operation
 */
function deleteFileLink(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
) {
	const endpoint = "/file/link/";
	const method = "DELETE";
	const data = {
		link_id: linkId,
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax GET request with the token as authentication to get the content for a single share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} share_id the share ID
 *
 * @returns {Promise} promise
 */
function readShare(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	share_id: string,
) {
	const endpoint = "/share/" + share_id + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["share"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request with the token as authentication to get the current user's shares
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
function readShares(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/share/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["shares"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request to create a datastore with the token as authentication and optional already some data,
 * together with the encrypted secret key and nonce
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string|undefined} [encryptedData] (optional) The data for the new share
 * @param {string|undefined} [encryptedDataNonce] (optional) The nonce for data, necessary if data is provided
 * @param {string} key encrypted key used by the encryption
 * @param {string} keyNonce nonce for key, necessary if a key is provided
 * @param {string|undefined} [parentShareId] (optional) The id of the parent share, may be left empty if the share resides in the datastore
 * @param {string|undefined} [parentDatastoreId] (optional) The id of the parent datastore, may be left empty if the share resides in a share
 * @param {string} linkId the local id of the share in the datastructure
 *
 * @returns {Promise} Returns a promise with the status and the new share id
 */
function createShare(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	encryptedData: string | null | undefined,
	encryptedDataNonce: string | null | undefined,
	key: string,
	keyNonce: string,
	parentShareId: string | null | undefined,
	parentDatastoreId: string | null | undefined,
	linkId: string,
) {
	const endpoint = "/share/";
	const method = "POST";
	const data = {
		data: encryptedData,
		data_nonce: encryptedDataNonce,
		key: key,
		key_nonce: keyNonce,
		key_type: "symmetric",
		parent_share_id: parentShareId,
		parent_datastore_id: parentDatastoreId,
		link_id: linkId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ share_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request with the token as authentication and the share's new content
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} share_id the share ID
 * @param {string|undefined} [encryptedData] (optional) data for the new share
 * @param {string|undefined} [encryptedDataNonce] (optional) nonce for data, necessary if data is provided
 * @param {string|undefined} [oldWriteDate] (optional) The write_date before the update
 *
 * @returns {Promise} Returns a promise with the status of the update
 */
function writeShare(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	share_id: string,
	encryptedData?: string | null,
	encryptedDataNonce?: string | null,
	oldWriteDate?: string | null,
) {
	const endpoint = "/share/";
	const method = "PUT";
	const data = {
		share_id: share_id,
		data: encryptedData,
		data_nonce: encryptedDataNonce,
		old_write_date: oldWriteDate,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax GET request with the token as authentication to get the users and groups rights of the share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} share_id the share ID
 *
 * @returns {Promise} promise
 */
function readShareRights(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	share_id: string,
) {
	const endpoint = "/share/rights/" + share_id + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["shareRightsDetail"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request with the token as authentication to get all the users share rights
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
function readShareRightsOverview(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) {
	const endpoint = "/share/right/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["shareRights"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax PUT request with the token as authentication to create share rights for a user
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} encrypted_title The title shown to the user before he accepts
 * @param {string} encrypted_title_nonce The corresponding title nonce
 * @param {string} encrypted_type The type of the share
 * @param {string} encrypted_type_nonce The corresponding type nonce
 * @param {uuid} share_id The share ID
 * @param {uuid} [user_id] (optional) The target user's user ID
 * @param {uuid} [group_id] (optional) The target group's group ID
 * @param {string} key The encrypted share secret, encrypted with the public key of the target user
 * @param {string} keyNonce The unique nonce for decryption
 * @param {bool} read read permission
 * @param {bool} write write permission
 * @param {bool} grant grant permission
 * @param {string|null|undefined} expirationDate Expiration date in ISO format
 *
 * @returns {Promise} promise
 */
function createShareRight(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	encrypted_title: string,
	encrypted_title_nonce: string,
	encrypted_type: string,
	encrypted_type_nonce: string,
	share_id: string,
	user_id: string | null | undefined,
	group_id: string | null | undefined,
	key: string,
	keyNonce: string,
	read: boolean,
	write: boolean,
	grant: boolean,
	expirationDate?: string | null,
) {
	const endpoint = "/share/right/";
	const method = "PUT";
	const data = {
		title: encrypted_title,
		title_nonce: encrypted_title_nonce,
		type: encrypted_type,
		type_nonce: encrypted_type_nonce,
		share_id: share_id,
		user_id: user_id,
		group_id: group_id,
		key: key,
		key_nonce: keyNonce,
		read: read,
		write: write,
		grant: grant,
		expiration_date: expirationDate,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ share_right_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request with the token as authentication to update the share rights for a user
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} share_id the share ID
 * @param {uuid} user_id the target user's user ID
 * @param {uuid} group_id the target user's user ID
 * @param {bool} read read right
 * @param {bool} write write right
 * @param {bool} grant grant right
 * @param {string|null|undefined} expirationDate Expiration date in ISO format
 *
 * @returns {Promise} promise
 */
function updateShareRight(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	share_id: string,
	user_id: string | null | undefined,
	group_id: string | null | undefined,
	read: boolean,
	write: boolean,
	grant: boolean,
	expirationDate?: string | null,
) {
	const endpoint = "/share/right/";
	const method = "POST";
	const data = {
		share_id: share_id,
		user_id: user_id,
		group_id: group_id,
		read: read,
		write: write,
		grant: grant,
		expiration_date: expirationDate,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ share_right_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax DELETE request with the token as authentication to delete the user / group share right
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} user_share_right_id the user share right ID
 * @param {uuid} group_share_right_id the group share right ID
 *
 * @returns {Promise} promise
 */
function deleteShareRight(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	user_share_right_id?: string | null,
	group_share_right_id?: string | null,
) {
	const endpoint = "/share/right/";
	const method = "DELETE";
	const data = {
		user_share_right_id: user_share_right_id,
		group_share_right_id: group_share_right_id,
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call<{ share_right_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request with the token as authentication to get all the users inherited share rights
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
function readShareRightsInheritOverview(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) {
	const endpoint = "/share/right/inherit/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["shareRights"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request with the token as authentication to accept a share right and in the same run updates it
 * with the re-encrypted key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} share_right_id The share right id
 * @param {string} key The encrypted key of the share
 * @param {string} keyNonce The nonce of the key
 * @param {string} key_type The type of the key (default: symmetric)
 *
 * @returns {Promise} promise
 */
function acceptShareRight(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	share_right_id: string,
	key: string,
	keyNonce: string,
	key_type?: string,
) {
	const endpoint = "/share/right/accept/";
	const method = "POST";
	const data = {
		share_right_id: share_right_id,
		key: key,
		key_nonce: keyNonce,
		key_type: key_type,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["acceptedShare"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request with the token as authentication to decline a share right
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} share_right_id The share right id
 *
 * @returns {Promise} promise
 */
function declineShareRight(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	share_right_id: string,
) {
	const endpoint = "/share/right/decline/";
	const method = "POST";
	const data = {
		share_right_id: share_right_id,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request with the token as authentication to get the public key of a user by user_id or user_email
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid|undefined} [user_id] (optional) the user ID
 * @param {string|undefined} [user_username] (optional) the username
 * @param {email|undefined} [user_email] (optional) the email
 *
 * @returns {Promise} Returns a promise with the user information
 */
function searchUser(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	user_id?: string | null,
	user_username?: string | null,
	user_email?: string | null,
) {
	const endpoint = "/user/search/";
	const method = "POST";
	const data = {
		user_id: user_id,
		user_username: user_username,
		user_email: user_email,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax GET request to query the server for the status
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with the user information
 */
function readStatus(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/user/status/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax GET request to query the open jobs
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with the open jobs
 */
function readJob(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/job/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to add the user's keys to admin recovery.
 *
 * @param {string} token The authentication token
 * @param {string} sessionSecretKey The session secret key
 * @param {string} privateKey Encrypted private key of the user
 * @param {string} privateKeyNonce Nonce for the private key
 * @param {string} secretKey Encrypted secret key of the user
 * @param {string} secretKeyNonce Nonce for the secret key
 *
 * @returns {Promise} Returns a promise with the job result
 */
function createJobUserMissingAdminSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	privateKey: string,
	privateKeyNonce: string,
	secretKey: string,
	secretKeyNonce: string,
) {
	const endpoint = "/job/user-missing-admin-secret/";
	const method = "POST";
	const data = {
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to add a group's keys to admin recovery.
 *
 * @param {string} token The authentication token
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} groupId The group id
 * @param {string} privateKey Encrypted private key of the group
 * @param {string} privateKeyNonce Nonce for the private key
 * @param {string} secretKey Encrypted secret key of the group
 * @param {string} secretKeyNonce Nonce for the secret key
 *
 * @returns {Promise} Returns a promise with the job result
 */
function createJobGroupMissingAdminSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupId: string,
	privateKey: string,
	privateKeyNonce: string,
	secretKey: string,
	secretKeyNonce: string,
) {
	const endpoint = "/job/group-missing-admin-secret/";
	const method = "POST";
	const data = {
		group_id: groupId,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to create the missing group secrets for memberships
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} membershipId The membership id to update
 * @param {string} secretKey encrypted secret key of the group
 * @param {string} secretKeyNonce nonce for secret key
 * @param {string} privateKey encrypted private key of the group
 * @param {string} privateKeyNonce nonce for private key
 *
 * @returns {Promise} Returns a promise with the open jobs
 */
function createMembershipMissingGroupSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	membershipId: string,
	secretKey: string,
	secretKeyNonce: string,
	privateKey: string,
	privateKeyNonce: string,
) {
	const endpoint = "/job/membership-missing-group-secret/";
	const method = "POST";
	const data = {
		membership_id: membershipId,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to create the missing group secrets for staff
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} userId The user id of the user that needs the group
 * @param {uuid} groupId The group id of the group that the user needs it for
 * @param {string} secretKey encrypted secret key of the group
 * @param {string} secretKeyNonce nonce for secret key
 * @param {string} privateKey encrypted private key of the group
 * @param {string} privateKeyNonce nonce for private key
 *
 * @returns {Promise} Returns a promise with the open jobs
 */
function createJobStaffMissingGroupSecret(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	userId: string,
	groupId: string,
	secretKey: string,
	secretKeyNonce: string,
	privateKey: string,
	privateKeyNonce: string,
) {
	const endpoint = "/job/staff-missing-group-secret/";
	const method = "POST";
	const data = {
		user_id: userId,
		group_id: groupId,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax PUT request with the token as authentication to generate a webauthn
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} title The title of the new webauthn
 * @param {string} origin The current origin e.g. https://example.com
 *
 * @returns {Promise} Returns a promise with the secret
 */
function createWebauthn(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	title: string,
	origin: string,
) {
	const endpoint = "/user/webauthn/";
	const method = "PUT";
	const data = {
		title: title,
		origin: origin,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["webauthn"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request to get a list of all registered webauthns
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with a list of all google authenticators
 */
function readWebauthn(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/user/webauthn/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["webauthns"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax DELETE request to delete a given webauthn
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} webauthn_id The webauthn id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
function deleteWebauthn(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	webauthn_id: string,
) {
	const endpoint = "/user/webauthn/";
	const method = "DELETE";
	const data = {
		webauthn_id: webauthn_id,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax POST request to activate registered webauthn
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} webauthnId The webauthn id
 * @param {string} credential The credentials passed by the browser
 *
 * @returns {Promise} Returns weather it was successful or not
 */
function activateWebauthn(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	webauthnId: string,
	credential: string,
) {
	const endpoint = "/user/webauthn/";
	const method = "POST";
	const data = {
		webauthn_id: webauthnId,
		credential: credential,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax PUT request to the backend to initiate the second factor authentication with webauthn
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} origin The current origin e.g. https://example.com
 *
 * @returns {Promise} Returns a promise with the verification status
 */
function webauthnVerifyInit(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	origin: string,
) {
	const endpoint = "/authentication/webauthn-verify/";
	const method = "PUT";
	const data = {
		origin: origin,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["webauthnVerification"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request to the backend with the response from the browser to solve the webauthn challenge
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} credential The credentials passed by the browser
 *
 * @returns {Promise} Returns a promise with the verification status
 */
function webauthnVerify(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	credential: string,
) {
	const endpoint = "/authentication/webauthn-verify/";
	const method = "POST";
	const data = {
		credential: credential,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax PUT request with the token as authentication to generate a google authenticator
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} title The title of the new GA
 *
 * @returns {Promise} Returns a promise with the secret
 */
function createGa(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	title: string,
) {
	const endpoint = "/user/ga/";
	const method = "PUT";
	const data = {
		title: title,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ id: string; secret: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request to get a list of all registered google authenticators
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with a list of all google authenticators
 */
function readGa(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/user/ga/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["googleAuthenticators"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request to activate registered TOTP
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} google_authenticator_id The TOTP id to activate
 * @param {string} google_authenticator_token One TOTP Code
 *
 * @returns {Promise} Returns weather it was successful or not
 */
function activateGa(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	google_authenticator_id: string,
	google_authenticator_token: string,
) {
	const endpoint = "/user/ga/";
	const method = "POST";
	const data = {
		google_authenticator_id: google_authenticator_id,
		google_authenticator_token: google_authenticator_token,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax DELETE request to delete a given Google authenticator
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} google_authenticator_id The google authenticator id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
function deleteGa(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	google_authenticator_id: string,
) {
	const endpoint = "/user/ga/";
	const method = "DELETE";
	const data = {
		google_authenticator_id: google_authenticator_id,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax PUT request with the token as authentication to generate a duo
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {boolean} use_system_wide_duo Indicates whether to use the system wide duo or not
 * @param {string} title The title of the duo
 * @param {string} integration_key The integration_key of the duo
 * @param {string} secretKey The secretKey of the duo
 * @param {string} host The host of the duo
 *
 * @returns {Promise} Returns a promise with the secret
 */
function createDuo(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	use_system_wide_duo: boolean,
	title?: string,
	integration_key?: string | null,
	secretKey?: string | null,
	host?: string | null,
) {
	const endpoint = "/user/duo/";
	const method = "PUT";
	const data = {
		use_system_wide_duo: use_system_wide_duo,
		title: title,
		integration_key: integration_key,
		secret_key: secretKey,
		host: host,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ id: string; activation_code: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax GET request to get a list of all registered duo
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with a list of all duo
 */
function readDuo(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/user/duo/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["duos"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

/**
 * Ajax POST request to activate registered duo
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} duo_id The duo id to activate
 * @param {string} [duo_token] (optional) The duo id to activate
 *
 * @returns {Promise} Returns weather it was successful or not
 */
const activateDuo = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	duo_id: string,
	duo_token?: string | null,
) => {
	const endpoint = "/user/duo/";
	const method = "POST";
	const data = {
		duo_id: duo_id,
		duo_token: duo_token,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given Google authenticator
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} duo_id The duo id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteDuo = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	duo_id: string,
) => {
	const endpoint = "/user/duo/";
	const method = "DELETE";
	const data = {
		duo_id: duo_id,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request with the token as authentication to create / set a new YubiKey OTP token
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} title The title of the new Yubikey OTP token
 * @param {string} yubikey_otp One YubiKey OTP Code
 *
 * @returns {Promise} Returns a promise with the secret
 */
const createYubikeyOtp = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	title: string,
	yubikey_otp: string,
) => {
	const endpoint = "/user/yubikey-otp/";
	const method = "PUT";
	const data = {
		title: title,
		yubikey_otp: yubikey_otp,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax GET request to get a list of all registered Yubikey OTP token
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with a list of all Yubikey OTP token
 */
const readYubikeyOtp = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) => {
	const endpoint = "/user/yubikey-otp/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["yubikeyOtps"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax POST request to activate registered YubiKey
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} yubikey_id The Yubikey id to activate
 * @param {string} yubikey_otp The Yubikey OTP
 *
 * @returns {Promise} Returns weather it was successful or not
 */
const activateYubikeyOtp = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	yubikey_id: string,
	yubikey_otp: string,
) => {
	const endpoint = "/user/yubikey-otp/";
	const method = "POST";
	const data = {
		yubikey_id: yubikey_id,
		yubikey_otp: yubikey_otp,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given Yubikey for OTP
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} yubikey_otp_id The Yubikey id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteYubikeyOtp = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	yubikey_otp_id: string,
) => {
	const endpoint = "/user/yubikey-otp/";
	const method = "DELETE";
	const data = {
		yubikey_otp_id: yubikey_otp_id,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request with the token as authentication to create a link between a share and a datastore or another
 * (parent-)share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId the link id
 * @param {uuid} share_id the share ID
 * @param {uuid|undefined} [parentShareId=null] (optional) parent share ID, necessary if no parentDatastoreId is provided
 * @param {uuid|undefined} [parentDatastoreId=null] (optional) parent datastore ID, necessary if no parentShareId is provided
 *
 * @returns {Promise} promise
 */
const createShareLink = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
	share_id: string,
	parentShareId?: string | null,
	parentDatastoreId?: string | null,
) => {
	const endpoint = "/share/link/";
	const method = "PUT";
	const data = {
		link_id: linkId,
		share_id: share_id,
		parent_share_id: parentShareId,
		parent_datastore_id: parentDatastoreId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request with the token as authentication to move a link between a share and a datastore or another
 * (parent-)share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId the link id
 * @param {uuid|undefined} [newParentShareId=null] (optional) new parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) new datastore ID, necessary if no newParentShareId is provided
 *
 * @returns {Promise} promise
 */
const moveShareLink = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
	newParentShareId?: string | null,
	newParentDatastoreId?: string | null,
) => {
	const endpoint = "/share/link/";
	const method = "POST";
	const data = {
		link_id: linkId,
		new_parent_share_id: newParentShareId,
		new_parent_datastore_id: newParentDatastoreId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request with the token as authentication to delete a link
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkId The Link ID
 *
 * @returns {Promise} promise
 */
const deleteShareLink = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkId: string,
) => {
	const endpoint = "/share/link/";
	const method = "DELETE";
	const data = {
		link_id: linkId,
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request with the token as authentication to get the current user's api keys
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid|undefined} [api_key_id=null] (optional) api key id
 *
 * @returns {Promise} promise
 */
const readApiKey = <Id extends string | null | undefined = undefined>(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	api_key_id?: Id,
): Promise<
	ApiResponse<
		ApiDetailOrList<Id, ApiEndpointData["apiKey"], ApiEndpointData["apiKeys"]>
	>
> => {
	const endpoint = "/api-key/" + (!api_key_id ? "" : api_key_id + "/");
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request with the token as authentication to read all the secrets of a specific api key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} api_key_id The ID of the api key
 *
 * @returns {Promise} promise
 */
const readApiKeySecrets = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	api_key_id: string,
) => {
	const endpoint = "/api-key/secret/" + api_key_id + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["apiKeySecrets"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax PUT request to create a api_key with the token as authentication and together with the name of the api_key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} title title of the new api_key
 * @param {string} public_key The public key of the api key
 * @param {string} private_key encrypted private key of the api_key
 * @param {string} privateKeyNonce nonce for private key
 * @param {string} secretKey encrypted secret key of the api_key
 * @param {string} secretKeyNonce nonce for secret key
 * @param {string} userPrivateKey encrypted private key of the user
 * @param {string} userPrivateKeyNonce nonce for private key
 * @param {string} userSecretKey encrypted secret key of the user
 * @param {string} userSecretKeyNonce nonce for secret key
 * @param {bool} restrict_to_secrets Restrict to secrets
 * @param {bool} allow_insecure_access Allow insecure access
 * @param {bool} allow_api_key_management Allow API key management
 * @param {bool} allow_admin_access Allow administration API access
 * @param {bool} read Allow read access
 * @param {bool} write Allow write access
 * @param {string} verify_key The verify key as a derivat of the private key
 *
 * @returns {Promise} promise
 */
const createApiKey = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	title: string,
	public_key: string,
	private_key: string,
	privateKeyNonce: string,
	secretKey: string,
	secretKeyNonce: string,
	userPrivateKey: string | null | undefined,
	userPrivateKeyNonce: string | null | undefined,
	userSecretKey: string | null | undefined,
	userSecretKeyNonce: string | null | undefined,
	restrict_to_secrets: boolean,
	allow_insecure_access: boolean,
	allow_api_key_management: boolean,
	allow_admin_access: boolean,
	read: boolean,
	write: boolean,
	verify_key: string,
) => {
	const endpoint = "/api-key/";
	const method = "PUT";
	const data = {
		title: title,
		public_key: public_key,
		private_key: private_key,
		private_key_nonce: privateKeyNonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		user_private_key: userPrivateKey,
		user_private_key_nonce: userPrivateKeyNonce,
		user_secret_key: userSecretKey,
		user_secret_key_nonce: userSecretKeyNonce,
		restrict_to_secrets: restrict_to_secrets,
		allow_insecure_access: allow_insecure_access,
		allow_api_key_management: allow_api_key_management,
		allow_admin_access: allow_admin_access,
		read: read,
		write: write,
		verify_key: verify_key,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ api_key_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax PUT request to add a secret to an api key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} api_key_id The id of the api key
 * @param {uuid} secretId The id of the secret
 * @param {string} title encrypted title of the api_key
 * @param {string} title_nonce nonce for title
 * @param {string} secretKey encrypted secret key of the api_key
 * @param {string} secretKeyNonce nonce for secret key
 *
 * @returns {Promise} promise
 */
const addSecretToApiKey = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	api_key_id: string,
	secretId: string,
	title: string,
	title_nonce: string,
	secretKey: string,
	secretKeyNonce: string,
) => {
	const endpoint = "/api-key/secret/";
	const method = "PUT";
	const data = {
		api_key_id: api_key_id,
		secret_id: secretId,
		title: title,
		title_nonce: title_nonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request to update a given api key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} api_key_id The api_key id to update
 * @param {string} title The new title of the api_key
 * @param {bool} restrict_to_secrets Restrict to secrets
 * @param {bool} allow_insecure_access Allow insecure access
 * @param {bool} allow_api_key_management Allow API key management
 * @param {bool} allow_admin_access Allow administration API access
 * @param {bool} read Allow read access
 * @param {bool} write Allow write access
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const updateApiKey = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	api_key_id: string,
	title: string,
	restrict_to_secrets: boolean,
	allow_insecure_access: boolean,
	allow_api_key_management: boolean,
	allow_admin_access: boolean,
	read: boolean,
	write: boolean,
) => {
	const endpoint = "/api-key/";
	const method = "POST";
	const data = {
		api_key_id: api_key_id,
		title: title,
		restrict_to_secrets: restrict_to_secrets,
		read: read,
		allow_insecure_access: allow_insecure_access,
		allow_api_key_management: allow_api_key_management,
		allow_admin_access: allow_admin_access,
		write: write,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete an api key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} api_key_id The api_key id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteApiKey = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	api_key_id: string,
) => {
	const endpoint = "/api-key/";
	const method = "DELETE";
	const data = {
		api_key_id: api_key_id,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given secret access right from an api key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} api_key_secret_id The api_key_secret_id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteApiKeySecret = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	api_key_secret_id: string,
) => {
	const endpoint = "/api-key/secret/";
	const method = "DELETE";
	const data = {
		api_key_secret_id: api_key_secret_id,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request with the token as authentication to get the current user's api keys
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid|undefined} [fileRepositoryId=null] (optional) api key id
 *
 * @returns {Promise} promise
 */
const readFileRepository = <Id extends string | null | undefined = undefined>(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryId?: Id,
): Promise<
	ApiResponse<
		ApiDetailOrList<
			Id,
			ApiEndpointData["fileRepository"],
			ApiEndpointData["fileRepositories"]
		>
	>
> => {
	const endpoint =
		"/file-repository/" + (!fileRepositoryId ? "" : fileRepositoryId + "/");
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request to create a file_repository with the token as authentication and together with the name of the file_repository
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} title title of the new file repository
 * @param {string} type The type of the new file repository
 * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
 * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
 * @param {string} [aws_s3_bucket] (optional) The s3 bucket
 * @param {string} [aws_s3_region] (optional) The s3 region
 * @param {string} [aws_s3_access_key_id] (optional) The s3 access key
 * @param {string} [aws_s3_secret_access_key] (optional) The s3 secret key
 * @param {string} [azure_blob_storage_account_name] (optional) The azure blob storage account name
 * @param {string} [azure_blob_storage_account_primary_key] (optional) The azure blob storage account primary key
 * @param {string} [azure_blob_storage_account_container_name] (optional) The azure blob storage account container name
 * @param {string} [backblaze_bucket] (optional) The backblaze bucket
 * @param {string} [backblaze_region] (optional) The backblaze region
 * @param {string} [backblaze_access_key_id] (optional) The backblaze access key
 * @param {string} [backblaze_secret_access_key] (optional) The backblaze secret key
 * @param {string} [other_s3_bucket] (optional) The s3 bucket
 * @param {string} [other_s3_region] (optional) The s3 region
 * @param {string} [other_s3_endpoint_url] (optional) The s3 endpoint url
 * @param {string} [other_s3_access_key_id] (optional) The s3 access key
 * @param {string} [other_s3_secret_access_key] (optional) The s3 secret key
 * @param {string} [do_space] (optional) The digital ocean space
 * @param {string} [do_region] (optional) The digital ocean region
 * @param {string} [do_key] (optional) The digital ocean key
 * @param {string} [do_secret] (optional) The digital ocean secret
 *
 * @returns {Promise} promise
 */
const createFileRepository = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	title: string,
	type: string,
	gcp_cloud_storage_bucket?: string | null,
	gcp_cloud_storage_json_key?: string | null,
	aws_s3_bucket?: string | null,
	aws_s3_region?: string | null,
	aws_s3_access_key_id?: string | null,
	aws_s3_secret_access_key?: string | null,
	azure_blob_storage_account_name?: string | null,
	azure_blob_storage_account_primary_key?: string | null,
	azure_blob_storage_account_container_name?: string | null,
	backblaze_bucket?: string | null,
	backblaze_region?: string | null,
	backblaze_access_key_id?: string | null,
	backblaze_secret_access_key?: string | null,
	other_s3_bucket?: string | null,
	other_s3_region?: string | null,
	other_s3_endpoint_url?: string | null,
	other_s3_access_key_id?: string | null,
	other_s3_secret_access_key?: string | null,
	do_space?: string | null,
	do_region?: string | null,
	do_key?: string | null,
	do_secret?: string | null,
) => {
	const endpoint = "/file-repository/";
	const method = "PUT";
	const data = {
		title: title,
		type: type,
		gcp_cloud_storage_bucket: gcp_cloud_storage_bucket,
		gcp_cloud_storage_json_key: gcp_cloud_storage_json_key,
		aws_s3_bucket: aws_s3_bucket,
		aws_s3_region: aws_s3_region,
		aws_s3_access_key_id: aws_s3_access_key_id,
		aws_s3_secret_access_key: aws_s3_secret_access_key,
		azure_blob_storage_account_name: azure_blob_storage_account_name,
		azure_blob_storage_account_primary_key:
			azure_blob_storage_account_primary_key,
		azure_blob_storage_account_container_name:
			azure_blob_storage_account_container_name,
		backblaze_bucket: backblaze_bucket,
		backblaze_region: backblaze_region,
		backblaze_access_key_id: backblaze_access_key_id,
		backblaze_secret_access_key: backblaze_secret_access_key,
		other_s3_bucket: other_s3_bucket,
		other_s3_region: other_s3_region,
		other_s3_endpoint_url: other_s3_endpoint_url,
		other_s3_access_key_id: other_s3_access_key_id,
		other_s3_secret_access_key: other_s3_secret_access_key,
		do_space: do_space,
		do_region: do_region,
		do_key: do_key,
		do_secret: do_secret,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ file_repository_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax POST request to update a given file repository
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryId The file_repository id to update
 * @param {string} title title of the new file repository
 * @param {string} type The type of the new file repository
 * @param {string} [gcp_cloud_storage_bucket] (optional) The gcp cloud storage bucket
 * @param {string} [gcp_cloud_storage_json_key] (optional) The gcp cloud storage json key
 * @param {string} [aws_s3_bucket] (optional) The s3 bucket
 * @param {string} [aws_s3_region] (optional) The s3 region
 * @param {string} [aws_s3_access_key_id] (optional) The s3 access key
 * @param {string} [aws_s3_secret_access_key] (optional) The s3 secret key
 * @param {string} [azure_blob_storage_account_name] (optional) The azure blob storage account name
 * @param {string} [azure_blob_storage_account_primary_key] (optional) The azure blob storage account primary key
 * @param {string} [azure_blob_storage_account_container_name] (optional) The azure blob storage account container name
 * @param {string} [backblaze_bucket] (optional) The backblaze bucket
 * @param {string} [backblaze_region] (optional) The backblaze region
 * @param {string} [backblaze_access_key_id] (optional) The backblaze access key
 * @param {string} [backblaze_secret_access_key] (optional) The backblaze secret key
 * @param {string} [other_s3_bucket] (optional) The s3 bucket
 * @param {string} [other_s3_region] (optional) The s3 region
 * @param {string} [other_s3_endpoint_url] (optional) The s3 endpoint url
 * @param {string} [other_s3_access_key_id] (optional) The s3 access key
 * @param {string} [other_s3_secret_access_key] (optional) The s3 secret key
 * @param {string} [do_space] (optional) The digital ocean space
 * @param {string} [do_region] (optional) The digital ocean region
 * @param {string} [do_key] (optional) The digital ocean key
 * @param {string} [do_secret] (optional) The digital ocean secret
 * @param {bool} active Active or not
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const updateFileRepository = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryId: string,
	title: string,
	type: string,
	gcp_cloud_storage_bucket?: string | null,
	gcp_cloud_storage_json_key?: string | null,
	active?: boolean,
	aws_s3_bucket?: string | null,
	aws_s3_region?: string | null,
	aws_s3_access_key_id?: string | null,
	aws_s3_secret_access_key?: string | null,
	azure_blob_storage_account_name?: string | null,
	azure_blob_storage_account_primary_key?: string | null,
	azure_blob_storage_account_container_name?: string | null,
	backblaze_bucket?: string | null,
	backblaze_region?: string | null,
	backblaze_access_key_id?: string | null,
	backblaze_secret_access_key?: string | null,
	other_s3_bucket?: string | null,
	other_s3_region?: string | null,
	other_s3_endpoint_url?: string | null,
	other_s3_access_key_id?: string | null,
	other_s3_secret_access_key?: string | null,
	do_space?: string | null,
	do_region?: string | null,
	do_key?: string | null,
	do_secret?: string | null,
) => {
	const endpoint = "/file-repository/";
	const method = "POST";
	const data = {
		file_repository_id: fileRepositoryId,
		title: title,
		type: type,
		gcp_cloud_storage_bucket: gcp_cloud_storage_bucket,
		gcp_cloud_storage_json_key: gcp_cloud_storage_json_key,
		active: active,
		aws_s3_bucket: aws_s3_bucket,
		aws_s3_region: aws_s3_region,
		aws_s3_access_key_id: aws_s3_access_key_id,
		aws_s3_secret_access_key: aws_s3_secret_access_key,
		azure_blob_storage_account_name: azure_blob_storage_account_name,
		azure_blob_storage_account_primary_key:
			azure_blob_storage_account_primary_key,
		azure_blob_storage_account_container_name:
			azure_blob_storage_account_container_name,
		backblaze_bucket: backblaze_bucket,
		backblaze_region: backblaze_region,
		backblaze_access_key_id: backblaze_access_key_id,
		backblaze_secret_access_key: backblaze_secret_access_key,
		other_s3_bucket: other_s3_bucket,
		other_s3_region: other_s3_region,
		other_s3_endpoint_url: other_s3_endpoint_url,
		other_s3_access_key_id: other_s3_access_key_id,
		other_s3_secret_access_key: other_s3_secret_access_key,
		do_space: do_space,
		do_region: do_region,
		do_key: do_key,
		do_secret: do_secret,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a file repository
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryId The file_repository id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteFileRepository = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryId: string,
) => {
	const endpoint = "/file-repository/";
	const method = "DELETE";
	const data = {
		file_repository_id: fileRepositoryId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request to create a group file repository right for a file repository with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryId ID of the file_repository
 * @param {uuid} groupId ID of the group
 * @param {boolean} read Weather the users should have read rights to read the details
 * @param {boolean} write Weather the users should have read rights to write / update details
 * @param {boolean} grant Weather the users should have read rights to modify other users read and write priviliges
 *
 * @returns {Promise} promise
 */
const createGroupFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryId: string,
	groupId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) => {
	const endpoint = "/group-file-repository-right/";
	const method = "PUT";
	const data = {
		file_repository_id: fileRepositoryId,
		group_id: groupId,
		read: read,
		write: write,
		grant: grant,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request to update a group file repository right with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} groupFileRepositoryRightId The file_repository_right id to update
 * @param {boolean} read Weather the users should have read rights to read the details
 * @param {boolean} write Weather the users should have read rights to write / update details
 * @param {boolean} grant Weather the users should have read rights to modify other users read and write priviliges
 *
 * @returns {Promise} promise
 */
const updateGroupFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupFileRepositoryRightId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) => {
	const endpoint = "/group-file-repository-right/";
	const method = "POST";
	const data = {
		group_file_repository_right_id: groupFileRepositoryRightId,
		read: read,
		write: write,
		grant: grant,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given group file repository right
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} groupFileRepositoryRightId The file repository right id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteGroupFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupFileRepositoryRightId: string,
) => {
	const endpoint = "/group-file-repository-right/";
	const method = "DELETE";
	const data = {
		group_file_repository_right_id: groupFileRepositoryRightId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request to create a file repository right for another user for a file repository with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryId ID of the file_repository
 * @param {uuid} user_id ID of the user
 * @param {boolean} read Weather the users should have read rights to read the details
 * @param {boolean} write Weather the users should have read rights to write / update details
 * @param {boolean} grant Weather the users should have read rights to modify other users read and write priviliges
 *
 * @returns {Promise} promise
 */
const createFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryId: string,
	user_id: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) => {
	const endpoint = "/file-repository-right/";
	const method = "PUT";
	const data = {
		file_repository_id: fileRepositoryId,
		user_id: user_id,
		read: read,
		write: write,
		grant: grant,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request to update a file repository right with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryRightId The file_repository_right id to update
 * @param {boolean} read Weather the users should have read rights to read the details
 * @param {boolean} write Weather the users should have read rights to write / update details
 * @param {boolean} grant Weather the users should have read rights to modify other users read and write priviliges
 *
 * @returns {Promise} promise
 */
const updateFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryRightId: string,
	read: boolean,
	write: boolean,
	grant: boolean,
) => {
	const endpoint = "/file-repository-right/";
	const method = "POST";
	const data = {
		file_repository_right_id: fileRepositoryRightId,
		read: read,
		write: write,
		grant: grant,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given file repository right
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryRightId The file repository right id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryRightId: string,
) => {
	const endpoint = "/file-repository-right/";
	const method = "DELETE";
	const data = {
		file_repository_right_id: fileRepositoryRightId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request to accept a file repository share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryRightId The file_repository user id to accept
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const acceptFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryRightId: string,
) => {
	const endpoint = "/file-repository-right/accept/";
	const method = "POST";
	const data = {
		file_repository_right_id: fileRepositoryRightId,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request to decline a file repository share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} fileRepositoryRightId The file_repository user id to decline
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const declineFileRepositoryRight = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileRepositoryRightId: string,
) => {
	const endpoint = "/file-repository-right/decline/";
	const method = "POST";
	const data = {
		file_repository_right_id: fileRepositoryRightId,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request to upload a file to an file repository with the token as authentication
 *
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {int} chunkSize The size of the complete chunk in bytes
 * @param {int} chunkPosition The sequence number of the chunk to determine the order
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
const fileRepositoryUpload = (
	fileTransferId: string,
	fileTransferSecretKey: SessionSecretKey,
	chunkSize: number,
	chunkPosition: number,
	hashChecksum: string,
) => {
	const endpoint = "/file-repository/upload/";
	const method = "PUT";
	const data = {
		chunk_size: chunkSize,
		chunk_position: chunkPosition,
		hash_checksum: hashChecksum,
	};

	const headers = {
		Authorization: "Filetransfer " + fileTransferId,
	};

	return call<ApiEndpointData["repositoryUpload"]>(
		method,
		endpoint,
		data,
		headers,
		fileTransferSecretKey,
	);
};

/**
 * Ajax PUT request to upload a file to an file repository with the token as authentication
 *
 * @param {uuid} fileTransferId The id of the file transfer
 * @param {string} fileTransferSecretKey The file transfer secret key
 * @param {string} hashChecksum The sha512 hash
 *
 * @returns {Promise} promise
 */
const fileRepositoryDownload = (
	fileTransferId: string,
	fileTransferSecretKey: SessionSecretKey,
	hashChecksum: string,
) => {
	const endpoint = "/file-repository/download/";
	const method = "PUT";
	const data = {
		hash_checksum: hashChecksum,
	};

	const headers = {
		Authorization: "Filetransfer " + fileTransferId,
	};

	return call<ApiEndpointData["repositoryDownload"]>(
		method,
		endpoint,
		data,
		headers,
		fileTransferSecretKey,
	);
};

/**
 * Ajax GET request with the token as authentication to get the current user's groups
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid|undefined} [groupId=null] (optional) group ID
 *
 * @returns {Promise} promise
 */
const readGroup = <Id extends string | null | undefined = undefined>(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupId?: Id,
): Promise<
	ApiResponse<
		ApiDetailOrList<Id, ApiEndpointData["group"], ApiEndpointData["groups"]>
	>
> => {
	const endpoint = "/group/" + (!groupId ? "" : groupId + "/");
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax PUT request to create a group with the token as authentication and together with the name of the group
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} name name of the new group
 * @param {string} secretKey encrypted secret key of the group
 * @param {string} secretKeyNonce nonce for secret key
 * @param {string} privateKey encrypted private key of the group
 * @param {string} privateKeyNonce nonce for private key
 * @param {string} publicKey the publicKey of the group
 *
 * @returns {Promise} promise
 */
const createGroup = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	name: string,
	secretKey: string,
	secretKeyNonce: string,
	privateKey: string,
	privateKeyNonce: string,
	publicKey: string,
) => {
	const endpoint = "/group/";
	const method = "PUT";
	const data = {
		name: name,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
		public_key: publicKey,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["createdGroup"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax POST request to update a given Group
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} groupId The group id to update
 * @param {string} name The new name of the group
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const updateGroup = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupId: string,
	name: string,
) => {
	const endpoint = "/group/";
	const method = "POST";
	const data = {
		group_id: groupId,
		name: name,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given Group
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} groupId The group id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteGroup = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupId: string,
) => {
	const endpoint = "/group/";
	const method = "DELETE";
	const data = {
		group_id: groupId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request with the token as authentication to get all the group rights accessible by a user
 * or for a specific group
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid|undefined} [groupId=null] (optional) group ID
 *
 * @returns {Promise} promise
 */
const readGroupRights = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupId?: string | null,
) => {
	const endpoint = "/group/rights/" + (!groupId ? "" : groupId + "/");
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["groupRights"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax PUT request to create a group membership for another user for a group with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} groupId ID of the group
 * @param {uuid} userId ID of the user
 * @param {string} secretKey encrypted secret key of the group
 * @param {string} secretKeyNonce nonce for secret key
 * @param {string} secretKeyType type of the secret key
 * @param {string} privateKey encrypted private key of the group
 * @param {string} privateKeyNonce nonce for private key
 * @param {string} privateKeyType type of the private key
 * @param {boolean} [groupAdmin] Weather the users should have group admin rights or not
 * @param {boolean} [shareAdmin] Weather the users should have share admin rights or not
 *
 * @returns {Promise} promise
 */
const createMembership = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	groupId: string,
	userId: string,
	secretKey: string,
	secretKeyNonce: string,
	secretKeyType: string,
	privateKey: string,
	privateKeyNonce: string,
	privateKeyType: string,
	groupAdmin?: boolean,
	shareAdmin?: boolean,
) => {
	const endpoint = "/membership/";
	const method = "PUT";
	const data = {
		group_id: groupId,
		user_id: userId,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		secret_key_type: secretKeyType,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
		private_key_type: privateKeyType,
		group_admin: groupAdmin,
		share_admin: shareAdmin,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["createdMembership"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax POST request to update a group membership with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} membershipId The membership id to update
 * @param {boolean} groupAdmin Weather the users should have group admin rights or not
 * @param {boolean} shareAdmin Weather the users should have share admin rights or not
 *
 * @returns {Promise} promise
 */
const updateMembership = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	membershipId: string,
	groupAdmin: boolean,
	shareAdmin: boolean,
) => {
	const endpoint = "/membership/";
	const method = "POST";
	const data = {
		membership_id: membershipId,
		group_admin: groupAdmin,
		share_admin: shareAdmin,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given group membership
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} membershipId The membership id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteMembership = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	membershipId: string,
) => {
	const endpoint = "/membership/";
	const method = "DELETE";
	const data = {
		membership_id: membershipId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request with the token as authentication to accept a membership and in the same run updates it
 * with the re-encrypted key
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} membership_id The share right id
 *
 * @returns {Promise} promise
 */
const acceptMembership = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	membership_id: string,
) => {
	const endpoint = "/membership/accept/";
	const method = "POST";
	const data = {
		membership_id: membership_id,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request with the token as authentication to decline a membership
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} membership_id The share right id
 *
 * @returns {Promise} promise
 */
const declineMembership = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	membership_id: string,
) => {
	const endpoint = "/membership/decline/";
	const method = "POST";
	const data = {
		membership_id: membership_id,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request to read a file with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} fileId The id of the file
 *
 * @returns {Promise} Returns a promise with the new fileId and fileTransferId
 */
const readFile = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileId: string,
) => {
	const endpoint = "/file/" + fileId + "/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["fileTransfer"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax PUT request to create a file with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string|undefined} shard_id (optional) The id of the target shard
 * @param {string|undefined} fileRepositoryId (optional) The id of the target file repository
 * @param {int} size The size of the complete file in bytes
 * @param {int} chunkCount The amount of chunks that this file is split into
 * @param {string|undefined} linkId (optional) the local id of the file in the datastructure (not used for secret attachments)
 * @param {string|undefined} [parentDatastoreId] (optional) id of the parent datastore, may be left empty if the share resides in a share
 * @param {string|undefined} [parentShareId] (optional) id of the parent share, may be left empty if the share resides in the datastore
 * @param {string|undefined} [parentSecretId] (optional) id of the parent secret for file attachments
 *
 * @returns {Promise} Returns a promise with the new fileId and fileTransferId
 */
const createFile = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	shard_id: string | null | undefined,
	fileRepositoryId: string | null | undefined,
	size: number,
	chunkCount: number,
	linkId?: string | null,
	parentDatastoreId?: string | null,
	parentShareId?: string | null,
	parentSecretId?: string | null,
) => {
	const endpoint = "/file/";
	const method = "PUT";
	const data = {
		shard_id: shard_id,
		file_repository_id: fileRepositoryId,
		size: size,
		chunk_count: chunkCount,
		link_id: linkId,
		parent_datastore_id: parentDatastoreId,
		parent_share_id: parentShareId,
		parent_secret_id: parentSecretId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["createdFile"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax DELETE request to detach a file from a secret (sets secret_id to null)
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} fileId The id of the file to detach
 *
 * @returns {Promise} Returns a promise with success status
 */
const deleteFile = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	fileId: string,
) => {
	const endpoint = "/file/";
	const method = "DELETE";
	const data = {
		file_id: fileId,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request with the token as authentication to delete a user account
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} authkey The authkey of the user
 * @param {string} password The password of the user
 *
 * @returns {Promise} promise
 */
const deleteAccount = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	authkey: string,
	password?: string | null,
) => {
	const endpoint = "/user/delete/";
	const method = "DELETE";
	const data = {
		authkey: authkey,
		password: password,
	};
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request with the token as authentication to get the available shards and fileservers
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
const readShards = (token: AuthToken, sessionSecretKey: SessionSecretKey) => {
	const endpoint = "/shard/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["shards"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Creates a link share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} secretId The id of the secret
 * @param {uuid} fileId The id of the file
 * @param {string} node The encrypted node in hex format
 * @param {string} node_nonce The nonce of the encrypted node in hex format
 * @param {string} publicTitle The public title of the link share
 * @param {int|null} allowed_reads The amount of allowed access requests before this link secret becomes invalid
 * @param {string|null} passphrase The passphrase to protect the link secret
 * @param {string|null} validTill The valid till time in iso format
 * @param {boolean} allowWrite Specifies whether a link user can modify the content
 *
 * @returns {Promise} Promise with the new link_secret_id
 */
const createLinkShare = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secretId: string | null | undefined,
	fileId: string | null | undefined,
	node: string,
	node_nonce: string,
	publicTitle: string,
	allowed_reads: number | null,
	passphrase: string | null,
	validTill: string | null,
	allowWrite: boolean,
) => {
	const endpoint = "/link-share/";
	const method = "PUT";
	const data = {
		secret_id: secretId,
		file_id: fileId,
		node: node,
		node_nonce: node_nonce,
		public_title: publicTitle,
		allowed_reads: allowed_reads,
		passphrase: passphrase,
		valid_till: validTill,
		allow_write: allowWrite,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ link_share_id: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax GET request to get a list of all created and still active link shares
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} Returns a promise with a list of all active link shares
 */
const readLinkShare = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) => {
	const endpoint = "/link-share/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["linkShares"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax POST request to update a given link share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkShareId The id of the link share
 * @param {string} publicTitle The news publicTitle of the link share
 * @param {int|null} allowedReads The new amount of allowed access requests before this link secret becomes invalid
 * @param {string|null} passphrase The new passphrase to protect the link secret
 * @param {string|null} validTill The new valid till time in iso format
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const updateLinkShare = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkShareId: string,
	publicTitle: string,
	allowedReads?: LinkShareReadLimitInput,
	passphrase?: string | null,
	validTill?: string | null,
) => {
	const endpoint = "/link-share/";
	const method = "POST";
	const data = {
		link_share_id: linkShareId,
		public_title: publicTitle,
		allowed_reads: allowedReads,
		passphrase: passphrase,
		valid_till: validTill,
	};

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given link share
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} linkShareId The link share id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteLinkShare = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	linkShareId: string,
) => {
	const endpoint = "/link-share/";
	const method = "DELETE";
	const data = {
		link_share_id: linkShareId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request with the token as authentication to access the secret behind a link share
 *
 * @param {uuid} linkShareId The link share id
 * @param {string|null} [passphrase=null] (optional) The passphrase
 *
 * @returns {Promise} promise
 */
const linkShareAccessRead = (
	linkShareId: string,
	passphrase?: string | null,
) => {
	const endpoint = "/link-share-access/";
	const method = "POST";
	const data = {
		link_share_id: linkShareId,
		passphrase: passphrase,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
};

/**
 * Ajax PUT request with the token as authentication to update the secret behind a link share
 *
 * @param {uuid} linkShareId The link share id
 * @param {string} secretData data for the new secret
 * @param {string} secretDataNonce nonce for data, necessary if data is provided
 * @param {string|null} [passphrase=null] (optional) The passphrase
 *
 * @returns {Promise} promise
 */
const linkShareAccessWrite = (
	linkShareId: string,
	secretData: string,
	secretDataNonce: string,
	passphrase?: string | null,
) => {
	const endpoint = "/link-share-access/";
	const method = "PUT";
	const data = {
		link_share_id: linkShareId,
		secret_data: secretData,
		secret_data_nonce: secretDataNonce,
		passphrase: passphrase,
	};
	const headers = null;

	return call(method, endpoint, data, headers);
};

/**
 * Ajax POST request to update a file repository right with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {Array} entries All the details about each entry
 * @param {boolean} checkHaveibeenpwned Whether haveibeenpwned was used or not
 * @param {string} authkey The authkey of the user if the masterpassword was tested
 *
 * @returns {Promise} promise
 */
const sendSecurityReport = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	entries: SecurityReportEntry[],
	checkHaveibeenpwned: boolean,
	authkey?: string | null,
) => {
	const endpoint = "/user/security-report/";
	const method = "POST";
	const data = {
		entries: entries,
		check_haveibeenpwned: checkHaveibeenpwned,
		authkey: authkey,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax GET request with the token as authentication to get the current user's avatars
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 *
 * @returns {Promise} promise
 */
const readAvatar = (token: AuthToken, sessionSecretKey: SessionSecretKey) => {
	const endpoint = "/avatar/";
	const method = "GET";
	const data = null;
	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["avatars"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
};

/**
 * Ajax POST request to create a avatar with the token as authentication and together with the base64 encoded data of the avatar
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} dataBase64 The base64 encoded data
 *
 * @returns {Promise} promise
 */
const createAvatar = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	dataBase64: string,
) => {
	const endpoint = "/avatar/";
	const method = "POST";
	const data = {
		data_base64: dataBase64,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete a given avatar
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} avatarId The avatar id to delete
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteAvatar = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	avatarId: string,
) => {
	const endpoint = "/avatar/";
	const method = "DELETE";
	const data = {
		avatar_id: avatarId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax POST request to create the user's server secret with the token as authentication
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {string} privateKey The user's unencrypted private key
 * @param {string} secretKey The user's unencrypted secret key
 *
 * @returns {Promise} promise
 */
const createServerSecret = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	secretKey: string,
	privateKey: string,
) => {
	const endpoint = "/server-secret/";
	const method = "POST";
	const data = {
		secret_key: secretKey,
		private_key: privateKey,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

/**
 * Ajax DELETE request to delete the user's server secret
 *
 * @param {string} token authentication token of the user, returned by authentication_login(email, authkey)
 * @param {string} sessionSecretKey The session secret key
 * @param {uuid} authkey The avatar id to delete
 * @param {string} secretKey encrypted secret key of the group
 * @param {string} secretKeyNonce nonce for secret key
 * @param {string} privateKey encrypted private key of the group
 * @param {string} privateKeyNonce nonce for private key
 * @param {string} userSauce the random user sauce used
 * @param {string} hashingAlgorithm the hashing algorithm e.g. scrypt
 * @param {object} hashingParameters the hashing parameters for the algorithm
 *
 * @returns {Promise} Returns a promise which can succeed or fail
 */
const deleteServerSecret = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	authkey: string,
	privateKey: string,
	privateKeyNonce: string,
	secretKey: string,
	secretKeyNonce: string,
	userSauce: string,
	hashingAlgorithm: string,
	hashingParameters: HashingParameters,
) => {
	const endpoint = "/server-secret/";
	const method = "DELETE";
	const data = {
		authkey: authkey,
		private_key: privateKey,
		private_key_nonce: privateKeyNonce,
		secret_key: secretKey,
		secret_key_nonce: secretKeyNonce,
		user_sauce: userSauce,
		hashing_algorithm: hashingAlgorithm,
		hashing_parameters: hashingParameters,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

const getIvaltApiToken = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
) => {
	const endpoint = "/user/ivalt-secret/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

const validateIvaltTwoFactor = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	requestType: string,
) => {
	const endpoint = "/authentication/ivalt-verify/";
	const method = "POST";
	const data = {
		request_type: requestType,
	};
	const headers = {
		Authorization: "Token " + token,
	};
	return call(method, endpoint, data, headers, sessionSecretKey);
};

function readIvalt(token: AuthToken, sessionSecretKey: SessionSecretKey) {
	const endpoint = "/user/ivalt/";
	const method = "GET";
	const data = null;

	const headers = {
		Authorization: "Token " + token,
	};

	return call<ApiEndpointData["ivalts"]>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

const deleteIvalt = (
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	ivaltId: string | null,
) => {
	const endpoint = "/user/ivalt/";
	const method = "DELETE";
	const data = {
		ivalt_id: ivaltId,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
};

function createIvalt(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	mobile?: string,
) {
	const endpoint = "/user/ivalt/";
	const method = "PUT";
	const data = {
		mobile: mobile,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call<{ id: string; activation_code: string }>(
		method,
		endpoint,
		data,
		headers,
		sessionSecretKey,
	);
}

function validateIvalt(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	mobile?: string,
) {
	const endpoint = "/user/ivalt/";
	const method = "POST";
	const data = {
		mobile: mobile,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

/**
 * Ajax PUT request to claim a device code.
 * The user must be authenticated (valid token required).
 *
 * @param {string} token Authentication token of the user.
 * @param {string} sessionSecretKey The session secret key (kept for signature consistency, but null is passed to `call` for its crypto duties).
 * @param {string} deviceCodeId The UUID of the device code to claim.
 * @param {string} encryptedCredentialsInput The encrypted credentials bundle.
 * @param {string} encryptedCredentialsNonce The nonce for the encrypted credentials bundle.
 *
 * @returns {Promise} Returns a promise with the API response.
 */
function claimDeviceCode(
	token: AuthToken,
	sessionSecretKey: SessionSecretKey,
	deviceCodeId: string,
	encryptedCredentialsInput: string,
	encryptedCredentialsNonce: string,
) {
	const endpoint = `/device-code/${deviceCodeId}/claim/`;
	const method = "PUT";
	const data = {
		encrypted_credentials_input: encryptedCredentialsInput,
		encrypted_credentials_nonce: encryptedCredentialsNonce,
	};
	const headers = {
		Authorization: "Token " + token,
	};

	return call(method, endpoint, data, headers, sessionSecretKey);
}

const apiClientService = {
	info: info,
	prelogin: prelogin,
	login: login,
	samlInitiateLogin: samlInitiateLogin,
	oidcInitiateLogin: oidcInitiateLogin,
	samlLogin: samlLogin,
	oidcLogin: oidcLogin,
	gaVerify: gaVerify,
	duoVerify: duoVerify,
	yubikeyOtpVerify: yubikeyOtpVerify,
	activateToken: activateToken,
	getSessions: getSessions,
	readEmergencyCodes: readEmergencyCodes,
	createEmergencyCode: createEmergencyCode,
	deleteEmergencyCode: deleteEmergencyCode,
	statelessLogout: statelessLogout,
	logout: logout,
	register: register,
	unregister: unregister,
	unregisterConfirm: unregisterConfirm,
	verifyEmail: verifyEmail,
	updateUser: updateUser,
	writeRecoverycode: writeRecoverycode,
	enableRecoverycode: enableRecoverycode,
	armEmergencyCode: armEmergencyCode,
	activateEmergencyCode: activateEmergencyCode,
	setPassword: setPassword,
	readSecretHistory: readSecretHistory,
	readHistory: readHistory,
	readDatastore: readDatastore,
	getGatewayClusters: getGatewayClusters,
	launchGateway: launchGateway,
	writeDatastore: writeDatastore,
	createDatastore: createDatastore,
	deleteDatastore: deleteDatastore,
	readSecret: readSecret,
	writeSecret: writeSecret,
	createSecret: createSecret,
	createSecretBulk: createSecretBulk,
	readSecretBulk: readSecretBulk,
	moveSecretLink: moveSecretLink,
	deleteSecretLink: deleteSecretLink,
	moveFileLink: moveFileLink,
	deleteFileLink: deleteFileLink,
	readShare: readShare,
	readShares: readShares,
	writeShare: writeShare,
	createShare: createShare,
	readShareRights: readShareRights,
	readShareRightsOverview: readShareRightsOverview,
	createShareRight: createShareRight,
	updateShareRight: updateShareRight,
	deleteShareRight: deleteShareRight,
	readShareRightsInheritOverview: readShareRightsInheritOverview,
	acceptShareRight: acceptShareRight,
	declineShareRight: declineShareRight,
	searchUser: searchUser,
	readGa: readGa,
	activateGa: activateGa,
	deleteGa: deleteGa,
	readStatus: readStatus,
	readJob: readJob,
	createJobUserMissingAdminSecret: createJobUserMissingAdminSecret,
	createJobGroupMissingAdminSecret: createJobGroupMissingAdminSecret,
	createMembershipMissingGroupSecret: createMembershipMissingGroupSecret,
	createJobStaffMissingGroupSecret: createJobStaffMissingGroupSecret,
	createWebauthn: createWebauthn,
	readWebauthn: readWebauthn,
	deleteWebauthn: deleteWebauthn,
	activateWebauthn: activateWebauthn,
	webauthnVerifyInit: webauthnVerifyInit,
	webauthnVerify: webauthnVerify,
	createGa: createGa,
	readDuo: readDuo,
	activateDuo: activateDuo,
	deleteDuo: deleteDuo,
	createDuo: createDuo,
	readYubikeyOtp: readYubikeyOtp,
	activateYubikeyOtp: activateYubikeyOtp,
	deleteYubikeyOtp: deleteYubikeyOtp,
	createYubikeyOtp: createYubikeyOtp,
	createShareLink: createShareLink,
	moveShareLink: moveShareLink,
	deleteShareLink: deleteShareLink,
	readApiKey: readApiKey,
	readApiKeySecrets: readApiKeySecrets,
	createApiKey: createApiKey,
	addSecretToApiKey: addSecretToApiKey,
	updateApiKey: updateApiKey,
	deleteApiKey: deleteApiKey,
	deleteApiKeySecret: deleteApiKeySecret,
	readFileRepository: readFileRepository,
	createFileRepository: createFileRepository,
	updateFileRepository: updateFileRepository,
	deleteFileRepository: deleteFileRepository,
	createGroupFileRepositoryRight: createGroupFileRepositoryRight,
	updateGroupFileRepositoryRight: updateGroupFileRepositoryRight,
	deleteGroupFileRepositoryRight: deleteGroupFileRepositoryRight,
	createFileRepositoryRight: createFileRepositoryRight,
	updateFileRepositoryRight: updateFileRepositoryRight,
	deleteFileRepositoryRight: deleteFileRepositoryRight,
	acceptFileRepositoryRight: acceptFileRepositoryRight,
	declineFileRepositoryRight: declineFileRepositoryRight,
	fileRepositoryUpload: fileRepositoryUpload,
	fileRepositoryDownload: fileRepositoryDownload,
	readGroup: readGroup,
	createGroup: createGroup,
	updateGroup: updateGroup,
	deleteGroup: deleteGroup,
	readGroupRights: readGroupRights,
	createMembership: createMembership,
	updateMembership: updateMembership,
	deleteMembership: deleteMembership,
	acceptMembership: acceptMembership,
	declineMembership: declineMembership,
	readFile: readFile,
	createFile: createFile,
	deleteFile: deleteFile,
	deleteAccount: deleteAccount,
	readShards: readShards,
	createLinkShare: createLinkShare,
	readLinkShare: readLinkShare,
	updateLinkShare: updateLinkShare,
	deleteLinkShare: deleteLinkShare,
	linkShareAccessRead: linkShareAccessRead,
	linkShareAccessWrite: linkShareAccessWrite,
	sendSecurityReport: sendSecurityReport,
	readAvatar: readAvatar,
	createAvatar: createAvatar,
	deleteAvatar: deleteAvatar,
	createServerSecret: createServerSecret,
	deleteServerSecret: deleteServerSecret,
	validateIvaltTwoFactor: validateIvaltTwoFactor,
	readIvalt: readIvalt,
	deleteIvalt: deleteIvalt,
	createIvalt: createIvalt,
	validateIvalt: validateIvalt,
	getIvaltApiToken: getIvaltApiToken,
	claimDeviceCode: claimDeviceCode,
};

export default apiClientService;
