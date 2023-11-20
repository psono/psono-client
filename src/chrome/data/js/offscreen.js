
chrome.runtime.onMessage.addListener(onMessage);

async function onMessage(request, sender, sendResponse) {
    const eventFunctions = {
        "get-offline-cache-encryption-key-offscreen": getOfflineCacheEncryptionKey,
        "set-offline-cache-encryption-key-offscreen": setOfflineCacheEncryptionKey,
    };

    if (eventFunctions.hasOwnProperty(request.event)) {
        return eventFunctions[request.event](request, sender, sendResponse);
    } else {
        // not catchable event
        // console.log(sender.tab);
        // console.log("offscreen script received (uncaptured)    " + request.event);
    }
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