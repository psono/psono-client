import {
	LOGOUT,
	SET_SERVER_INFO,
	SET_SERVER_URL,
	SET_SERVER_POLICY,
} from "../actions/action-types";
import server from "./server";

describe("Reducer: passphrase compliance defaults", () => {
	it("loads the server default, applies policy overrides and resets it on logout", () => {
		const configured = server(undefined, {
			type: SET_SERVER_INFO,
			info: { compliance_password_generator_default_word_length: 6 },
		});
		expect(configured.compliancePasswordGeneratorDefaultWordLength).toBe(6);
		const policy = server(configured, {
			type: SET_SERVER_POLICY,
			policy: { compliance_password_generator_default_word_length: 8 },
		});
		expect(policy.compliancePasswordGeneratorDefaultWordLength).toBe(8);
		expect(
			server(policy, { type: LOGOUT, rememberMe: true })
				.compliancePasswordGeneratorDefaultWordLength,
		).toBeUndefined();
	});
});

describe("Reducer: server gateway capability", () => {
	it("defaults gateway support to false and only accepts an explicit signed true", () => {
		expect(server(undefined, { type: "@@UNKNOWN" }).gateway).toBe(false);
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

describe("locking server policy", () => {
	it("accepts server defaults and per-user overrides without weakening them on sparse updates", () => {
		const defaults = server(undefined, {
			type: SET_SERVER_INFO,
			info: {
				compliance_enforce_locking: true,
				compliance_max_lock_timeout: 300,
			},
		});
		const user = server(defaults, {
			type: SET_SERVER_POLICY,
			policy: { compliance_max_lock_timeout: 60 },
		});
		expect(user.complianceEnforceLocking).toBe(true);
		expect(user.complianceMaxLockTimeout).toBe(60);
		const sparse = server(user, { type: SET_SERVER_INFO, info: {} });
		expect(sparse.complianceEnforceLocking).toBe(true);
		expect(sparse.complianceMaxLockTimeout).toBe(60);
	});
	it("clears account policy at logout and allows an explicit server-policy relaxation", () => {
		const enforced = server(undefined, {
			type: SET_SERVER_POLICY,
			policy: {
				compliance_enforce_locking: true,
				compliance_max_lock_timeout: 60,
			},
		});
		expect(
			server(enforced, {
				type: SET_SERVER_POLICY,
				policy: { compliance_enforce_locking: false },
			}).complianceEnforceLocking,
		).toBe(false);
		const loggedOut = server(enforced, { type: LOGOUT, rememberMe: true });
		expect(loggedOut.complianceEnforceLocking).toBe(false);
		expect(loggedOut.complianceMaxLockTimeout).toBeUndefined();
	});
});
