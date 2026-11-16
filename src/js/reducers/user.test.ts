import {
	LOGOUT,
	SET_LAST_SERVER_CONNECTION_TIME,
	SET_USER_INFO_2,
	SET_USER_PASSWORD_SHA1_PREFIX,
} from "../actions/action-types";
import user from "./user";

describe("user last server connection", () => {
	it("keeps the newest connection across out-of-order tab updates and clears it on logout", () => {
		const connected = user(undefined, {
			type: SET_LAST_SERVER_CONNECTION_TIME,
			lastServerConnectionTimeSinceEpoch: 2000,
		});
		const delayed = user(connected, {
			type: SET_LAST_SERVER_CONNECTION_TIME,
			lastServerConnectionTimeSinceEpoch: 1000,
		});
		expect(delayed.lastServerConnectionTimeSinceEpoch).toBe(2000);
		expect(
			user(delayed, { type: LOGOUT, rememberMe: false })
				.lastServerConnectionTimeSinceEpoch,
		).toBe(0);
	});
});

describe("user report password prefix", () => {
	it("replaces the prefix on login and clears it on logout or passwordless login", () => {
		const initial = user(undefined, { type: "@@INIT" });
		const login = {
			type: SET_USER_INFO_2 as typeof SET_USER_INFO_2,
			userPrivateKey: "private",
			userPublicKey: "public",
			sessionSecretKey: "session",
			token: "token",
			userSauce: "sauce",
			authentication: "AUTHKEY" as const,
			passwordSha1Prefix: "a9",
		};
		const signedIn = user(initial, login);
		expect(signedIn.passwordSha1Prefix).toBe("a9");

		const changed = user(signedIn, {
			type: SET_USER_PASSWORD_SHA1_PREFIX,
			passwordSha1Prefix: "02",
		});
		expect(changed.passwordSha1Prefix).toBe("02");
		expect(
			user(changed, { ...login, passwordSha1Prefix: "" }).passwordSha1Prefix,
		).toBe("");
		expect(
			user(changed, { type: LOGOUT, rememberMe: false }).passwordSha1Prefix,
		).toBe("");
	});
});
