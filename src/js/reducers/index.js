import { combineReducers } from "redux";
import persistent from "./persistent";
// import adminClient from './admin_client';
import user from "./user";
import settingsDatastore from "./settings-datastore";
import server from "./server";
import client from "./client";
// import notification from './notification';

const rootReducer = combineReducers({
    persistent,
    // adminClient,
    user,
    settingsDatastore,
    server,
    client,
    // notification
});

export default rootReducer;
