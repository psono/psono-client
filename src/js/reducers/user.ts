import type { ReducerAction } from "../../types/actions";
import type { UserState } from "../../types/state";
import {
	LOGOUT,
	SET_EMAIL,
	SET_HAS_TWO_FACTOR,
	SET_HASHING_PARAMETERS,
	SET_REQUIRE_PASSWORD_CHANGE,
	SET_SERVER_SECRET_EXISTS,
	SET_USER_DATASTORE_OVERVIEW,
	SET_USER_INFO_1,
	SET_USER_INFO_2,
	SET_USER_INFO_3,
	SET_USER_PASSWORD_SHA1_PREFIX,
	SET_USER_USERNAME,
} from "../actions/action-types";

const defaultUsername = "";
const defaultRememberMe = false;
const defaultTrustDevice = false;
const defaultUserDatastoreOverview = {
	datastores: [],
};

function user(
	state: UserState = {
		isLoggedIn: false,
		username: defaultUsername,
		rememberMe: defaultRememberMe,
		trustDevice: defaultTrustDevice,
		hasTwoFactor: false,
		authentication: "",
		passwordSha1Prefix: "",
		hashingAlgorithm: "scrypt",
		hashingParameters: {
			u: 14,
			r: 8,
			p: 1,
			l: 64,
		},
		userSecretKey: "",
		defaultHashingAlgorithm: "scrypt",
		defaultHashingParameters: { u: 14, r: 8, p: 1, l: 64 },
		serverSecretExists: false,
		userPrivateKey: "",
		userPublicKey: "",
		sessionSecretKey: "",
		token: "",
		userSauce: "",
		userEmail: "",
		userId: "",
		requirePasswordChange: false,
		userDatastoreOverview: defaultUserDatastoreOverview,
	},
	action: ReducerAction,
): UserState {
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
				passwordSha1Prefix: action.passwordSha1Prefix,
			});
		case SET_USER_PASSWORD_SHA1_PREFIX:
			return Object.assign({}, state, {
				passwordSha1Prefix: action.passwordSha1Prefix,
			});
		case SET_USER_INFO_3:
			return Object.assign({}, state, {
				isLoggedIn: true,
				userId: action.userId,
				userEmail: action.userEmail,
				userSecretKey: action.userSecretKey,
				serverSecretExists: action.serverSecretExists,
				requirePasswordChange: action.requirePasswordChange,
				defaultHashingAlgorithm: action.defaultHashingAlgorithm ?? "scrypt",
				defaultHashingParameters: {
					u: 14,
					r: 8,
					p: 1,
					l: 64,
					...action.defaultHashingParameters,
				},
			});
		case SET_REQUIRE_PASSWORD_CHANGE:
			return Object.assign({}, state, {
				requirePasswordChange: action.requirePasswordChange,
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
				passwordSha1Prefix: "",
				hashingAlgorithm: "scrypt",
				hashingParameters: {
					u: 14,
					r: 8,
					p: 1,
					l: 64,
				},
				userSecretKey: "",
				defaultHashingAlgorithm: "scrypt",
				defaultHashingParameters: { u: 14, r: 8, p: 1, l: 64 },
				serverSecretExists: false,
				userPrivateKey: "",
				userEmail: "",
				userId: "",
				userPublicKey: "",
				sessionSecretKey: "",
				token: "",
				userSauce: "",
				requirePasswordChange: false,
				userDatastoreOverview: defaultUserDatastoreOverview,
			});
		default:
			return state;
	}
}

export default user;
