/**
 * Store service
 */

import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import rootReducer from "../reducers";

const middlewares = [thunkMiddleware];

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

export default service;
