
// https://gitlab.com/esaqa/psono/psono-client/-/issues/551
// https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269
setInterval(async () => {
    (await navigator.serviceWorker.ready).active.postMessage('keepAlive');
}, 20e3);

chrome.runtime.onMessage.addListener(onMessage);

function onMessage(request, sender, sendResponse) {
    try {
        const eventFunctions = {
            "get-offline-cache-encryption-key-offscreen": getOfflineCacheEncryptionKey,
            "set-offline-cache-encryption-key-offscreen": setOfflineCacheEncryptionKey,
        };

        if (eventFunctions.hasOwnProperty(request.event)) {
            eventFunctions[request.event](request, sender, sendResponse);
        } else {
            // not catchable event
            // console.log(sender.tab);
            // console.log("offscreen script received (uncaptured)    " + request.event);
        }
    } catch (error) {
        console.error("Error in onMessage handler:", error);
        sendResponse({ error: error.message });
    }
    // Return false since we're responding synchronously
    return false;
}


/**
 * We received a get-offline-cache-encryption-key-offscreen event and as such we respond with the psono_offline_cache_encryption_key
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function getOfflineCacheEncryptionKey(request, sender, sendResponse) {
    sendResponse(window.psono_offline_cache_encryption_key || "")
}

/**
 * We received a set-offline-cache-encryption-key-offscreen event and as such we set the psono_offline_cache_encryption_key
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function setOfflineCacheEncryptionKey(request, sender, sendResponse) {
    window.psono_offline_cache_encryption_key = request.data
}