import { persistStore } from "redux-persist";
import backgroundService from "./services/background";
import { initStore } from "./services/store";
import type { AppDispatch, AppState } from "../types/state";

const channel = new BroadcastChannel("account");
let alreadyLoaded = false;

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
async function activate() {
	backgroundService.activate();
	const store = await initStore();
	persistStore(store, undefined, () => {
		if (!alreadyLoaded) {
			alreadyLoaded = true;
			store.dispatch(loadAfterStore);
		}
	});
}

activate();
