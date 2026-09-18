import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import offlineCache from "./offline-cache";

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
	default: { get: jest.fn(), set: jest.fn() },
}));
jest.mock("./user", () => ({
	__esModule: true,
	default: { isLoggedIn: () => false, logout: jest.fn() },
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		encryptData: jest.fn(() => ({ text: "encrypted", nonce: "nonce" })),
		decryptData: jest.fn(),
	},
}));

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

function respond(body: string, status = 200, statusText = ""): Response {
	// Only the fetch Response members used by the transport are needed here.
	const response: Partial<Response> = {
		ok: status >= 200 && status < 300,
		status,
		statusText,
		text: async () => body,
	};
	fetchMock.mockResolvedValue(response as Response);
	return response as Response;
}

describe("API client: transport compatibility", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		jest.clearAllMocks();
		fetchMock.mockReset();
		globalThis.fetch = fetchMock;
		jest.mocked(offlineCache.get).mockResolvedValue(null);
		jest.mocked(cryptoLibrary.decryptData).mockReturnValue('{"id":"secret"}');
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it("unwraps encrypted JSON and caches the decrypted envelope", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}');

		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).resolves.toEqual({
			data: { id: "secret" },
		});
		expect(cryptoLibrary.decryptData).toHaveBeenCalledWith(
			"ciphertext",
			"response-nonce",
			"key",
		);
		expect(offlineCache.set).toHaveBeenCalledWith(
			"https://api.test/secret/secret/",
			"GET",
			{ data: { id: "secret" } },
		);
	});

	it("returns cached envelopes without fetching or decrypting them again", async () => {
		const cached = { data: { id: "cached-secret" } };
		jest.mocked(offlineCache.get).mockResolvedValue(cached);

		await expect(apiClient.readSecret("token", "key", "secret")).resolves.toBe(
			cached,
		);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(cryptoLibrary.decryptData).not.toHaveBeenCalled();
	});

	it.each([
		200, 400,
	])("rejects plaintext on encrypted requests (HTTP %s)", async (status) => {
		respond('{"id":"untrusted"}', status);

		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).rejects.toEqual({
			errors: ["UNENCRYPTED_RESPONSE_RECEIVED"],
		});
		expect(offlineCache.set).not.toHaveBeenCalled();
	});

	it("preserves decrypted server validation errors", async () => {
		respond('{"text":"ciphertext","nonce":"response-nonce"}', 400);
		jest
			.mocked(cryptoLibrary.decryptData)
			.mockReturnValue('{"non_field_errors":["invalid"]}');

		await expect(
			apiClient.readSecret("token", "key", "secret"),
		).rejects.toEqual({
			data: { non_field_errors: ["invalid"] },
		});
	});

	it("preserves empty successful responses and omitted logout fields", async () => {
		respond("", 204);

		await expect(apiClient.logout("token", "key")).resolves.toBe("");
		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith("{}", "key");
	});

	it("allows public unencrypted JSON responses", async () => {
		respond('{"info":"server-info"}');

		await expect(apiClient.info()).resolves.toEqual({
			data: { info: "server-info" },
		});
		expect(cryptoLibrary.decryptData).not.toHaveBeenCalled();
	});

	it("uses explicit stateless connection details and invokes the response callback", async () => {
		const response = respond("", 204);
		const sideEffect = jest.fn<void, [Response]>();

		await apiClient.statelessLogout(
			"other-token",
			"other-key",
			undefined,
			undefined,
			"https://other.test",
			"other-fingerprint",
			sideEffect,
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://other.test/authentication/logout/",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Token other-token",
				}),
			}),
		);
		expect(sideEffect).toHaveBeenCalledWith(response);
		const validator: unknown = JSON.parse(
			jest.mocked(cryptoLibrary.encryptData).mock.calls[1][0],
		);
		expect(validator).toEqual({
			request_time: expect.any(String),
			request_device_fingerprint: "other-fingerprint",
		});
	});

	it("maps failed network requests to the legacy offline error", async () => {
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(apiClient.info()).rejects.toEqual({
			errors: ["SERVER_OFFLINE"],
		});
	});

	it.each([
		[404, "RESOURCE_NOT_FOUND"],
		[503, "SERVER_OFFLINE"],
	])("maps HTTP %s without status text to a stable error", async (status, error) => {
		respond("", status);

		await expect(apiClient.info()).rejects.toEqual({ errors: [error] });
	});
});
