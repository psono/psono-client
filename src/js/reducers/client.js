import { LOGOUT, SET_CLIENT_URL, ENABLE_OFFLINE_MODE, DISABLE_OFFLINE_MODE } from "../actions/action-types";

const default_url = "";

function server(
    state = {
        url: default_url,
        offlineMode: false,
    },
    action
) {
    switch (action.type) {
        case LOGOUT:
            return Object.assign({}, state, {
                url: default_url.toLowerCase(),
            });
        case SET_CLIENT_URL:
            return Object.assign({}, state, {
                url: action.url.toLowerCase(),
            });
        case ENABLE_OFFLINE_MODE:
            return Object.assign({}, state, {
                offlineMode: true,
            });
        case DISABLE_OFFLINE_MODE:
            return Object.assign({}, state, {
                offlineMode: false,
            });
        default:
            return state;
    }
}

export default server;
