import { getStore } from "./store";

const EMPTY_CONNECTION_AUTHENTICATION = {
	schema_version: 1,
	by_connection_secret_id: {},
};

function getConnectionAuthentication(connectionSecretId) {
	const settings = getStore().getState().settingsDatastore;
	const connectionAuthentication =
		settings.connectionAuthentication || EMPTY_CONNECTION_AUTHENTICATION;
	return (
		connectionAuthentication.by_connection_secret_id?.[connectionSecretId] ||
		null
	);
}

function sanitizeConnectionAuthentication(authentication) {
	if (!authentication) {
		return null;
	}

	const sanitized = {
		secret_id: authentication.secret_id,
		secret_key: authentication.secret_key,
		type: authentication.type,
	};
	if (authentication.type === "ssh_own_key") {
		sanitized.username = authentication.username || "";
	}
	return sanitized;
}

function embeddedAuthentication(type, data) {
	if (type === "ssh_connection") {
		if (data.ssh_connection_authentication_type === "password") {
			if (!data.ssh_connection_username || !data.ssh_connection_password) {
				return null;
			}
			return {
				source: "connection",
				type: "password",
				username: data.ssh_connection_username || "",
				password: data.ssh_connection_password || "",
				private_key: "",
			};
		}
		if (data.ssh_connection_authentication_type === "private_key") {
			if (!data.ssh_connection_username || !data.ssh_connection_private_key) {
				return null;
			}
			return {
				source: "connection",
				type: "private_key",
				username: data.ssh_connection_username || "",
				password: "",
				private_key: data.ssh_connection_private_key || "",
			};
		}
	}

	if (type === "rdp_connection") {
		if (!data.rdp_connection_username || !data.rdp_connection_password) {
			return null;
		}
		return {
			source: "connection",
			type: "password",
			username: data.rdp_connection_username || "",
			password: data.rdp_connection_password || "",
			private_key: "",
		};
	}

	return null;
}

function rejectBrokenReference() {
	return Promise.reject({
		code: "BROKEN_REFERENCE",
		non_field_errors: ["BROKEN_REFERENCE"],
	});
}

function resolveAuthenticationReference(type, authentication, readSecret) {
	if (
		!authentication.secret_id ||
		!authentication.secret_key ||
		!authentication.type ||
		(authentication.type !== "application_password" &&
			authentication.type !== "ssh_own_key") ||
		(type === "rdp_connection" &&
			authentication.type !== "application_password")
	) {
		return rejectBrokenReference();
	}

	return readSecret(authentication.secret_id, authentication.secret_key)
		.then((credential) => {
			if (authentication.type === "application_password") {
				if (
					!credential.application_password_username ||
					!credential.application_password_password
				) {
					return rejectBrokenReference();
				}
				return {
					source: "reference",
					type: "password",
					username: credential.application_password_username,
					password: credential.application_password_password,
					private_key: "",
				};
			}

			if (
				type !== "ssh_connection" ||
				!authentication.username ||
				!credential.ssh_own_key_private
			) {
				return rejectBrokenReference();
			}
			return {
				source: "reference",
				type: "private_key",
				username: authentication.username,
				password: "",
				private_key: credential.ssh_own_key_private,
			};
		})
		.catch(() => rejectBrokenReference());
}

function resolveConnectionAuthentication(
	type,
	connectionSecretId,
	data,
	readSecret,
) {
	const authentication = getConnectionAuthentication(connectionSecretId);
	if (!authentication) {
		return Promise.resolve(embeddedAuthentication(type, data));
	}
	return resolveAuthenticationReference(type, authentication, readSecret);
}

const connectionCredentialsService = {
	embeddedAuthentication,
	getConnectionAuthentication,
	resolveAuthenticationReference,
	resolveConnectionAuthentication,
	sanitizeConnectionAuthentication,
};
export default connectionCredentialsService;
