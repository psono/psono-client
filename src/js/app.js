import React, { Suspense } from "react";

import { render } from "react-dom";
import { HashLoader } from "react-spinners";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/core/styles";
import { I18nextProvider } from "react-i18next";
import { HashRouter } from "react-router-dom";
import { createBrowserHistory } from "history";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";

import store from "./services/store";
import datastoreSettingService from "./services/datastore-setting";
import i18n from "./i18n";
import theme from "./theme";

import IndexView from "./views/index";

/**
 * Loads the datastore
 * @param dispatch
 * @param getState
 */
function fetchTodos(dispatch, getState) {
    datastoreSettingService.getSettingsDatastore();
}

let persistor = persistStore(store, null, () => {
    store.dispatch(fetchTodos);
});
const customHistory = createBrowserHistory();

const App = () => {
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Provider store={store}>
                <Suspense fallback="loading...">
                    <PersistGate loading={<HashLoader />} persistor={persistor}>
                        <I18nextProvider i18n={i18n}>
                            <ThemeProvider theme={theme}>
                                <CssBaseline />
                                <HashRouter history={customHistory} hashType={"hashbang"}>
                                    <IndexView />
                                </HashRouter>
                            </ThemeProvider>
                        </I18nextProvider>
                    </PersistGate>
                </Suspense>
            </Provider>
        </MuiPickersUtilsProvider>
    );
};

export default App;

const container = document.getElementById("app");
render(<App />, container);
