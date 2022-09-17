/**
 * Store service
 */

import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { persistReducer, createMigrate } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { createStateSyncMiddleware, initMessageListener } from "redux-state-sync";

import rootReducer from "../reducers";

const config = {
    channel: "redux_state_sync",
    blacklist: ["persist/PERSIST", "persist/REHYDRATE"],
};

const middlewares = [thunkMiddleware, createStateSyncMiddleware(config)];

if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    const loggerMiddleware = createLogger();
    middlewares.push(loggerMiddleware);
}

const migrations = {
    0: (state) => {
        return {
            ...state,
            server: {
                ...state.server,
                complianceDisableUnmanagedGroups: false
            },
            user: {
                ...state.user,
                userDatastoreOverview: {
                    'datastores': []
                }
            },
        }
    },
    1: (state) => {
        return {
            ...state,
            client: {
                ...state.client,
                lastPopupSearch: ""
            },
        }
    },
}

const persistConfig = {
    key: "client",
    version: 1,
    storage,
    debug: false,
    migrate: createMigrate(migrations, { debug: false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

let service = createStore(persistedReducer, applyMiddleware(...middlewares));

initMessageListener(service);

export default service;
