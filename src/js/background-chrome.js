import backgroundService from "./services/background";
import {persistStore} from "redux-persist";
import store from "./services/store";

function loadSettingsDatastore(dispatch, getState) {
    backgroundService.activate()
}

persistStore(store, null, () => {
    store.dispatch(loadSettingsDatastore);
});
