import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import hostService from "./host";

let mockServer = {};
let mockKnownHosts = [];
const mockSetKnownHosts = jest.fn();

jest.mock("./store", () => ({
	getStore: () => ({
		getState: () => ({
			server: mockServer,
			persistent: { knownHosts: mockKnownHosts },
		}),
	}),
}));

jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({ setKnownHosts: mockSetKnownHosts }),
}));

jest.mock("./api-client", () => ({
	__esModule: true,
	default: { info: jest.fn() },
}));

jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: { validateSignature: jest.fn() },
}));

const verifyKey = "verify-key";
const recoveryKey = "a".repeat(64);
const otherRecoveryKey = "b".repeat(64);

function mockInfo(adminRecoveryPublicKey = recoveryKey) {
	const info = {
		type: "EE",
		version: "5.3.2 (Build abcdef)",
		admin_recovery_public_key: adminRecoveryPublicKey,
	};
	apiClient.info.mockResolvedValue({
		data: {
			info: JSON.stringify(info),
			signature: "signature",
			verify_key: verifyKey,
		},
	});
}

describe("Service: host test suite", () => {
	beforeEach(() => {
		mockKnownHosts = [];
		mockSetKnownHosts.mockClear();
		cryptoLibrary.validateSignature.mockReturnValue(true);
		mockInfo();
	});

	describe("admin recovery public key trust", () => {
		it.each([
			[recoveryKey, recoveryKey],
			[recoveryKey.toUpperCase(), recoveryKey],
			[undefined, ""],
			[null, ""],
			["", ""],
			["a".repeat(63), ""],
			["g".repeat(64), ""],
		])("normalizes %p to the canonical pin", (value, expected) => {
			expect(hostService.normalizeAdminRecoveryPublicKey(value)).toBe(expected);
		});

		it("gives a verify-key mismatch precedence over a recovery-key change", () => {
			mockKnownHosts = [
				{
					url: "https://example.com/server",
					verify_key: "old-verify-key",
					admin_recovery_public_key: otherRecoveryKey,
				},
			];

			expect(
				hostService.checkKnownHosts(
					"https://example.com/server",
					verifyKey,
					recoveryKey,
				),
			).toEqual({
				status: "signature_changed",
				verify_key_old: "old-verify-key",
				admin_recovery_public_key_old: otherRecoveryKey,
				admin_recovery_public_key_changed: true,
			});
		});

		it("does not let a preapproved key override a stored verify-key mismatch", async () => {
			mockKnownHosts = [
				{
					url: "https://example.com/server",
					verify_key: "old-verify-key",
					admin_recovery_public_key: otherRecoveryKey,
				},
			];

			const result = await hostService.checkHost(
				"https://example.com/server",
				verifyKey,
			);

			expect(result).toMatchObject({
				status: "signature_changed",
				verify_key: verifyKey,
				verify_key_old: "old-verify-key",
			});
			expect(mockSetKnownHosts).not.toHaveBeenCalled();
		});

		it("distinguishes a missing legacy pin from an explicit disabled pin", () => {
			mockKnownHosts = [
				{ url: "https://example.com/server", verify_key: verifyKey },
			];
			expect(
				hostService.checkKnownHosts(
					"https://example.com/server",
					verifyKey,
					recoveryKey,
				),
			).toMatchObject({
				status: "matched",
				admin_recovery_public_key_missing: true,
			});

			mockKnownHosts[0].admin_recovery_public_key = "";
			expect(
				hostService.checkKnownHosts(
					"https://example.com/server",
					verifyKey,
					recoveryKey,
				),
			).toEqual({
				status: "admin_recovery_public_key_changed",
				admin_recovery_public_key_old: "",
			});
		});

		it.each([
			["", recoveryKey],
			[recoveryKey, ""],
			[recoveryKey, otherRecoveryKey],
		])("blocks every pin transition from %p to %p", async (oldKey, newKey) => {
			mockKnownHosts = [
				{
					url: "https://example.com/server",
					verify_key: verifyKey,
					admin_recovery_public_key: oldKey,
				},
			];
			mockInfo(newKey);

			const result = await hostService.checkHost("https://example.com/server");

			expect(result).toMatchObject({
				status: "admin_recovery_public_key_changed",
				admin_recovery_public_key: newKey,
				admin_recovery_public_key_old: oldKey,
			});
			expect(mockSetKnownHosts).not.toHaveBeenCalled();
		});

		it("silently initializes a legacy pin after a normal signed match", async () => {
			mockKnownHosts = [
				{ url: "https://example.com/server", verify_key: verifyKey },
			];

			const result = await hostService.checkHost("https://example.com/server");

			expect(result.status).toBe("matched");
			expect(mockSetKnownHosts).toHaveBeenCalledWith([
				{
					url: "https://example.com/server",
					verify_key: verifyKey,
					admin_recovery_public_key: recoveryKey,
				},
			]);
		});

		it("initializes a legacy host even when its verify key was preapproved", async () => {
			mockKnownHosts = [
				{ url: "https://example.com/server", verify_key: verifyKey },
			];

			const result = await hostService.checkHost(
				"https://example.com/server",
				verifyKey,
			);

			expect(result).toMatchObject({
				status: "matched",
				admin_recovery_public_key: recoveryKey,
			});
			expect(mockSetKnownHosts).toHaveBeenCalledWith([
				{
					url: "https://example.com/server",
					verify_key: verifyKey,
					admin_recovery_public_key: recoveryKey,
				},
			]);
		});

		it("requires approval for a new host and does not persist its key", async () => {
			const result = await hostService.checkHost("https://example.com/server");

			expect(result).toMatchObject({
				status: "new_server",
				admin_recovery_public_key: recoveryKey,
			});
			expect(mockSetKnownHosts).not.toHaveBeenCalled();
		});

		it("does not persist an untrusted key from an invalid signature", async () => {
			mockKnownHosts = [
				{ url: "https://example.com/server", verify_key: verifyKey },
			];
			cryptoLibrary.validateSignature.mockReturnValue(false);

			const result = await hostService.checkHost("https://example.com/server");

			expect(result.status).toBe("invalid_signature");
			expect(mockSetKnownHosts).not.toHaveBeenCalled();
		});

		it("atomically approves and canonicalizes both host pins", () => {
			const originalHost = {
				url: "https://example.com/server",
				verify_key: "old-verify-key",
				admin_recovery_public_key: otherRecoveryKey,
			};
			mockKnownHosts = [originalHost];

			hostService.approveHost(
				"HTTPS://EXAMPLE.COM/SERVER",
				verifyKey,
				recoveryKey.toUpperCase(),
			);

			expect(mockSetKnownHosts).toHaveBeenCalledWith([
				{
					url: "https://example.com/server",
					verify_key: verifyKey,
					admin_recovery_public_key: recoveryKey,
				},
			]);
			expect(originalHost).toEqual({
				url: "https://example.com/server",
				verify_key: "old-verify-key",
				admin_recovery_public_key: otherRecoveryKey,
			});
		});
	});

	describe("supportsGateway", () => {
		it("requires both EE and the signed gateway capability", () => {
			mockServer = { type: "EE", gateway: true };
			expect(hostService.supportsGateway()).toBe(true);
			mockServer = { type: "CE", gateway: true };
			expect(hostService.supportsGateway()).toBe(false);
			mockServer = { type: "EE", gateway: false };
			expect(hostService.supportsGateway()).toBe(false);
		});
	});
	describe("semverCompare", () => {
		it("semverCompare exists", () => {
			expect(hostService.semverCompare).toBeDefined();
		});

		// Basic version comparisons
		it("should return 0 for equal versions", () => {
			expect(hostService.semverCompare("1.0.0", "1.0.0")).toBe(0);
			expect(hostService.semverCompare("2.5.3", "2.5.3")).toBe(0);
			expect(hostService.semverCompare("0.0.1", "0.0.1")).toBe(0);
		});

		it("should return -1 when first version is less than second", () => {
			expect(hostService.semverCompare("1.0.0", "2.0.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "1.1.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "1.0.1")).toBe(-1);
			expect(hostService.semverCompare("0.9.0", "1.0.0")).toBe(-1);
		});

		it("should return 1 when first version is greater than second", () => {
			expect(hostService.semverCompare("2.0.0", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("1.1.0", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("1.0.1", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("1.0.0", "0.9.0")).toBe(1);
		});

		it("should handle leading v prefix", () => {
			expect(hostService.semverCompare("v1.0.0", "1.0.0")).toBe(0);
			expect(hostService.semverCompare("1.0.0", "v1.0.0")).toBe(0);
			expect(hostService.semverCompare("v2.0.0", "1.0.0")).toBe(1);
			expect(hostService.semverCompare("2.0.0", "v1.0.0")).toBe(1);
			expect(hostService.semverCompare("v1.0.0", "2.0.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "v2.0.0")).toBe(-1);
			expect(hostService.semverCompare("v1.2.3", "v1.2.3")).toBe(0);
		});

		// Whitespace handling
		it("should ignore everything after whitespace", () => {
			expect(hostService.semverCompare("1.0.0 some extra text", "1.0.0")).toBe(
				0,
			);
			expect(hostService.semverCompare("2.0.0", "1.0.0 build info")).toBe(1);
			expect(hostService.semverCompare("1.0.0 alpha", "2.0.0 beta")).toBe(-1);
		});

		// Build metadata handling (+ sign)
		it("should ignore everything after plus sign", () => {
			expect(hostService.semverCompare("1.0.0+build123", "1.0.0")).toBe(0);
			expect(hostService.semverCompare("1.0.0", "1.0.0+build456")).toBe(0);
			expect(
				hostService.semverCompare("2.0.0+metadata", "1.0.0+othermeta"),
			).toBe(1);
			expect(hostService.semverCompare("1.0.0+build", "2.0.0+build")).toBe(-1);
		});

		// Pre-release version handling
		it("should handle pre-release versions correctly", () => {
			// Pre-release should be less than regular version
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0")).toBe(-1);
			expect(hostService.semverCompare("1.0.0", "1.0.0-beta")).toBe(1);
		});

		it("should compare pre-release versions", () => {
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
			expect(hostService.semverCompare("1.0.0-beta", "1.0.0-alpha")).toBe(1);
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0-alpha")).toBe(0);
		});

		// Complex version formats
		it("should handle different version formats", () => {
			expect(hostService.semverCompare("1.0", "1.0.0")).toBe(-1);
			expect(hostService.semverCompare("1", "1.0")).toBe(-1);
			expect(hostService.semverCompare("10", "2")).toBe(1);
		});

		// Edge cases
		it("should handle empty or malformed versions", () => {
			expect(hostService.semverCompare("", "")).toBe(0);
			expect(hostService.semverCompare("1.0.0", "")).toBe(1);
			expect(hostService.semverCompare("", "1.0.0")).toBe(-1);
		});

		// Numeric sorting
		it("should use numeric comparison for version numbers", () => {
			expect(hostService.semverCompare("1.10.0", "1.2.0")).toBe(1);
			expect(hostService.semverCompare("1.2.0", "1.10.0")).toBe(-1);
			expect(hostService.semverCompare("2.0.0", "10.0.0")).toBe(-1);
		});

		// Combined scenarios
		it("should handle complex scenarios with whitespace and build metadata", () => {
			expect(
				hostService.semverCompare("1.0.0-alpha+build123 extra", "1.0.0"),
			).toBe(-1);
			expect(
				hostService.semverCompare("2.0.0+build extra text", "1.0.0-beta+other"),
			).toBe(1);
		});

		// Real-world examples based on the codebase usage
		it("should handle version formats used in the codebase", () => {
			// Based on the usage in checkHost function
			expect(hostService.semverCompare("4.0.14", "4.0.13")).toBe(1);
			expect(hostService.semverCompare("4.0.24", "4.0.14")).toBe(1);
			expect(hostService.semverCompare("3.9.0", "4.0.14")).toBe(-1);
		});

		// Case sensitivity
		it("should handle case sensitivity correctly", () => {
			expect(hostService.semverCompare("1.0.0-Alpha", "1.0.0-alpha")).toBe(-1); // uppercase comes first
			expect(hostService.semverCompare("1.0.0-alpha", "1.0.0-Alpha")).toBe(1);
		});
	});
});
