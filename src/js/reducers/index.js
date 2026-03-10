import { combineReducers } from "redux";
import client from "./client";
import device from "./device";
import notification from "./notification";
import persistent from "./persistent";
import server from "./server";
import settingsDatastore from "./settings-datastore";
import transient from "./transient";
// import adminClient from './admin_client';
import user from "./user";

const rootReducer = combineReducers({
	persistent,
	transient,
	// adminClient,
	user,
	settingsDatastore,
	server,
	client,
	notification,
	device,
});

export default rootReducer;
