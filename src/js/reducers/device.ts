import type { ReducerAction } from "../../types/actions";
import type { DeviceState } from "../../types/state";
import { CLEAR_DEVICE_CODE, SET_DEVICE_CODE } from "../actions/action-types";

const initialState: DeviceState = {
	deviceCode: null,
};

function device(state = initialState, action: ReducerAction): DeviceState {
	switch (action.type) {
		case SET_DEVICE_CODE:
			return {
				...state,
				deviceCode: {
					id: action.id,
					secretBoxKey: action.secretBoxKey,
				},
			};
		case CLEAR_DEVICE_CODE:
			// Pending approvals survive logout/re-login and are cleared by the dialog
			// only after a successful claim or when the user closes it.
			return {
				...state,
				deviceCode: null,
			};
		default:
			return state;
	}
}

export default device;
