import {
    SET_REQUESTS_IN_PROGRESS,
} from "../actions/action-types";


function transient(
    state = {
        requestCounterOpen: 0,
        requestCounterClosed: 0,
    },
    action
) {
    switch (action.type) {
        case SET_REQUESTS_IN_PROGRESS:
            return Object.assign({}, state, {
                requestCounterOpen: action.requestCounterOpen,
                requestCounterClosed: action.requestCounterClosed,
            });
        default:
            return state;
    }
}

export default transient;
