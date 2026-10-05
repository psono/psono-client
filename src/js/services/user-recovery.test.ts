jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState, dispatch: jest.fn() }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({
		setUserUsername: jest.fn(),
		setServerUrl: jest.fn(),
		setServerPolicy: jest.fn(),
	}),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: { enableRecoverycode: jest.fn(), setPassword: jest.fn() },
}));

import type { RecoveryEnableData } from "../../types/auth";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import user from "./user";

const api = jest.mocked(apiClient, true);
const legacy = { u: 14, r: 8, p: 1, l: 64 };
const stronger = { ...legacy, u: 15 };
const mockState = {
	user: { hashingAlgorithm: "scrypt", hashingParameters: { ...legacy, u: 16 } },
};

describe("password recovery preserves account hashing parameters", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
	});
	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it.each([
		undefined,
		stronger,
	])("uses recovery response metadata rather than unrelated client state: %p", async (parameters) => {
		const username = "recovery@example.com";
		const code = "recovery-code";
		const password = "NewPassword123!";
		const pair = cryptoLibrary.generatePublicPrivateKeypair();
		const verifier = cryptoLibrary.generatePublicPrivateKeypair();
		const secretKey = "cd".repeat(32);
		const recovered = cryptoLibrary.encryptSecret(
			JSON.stringify({
				user_private_key: pair.private_key,
				user_secret_key: secretKey,
			}),
			code,
			"recovery-salt",
		);
		const response: RecoveryEnableData = {
			recovery_data: recovered.text,
			recovery_data_nonce: recovered.nonce,
			recovery_sauce: "recovery-salt",
			user_sauce: "user-salt",
			verifier_public_key: verifier.public_key,
			verifier_time_valid: 60,
			...(parameters && {
				hashing_algorithm: "scrypt",
				hashing_parameters: parameters,
			}),
		};
		api.enableRecoverycode.mockResolvedValue({ data: response });
		api.setPassword.mockResolvedValue({ data: {} });
		const information = await user.recoveryEnable(
			username,
			code,
			"https://server.example",
		);
		expect(information.hashing_algorithm).toBe("scrypt");
		expect(information.hashing_parameters).toEqual(parameters ?? legacy);
		await user.setPassword(
			username,
			code,
			password,
			information.user_private_key,
			information.user_secret_key,
			information.user_sauce,
			information.verifier_public_key,
			information.hashing_algorithm,
			information.hashing_parameters,
		);
		const [
			requestUsername,
			codeAuthkey,
			text,
			nonce,
			algorithm,
			actualParameters,
		] = api.setPassword.mock.calls[0];
		expect(requestUsername).toBe(username);
		expect(actualParameters).toEqual(parameters ?? legacy);
		expect(algorithm).toBe("scrypt");
		expect(codeAuthkey).toBe(
			cryptoLibrary.generateAuthkey(username, code, "scrypt", legacy),
		);
		const payload = JSON.parse(
			cryptoLibrary.decryptDataPublicKey(
				text,
				nonce,
				pair.public_key,
				verifier.private_key,
			),
		);
		expect(payload.authkey).toBe(
			cryptoLibrary.generateAuthkey(
				username,
				password,
				algorithm,
				actualParameters,
			),
		);
		expect(
			cryptoLibrary.decryptSecret(
				payload.private_key,
				payload.private_key_nonce,
				password,
				"user-salt",
				algorithm,
				actualParameters,
			),
		).toBe(pair.private_key);
		expect(
			cryptoLibrary.decryptSecret(
				payload.secret_key,
				payload.secret_key_nonce,
				password,
				"user-salt",
				algorithm,
				actualParameters,
			),
		).toBe(secretKey);
		expect(mockState.user.hashingParameters.u).toBe(16);
	});
});
