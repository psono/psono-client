import type { NamedSecretReference } from "../../types/vault";
import apiClient from "./api-client";
import apiKeys from "./api-keys";
import notification from "./notification";

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
jest.mock("./notification", () => ({
	__esModule: true,
	default: { errorSend: jest.fn() },
}));
jest.mock("../i18n", () => ({
	__esModule: true,
	default: {
		t: (key: string, options?: { count?: number }) =>
			`${key}:${options?.count}`,
	},
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

type Added = Awaited<ReturnType<typeof apiClient.addSecretToApiKey>>;
const idOf = (call: unknown[]) => call[3] as string;
const addedIds = () => addSecretToApiKeyMock.mock.calls.map(idOf);

describe("Service: apiKeys test suite", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		addSecretToApiKeyMock.mockReset();
	});
	// Runs the call without really waiting between the attempts.
	const addWithTimers = async (secrets: NamedSecretReference[]) => {
		const spy = jest.spyOn(global, "setTimeout").mockImplementation(((
			callback: () => void,
		) => {
			callback();
			return 0;
		}) as unknown as typeof setTimeout);
		try {
			return await apiKeys.addSecretsToApiKey(
				"api-key-id",
				"api-key-secret-key",
				secrets,
			);
		} finally {
			spy.mockRestore();
		}
	};

	it("addSecretsToApiKey adds all secrets with at most 10 requests at the same time", async () => {
		let running = 0;
		let maxRunning = 0;
		addSecretToApiKeyMock.mockImplementation(async () => {
			running++;
			maxRunning = Math.max(maxRunning, running);
			await new Promise((resolve) => setTimeout(resolve, 1));
			running--;
			return {} as Added;
		});

		const failed = await apiKeys.addSecretsToApiKey(
			"api-key-id",
			"api-key-secret-key",
			createSecrets(25),
		);

		expect(addSecretToApiKeyMock).toHaveBeenCalledTimes(25);
		expect(maxRunning).toBe(10);
		expect(failed).toEqual([]);
		expect(notification.errorSend).not.toHaveBeenCalled();
	});

	it("one failed request does not stop the others, and it is tried again", async () => {
		let calls = 0;
		addSecretToApiKeyMock.mockImplementation(async () => {
			calls++;
			if (calls === 251) throw new Error("network blip"); // the request in the middle of 1000
			return {} as Added;
		});

		const failed = await addWithTimers(createSecrets(1000));

		expect(failed).toEqual([]);
		expect(new Set(addedIds()).size).toBe(1000); // every secret was sent
		expect(addSecretToApiKeyMock).toHaveBeenCalledTimes(1001); // one of them twice
		expect(notification.errorSend).not.toHaveBeenCalled();
	});

	it("tells the user how many secrets could not be added, and still adds all the others", async () => {
		addSecretToApiKeyMock.mockImplementation(async (...args) => {
			if (idOf(args) === "secret-id-3") throw new Error("always fails");
			return {} as Added;
		});

		const failed = await addWithTimers(createSecrets(25));

		expect(failed.map((s) => s.secret_id)).toEqual(["secret-id-3"]);
		expect(addedIds().filter((id) => id === "secret-id-3")).toHaveLength(3); // tried three times
		expect(new Set(addedIds()).size).toBe(25);
		expect(notification.errorSend).toHaveBeenCalledTimes(1);
		expect(notification.errorSend).toHaveBeenCalledWith(
			"API_KEY_SECRETS_NOT_ADDED:1",
		);
	});

	it("a secret the key already has counts as added: no retry, no message", async () => {
		addSecretToApiKeyMock.mockImplementation(async (...args) => {
			if (idOf(args) === "secret-id-1")
				throw { non_field_errors: ["API_KEY_SECRET_ALREADY_EXIST"] };
			return {} as Added;
		});

		const failed = await addWithTimers(createSecrets(5));

		expect(failed).toEqual([]);
		expect(addSecretToApiKeyMock).toHaveBeenCalledTimes(5);
		expect(notification.errorSend).not.toHaveBeenCalled();
	});

	it("adds a secret that was selected more than once only once", async () => {
		addSecretToApiKeyMock.mockResolvedValue({} as Added);
		const secrets = [...createSecrets(3), ...createSecrets(3)];

		await apiKeys.addSecretsToApiKey(
			"api-key-id",
			"api-key-secret-key",
			secrets,
		);

		expect(addSecretToApiKeyMock).toHaveBeenCalledTimes(3);
	});

	it("reports the progress in percent after every batch", async () => {
		addSecretToApiKeyMock.mockResolvedValue({} as Added);
		const onProgress = jest.fn();

		await apiKeys.addSecretsToApiKey(
			"api-key-id",
			"api-key-secret-key",
			createSecrets(25),
			onProgress,
		);

		expect(onProgress.mock.calls.map((call) => call[0])).toEqual([40, 80, 100]);
	});

	it("does not report any progress when there is nothing to add", async () => {
		const onProgress = jest.fn();

		await apiKeys.addSecretsToApiKey(
			"api-key-id",
			"api-key-secret-key",
			[],
			onProgress,
		);

		expect(onProgress).not.toHaveBeenCalled();
		expect(addSecretToApiKeyMock).not.toHaveBeenCalled();
	});

	it("addSecretsToApiKey resolves without any secrets", async () => {
		const failed = await apiKeys.addSecretsToApiKey(
			"api-key-id",
			"api-key-secret-key",
			[],
		);

		expect(failed).toEqual([]);
		expect(addSecretToApiKeyMock).not.toHaveBeenCalled();
	});
});
