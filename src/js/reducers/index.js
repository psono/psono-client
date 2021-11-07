import { combineReducers } from "redux";
import persistent from "./persistent";
// import adminClient from './admin_client';
import user from "./user";
import server from "./server";
import client from "./client";
// import notification from './notification';

const rootReducer = combineReducers({
    persistent,
    // adminClient,
    user,
    server,
    client,
    // notification
});

export default rootReducer;
