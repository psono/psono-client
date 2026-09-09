import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";

jest.mock("./store", () => ({
	getStore: () => ({
		getState: () => ({ server: { url: "https://api.test" } }),
	}),
}));
jest.mock("./device", () => ({
	__esModule: true,
	default: { getDeviceFingerprint: () => "fingerprint" },
}));
jest.mock("./offline-cache", () => ({
	__esModule: true,
	default: { get: jest.fn().mockResolvedValue(null), set: jest.fn() },
}));
jest.mock("./user", () => ({
	__esModule: true,
	default: { isLoggedIn: () => false, logout: jest.fn() },
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		encryptData: jest.fn(() => ({ text: "encrypted", nonce: "nonce" })),
		decryptData: jest.fn(() => '{"ok":true}'),
	},
}));

describe("API client: jobs", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: jest.fn().mockResolvedValue('{"text":"response","nonce":"n"}'),
		});
	});

	it("posts user ciphertexts and nonces", async () => {
		await apiClient.createJobUserMissingAdminSecret(
			"token",
			"session-key",
			"encrypted-private",
			"private-nonce",
			"encrypted-secret",
			"secret-nonce",
		);

		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({
				private_key: "encrypted-private",
				private_key_nonce: "private-nonce",
				secret_key: "encrypted-secret",
				secret_key_nonce: "secret-nonce",
			}),
			"session-key",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.test/job/user-missing-admin-secret/",
			expect.objectContaining({ method: "POST" }),
		);
	});

	it("posts the group id, ciphertexts, and nonces", async () => {
		await apiClient.createJobGroupMissingAdminSecret(
			"token",
			"session-key",
			"group-id",
			"encrypted-private",
			"private-nonce",
			"encrypted-secret",
			"secret-nonce",
		);

		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({
				group_id: "group-id",
				private_key: "encrypted-private",
				private_key_nonce: "private-nonce",
				secret_key: "encrypted-secret",
				secret_key_nonce: "secret-nonce",
			}),
			"session-key",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.test/job/group-missing-admin-secret/",
			expect.objectContaining({ method: "POST" }),
		);
	});
});
