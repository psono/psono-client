jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({
		sethashingParameters: (
			hashingAlgorithm: string,
			hashingParameters: object,
		) => {
			Object.assign(mockState.user, { hashingAlgorithm, hashingParameters });
		},
		setUserUsername: (username: string) => {
			mockState.user.username = username;
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
			key: string,
			serverSecretExists: boolean,
			requirePasswordChange: boolean,
			defaultHashingAlgorithm: string,
			defaultHashingParameters: object,
		) => {
			Object.assign(mockState.user, {
				isLoggedIn: true,
				userId: id,
				userEmail: email,
				userSecretKey: key,
				serverSecretExists,
				requirePasswordChange,
				defaultHashingAlgorithm,
				defaultHashingParameters,
			});
		},
		setHasTwoFactor: jest.fn(),
	}),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		prelogin: jest.fn(),
		login: jest.fn(),
		samlLogin: jest.fn(),
		oidcLogin: jest.fn(),
		activateToken: jest.fn(),
		updateUser: jest.fn(),
		upgradeHashingParameters: jest.fn(),
	},
}));
jest.mock("./device", () => ({
	__esModule: true,
	default: {
		getDeviceFingerprint: () => "device",
		getDeviceDescription: () => "description",
	},
}));
jest.mock("./browser-client", () => ({
	__esModule: true,
	default: { getClientType: () => "extension", emit: jest.fn() },
}));

import apiClient from "./api-client";
import crypto from "./crypto-library";
import { getHashingUpgrade } from "./hashing-parameters";
import user from "./user";

const legacy = { u: 14, r: 8, p: 1, l: 64 };
const stronger = { ...legacy, u: 15 };
const username = "upgrade@example.com";
const secretKey = "cd".repeat(32);
let mockState: any;

describe("background hashing upgrades", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockState = {
			user: { username, hashingAlgorithm: "scrypt", hashingParameters: legacy },
			server: {},
		};
	});
	afterEach(() => {
		jest.restoreAllMocks();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it("never lowers existing work factors or changes the credential format", () => {
		expect(getHashingUpgrade("scrypt", stronger, "scrypt", legacy)).toBeNull();
		expect(
			getHashingUpgrade("scrypt", stronger, "scrypt", { ...legacy, r: 9 }),
		).toEqual({ ...stronger, r: 9 });
		expect(getHashingUpgrade("scrypt", legacy, "argon2", stronger)).toBeNull();
		expect(
			getHashingUpgrade("scrypt", legacy, "scrypt", { ...stronger, l: 65 }),
		).toBeNull();
	});

	for (const [authentication, personalPassword, concurrent, failure] of [
		["AUTHKEY", false, false, false],
		["LDAP", false, false, false],
		["SAML", false, false, false],
		["OIDC", false, false, false],
		["SAML", true, false, false],
		["OIDC", true, false, false],
		["AUTHKEY", false, true, false],
		["AUTHKEY", false, false, true],
	] as const) {
		it(`${authentication} upgrade: ${personalPassword}/${concurrent}/${failure}`, async () => {
			const password = personalPassword
				? "PersonalMasterPassword123!"
				: "LoginPassword123!";
			const server = crypto.generatePublicPrivateKeypair();
			const client = crypto.generatePublicPrivateKeypair();
			const keys = crypto.generatePublicPrivateKeypair();
			jest
				.spyOn(crypto, "generatePublicPrivateKeypair")
				.mockReturnValue(client);
			mockState.server.publicKey = server.public_key;
			const privateKey = crypto.encryptSecret(
				keys.private_key,
				password,
				"user-sauce",
				"scrypt",
				legacy,
			);
			const secret = crypto.encryptSecret(
				secretKey,
				password,
				"user-sauce",
				"scrypt",
				concurrent ? stronger : legacy,
			);
			const validator = crypto.encryptDataPublicKey(
				"validator",
				keys.public_key,
				server.private_key,
			);
			const login = crypto.encryptDataPublicKey(
				JSON.stringify({
					password: personalPassword ? "unused-server-password" : password,
					token: "token",
					session_secret_key: "ab".repeat(32),
					session_public_key: server.public_key,
					user_validator: validator.text,
					user_validator_nonce: validator.nonce,
					required_multifactors: [],
					user: {
						username,
						authentication,
						public_key: keys.public_key,
						private_key: privateKey.text,
						private_key_nonce: privateKey.nonce,
						user_sauce: "user-sauce",
						hashing_algorithm: "scrypt",
						hashing_parameters: legacy,
					},
				}),
				client.public_key,
				server.private_key,
			);
			const response = {
				data: { login_info: login.text, login_info_nonce: login.nonce },
			};
			const api = jest.mocked(apiClient, true);
			api.prelogin.mockResolvedValue({
				data: { hashing_algorithm: "scrypt", hashing_parameters: legacy },
			});
			api.login.mockResolvedValue(response);
			api.samlLogin.mockResolvedValue(response);
			api.oidcLogin.mockResolvedValue(response);
			api.activateToken.mockResolvedValue({
				data: {
					default_hashing_algorithm: "scrypt",
					default_hashing_parameters: stronger,
					user: {
						id: "user-id",
						email: username,
						authentication,
						secret_key: secret.text,
						secret_key_nonce: secret.nonce,
						require_password_change: true,
						...(concurrent
							? { hashing_algorithm: "scrypt", hashing_parameters: stronger }
							: {}),
					},
				},
			});
			api.upgradeHashingParameters.mockResolvedValue({ data: {} });
			if (failure) {
				api.upgradeHashingParameters.mockRejectedValueOnce(
					new Error("offline"),
				);
			}
			let result =
				authentication === "SAML"
					? await user.samlLogin("sso-token")
					: authentication === "OIDC"
						? await user.oidcLogin("sso-token")
						: await user.login(
								password,
								{ info: { public_key: server.public_key } },
								authentication === "LDAP",
							);
			if ("require_password" in result) {
				result = await result.require_password(password);
			}
			await user.activateToken();
			expect(api.updateUser).not.toHaveBeenCalled();
			expect(api.upgradeHashingParameters).not.toHaveBeenCalled();
			if (concurrent) {
				expect(mockState.user.hashingParameters).toEqual(stronger);
				return;
			}
			jest.advanceTimersByTime(0);
			for (
				let i = 0;
				i < 10 && mockState.user.hashingParameters.u !== 15;
				i++
			) {
				await Promise.resolve();
			}
			const args = api.upgradeHashingParameters.mock.calls[0];
			expect(args.slice(8)).toEqual(["scrypt", stronger]);
			expect(args[3]).toBe(
				crypto.generateAuthkey(username, password, "scrypt", legacy),
			);
			expect(args[2]).toBe(
				crypto.generateAuthkey(username, password, "scrypt", stronger),
			);
			expect(
				crypto.decryptSecret(
					args[4],
					args[5],
					password,
					"user-sauce",
					"scrypt",
					stronger,
				),
			).toBe(keys.private_key);
			expect(
				crypto.decryptSecret(
					args[6],
					args[7],
					password,
					"user-sauce",
					"scrypt",
					stronger,
				),
			).toBe(secretKey);
			expect(mockState.user.hashingParameters).toEqual(
				failure ? legacy : stronger,
			);
			expect(mockState.user.isLoggedIn).toBe(true);
			expect(mockState.user.requirePasswordChange).toBe(true);
		});
	}
});
