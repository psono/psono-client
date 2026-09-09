/**
 * Service to manage the host
 */

import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import { getStore } from "./store";

/**
 * Returns all known hosts
 *
 * @returns {*} The known hosts
 */
function getKnownHosts() {
	return getStore().getState().persistent.knownHosts;
}
/**
 * Returns the current host
 *
 * @returns {*} The current host
 */
function getCurrentHost() {
	return getStore().getState().server;
}
/**
 * Returns whether the current server is EE
 *
 * @returns {boolean} The current host is an EE host
 */
function isEE() {
	return getStore().getState().server.type === "EE";
}
/**
 * Returns whether the current server is EE
 *
 * @returns {boolean} The current host is an CE host
 */
function isCE() {
	return getStore().getState().server.type === "CE";
}

/**
 * Returns whether the current EE server advertises gateway support.
 *
 * @returns {boolean} The current host supports gateway launches
 */
function supportsGateway() {
	const server = getStore().getState().server;
	return server.type === "EE" && server.gateway === true;
}
/**
 * Returns whether the current's server version is greater (or equal) than the current specified one
 *
 * @returns {*} The current host
 */
function isNewerOrEqualVersionThan(version) {
	return semverCompare(getStore().getState().server.version, version) >= 0;
}
/**
 * Returns the url of the current host
 *
 * @returns {*} The current host url
 */
function getCurrentHostUrl() {
	return getStore().getState().server.url;
}

/**
 * Updates the known servers with the given new list of servers
 *
 * @param {array} newKnownHosts List of the new servers
 */
function updateKnownHosts(newKnownHosts) {
	action().setKnownHosts(newKnownHosts);
}

/**
 * Tries to find the serverUrl and fingerprint in the known hosts storage and compares the fingerprint
 *
 * @param {string} serverUrl The url of the server
 * @param {string} verifyKey The fingerprint of the server
 * @param {*} adminRecoveryPublicKey The advertised admin recovery public key
 *
 * @returns {*} The result of the search / comparison
 */
function checkKnownHosts(serverUrl, verifyKey, adminRecoveryPublicKey) {
	const known_hosts = getKnownHosts();
	serverUrl = serverUrl.toLowerCase();
	adminRecoveryPublicKey = normalizeAdminRecoveryPublicKey(
		adminRecoveryPublicKey,
	);

	for (let i = 0; i < known_hosts.length; i++) {
		if (known_hosts[i]["url"] !== serverUrl) {
			continue;
		}
		if (known_hosts[i]["verify_key"] !== verifyKey) {
			const hasAdminRecoveryPublicKey = Object.hasOwn(
				known_hosts[i],
				"admin_recovery_public_key",
			);
			const oldAdminRecoveryPublicKey = hasAdminRecoveryPublicKey
				? normalizeAdminRecoveryPublicKey(
						known_hosts[i]["admin_recovery_public_key"],
					)
				: undefined;
			return {
				status: "signature_changed",
				verify_key_old: known_hosts[i]["verify_key"],
				admin_recovery_public_key_old: oldAdminRecoveryPublicKey,
				admin_recovery_public_key_changed:
					hasAdminRecoveryPublicKey &&
					oldAdminRecoveryPublicKey !== adminRecoveryPublicKey,
			};
		}
		if (!Object.hasOwn(known_hosts[i], "admin_recovery_public_key")) {
			return {
				status: "matched",
				admin_recovery_public_key_missing: true,
			};
		}

		const oldAdminRecoveryPublicKey = normalizeAdminRecoveryPublicKey(
			known_hosts[i]["admin_recovery_public_key"],
		);
		if (oldAdminRecoveryPublicKey !== adminRecoveryPublicKey) {
			return {
				status: "admin_recovery_public_key_changed",
				admin_recovery_public_key_old: oldAdminRecoveryPublicKey,
			};
		}
		return {
			status: "matched",
			admin_recovery_public_key_needs_normalization:
				known_hosts[i]["admin_recovery_public_key"] !==
				oldAdminRecoveryPublicKey,
		};
	}

	return {
		status: "not_found",
	};
}

/**
 * Returns a canonical admin recovery public key or the disabled value.
 *
 * @param {*} publicKey The advertised public key
 * @returns {string} A lowercase 64 character hex key, or an empty string
 */
function normalizeAdminRecoveryPublicKey(publicKey) {
	return typeof publicKey === "string" && /^[0-9a-f]{64}$/i.test(publicKey)
		? publicKey.toLowerCase()
		: "";
}

/**
 * Returns the server info
 *
 * @returns {Promise} Server info
 */
function info() {
	const onSuccess = (response) => {
		response.data["decoded_info"] = JSON.parse(response.data["info"]);

		return response;
	};
	return apiClient.info().then(onSuccess);
}

/**
 * Simple semver comparison of two semantic versioned strings like "1.0" and "2.5-alpha" or "3.2+whatever"
 *
 * Returns a number encoding the relation
 * "-1": "a < b",
 *  "0": "=",
 *  "1":  ">"
 *
 * @param a
 * @param b
 * @returns {number}
 */
function semverCompare(a, b) {
	// remove leading v
	a = a.replace(/^v/, "");
	b = b.replace(/^v/, "");
	// remove everything after whitespace
	a = a.replace(/\s.*/, "");
	b = b.replace(/\s.*/, "");
	// remove everything after + sign
	a = a.replace(/\+.*/, "");
	b = b.replace(/\+.*/, "");

	// handles cases like "1.2.3", ">", "1.2.3-asdf"
	if (a.startsWith(b + "-")) return -1;
	if (b.startsWith(a + "-")) return 1;

	return a.localeCompare(b, undefined, {
		numeric: true,
		sensitivity: "case",
		caseFirst: "upper",
	});
}

/**
 * Validates the signature of the server and compares it to known hosts.
 *
 * @param {String} server The server url
 * @param {String} [preApprovedVerifyKey] A preapproved verify key
 *
 * @returns {Promise} Result of the check
 */
function checkHost(server, preApprovedVerifyKey) {
	const onSuccess = (response) => {
		const data = response.data;
		const serverUrl = server.toLowerCase();
		const info = JSON.parse(data["info"]);
		const adminRecoveryPublicKey = normalizeAdminRecoveryPublicKey(
			info["admin_recovery_public_key"],
		);
		const splitVersion = info.version.split(" ");
		info.version = "v" + splitVersion[0];
		info.build = splitVersion[2].replace(")", "");

		if (
			!cryptoLibrary.validateSignature(
				data["info"],
				data["signature"],
				data["verify_key"],
			)
		) {
			return {
				server_url: serverUrl,
				status: "invalid_signature",
				verify_key: undefined,
				admin_recovery_public_key: adminRecoveryPublicKey,
				info: info,
			};
		}

		const minVersion = {
			CE: "4.0.14",
			EE: "4.0.24",
		};

		if (
			semverCompare(
				minVersion[data["decoded_info"]["type"]],
				data["decoded_info"]["version"],
			) > 0
		) {
			return {
				server_url: serverUrl,
				status: "unsupported_server_version",
				verify_key: data["verify_key"],
				admin_recovery_public_key: adminRecoveryPublicKey,
				info: info,
			};
		}

		const checkResult = checkKnownHosts(
			serverUrl,
			data["verify_key"],
			adminRecoveryPublicKey,
		);

		if (checkResult["status"] === "signature_changed") {
			return {
				server_url: serverUrl,
				status: "signature_changed",
				verify_key: data["verify_key"],
				verify_key_old: checkResult["verify_key_old"],
				admin_recovery_public_key: adminRecoveryPublicKey,
				admin_recovery_public_key_old:
					checkResult["admin_recovery_public_key_old"],
				admin_recovery_public_key_changed:
					checkResult["admin_recovery_public_key_changed"],
				info: info,
			};
		} else if (checkResult["status"] === "admin_recovery_public_key_changed") {
			return {
				server_url: serverUrl,
				status: "admin_recovery_public_key_changed",
				verify_key: data["verify_key"],
				admin_recovery_public_key: adminRecoveryPublicKey,
				admin_recovery_public_key_old:
					checkResult["admin_recovery_public_key_old"],
				info: info,
			};
		} else if (
			checkResult["status"] === "matched" ||
			(checkResult["status"] === "not_found" &&
				preApprovedVerifyKey &&
				preApprovedVerifyKey === data["verify_key"])
		) {
			if (
				checkResult["status"] === "matched" &&
				(checkResult["admin_recovery_public_key_missing"] ||
					checkResult["admin_recovery_public_key_needs_normalization"])
			) {
				approveHost(serverUrl, data["verify_key"], adminRecoveryPublicKey);
			}
			return {
				server_url: serverUrl,
				status: "matched",
				verify_key: data["verify_key"],
				admin_recovery_public_key: adminRecoveryPublicKey,
				info: info,
			};
		} else {
			return {
				server_url: serverUrl,
				status: "new_server",
				verify_key: data["verify_key"],
				admin_recovery_public_key: adminRecoveryPublicKey,
				info: info,
			};
		}
	};

	return info().then(onSuccess);
}

/**
 * Loads a remote config. It takes an url of a remote web client and loads its config.
 * It persists the config so it does not need to be loaded multiple times
 *
 * @param {string} webClientUrl The url of a web client without trailing slash
 * @param {string} serverUrl The default url of the server
 *
 * @returns {Promise} Result of the check
 */
function loadRemoteConfig(webClientUrl, serverUrl) {
	const onSuccess = async (data) => {
		const config = await data.json();
		// we need to preserve the base_url and the backend server as they are optional and the original web
		// client would create them dynamically
		if (!Object.hasOwn(config, "base_url")) {
			config["base_url"] = webClientUrl;
		}

		if (Object.hasOwn(config, "backend_servers")) {
			for (let i = 0; i < config["backend_servers"].length; i++) {
				if (Object.hasOwn(config["backend_servers"][i], "url")) {
					continue;
				}
				config["backend_servers"][i]["url"] = serverUrl;
			}
		}

		// we store the loaded configuration
		action().setRemoteConfigJson(webClientUrl, config);
		action().setUserUsername("");
		action().setServerUrl("");
		browserClient.clearConfigCache();
	};

	const onError = (data) => {
		console.log(data);
		return Promise.reject(data);
	};

	return fetch(webClientUrl + "/config.json").then(onSuccess, onError);
}

/**
 * Puts the server with the specified url and verify key on the approved servers list
 *
 * @param {string} serverUrl The url of the server
 * @param {string} verifyKey The verification key
 * @param {*} adminRecoveryPublicKey The admin recovery public key
 */
function approveHost(serverUrl, verifyKey, adminRecoveryPublicKey) {
	serverUrl = serverUrl.toLowerCase();
	adminRecoveryPublicKey = normalizeAdminRecoveryPublicKey(
		adminRecoveryPublicKey,
	);

	const known_hosts = getKnownHosts().map((knownHost) => ({ ...knownHost }));

	for (let i = 0; i < known_hosts.length; i++) {
		if (known_hosts[i]["url"] !== serverUrl) {
			continue;
		}
		known_hosts[i]["verify_key"] = verifyKey;
		known_hosts[i]["admin_recovery_public_key"] = adminRecoveryPublicKey;

		updateKnownHosts(known_hosts);
		return;
	}

	known_hosts.push({
		url: serverUrl,
		verify_key: verifyKey,
		admin_recovery_public_key: adminRecoveryPublicKey,
	});

	updateKnownHosts(known_hosts);
}

/**
 * Deletes a known host identified by its fingerprint from the storage
 *
 * @param {string} fingerprint The fingerprint of the host
 */
function deleteKnownHost(fingerprint) {
	const known_hosts = getKnownHosts();

	helperService.removeFromArray(
		known_hosts,
		fingerprint,
		(known_host, fingerprint) => known_host["verify_key"] === fingerprint,
	);

	updateKnownHosts(known_hosts);
}

const hostService = {
	semverCompare: semverCompare,
	getKnownHosts: getKnownHosts,
	getCurrentHost: getCurrentHost,
	isCE: isCE,
	isEE: isEE,
	supportsGateway: supportsGateway,
	isNewerOrEqualVersionThan: isNewerOrEqualVersionThan,
	getCurrentHostUrl: getCurrentHostUrl,
	checkKnownHosts: checkKnownHosts,
	normalizeAdminRecoveryPublicKey: normalizeAdminRecoveryPublicKey,
	info: info,
	checkHost: checkHost,
	loadRemoteConfig: loadRemoteConfig,
	approveHost: approveHost,
	deleteKnownHost: deleteKnownHost,
	updateKnownHosts: updateKnownHosts,
};

export default hostService;
