/**
 * The browser interface, responsible for the cross browser / platform compatibility.
 */

import type {
	EventData,
	EventResponse,
	SendResponse,
} from "../../types/browser";

/**
 * Checks whether an offscreen document exists or not
 */
async function hasOffscreenDocument(
	offscreenDocumentPath: string,
): Promise<boolean | undefined> {
	if (TARGET === "chrome" && typeof clients !== "undefined") {
		const offscreenUrl = chrome.runtime.getURL(offscreenDocumentPath);
		const matchedClients = await clients.matchAll();
		for (const client of matchedClients) {
			if (client.url === offscreenUrl) {
				return true;
			}
		}
		return false;
	} else {
		//pass, only availble in chrome extensions
	}
}

/**
 * Creates and offscreen document if it doesn't exist yet
 */
async function createOffscreenDocument() {
	if (TARGET === "chrome") {
		const offscreenDocumentPath = "data/offscreen.html";
		if (!(await hasOffscreenDocument(offscreenDocumentPath))) {
			try {
				await chrome.offscreen.createDocument({
					url: chrome.runtime.getURL(offscreenDocumentPath),
					reasons: ["USER_MEDIA" as chrome.offscreen.Reason], // tried LOCAL_STORAGE but it's not accepted due to Error at property 'reasons': Error at index 0: Value must be one of AUDIO_PLAYBACK, BLOBS, CLIPBOARD, DISPLAY_MEDIA, DOM_PARSER, DOM_SCRAPING, IFRAME_SCRIPTING, TESTING, USER_MEDIA, WEB_RTC.
					justification:
						"Isolated in-memory storage of the offline cache secret that is wiped when the browser closes.",
				});
			} catch (e) {
				// hasOffscreenDocument doesn't work even so its the documented way to check whether an offscreen page
				// already exists. https://groups.google.com/a/chromium.org/g/chromium-extensions/c/D5Jg2ukyvUc/m/VaSvEfoHAgAJ
				// the problem is that clients.matchAll() doesn't include the offscreen page...
			}
		}
	} else {
		//pass, can only create offscreen documents in chrome extensions
	}
}

/**
 * Sends a message to the offscreen document
 *
 * @param {string} event The event code
 * @param {object} data The data to send along
 * @param {function} fnc The callback function
 */
async function sendMessage<E extends string>(
	event: E,
	data: EventData<E>,
	fnc?: SendResponse<EventResponse<E>>,
) {
	await createOffscreenDocument();
	const message = { event: event, data: data };
	if (fnc) {
		chrome.runtime.sendMessage(message, fnc);
	} else {
		chrome.runtime.sendMessage(message);
	}
}

/**
 * Asks the offscreen page for the offline cache encryption key
 *
 * @param {function} fnc The callback function
 */
async function getOfflineCacheEncryptionKey(
	fnc: SendResponse<string | null | undefined>,
) {
	if (TARGET === "firefox") {
		if (!browser.runtime.getBackgroundPage) {
			return;
		}
		browser.runtime.getBackgroundPage().then((bg) => {
			fnc(bg.psono_offline_cache_encryption_key);
		});
	} else if (TARGET === "chrome") {
		sendMessage("get-offline-cache-encryption-key-offscreen", null, fnc);
		// chrome.runtime.getBackgroundPage(function (bg) {
		//     fnc(bg.psono_offline_cache_encryption_key);
		// });
	} else {
		//pass, no background page on the website
	}
}

/**
 * Sends the offline cache encryption key to the offscreen page for storage
 *
 * @param {string} offlineCacheEncryptionKey The new offline cache encryption eky
 */
async function setOfflineCacheEncryptionKey(
	offlineCacheEncryptionKey: string | null | undefined,
) {
	if (TARGET === "chrome") {
		sendMessage(
			"set-offline-cache-encryption-key-offscreen",
			offlineCacheEncryptionKey,
			undefined,
		);
	} else {
		//pass, no background page on the website
	}
}

const browserClientService = {
	getOfflineCacheEncryptionKey: getOfflineCacheEncryptionKey,
	setOfflineCacheEncryptionKey: setOfflineCacheEncryptionKey,
	sendMessage: sendMessage,
};

export default browserClientService;
