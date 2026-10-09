import {
	LOGOUT,
	SET_USER_INFO_2,
	SET_USER_PASSWORD_SHA1_PREFIX,
} from "../actions/action-types";
import user from "./user";

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
