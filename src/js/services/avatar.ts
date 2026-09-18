/**
 * Service to manage the avatars and avatar related functions
 */
import apiClient from "./api-client";
import { getStore } from "./store";

interface Avatar {
	id: string;
}

type AvatarDataUrl = string | null | undefined;
const avatarSingleton: Record<string, Promise<AvatarDataUrl>> = {};

/**
 * Helper function that acts as a singleton to load the avatar data url.
 * @returns {Promise}
 * @private
 */
function readAvatarCached(): Promise<AvatarDataUrl> {
	const userId = getStore().getState().user.userId;
	if (!Object.hasOwn(avatarSingleton, userId) || !avatarSingleton[userId]) {
		avatarSingleton[userId] = _readAvatarCached();
	}
	return avatarSingleton[userId];
}

/**
 * Converts an image url ot a data url
 *
 * @param imageUrl
 * @returns {Promise<unknown>}
 */
async function imageUrlToDataUrl(imageUrl: string): Promise<AvatarDataUrl> {
	let response;
	try {
		response = await fetch(imageUrl);
	} catch (error) {
		return;
	}
	if (!response.ok) {
		return;
	}

	let blob;
	try {
		blob = await response.blob();
	} catch (error) {
		return;
	}

	return new Promise<AvatarDataUrl>((resolve, reject) => {
		const reader = new FileReader();
		// readAsDataURL produces a string, rather than an ArrayBuffer.
		reader.onloadend = () => resolve(reader.result as string | null);
		reader.onerror = () => resolve(undefined);
		reader.readAsDataURL(blob);
	});
}

/**
 * Returns the data url of the avatar of the current user
 *
 * @returns {Promise} Returns a list of avatars
 */
async function _readAvatarCached(): Promise<AvatarDataUrl> {
	let avatars;
	try {
		avatars = await avatarService.readAvatars();
	} catch (error) {
		return;
	}
	if (!avatars || avatars.length <= 0) {
		return;
	}
	const path =
		"/avatar-image/" +
		getStore().getState().user.userId +
		"/" +
		avatars[0].id +
		"/";
	return imageUrlToDataUrl(getStore().getState().server.url + path);
}

/**
 * Fetches the list of all avatars of this user (eather one or none) so that one can check if one already cached the avatar
 * or if one need to download the binary from the server
 *
 * @returns {Promise} Returns a list of avatars
 */
function readAvatars() {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = (data: { data: { avatars: Avatar[] } }) =>
		data.data.avatars;

	const onError = () => Promise.reject();

	return apiClient.readAvatar(token, sessionSecretKey).then(onSuccess, onError);
}

/**
 * Creates a new avatar
 *
 * @param {string} mimeType the mime type
 * @param {string} dataBase64 the base64 encoded image
 *
 * @returns {Promise} Returns whether the creation was successful or not
 */
function createAvatar(mimeType: string, dataBase64: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(data: { data: T }): T => {
		const userId = getStore().getState().user.userId;
		if (Object.hasOwn(avatarSingleton, userId)) {
			delete avatarSingleton[userId];
		}

		return data.data;
	};

	const onError = () => {
		//pass
	};

	return apiClient
		.createAvatar(token, sessionSecretKey, dataBase64)
		.then(onSuccess, onError);
}

/**
 * Deletes a given avatar
 *
 * @param {uuid} avatarId the avatar id
 *
 * @returns {Promise} Returns whether the delete was successful or not
 */
function deleteAvatar(avatarId: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;

	const onSuccess = <T>(data: { data: T }): T => {
		const userId = getStore().getState().user.userId;
		if (Object.hasOwn(avatarSingleton, userId)) {
			delete avatarSingleton[userId];
		}
		return data.data;
	};

	const onError = () => {
		//pass
	};

	return apiClient
		.deleteAvatar(token, sessionSecretKey, avatarId)
		.then(onSuccess, onError);
}

const avatarService = {
	readAvatarCached: readAvatarCached,
	readAvatars: readAvatars,
	createAvatar: createAvatar,
	deleteAvatar: deleteAvatar,
};
export default avatarService;
