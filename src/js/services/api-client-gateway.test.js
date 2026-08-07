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

describe("API client: gateway", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			text: jest.fn().mockResolvedValue('{"text":"response","nonce":"n"}'),
		});
	});

	it("uses authenticated encrypted transport for clusters", async () => {
		await apiClient.getGatewayClusters("token", "session-key");

		expect(fetch).toHaveBeenCalledWith(
			"https://api.test/gateway/clusters/",
			expect.objectContaining({
				method: "GET",
				headers: expect.objectContaining({ Authorization: "Token token" }),
			}),
		);
		expect(cryptoLibrary.decryptData).toHaveBeenCalledWith(
			"response",
			"n",
			"session-key",
		);
	});

	it("posts the fixed launch contract through encrypted transport", async () => {
		await apiClient.launchGateway(
			"token",
			"session-key",
			"cluster-a",
			"connection-secret",
			"ciphertext",
			"payload-nonce",
		);

		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({
				cluster_id: "cluster-a",
				secret_id: "connection-secret",
				data: "ciphertext",
				data_nonce: "payload-nonce",
			}),
			"session-key",
		);
		expect(fetch).toHaveBeenCalledWith(
			"https://api.test/gateway/launch/",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ text: "encrypted", nonce: "nonce" }),
			}),
		);
	});
});
