import backgroundService from "./services/background";
import {persistStore} from "redux-persist";
import {initStore} from "./services/store";

function loadAfterStore(dispatch, getState) {
    backgroundService.activate()
}
async function activate() {
    const store = await initStore();
    persistStore(store, null, () => {
        store.dispatch(loadAfterStore);
    });
}

activate();