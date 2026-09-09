import apiClient from "./api-client";
import user from "./user";

let mockToken = "current-token";

jest.mock("./store", () => ({
	getStore: () => ({
		getState: () => ({
			server: { url: "https://api.test" },
			user: { token: mockToken },
		}),
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
	default: {
		isLoggedIn: () => true,
		logout: jest.fn(),
	},
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		encryptData: jest.fn(() => ({ text: "encrypted", nonce: "nonce" })),
		decryptData: jest.fn(),
	},
}));

describe("API client: session errors", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		mockToken = "current-token";
		global.fetch = jest.fn().mockResolvedValue({
			ok: false,
			status: 401,
			statusText: "Unauthorized",
			text: jest.fn().mockResolvedValue(""),
		});
	});

	it("scopes automatic logout to the rejected session", async () => {
		await expect(
			apiClient.readDatastore("current-token", "session-key", "datastore-id"),
		).rejects.toBe("");

		expect(user.logout).toHaveBeenCalledWith(
			expect.any(String),
			undefined,
			"current-token",
		);
	});

	it("ignores a response issued with an older token", async () => {
		mockToken = "replacement-token";

		await expect(
			apiClient.readDatastore("old-token", "old-session-key", "datastore-id"),
		).rejects.toBe("");

		expect(user.logout).not.toHaveBeenCalled();
	});

	it("does not recursively trigger logout for a rejected logout request", async () => {
		await expect(apiClient.logout("current-token", "session-key")).rejects.toBe(
			"",
		);

		expect(user.logout).not.toHaveBeenCalled();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});
});
