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
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

var report_url = "";

if (window.location.href.indexOf("https://www.psono.pw") !== -1) {
    report_url = "https://d9647cf54f0a46d68289c85b77fbca11@sentry.io/1265628";
} else if (window.location.href.indexOf("chrome-extension://eljmjmgjkbmpmfljlmklcfineebidmlo") !== -1) {
    report_url = "https://587b29076fa84bc4b57cf447b949f880@sentry.io/1265636";
} else if (window.location.href.indexOf("moz-extension://47807566-6bb5-44b3-8436-c77e0fdd15c8") !== -1) {
    report_url = "https://5f58b21bec7c499aa8950b0b646405c8@sentry.io/1265640";
}

if (report_url) {
    console.log("Sentry enabled.");
    Sentry.init({
        dsn: report_url,
        integrations: [new BrowserTracing()],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
    });
}

import IndexView from "./views/index";
import DownloadBanner from "./components/download-banner";

/**
 * Loads the datastore
 * @param dispatch
 * @param getState
 */
function loadSettingsDatastore(dispatch, getState) {
    const state = getState();
    if (state.user.isLoggedIn) {
        datastoreSettingService.getSettingsDatastore();
    }
}

let persistor = persistStore(store, null, () => {
    store.dispatch(loadSettingsDatastore);
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
                                    <DownloadBanner />
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
