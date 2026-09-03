import {
	LOGOUT,
	SET_SERVER_INFO,
	SET_SERVER_URL,
} from "../actions/action-types";
import server from "./server";

describe("Reducer: server gateway capability", () => {
	it("defaults gateway support to false and only accepts an explicit signed true", () => {
		expect(server(undefined, { type: "unknown" }).gateway).toBe(false);
		expect(
			server(undefined, {
				type: SET_SERVER_INFO,
				info: { gateway: true },
			}).gateway,
		).toBe(true);
		expect(
			server(undefined, {
				type: SET_SERVER_INFO,
				info: { gateway: "true" },
			}).gateway,
		).toBe(false);
	});

	it("clears gateway support on logout", () => {
		const capable = server(undefined, {
			type: SET_SERVER_INFO,
			info: { gateway: true },
		});
		expect(server(capable, { type: LOGOUT, rememberMe: true }).gateway).toBe(
			false,
		);
	});
});

describe("Reducer: server admin recovery key", () => {
	const recoveryPublicKey = "A".repeat(64);

	it("only accepts and canonicalizes the explicit trusted recovery key", () => {
		const state = server(undefined, {
			type: SET_SERVER_INFO,
			info: { admin_recovery_public_key: "b".repeat(64) },
			adminRecoveryPublicKey: recoveryPublicKey,
		});

		expect(state.adminRecoveryPublicKey).toBe("a".repeat(64));
	});

	it("does not accept the raw info recovery key or malformed trusted values", () => {
		expect(
			server(undefined, {
				type: SET_SERVER_INFO,
				info: { admin_recovery_public_key: "b".repeat(64) },
			}).adminRecoveryPublicKey,
		).toBe("");
		expect(
			server(undefined, {
				type: SET_SERVER_INFO,
				info: {},
				adminRecoveryPublicKey: "malformed",
			}).adminRecoveryPublicKey,
		).toBe("");
	});

	it("clears the admin recovery public key when trusted info is omitted and on logout", () => {
		const configured = server(undefined, {
			type: SET_SERVER_INFO,
			info: {},
			adminRecoveryPublicKey: recoveryPublicKey,
		});

		expect(
			server(configured, { type: SET_SERVER_INFO, info: {} })
				.adminRecoveryPublicKey,
		).toBe("");
		expect(
			server(configured, { type: LOGOUT, rememberMe: true })
				.adminRecoveryPublicKey,
		).toBe("");
	});

	it("clears the admin recovery public key when the server URL changes", () => {
		const configured = server(undefined, {
			type: SET_SERVER_INFO,
			info: {},
			adminRecoveryPublicKey: recoveryPublicKey,
		});

		expect(
			server(configured, { type: SET_SERVER_URL, url: "https://other.test" })
				.adminRecoveryPublicKey,
		).toBe("");
	});
});
