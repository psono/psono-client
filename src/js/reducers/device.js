import {
    SET_DEVICE_CODE,
    CLEAR_DEVICE_CODE,
    LOGOUT,
} from "../actions/action-types";

const initialState = {
    deviceCode: null,
};

function device(state = initialState, action) {
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