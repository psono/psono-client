import { persistStore } from "redux-persist";
import backgroundService from "./services/background";
import { initStore, registerPersistor } from "./services/store";
import vaultLock from "./services/vault-lock";
import type { AppDispatch, AppState } from "../types/state";

const channel = new BroadcastChannel("account");
let alreadyLoaded = false;
let activationQueue = Promise.resolve();

// MV3 dispatches the wake-up message before asynchronous vault hydration has
// finished. Register synchronously and keep its response port open until ready.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (
		request.event === "get-offline-cache-encryption-key-offscreen" ||
		request.event === "set-offline-cache-encryption-key-offscreen"
	)
		return false;
	void activationQueue
		.then(() => backgroundService.onMessage(request, sender, sendResponse))
		.catch((error: unknown) => {
			console.error("Could not handle background message", error);
			sendResponse({
				error: error instanceof Error ? error.message : String(error),
			});
		});
	return true;
});

// Tab activation must wake the worker even when the popup is closed. These
// listeners must exist before any asynchronous store/key initialization.
chrome.tabs.onActivated.addListener((activeInfo) => {
	runAfterInitialization(() => backgroundService.onTabActivated(activeInfo));
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status !== "complete") return;
	runAfterInitialization(() =>
		backgroundService.onTabUpdated(tabId, changeInfo, tab),
	);
});
chrome.windows.onFocusChanged.addListener((windowId) => {
	runAfterInitialization(() =>
		backgroundService.onWindowFocusChanged(windowId),
	);
});

function runAfterInitialization(handle: () => void) {
	void activationQueue.then(handle).catch((error: unknown) => {
		console.error("Could not handle background browser event", error);
	});
}

// Add an event listener to handle incoming messages
channel.onmessage = (event) => {
	if (!Object.hasOwn(event.data, "event")) {
		return;
	}
	if (event.data.event === "reinitialize-background") {
		activate();
	}
};

function loadAfterStore(dispatch: AppDispatch, getState: () => AppState): void {
	backgroundService.activateAfterStore();
}
function activate() {
	activationQueue = activationQueue.catch(() => {}).then(initialize);
	void activationQueue.catch((error) =>
		console.error("Could not initialize the background vault", error),
	);
	return activationQueue;
}

async function initialize() {
	backgroundService.activate();
	const store = await initStore();
	const accountId = vaultLock.getAccountId();
	const persistor = persistStore(store, undefined, () => {
		vaultLock.completeInitialization(accountId);
		if (!alreadyLoaded) {
			alreadyLoaded = true;
			store.dispatch(loadAfterStore);
		} else backgroundService.watchBrowserActionState();
	});
	registerPersistor(persistor);
	await new Promise<void>((resolve) => {
		if (persistor.getState().bootstrapped) {
			resolve();
			return;
		}
		const unsubscribe = persistor.subscribe(() => {
			if (persistor.getState().bootstrapped) {
				unsubscribe();
				resolve();
			}
		});
	});
}

activate();
