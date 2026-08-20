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

describe("API client: API keys", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: jest.fn().mockResolvedValue('{"text":"response","nonce":"n"}'),
		});
	});

	it("includes management permissions when creating an API key", async () => {
		await apiClient.createApiKey(
			"token",
			"session-key",
			"CLI",
			"public",
			"private",
			"private-nonce",
			"secret",
			"secret-nonce",
			"user-private",
			"user-private-nonce",
			"user-secret",
			"user-secret-nonce",
			false,
			false,
			true,
			true,
			true,
			false,
			"verify",
		);

		expect(JSON.parse(cryptoLibrary.encryptData.mock.calls[0][0])).toEqual(
			expect.objectContaining({
				allow_api_key_management: true,
				allow_admin_access: true,
			}),
		);
		expect(cryptoLibrary.encryptData.mock.calls[0][1]).toBe("session-key");
	});

	it("includes management permissions when updating an API key", async () => {
		await apiClient.updateApiKey(
			"token",
			"session-key",
			"key-id",
			"CLI",
			false,
			false,
			true,
			true,
			true,
			false,
		);

		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({
				api_key_id: "key-id",
				title: "CLI",
				restrict_to_secrets: false,
				read: true,
				allow_insecure_access: false,
				allow_api_key_management: true,
				allow_admin_access: true,
				write: false,
			}),
			"session-key",
		);
	});
});
