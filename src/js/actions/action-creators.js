import datastoreSettingService from "../services/datastore-setting";
import { getStore } from "../services/store";
import {
	CLEAR_DEVICE_CODE,
	DISABLE_OFFLINE_MODE,
	ENABLE_OFFLINE_MODE,
	LOGOUT,
	NOTIFICATION_SEND,
	NOTIFICATION_SET,
	SET_AUTO_APPROVE_PLAINTEXT_PASSWORD,
	SET_CLIENT_CONFIG,
	SET_CLIENT_URL,
	SET_CONNECTION_AUTHENTICATION,
	SET_DEVICE_CODE,
	SET_DISABLE_BROWSER_PM,
	SET_DOMAIN_SYNONYMS_CONFIG,
	SET_EMAIL,
	SET_FINGERPRINT,
	SET_GATEWAY_CLUSTER_SELECTION,
	SET_GPG_CONFIG,
	SET_HAS_TWO_FACTOR,
	SET_HASHING_PARAMETERS,
	SET_HIDE_DOWNLOAD_BANNER,
	SET_KNOWN_HOSTS,
	SET_LAST_POPUP_SEARCH,
	SET_NOTIFICATION_ON_COPY,
	SET_OFFLINE_CACHE_ENCRYPTION_INFO,
	SET_PASSWORD_CONFIG,
	SET_REMOTE_CONFIG_JSON,
	SET_REQUESTS_IN_PROGRESS,
	SET_REQUIRE_PASSWORD_CHANGE,
	SET_SERVER_INFO,
	SET_SERVER_POLICY,
	SET_SERVER_SECRET_EXISTS,
	SET_SERVER_STATUS,
	SET_SERVER_URL,
	SET_SHOW_FILTERS,
	SET_SHOWN_ENTRIES_CONFIG,
	SET_USER_DATASTORE_OVERVIEW,
	SET_USER_INFO_1,
	SET_USER_INFO_2,
	SET_USER_INFO_3,
	SET_USER_USERNAME,
	SETTINGS_DATASTORE_LOADED,
} from "./action-types";

function setUserUsername(username) {
	return (dispatch) => {
		dispatch({
			type: SET_USER_USERNAME,
			username,
		});
	};
}

function setUserInfo1(rememberMe, trustDevice, authentication) {
	return (dispatch) => {
		dispatch({
			type: SET_USER_INFO_1,
			rememberMe,
			trustDevice,
			authentication,
		});
	};
}
function setUserInfo2(
	userPrivateKey,
	userPublicKey,
	sessionSecretKey,
	token,
	userSauce,
	authentication,
) {
	return (dispatch) => {
		dispatch({
			type: SET_USER_INFO_2,
			userPrivateKey: userPrivateKey,
			userPublicKey: userPublicKey,
			sessionSecretKey: sessionSecretKey,
			token,
			userSauce: userSauce,
			authentication: authentication,
		});
	};
}
function setUserInfo3(
	userId,
	userEmail,
	userSecretKey,
	serverSecretExists,
	requirePasswordChange = false,
) {
	return (dispatch) => {
		dispatch({
			type: SET_USER_INFO_3,
			userId: userId,
			userEmail,
			userSecretKey,
			serverSecretExists,
			requirePasswordChange,
		});
	};
}

function setRequirePasswordChange(requirePasswordChange) {
	return (dispatch) => {
		dispatch({
			type: SET_REQUIRE_PASSWORD_CHANGE,
			requirePasswordChange,
		});
	};
}
function sethashingParameters(hashingAlgorithm, hashingParameters) {
	return (dispatch) => {
		dispatch({
			type: SET_HASHING_PARAMETERS,
			hashingAlgorithm: hashingAlgorithm,
			hashingParameters: hashingParameters,
		});
	};
}
function setServerSecretExists(serverSecretExists) {
	return (dispatch) => {
		dispatch({
			type: SET_SERVER_SECRET_EXISTS,
			serverSecretExists: serverSecretExists,
		});
	};
}
function setHasTwoFactor(hasTwoFactor) {
	return (dispatch) => {
		dispatch({
			type: SET_HAS_TWO_FACTOR,
			hasTwoFactor: hasTwoFactor,
		});
	};
}

function setEmail(userEmail) {
	return (dispatch) => {
		dispatch({
			type: SET_EMAIL,
			userEmail,
		});
	};
}

function setUserDatastoreOverview(userDatastoreOverview) {
	return (dispatch) => {
		dispatch({
			type: SET_USER_DATASTORE_OVERVIEW,
			userDatastoreOverview,
		});
	};
}

function logout(rememberMe) {
	return (dispatch) => {
		dispatch({
			type: LOGOUT,
			rememberMe,
		});
	};
}

function setServerInfo(info, verifyKey, adminRecoveryPublicKey = "") {
	return (dispatch) => {
		dispatch({
			type: SET_SERVER_INFO,
			info,
			verifyKey,
			adminRecoveryPublicKey,
		});
	};
}

function setServerPolicy(policy) {
	return (dispatch) => {
		dispatch({
			type: SET_SERVER_POLICY,
			policy,
		});
	};
}

function setServerUrl(url) {
	return (dispatch) => {
		dispatch({
			type: SET_SERVER_URL,
			url: url,
		});
	};
}

function setServerStatus(status) {
	return (dispatch) => {
		dispatch({
			type: SET_SERVER_STATUS,
			status: status,
		});
	};
}

function setClientUrl(url) {
	return (dispatch) => {
		dispatch({
			type: SET_CLIENT_URL,
			url: url,
		});
	};
}
function enableOfflineMode() {
	return (dispatch) => {
		dispatch({
			type: ENABLE_OFFLINE_MODE,
		});
	};
}
function disableOfflineMode() {
	return (dispatch) => {
		dispatch({
			type: DISABLE_OFFLINE_MODE,
		});
	};
}
function setOfflineCacheEncryptionInfo(
	offlineCacheEncryptionKey,
	offlineCacheEncryptionSalt,
) {
	return (dispatch) => {
		dispatch({
			type: SET_OFFLINE_CACHE_ENCRYPTION_INFO,
			offlineCacheEncryptionKey,
			offlineCacheEncryptionSalt,
		});
	};
}
function setNotificationOnCopy(notificationOnCopy) {
	return (dispatch) => {
		dispatch({
			type: SET_NOTIFICATION_ON_COPY,
			notificationOnCopy,
		});
	};
}
function setDisableBrowserPm(disableBrowserPm) {
	return (dispatch) => {
		dispatch({
			type: SET_DISABLE_BROWSER_PM,
			disableBrowserPm,
		});
	};
}
function setShowFilters(showFilters) {
	return (dispatch) => {
		dispatch({
			type: SET_SHOW_FILTERS,
			showFilters,
		});
	};
}
function setHideDownloadBanner(hideDownloadBanner) {
	return (dispatch) => {
		dispatch({
			type: SET_HIDE_DOWNLOAD_BANNER,
			hideDownloadBanner,
		});
	};
}
function setLastPopupSearch(lastPopupSearch) {
	return (dispatch) => {
		dispatch({
			type: SET_LAST_POPUP_SEARCH,
			lastPopupSearch,
		});
	};
}
function settingsDatastoreLoaded(data) {
	return (dispatch) => {
		dispatch({
			type: SETTINGS_DATASTORE_LOADED,
			data,
		});
	};
}

let settingsPersistenceQueue = Promise.resolve();

function enqueueSettingsPersistence(operation, rejectOnStaleUser = false) {
	const userId = getStore().getState().user?.userId;
	const result = settingsPersistenceQueue
		.catch(() => undefined)
		.then(() => {
			if (getStore().getState().user?.userId !== userId) {
				if (rejectOnStaleUser) {
					return Promise.reject({ code: "SETTINGS_PERSISTENCE_FAILED" });
				}
				return undefined;
			}
			return operation(userId);
		});
	settingsPersistenceQueue = result;
	return result;
}

function persistSettingsDatastore(overrides) {
	return enqueueSettingsPersistence(() => {
		const settings = Object.assign(
			{},
			getStore().getState().settingsDatastore,
			overrides,
		);
		return datastoreSettingService.saveSettingsDatastore(
			datastoreSettingService.serializeSettingsDatastore(settings),
		);
	});
}

function setPasswordConfig(
	passwordLength,
	passwordLettersUppercase,
	passwordLettersLowercase,
	passwordNumbers,
	passwordSpecialChars,
) {
	persistSettingsDatastore({
		passwordLength,
		passwordLettersUppercase,
		passwordLettersLowercase,
		passwordNumbers,
		passwordSpecialChars,
	});
	return (dispatch) => {
		dispatch({
			type: SET_PASSWORD_CONFIG,
			passwordLength,
			passwordLettersUppercase,
			passwordLettersLowercase,
			passwordNumbers,
			passwordSpecialChars,
		});
	};
}

function setClientOptionsConfig(
	clipboardClearDelay,
	noSaveMode,
	showNoSaveToggle,
	confirmOnUnsavedChanges,
) {
	persistSettingsDatastore({
		clipboardClearDelay,
		noSaveMode,
		showNoSaveToggle,
		confirmOnUnsavedChanges,
	});

	return (dispatch) => {
		dispatch({
			type: SET_CLIENT_CONFIG,
			clipboardClearDelay,
			noSaveMode,
			showNoSaveToggle,
			confirmOnUnsavedChanges,
		});
	};
}

function setDomainSynonymsConfig(customDomainSynonyms) {
	persistSettingsDatastore({ customDomainSynonyms });

	return (dispatch) => {
		dispatch({
			type: SET_DOMAIN_SYNONYMS_CONFIG,
			customDomainSynonyms,
		});
	};
}

function setShownEntriesConfig(
	showWebsitePassword,
	showApplicationPassword,
	showTOTPAuthenticator,
	showPasskey,
	showNote,
	showEnvironmentVariables,
	showSSHKey,
	showGPGKey,
	showSSHConnection,
	showRDPConnection,
	showVNCConnection,
	showCreditCard,
	showBookmark,
	showIdentity,
	showElsterCertificate,
	showFile,
) {
	persistSettingsDatastore({
		showWebsitePassword,
		showApplicationPassword,
		showTOTPAuthenticator,
		showPasskey,
		showNote,
		showEnvironmentVariables,
		showSSHKey,
		showGPGKey,
		showSSHConnection,
		showRDPConnection,
		showVNCConnection,
		showCreditCard,
		showBookmark,
		showIdentity,
		showElsterCertificate,
		showFile,
	});
	return (dispatch) => {
		dispatch({
			type: SET_SHOWN_ENTRIES_CONFIG,
			showWebsitePassword,
			showApplicationPassword,
			showTOTPAuthenticator,
			showPasskey,
			showNote,
			showEnvironmentVariables,
			showSSHKey,
			showGPGKey,
			showSSHConnection,
			showRDPConnection,
			showVNCConnection,
			showCreditCard,
			showBookmark,
			showIdentity,
			showElsterCertificate,
			showFile,
		});
	};
}
function setGpgConfig(gpgDefaultKey, gpgHkpKeyServer, gpgHkpSearch) {
	persistSettingsDatastore({ gpgDefaultKey, gpgHkpKeyServer, gpgHkpSearch });
	return (dispatch) => {
		dispatch({
			type: SET_GPG_CONFIG,
			gpgDefaultKey,
			gpgHkpKeyServer,
			gpgHkpSearch,
		});
	};
}

function setConnectionAuthentication(connectionSecretId, authentication) {
	return (dispatch) => {
		return enqueueSettingsPersistence((userId) => {
			const current = getStore().getState().settingsDatastore
				.connectionAuthentication || {
				schema_version: 1,
				by_connection_secret_id: {},
			};
			const byConnectionSecretId = Object.assign(
				{},
				current.by_connection_secret_id || {},
			);

			if (authentication === null || typeof authentication === "undefined") {
				delete byConnectionSecretId[connectionSecretId];
			} else {
				byConnectionSecretId[connectionSecretId] = authentication;
			}

			const connectionAuthentication = Object.assign({}, current, {
				schema_version: 1,
				by_connection_secret_id: byConnectionSecretId,
			});
			const settings = Object.assign(
				{},
				getStore().getState().settingsDatastore,
				{ connectionAuthentication },
			);

			return datastoreSettingService
				.saveSettingsDatastore(
					datastoreSettingService.serializeSettingsDatastore(settings),
				)
				.then((result) => {
					if (
						typeof result === "undefined" ||
						getStore().getState().user?.userId !== userId
					) {
						return Promise.reject({ code: "SETTINGS_PERSISTENCE_FAILED" });
					}
					dispatch({
						type: SET_CONNECTION_AUTHENTICATION,
						connectionAuthentication,
					});
					return result;
				});
		}, true);
	};
}

function setGatewayClusterSelection(connectionSecretId, clusterId) {
	return (dispatch) => {
		return enqueueSettingsPersistence((userId) => {
			const current = getStore().getState().settingsDatastore
				.gatewayClusterSelection || {
				schema_version: 1,
				by_connection_secret_id: {},
			};
			const byConnectionSecretId = Object.assign(
				{},
				current.by_connection_secret_id || {},
			);

			if (clusterId === null || typeof clusterId === "undefined") {
				delete byConnectionSecretId[connectionSecretId];
			} else {
				byConnectionSecretId[connectionSecretId] = clusterId;
			}

			const gatewayClusterSelection = Object.assign({}, current, {
				schema_version: 1,
				by_connection_secret_id: byConnectionSecretId,
			});
			const settings = Object.assign(
				{},
				getStore().getState().settingsDatastore,
				{ gatewayClusterSelection },
			);

			return datastoreSettingService
				.saveSettingsDatastore(
					datastoreSettingService.serializeSettingsDatastore(settings),
				)
				.then((result) => {
					if (
						typeof result === "undefined" ||
						getStore().getState().user?.userId !== userId
					) {
						return Promise.reject({ code: "SETTINGS_PERSISTENCE_FAILED" });
					}
					dispatch({
						type: SET_GATEWAY_CLUSTER_SELECTION,
						gatewayClusterSelection,
					});
					return result;
				});
		}, true);
	};
}

function setKnownHosts(knownHosts) {
	return (dispatch) => {
		dispatch({
			type: SET_KNOWN_HOSTS,
			knownHosts: knownHosts,
		});
	};
}

function setAutoApproveLdap(autoApproveLdap) {
	return (dispatch) => {
		dispatch({
			type: SET_AUTO_APPROVE_PLAINTEXT_PASSWORD,
			autoApproveLdap: autoApproveLdap,
		});
	};
}

function setFingerprint(fingerprint) {
	return (dispatch) => {
		dispatch({
			type: SET_FINGERPRINT,
			fingerprint,
		});
	};
}

function setRemoteConfigJson(remoteConfigWebClientUrl, remoteConfigJson) {
	return (dispatch) => {
		dispatch({
			type: SET_REMOTE_CONFIG_JSON,
			remoteConfigWebClientUrl: remoteConfigWebClientUrl,
			remoteConfigJson: remoteConfigJson,
		});
	};
}

function sendNotification(message, messageType) {
	return (dispatch) => {
		dispatch({
			type: NOTIFICATION_SEND,
			message: message,
			messageType: messageType,
		});
	};
}

function setNotifications(messages) {
	return (dispatch) => {
		dispatch({
			type: NOTIFICATION_SET,
			messages: messages,
		});
	};
}

function setRequestsInProgress(requestCounterOpen, requestCounterClosed) {
	return (dispatch) => {
		dispatch({
			type: SET_REQUESTS_IN_PROGRESS,
			requestCounterOpen: requestCounterOpen,
			requestCounterClosed: requestCounterClosed,
		});
	};
}

/**
 *
 * @param {string} id
 * @param {string} secretBoxKey
 * @returns
 */
function setDeviceCode(id, secretBoxKey) {
	return (dispatch) => {
		dispatch({
			type: SET_DEVICE_CODE,
			id,
			secretBoxKey,
		});
	};
}

function clearDeviceCode() {
	return (dispatch) => {
		dispatch({
			type: CLEAR_DEVICE_CODE,
		});
	};
}

const actionCreators = {
	setUserUsername,
	setUserInfo1,
	setUserInfo2,
	setUserInfo3,
	setRequirePasswordChange,
	sethashingParameters,
	setServerSecretExists,
	setHasTwoFactor,
	setEmail,
	setUserDatastoreOverview,
	logout,
	setServerInfo,
	setServerPolicy,
	setServerUrl,
	setServerStatus,
	setClientUrl,
	disableOfflineMode,
	enableOfflineMode,
	setOfflineCacheEncryptionInfo,
	setNotificationOnCopy,
	setDisableBrowserPm,
	setShowFilters,
	setHideDownloadBanner,
	setLastPopupSearch,
	setPasswordConfig,
	setShownEntriesConfig,
	setGpgConfig,
	settingsDatastoreLoaded,
	setKnownHosts,
	setAutoApproveLdap,
	setFingerprint,
	setRemoteConfigJson,
	sendNotification,
	setNotifications,
	setRequestsInProgress,
	setClientOptionsConfig,
	setDomainSynonymsConfig,
	setConnectionAuthentication,
	setGatewayClusterSelection,
	setDeviceCode,
	clearDeviceCode,
};

export default actionCreators;
