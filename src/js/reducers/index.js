import { combineReducers } from "redux";
import persistent from "./persistent";
import transient from "./transient";
// import adminClient from './admin_client';
import user from "./user";
import settingsDatastore from "./settings-datastore";
import server from "./server";
import client from "./client";
import notification from './notification';
import device from './device';

const rootReducer = combineReducers({
    persistent,
    transient,
    // adminClient,
    user,
    settingsDatastore,
    server,
    client,
    notification,
    device
});

export default rootReducer;
