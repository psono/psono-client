import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import connectionCredentialsService from "./connection-credentials";
import cryptoLibrary from "./crypto-library";
import secretService from "./secret";
import storage from "./storage";
import { getStore } from "./store";

const GUACAMOLE_CONNECTION_CLIENT_ID = "cHNvbm8tY29ubmVjdGlvbgBjAHBzb25v";
const MAX_HOSTNAME_LENGTH = 253;
const MAX_USERNAME_LENGTH = 256;
const MAX_PASSWORD_LENGTH = 4096;
const MAX_DOMAIN_LENGTH = 256;
const MAX_PRIVATE_KEY_LENGTH = 64 * 1024;

function gatewayError(code) {
	return { code, non_field_errors: [code] };
}

function hasForbiddenControlCharacter(value, multilineAllowed) {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		const isControl = code <= 0x1f || (code >= 0x7f && code <= 0x9f);
		if (
			isControl &&
			!(multilineAllowed && (code === 0x09 || code === 0x0a || code === 0x0d))
		) {
			return true;
		}
	}
	return false;
}

function validString(value, maximumLength, emptyAllowed, multilineAllowed) {
	return (
		typeof value === "string" &&
		(emptyAllowed || value.length > 0) &&
		value.length <= maximumLength &&
		!hasForbiddenControlCharacter(value, multilineAllowed)
	);
}

function validHostname(value) {
	return (
		validString(value, MAX_HOSTNAME_LENGTH, false, false) &&
		!/[\s/\\?#]/u.test(value)
	);
}

function buildPayload(type, connection, authentication) {
	if (!authentication || !connection) {
		throw gatewayError("GATEWAY_CREDENTIALS_MISSING");
	}

	if (type === "ssh_connection") {
		const hostname = connection.ssh_connection_host;
		const port = Number(connection.ssh_connection_port);
		if (
			!validHostname(hostname) ||
			!Number.isInteger(port) ||
			port < 1 ||
			port > 65535
		) {
			throw gatewayError("GATEWAY_CONNECTION_INVALID");
		}
		if (
			authentication.type !== "password" &&
			authentication.type !== "private_key"
		) {
			throw gatewayError("GATEWAY_CREDENTIALS_MISSING");
		}
		if (
			!validString(authentication.username, MAX_USERNAME_LENGTH, false, false)
		) {
			throw gatewayError("GATEWAY_CREDENTIALS_MISSING");
		}
		if (
			authentication.type === "password" &&
			!validString(authentication.password, MAX_PASSWORD_LENGTH, false, false)
		) {
			throw gatewayError("GATEWAY_CREDENTIALS_MISSING");
		}
		if (
			authentication.type === "private_key" &&
			!validString(
				authentication.private_key,
				MAX_PRIVATE_KEY_LENGTH,
				false,
				true,
			)
		) {
			throw gatewayError("GATEWAY_CREDENTIALS_MISSING");
		}
		const payload = {
			version: 1,
			protocol: "ssh",
			hostname,
			port,
			authentication: {
				type: authentication.type,
				username: authentication.username,
			},
		};
		if (authentication.type === "password") {
			payload.authentication.password = authentication.password;
		} else {
			payload.authentication.private_key = authentication.private_key;
		}
		return payload;
	}

	if (type === "rdp_connection") {
		const hostname = connection.rdp_connection_host;
		const port = Number(connection.rdp_connection_port);
		const domain = connection.rdp_connection_domain || "";
		const ignoreCertificate =
			connection.rdp_connection_ignore_certificate === true;
		if (
			!validHostname(hostname) ||
			!Number.isInteger(port) ||
			port < 1 ||
			port > 65535 ||
			authentication.type !== "password" ||
			!validString(
				authentication.username,
				MAX_USERNAME_LENGTH,
				false,
				false,
			) ||
			!validString(
				authentication.password,
				MAX_PASSWORD_LENGTH,
				false,
				false,
			) ||
			!validString(domain, MAX_DOMAIN_LENGTH, true, false)
		) {
			throw gatewayError("GATEWAY_CONNECTION_INVALID");
		}
		return {
			version: 1,
			protocol: "rdp",
			hostname,
			port,
			domain,
			ignore_certificate: ignoreCertificate,
			authentication: {
				type: "password",
				username: authentication.username,
				password: authentication.password,
			},
		};
	}

	if (type === "vnc_connection") {
		const hostname = connection.vnc_connection_host;
		const port = Number(connection.vnc_connection_port);
		const username = authentication.username || "";
		if (
			!validHostname(hostname) ||
			!Number.isInteger(port) ||
			port < 1 ||
			port > 65535 ||
			authentication.type !== "password" ||
			!validString(username, MAX_USERNAME_LENGTH, true, false) ||
			!validString(authentication.password, MAX_PASSWORD_LENGTH, false, false)
		) {
			throw gatewayError("GATEWAY_CONNECTION_INVALID");
		}
		return {
			version: 1,
			protocol: "vnc",
			hostname,
			port,
			authentication: {
				type: "password",
				username,
				password: authentication.password,
			},
		};
	}

	throw gatewayError("GATEWAY_CONNECTION_INVALID");
}

function buildGatewayUrl(gatewayUrl, launchId, key) {
	let url;
	try {
		url = new URL(gatewayUrl);
	} catch (_error) {
		throw gatewayError("GATEWAY_URL_INVALID");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw gatewayError("GATEWAY_URL_INVALID");
	}
	if (
		url.protocol === "http:" &&
		!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
	) {
		throw gatewayError("GATEWAY_URL_INVALID");
	}
	url.hash = `#/client/${GUACAMOLE_CONNECTION_CLIENT_ID}?${new URLSearchParams({
		"psono-launch": launchId,
		"psono-key": key,
	}).toString()}`;
	return url.toString();
}

function openGatewayWindow() {
	const gatewayWindow = window.open("about:blank", "_blank");
	if (!gatewayWindow) {
		throw gatewayError("GATEWAY_POPUP_BLOCKED");
	}
	gatewayWindow.opener = null;
	return gatewayWindow;
}

function closeGatewayWindow(gatewayWindow) {
	try {
		gatewayWindow?.close();
	} catch (_error) {
		// The browser owns this window and may have already closed it.
	}
}

function openGatewayUrl(url, gatewayWindow) {
	const targetWindow = gatewayWindow || openGatewayWindow();
	try {
		targetWindow.location.replace(url);
	} catch (error) {
		closeGatewayWindow(targetWindow);
		throw error;
	}
	return targetWindow;
}

async function resolveItem(itemOrSecretId) {
	if (typeof itemOrSecretId !== "string") {
		return itemOrSecretId;
	}
	const leaf = await storage.findKey(
		"datastore-password-leafs",
		itemOrSecretId,
	);
	if (!leaf) {
		throw gatewayError("GATEWAY_CONNECTION_INVALID");
	}
	return Object.assign({}, leaf, { secret_id: itemOrSecretId });
}

async function launch(itemOrSecretId, clusterId, gatewayWindow) {
	const targetWindow = gatewayWindow || openGatewayWindow();
	try {
		const item = await resolveItem(itemOrSecretId);
		if (
			!item ||
			!["ssh_connection", "rdp_connection", "vnc_connection"].includes(
				item.type,
			) ||
			!item.secret_id ||
			!item.secret_key
		) {
			throw gatewayError("GATEWAY_CONNECTION_INVALID");
		}

		const connection = await secretService.readSecret(
			item.secret_id,
			item.secret_key,
		);
		const authentication =
			await connectionCredentialsService.resolveConnectionAuthentication(
				item.type,
				item.secret_id,
				connection,
				secretService.readSecret,
			);
		const payload = buildPayload(item.type, connection, authentication);
		const key = cryptoLibrary.generateSecretKey();
		const encrypted = cryptoLibrary.encryptData(JSON.stringify(payload), key);
		const state = getStore().getState();
		const response = await apiClient.launchGateway(
			state.user.token,
			state.user.sessionSecretKey,
			clusterId,
			encrypted.text,
			encrypted.nonce,
		);
		const url = buildGatewayUrl(
			response.data.gateway_url,
			response.data.launch_id,
			key,
		);
		openGatewayUrl(url, targetWindow);
		return response.data;
	} catch (error) {
		closeGatewayWindow(targetWindow);
		throw error;
	}
}

function getRememberedClusterId(connectionSecretId) {
	return (
		getStore().getState().settingsDatastore.gatewayClusterSelection
			?.by_connection_secret_id?.[connectionSecretId] || null
	);
}

async function prepareLaunch(item) {
	const gatewayWindow = openGatewayWindow();
	try {
		const state = getStore().getState();
		const response = await apiClient.getGatewayClusters(
			state.user.token,
			state.user.sessionSecretKey,
		);
		const clusters = Array.isArray(response.data.clusters)
			? response.data.clusters
			: [];
		if (clusters.length === 0) {
			throw gatewayError("GATEWAY_NO_CLUSTERS");
		}

		const rememberedClusterId = getRememberedClusterId(item.secret_id);
		const rememberedCluster = clusters.find(
			(cluster) => cluster.id === rememberedClusterId,
		);
		if (rememberedCluster) {
			await launch(item, rememberedCluster.id, gatewayWindow);
			return { launched: true, clusters };
		}
		if (rememberedClusterId) {
			await action().setGatewayClusterSelection(item.secret_id, null);
		}
		if (clusters.length === 1) {
			await launch(item, clusters[0].id, gatewayWindow);
			return { launched: true, clusters };
		}
		closeGatewayWindow(gatewayWindow);
		return { launched: false, clusters };
	} catch (error) {
		closeGatewayWindow(gatewayWindow);
		throw error;
	}
}

async function launchSelected(item, clusterId, remember) {
	const gatewayWindow = openGatewayWindow();
	try {
		if (remember) {
			await action().setGatewayClusterSelection(item.secret_id, clusterId);
		}
		return await launch(item, clusterId, gatewayWindow);
	} catch (error) {
		closeGatewayWindow(gatewayWindow);
		throw error;
	}
}

const gatewayService = {
	buildGatewayUrl,
	buildPayload,
	getRememberedClusterId,
	launch,
	launchSelected,
	openGatewayUrl,
	openGatewayWindow,
	prepareLaunch,
};

export default gatewayService;
