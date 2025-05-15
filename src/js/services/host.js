/**
 * Service to manage the host
 */

import { getStore } from "./store";
import cryptoLibrary from "./crypto-library";
import helperService from "./helper";
import apiClient from "./api-client";
import browserClient from "./browser-client";
import action from "../actions/bound-action-creators";

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
 *
 * @returns {*} The result of the search / comparison
 */
function checkKnownHosts(serverUrl, verifyKey) {
    const known_hosts = getKnownHosts();
    serverUrl = serverUrl.toLowerCase();

    for (let i = 0; i < known_hosts.length; i++) {
        if (known_hosts[i]["url"] !== serverUrl) {
            continue;
        }
        if (known_hosts[i]["verify_key"] !== verifyKey) {
            return {
                status: "signature_changed",
                verify_key_old: known_hosts[i]["verify_key"],
            };
        }
        return {
            status: "matched",
        };
    }

    return {
        status: "not_found",
    };
}

/**
 * Returns the server info
 *
 * @returns {Promise} Server info
 */
function info() {
    const onSuccess = function (response) {
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
    // remove everything after whitespace
    a = a.replace(/\s.*/, "")
    b = b.replace(/\s.*/, "")
    // remove everything after + sign
    a = a.replace(/\+.*/, "")
    b = b.replace(/\+.*/, "")

    // handles cases like "1.2.3", ">", "1.2.3-asdf"
    if (a.startsWith(b + "-")) return -1
    if (b.startsWith(a + "-")) return  1

    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "case", caseFirst: "upper" })
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
    const onSuccess = function (response) {
        let checkResult;
        const data = response.data;
        const serverUrl = server.toLowerCase();
        const info = JSON.parse(data["info"]);
        const splitVersion = info.version.split(" ");
        info.version = "v" + splitVersion[0];
        info.build = splitVersion[2].replace(")", "");

        if (!cryptoLibrary.validateSignature(data["info"], data["signature"], data["verify_key"])) {
            return {
                server_url: serverUrl,
                status: "invalid_signature",
                verify_key: undefined,
                info: info,
            };
        }

        const minVersion = {
            'CE': '4.0.14',
            'EE': '4.0.24',
        }

        if (semverCompare(minVersion[data["decoded_info"]["type"]], data["decoded_info"]["version"]) > 0) {
            return {
                server_url: serverUrl,
                status: "unsupported_server_version",
                verify_key: data["verify_key"],
                info: info,
            };
        }

        checkResult = checkKnownHosts(serverUrl, data["verify_key"]);

        if (checkResult["status"] === "matched" || (preApprovedVerifyKey && preApprovedVerifyKey === data["verify_key"])) {
            return {
                server_url: serverUrl,
                status: "matched",
                verify_key: data["verify_key"],
                info: info,
            };
        } else if (checkResult["status"] === "signature_changed") {
            return {
                server_url: serverUrl,
                status: "signature_changed",
                verify_key: data["verify_key"],
                verify_key_old: checkResult["verify_key_old"],
                info: info,
            };
        } else {
            return {
                server_url: serverUrl,
                status: "new_server",
                verify_key: data["verify_key"],
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

    const onSuccess = async function (data) {
        const config = await data.json();
        // we need to preserve the base_url and the backend server as they are optional and the original web
        // client would create them dynamically
        if (!config.hasOwnProperty("base_url")) {
            config["base_url"] = webClientUrl;
        }

        if (config.hasOwnProperty("backend_servers")) {
            for (let i = 0; i < config["backend_servers"].length; i++) {
                if (config["backend_servers"][i].hasOwnProperty("url")) {
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

    const onError = function (data) {
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
 */
function approveHost(serverUrl, verifyKey) {
    serverUrl = serverUrl.toLowerCase();

    const known_hosts = getKnownHosts();

    for (let i = 0; i < known_hosts.length; i++) {
        if (known_hosts[i]["url"] !== serverUrl) {
            continue;
        }
        known_hosts[i]["verify_key"] = verifyKey;

        updateKnownHosts(known_hosts);
        return;
    }

    known_hosts.push({
        url: serverUrl,
        verify_key: verifyKey,
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

    helperService.removeFromArray(known_hosts, fingerprint, function (known_host, fingerprint) {
        return known_host["verify_key"] === fingerprint;
    });

    updateKnownHosts(known_hosts);
}

const hostService = {
    getKnownHosts: getKnownHosts,
    getCurrentHost: getCurrentHost,
    getCurrentHostUrl: getCurrentHostUrl,
    checkKnownHosts: checkKnownHosts,
    info: info,
    checkHost: checkHost,
    loadRemoteConfig: loadRemoteConfig,
    approveHost: approveHost,
    deleteKnownHost: deleteKnownHost,
    updateKnownHosts: updateKnownHosts,
};

export default hostService;
