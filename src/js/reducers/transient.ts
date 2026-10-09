import type { ReducerAction } from "../../types/actions";
import type { TransientState } from "../../types/state";
import { SET_REQUESTS_IN_PROGRESS } from "../actions/action-types";

function transient(
	state: TransientState = {
		requestCounterOpen: 0,
		requestCounterClosed: 0,
	},
	action: ReducerAction,
): TransientState {
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
