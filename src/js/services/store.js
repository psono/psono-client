/**
 * Store service
 */

import { createStore, applyMiddleware } from "redux";
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

    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
        const loggerMiddleware = createLogger({
            predicate: (getState, action) => action.type !== SET_REQUESTS_IN_PROGRESS
        });
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
            }
        },
    }

    const persistConfig = {
        key: await accountService.getCurrentId(),
        blacklist: ['transient'],
        version: 3,
        storage: storageService.get('state'),
        debug: false,
        migrate: createMigrate(migrations, { debug: false }),
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);

    store = createStore(persistedReducer, applyMiddleware(...middlewares));

    initMessageListener(store);

    return store;
};

export const getStore = () => {
    return store;
}
