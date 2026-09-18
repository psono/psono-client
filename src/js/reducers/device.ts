import type { ReducerAction } from "../../types/actions";
import type { DeviceState } from "../../types/state";
import {
	CLEAR_DEVICE_CODE,
	LOGOUT,
	SET_DEVICE_CODE,
} from "../actions/action-types";

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
			return {
				...state,
				deviceCode: null,
			};
		case LOGOUT:
			return {
				...state,
				deviceCode: null,
			};
		default:
			return state;
	}
}

export default device;
