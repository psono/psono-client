import type { NamedSecretReference } from "../../types/vault";
import apiClient from "./api-client";
import apiKeys from "./api-keys";

const addSecretToApiKeyMock = jest.mocked(apiClient.addSecretToApiKey);

jest.mock("./store", () => ({
	getStore: () => ({
		getState: () => ({
			user: { token: "token", sessionSecretKey: "session-key" },
		}),
	}),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: { addSecretToApiKey: jest.fn() },
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		encryptData: jest.fn(() => ({ text: "encrypted", nonce: "nonce" })),
		encryptSecretKey: jest.fn(() => ({ text: "encrypted", nonce: "nonce" })),
	},
}));

const createSecrets = (count: number): NamedSecretReference[] =>
	Array.from({ length: count }, (_, i) => ({
		secret_id: `secret-id-${i}`,
		name: `secret ${i}`,
		secret_key: "secret-key",
	}));

describe("Service: apiKeys test suite", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("addSecretsToApiKey adds all secrets with at most 10 requests at the same time", async () => {
		let running = 0;
		let maxRunning = 0;
		addSecretToApiKeyMock.mockImplementation(async () => {
			running++;
			maxRunning = Math.max(maxRunning, running);
			await new Promise((resolve) => setTimeout(resolve, 1));
			running--;
			return {} as Awaited<ReturnType<typeof apiClient.addSecretToApiKey>>;
		});

		await apiKeys.addSecretsToApiKey(
			"api-key-id",
			"api-key-secret-key",
			createSecrets(25),
		);

		expect(addSecretToApiKeyMock).toHaveBeenCalledTimes(25);
		expect(maxRunning).toBe(10);
	});

	it("addSecretsToApiKey rejects and stops if a secret can not be added", async () => {
		addSecretToApiKeyMock.mockRejectedValue(new Error("failed"));

		await expect(
			apiKeys.addSecretsToApiKey(
				"api-key-id",
				"api-key-secret-key",
				createSecrets(25),
			),
		).rejects.toThrow("failed");

		expect(addSecretToApiKeyMock).toHaveBeenCalledTimes(10);
	});

	it("addSecretsToApiKey resolves without any secrets", async () => {
		await apiKeys.addSecretsToApiKey("api-key-id", "api-key-secret-key", []);

		expect(addSecretToApiKeyMock).not.toHaveBeenCalled();
	});
});
