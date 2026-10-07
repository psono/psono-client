jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({
		setUserUsername: (username: string) => {
			mockState.user.username = username;
		},
		setServerUrl: (url: string) => {
			mockState.server.url = url;
		},
		sethashingParameters: (
			hashingAlgorithm: string,
			hashingParameters: object,
		) => {
			Object.assign(mockState.user, { hashingAlgorithm, hashingParameters });
		},
		setUserInfo2: (
			privateKey: string,
			publicKey: string,
			sessionKey: string,
			token: string,
			sauce: string,
		) => {
			Object.assign(mockState.user, {
				userPrivateKey: privateKey,
				userPublicKey: publicKey,
				sessionSecretKey: sessionKey,
				token,
				userSauce: sauce,
			});
		},
		setUserInfo3: (
			id: string,
			email: string,
			secretKey: string,
			serverSecretExists: boolean,
			requirePasswordChange: boolean,
			defaultHashingAlgorithm: string,
			defaultHashingParameters: object,
		) => {
			Object.assign(mockState.user, {
				userId: id,
				userEmail: email,
				userSecretKey: secretKey,
				serverSecretExists,
				requirePasswordChange,
				defaultHashingAlgorithm,
				defaultHashingParameters,
			});
		},
	}),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		readEmergencyCodes: jest.fn(),
		createEmergencyCode: jest.fn(),
		armEmergencyCode: jest.fn(),
		activateEmergencyCode: jest.fn(),
	},
}));
jest.mock("./device", () => ({
	__esModule: true,
	default: {
		getDeviceFingerprint: () => "device",
		getDeviceDescription: () => "description",
	},
}));

import type {
	EmergencyCodeActivationData,
	EmergencyLoginData,
} from "../../types/auth";
import apiClient from "./api-client";
import crypto from "./crypto-library";
import {
	emergencyCodeFromInput,
	emergencyCodeFromWords,
	getEmergencyCodeParameters,
} from "./emergency-code-format";
import emergency from "./emmergency-code";
import user from "./user";

const legacy = { u: 14, r: 8, p: 1, l: 64 };
const codeProfile = { ...legacy, u: 15 };
const readyProfile = { ...legacy, u: 16 };
const finalProfile = { ...legacy, u: 17 };
const preferred = { ...legacy, u: 18 };
let mockState: any;

describe("emergency-code creation and login", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
	});
	afterEach(() => {
		jest.restoreAllMocks();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	for (const variant of [
		"legacy-server",
		"new-server",
		"ready-fallback",
	] as const) {
		it(`creates and activates codes using ${variant}`, async () => {
			const pair = crypto.generatePublicPrivateKeypair();
			const verifier = crypto.generatePublicPrivateKeypair();
			const server = crypto.generatePublicPrivateKeypair();
			const secretKey = "cd".repeat(32);
			mockState = {
				user: {
					username: "code@example.com",
					token: "token",
					sessionSecretKey: "ab".repeat(32),
					userPrivateKey: pair.private_key,
					userSecretKey: secretKey,
					defaultHashingAlgorithm: "scrypt",
					defaultHashingParameters: legacy,
				},
				server: { url: "https://example.com" },
			};
			const api = jest.mocked(apiClient, true);
			api.readEmergencyCodes.mockResolvedValue({
				data: {
					emegency_codes: [],
					...(variant !== "legacy-server"
						? {
								default_hashing_algorithm: "scrypt",
								default_hashing_parameters: codeProfile,
							}
						: {}),
				},
			});
			api.createEmergencyCode.mockResolvedValue({
				data: { emergency_code_id: "code-id" },
			});
			const generated = await emergency.createEmergencyCode("contact", 0);
			const code = emergencyCodeFromInput(generated.emergency_password);
			expect(emergencyCodeFromWords(generated.emergency_words)).toBe(code);
			expect(getEmergencyCodeParameters(code)).toEqual(
				variant === "legacy-server" ? legacy : codeProfile,
			);
			const request = api.createEmergencyCode.mock.calls[0];
			const keys = JSON.parse(
				crypto.decryptSecret(
					request[5],
					request[6],
					code,
					request[7],
					"scrypt",
					getEmergencyCodeParameters(code),
				),
			);
			expect(keys).toEqual({
				user_private_key: pair.private_key,
				user_secret_key: secretKey,
			});

			mockState.user.hashingAlgorithm = "scrypt";
			mockState.user.hashingParameters = preferred;
			mockState.user.defaultHashingParameters = preferred;
			const ready: EmergencyCodeActivationData = {
				emergency_data: request[5],
				emergency_data_nonce: request[6],
				emergency_sauce: request[7],
				user_sauce: "old-sauce",
				verifier_public_key: verifier.public_key,
				authentication: "AUTHKEY",
				...(variant !== "legacy-server"
					? { hashing_algorithm: "scrypt", hashing_parameters: readyProfile }
					: {}),
			};
			api.armEmergencyCode.mockImplementation(async (_username, authkey) => {
				expect(authkey).toBe(request[4]);
				return { data: ready };
			});
			api.activateEmergencyCode.mockImplementation(
				async (_username, authkey, text, nonce) => {
					expect(authkey).toBe(request[4]);
					const session = JSON.parse(
						crypto.decryptDataPublicKey(
							text,
							nonce,
							pair.public_key,
							verifier.private_key,
						),
					);
					const login: EmergencyLoginData = {
						token: "emergency-token",
						session_secret_key: "ef".repeat(32),
						user_public_key: pair.public_key,
						user_email: "code@example.com",
						user_id: "user-id",
						...(variant === "new-server"
							? {
									hashing_algorithm: "scrypt",
									hashing_parameters: finalProfile,
									default_hashing_algorithm: "scrypt",
									default_hashing_parameters: preferred,
								}
							: {}),
					};
					const encrypted = crypto.encryptDataPublicKey(
						JSON.stringify(login),
						session.session_public_key,
						server.private_key,
					);
					return {
						data: {
							login_info: encrypted.text,
							login_info_nonce: encrypted.nonce,
						},
					};
				},
			);
			expect(
				await user.armEmergencyCode(
					"code@example.com",
					code,
					"https://example.com",
					{ public_key: server.public_key },
				),
			).toEqual({ status: "active" });
			expect(mockState.user.hashingParameters).toEqual(
				variant === "new-server"
					? finalProfile
					: variant === "ready-fallback"
						? readyProfile
						: legacy,
			);
			expect(mockState.user.defaultHashingParameters).toEqual(
				variant === "new-server" ? preferred : legacy,
			);
			expect(mockState.user.userSauce).toBe(ready.user_sauce);
			expect(mockState.user.userPrivateKey).toBe(pair.private_key);
			expect(mockState.user.userSecretKey).toBe(secretKey);
		});
	}
});
