import { combineReducers } from "redux";
import type { ReducerAction } from "../../types/actions";
import type { AppState } from "../../types/state";
import client from "./client";
import device from "./device";
import notification from "./notification";
import persistent from "./persistent";
import server from "./server";
import settingsDatastore from "./settings-datastore";
import transient from "./transient";
// import adminClient from './admin_client';
import user from "./user";

const rootReducer = combineReducers<AppState, ReducerAction>({
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
