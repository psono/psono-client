/**
 * Store service
 */

import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { persistReducer } from "redux-persist";
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

const persistConfig = {
    key: "client",
    storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

let service = createStore(persistedReducer, applyMiddleware(...middlewares));

initMessageListener(service);

export default service;
