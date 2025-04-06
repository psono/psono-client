import { createTheme } from "@mui/material/styles";
import React, { Suspense, useEffect, useState } from "react";
import { render } from "react-dom";
import { HashLoader } from "react-spinners";
import { I18nextProvider } from "react-i18next";
import { HashRouter } from "react-router-dom";
import { createBrowserHistory } from "history";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { initStore } from "./services/store";
import datastoreSettingService from "./services/datastore-setting";
import i18n from "./i18n";
import { initSentry } from "./var/sentry";

initSentry();

import IndexView from "./views/index";
import DownloadBanner from "./components/download-banner";
import NotificationSnackbar from "./components/notification-snackbar";
import browserClientService from "./services/browser-client";
import backgroundService from "./services/background";

const LazyThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(null);

    useEffect(() => {
        // Fetch theme configuration from theme.json
        browserClientService.getConfig('theme')
            .then((theme) => {
                const muiTheme = createTheme(theme);
                setTheme(muiTheme);
            })
            .catch((error) => {
                console.error("Failed to load theme:", error);
            });
    }, []);

    if (!theme) {
        return <div>Loading theme...</div>; // Display a loading state until the theme is ready
    }

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

const channel = new BroadcastChannel("account");
channel.onmessage = function (event) {
    if (event.data?.event === "reinitialize-app") {
        initAndRenderApp();
    }
};

/**
 * Loads the datastore
 * @param dispatch
 * @param getState
 */
function loadSettingsDatastore(dispatch, getState) {
    if (getState().user.isLoggedIn) {
        datastoreSettingService.getSettingsDatastore();
    }
}
const customHistory = createBrowserHistory();

async function initAndRenderApp() {
    const pathname = window.location.pathname;
    if (pathname.endsWith("/background.html")) {
        backgroundService.activate();
    }

    const store = await initStore();
    const persistor = persistStore(store, null, () => {
        store.dispatch(loadSettingsDatastore);
    });

    const App = () => (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Provider store={store}>
                <Suspense fallback={<HashLoader />}>
                    <PersistGate loading={<HashLoader />} persistor={persistor}>
                        <I18nextProvider i18n={i18n}>
                            <LazyThemeProvider>
                                <HashRouter history={customHistory} hashType="hashbang">
                                    <DownloadBanner />
                                    <NotificationSnackbar />
                                    <IndexView />
                                </HashRouter>
                            </LazyThemeProvider>
                        </I18nextProvider>
                    </PersistGate>
                </Suspense>
            </Provider>
        </LocalizationProvider>
    );

    const container = document.getElementById("app");
    render(<App />, container);
}

initAndRenderApp();



console.log("%cDanger:", "color:red;font-size:40px;");
console.log(
    "%cDo not type or paste anything here. This feature is for developers and typing or pasting something here can compromise your account.",
    "font-size:20px;"
);
