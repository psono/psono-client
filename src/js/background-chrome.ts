import { persistStore } from "redux-persist";
import backgroundService from "./services/background";
import { initStore, registerPersistor } from "./services/store";
import vaultLock from "./services/vault-lock";
import type { AppDispatch, AppState } from "../types/state";

const channel = new BroadcastChannel("account");
let alreadyLoaded = false;
let activationQueue = Promise.resolve();

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
	activationQueue = activationQueue
		.then(initialize)
		.catch((error) =>
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
		}
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
