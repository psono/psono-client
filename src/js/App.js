import React, { Suspense } from "react";

// initially required for stripe
import "core-js/stable";
import "regenerator-runtime/runtime";

import { render } from "react-dom";
import { HashLoader } from "react-spinners";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/core/styles";
import { I18nextProvider } from "react-i18next";
import { HashRouter, Route, Switch } from "react-router-dom";
import { createBrowserHistory } from "history";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";

import store from "./services/store";
import i18n from "./i18n";
import theme from "./theme";

import IndexView from "./views/index";

let persistor = persistStore(store);
const customHistory = createBrowserHistory();

const App = () => {
    return (
        <I18nextProvider i18n={i18n}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <HashRouter history={customHistory} hashType={"hashbang"}>
                    <div>
                        <Switch>
                            <Route path="/">
                                <IndexView store={store} />
                            </Route>
                        </Switch>
                    </div>
                </HashRouter>
            </ThemeProvider>
        </I18nextProvider>
    );
};

export default App;

const container = document.getElementById("app");
render(
    <Suspense fallback="loading...">
        <PersistGate loading={<HashLoader />} persistor={persistor}>
            <App />
        </PersistGate>
    </Suspense>,
    container
);
