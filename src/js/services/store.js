/**
 * Store service
 */

import { createStore, applyMiddleware, combineReducers, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";

import { persistReducer, createMigrate } from "redux-persist";
import { createStateSyncMiddleware, initMessageListener } from "redux-state-sync";
import {
    SET_REQUESTS_IN_PROGRESS,
} from "../actions/action-types";

import rootReducer from "../reducers";
import storageService from "./storage";
import accountService from "./account";

let store

export const initStore = async () => {
    const config = {
        channel: "redux_state_sync",
        blacklist: ["persist/PERSIST", "persist/REHYDRATE"],
    };

    const middlewares = [thunkMiddleware, createStateSyncMiddleware(config)];

    let composeEnhancers = compose; // Default to Redux's compose

    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
        const loggerMiddleware = createLogger({
            predicate: (getState, action) => action.type !== SET_REQUESTS_IN_PROGRESS
        });
        middlewares.push(loggerMiddleware);

        // Enable Redux DevTools Extension in development
        if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
            composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({});
        }
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
        2: (state) => {
            return {
                ...state,
                server: {
                    ...state.server,
                    disableCallbacks: true,
                    allowedFileRepositoryTypes: [
                        'azure_blob',
                        'gcp_cloud_storage',
                        'aws_s3',
                        'do_spaces',
                        'backblaze',
                    ],
                },
            }
        },
        3: (state) => {
            return {
                ...state,
                user: {
                    ...state.user,
                    serverSecretExists: ['SAML', 'OIDC', 'LDAP'].includes(state.user.authentication),
                },
                server: {
                    ...state.server,
                    complianceServerSecrets: 'auto',
                },
                persistent: {
                    ...state.persistent,
                    remoteConfigWebClientUrl: null,
                },
            }
        },
        4: (state) => {
            return {
                ...state,
                server: {
                    ...state.server,
                    complianceEnforceBreachDetection: false,
                },
            }
        },
        5: (state) => {
            return {
                ...state,
                server: {
                    ...state.server,
                    faviconServiceUrl: '',
                },
            }
        },
        6: (state) => {
            return {
                ...state,
                user: {
                    ...state.user,
                    hashingAlgorithm: "scrypt",
                    hashingParameters: {
                        "u": 14,
                        "r": 8,
                        "p": 1,
                        "l": 64
                    },
                },
            }
        },
        7: (state) => {
            return {
                ...state,
                server: {
                    ...state.server,
                    complianceDisableTotp: false,
                },
            }
        },
    }

    const persistConfig = {
        key: await accountService.getCurrentId(),
        blacklist: ['transient', 'notification'],
        version: 7,
        storage: storageService.get('state'),
        debug: false,
        migrate: createMigrate(migrations, { debug: false }),
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);

    store = createStore(
        persistedReducer,
        composeEnhancers(applyMiddleware(...middlewares))
    );

    initMessageListener(store);

    // Expose store to window only in development for debugging (optional)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
        window.store = store;
    }

    return store;
};

export const getStore = () => {
    return store;
}
