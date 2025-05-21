import {
    SET_USER_USERNAME,
    SET_USER_INFO_1,
    SET_USER_INFO_2,
    SET_USER_INFO_3,
    SET_HASHING_PARAMETERS,
    SET_SERVER_SECRET_EXISTS,
    SET_HAS_TWO_FACTOR,
    SET_EMAIL,
    SET_USER_DATASTORE_OVERVIEW,
    LOGOUT,
} from "../actions/action-types";

const defaultUsername = "";
const defaultRememberMe = false;
const defaultTrustDevice = false;
const defaultUserDatastoreOverview = {
    'datastores': []
};

function user(
    state = {
        isLoggedIn: false,
        username: defaultUsername,
        rememberMe: defaultRememberMe,
        trustDevice: defaultTrustDevice,
        hasTwoFactor: false,
        authentication: "",
        hashingAlgorithm: "scrypt",
        hashingParameters: {
            "u": 14,
            "r": 8,
            "p": 1,
            "l": 64
        },
        userSecretKey: "",
        serverSecretExists: false,
        userPrivateKey: "",
        userPublicKey: "",
        sessionSecretKey: "",
        token: "",
        userSauce: "",
        userEmail: "",
        userId: "",
        userDatastoreOverview: defaultUserDatastoreOverview,
    },
    action
) {
    switch (action.type) {
        case SET_USER_USERNAME:
            return Object.assign({}, state, {
                username: action.username,
            });
        case SET_USER_INFO_1:
            return Object.assign({}, state, {
                rememberMe: action.rememberMe,
                trustDevice: action.trustDevice,
                authentication: action.authentication,
            });
        case SET_USER_INFO_2:
            return Object.assign({}, state, {
                userPrivateKey: action.userPrivateKey,
                userPublicKey: action.userPublicKey,
                sessionSecretKey: action.sessionSecretKey,
                token: action.token,
                userSauce: action.userSauce,
                authentication: action.authentication,
            });
        case SET_USER_INFO_3:
            return Object.assign({}, state, {
                isLoggedIn: true,
                userId: action.userId,
                userEmail: action.userEmail,
                userSecretKey: action.userSecretKey,
                serverSecretExists: action.serverSecretExists,
            });
        case SET_HASHING_PARAMETERS:
            return Object.assign({}, state, {
                hashingAlgorithm: action.hashingAlgorithm,
                hashingParameters: action.hashingParameters,
            });
        case SET_SERVER_SECRET_EXISTS:
            return Object.assign({}, state, {
                serverSecretExists: action.serverSecretExists,
            });
        case SET_HAS_TWO_FACTOR:
            return Object.assign({}, state, {
                hasTwoFactor: action.hasTwoFactor,
            });
        case SET_EMAIL:
            return Object.assign({}, state, {
                userEmail: action.userEmail,
            });
        case SET_USER_DATASTORE_OVERVIEW:
            return Object.assign({}, state, {
                userDatastoreOverview: action.userDatastoreOverview,
            });
        case LOGOUT:
            return Object.assign({}, state, {
                isLoggedIn: false,
                username: state.rememberMe ? state.username : defaultUsername,
                rememberMe: state.rememberMe ? state.rememberMe : defaultRememberMe,
                trustDevice: state.rememberMe ? state.trustDevice : defaultTrustDevice,
                hasTwoFactor: false,
                authentication: "",
                hashingAlgorithm: "scrypt",
                hashingParameters: {
                    "u": 14,
                    "r": 8,
                    "p": 1,
                    "l": 64
                },
                userSecretKey: "",
                serverSecretExists: false,
                userPrivateKey: "",
                userEmail: "",
                userId: "",
                userPublicKey: "",
                sessionSecretKey: "",
                token: "",
                userSauce: "",
                userDatastoreOverview: defaultUserDatastoreOverview,
            });
        default:
            return state;
    }
}

export default user;
