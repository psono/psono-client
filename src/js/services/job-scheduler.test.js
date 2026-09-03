import apiClient from "./api-client";
import cryptoLibraryService from "./crypto-library";
import hostService from "./host";
import jobSchedulerService from "./job-scheduler";

const recoveryPublicKey = "ab".repeat(32);
let mockState;

jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		readJob: jest.fn(),
		createJobUserMissingAdminSecret: jest.fn(),
		createJobGroupMissingAdminSecret: jest.fn(),
		createJobStaffMissingGroupSecret: jest.fn(),
		createMembershipMissingGroupSecret: jest.fn(),
	},
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		decryptSecretKey: jest.fn((value) => `decrypted-${value}`),
		decryptPrivateKey: jest.fn((value) => `decrypted-${value}`),
		encryptDataPublicKey: jest.fn((value) => ({
			text: `public-${value}`,
			nonce: `nonce-${value}`,
		})),
	},
}));
jest.mock("./host", () => ({
	__esModule: true,
	default: {
		isEE: () => true,
		isNewerOrEqualVersionThan: () => true,
		checkHost: jest.fn(),
	},
}));
jest.mock("./offline-cache", () => ({
	__esModule: true,
	default: { isActive: () => false },
}));
jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));

describe("Service: admin recovery job scheduler", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockState = {
			server: {
				url: "https://example.com/server",
				adminRecoveryPublicKey: recoveryPublicKey,
			},
			user: {
				isLoggedIn: true,
				token: "token",
				sessionSecretKey: "session-key",
				userPrivateKey: "user-private",
				userSecretKey: "user-secret",
			},
		};
		hostService.checkHost.mockResolvedValue({
			status: "matched",
			server_url: "https://example.com/server",
			admin_recovery_public_key: recoveryPublicKey,
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("encrypts and submits the logged-in user's plaintext keys", async () => {
		apiClient.readJob.mockResolvedValue({
			data: { users_missing_admin_secrets: [{}] },
		});

		await jobSchedulerService.checkForJobs();

		expect(cryptoLibraryService.encryptDataPublicKey).toHaveBeenNthCalledWith(
			1,
			"user-private",
			recoveryPublicKey,
			"user-private",
		);
		expect(cryptoLibraryService.encryptDataPublicKey).toHaveBeenNthCalledWith(
			2,
			"user-secret",
			recoveryPublicKey,
			"user-private",
		);
		expect(apiClient.createJobUserMissingAdminSecret).toHaveBeenCalledWith(
			"token",
			"session-key",
			"public-user-private",
			"nonce-user-private",
			"public-user-secret",
			"nonce-user-secret",
		);
	});

	it("does not export recovery secrets when the signed recovery key changed", async () => {
		apiClient.readJob.mockResolvedValue({
			data: { users_missing_admin_secrets: [{}] },
		});
		hostService.checkHost.mockResolvedValue({
			status: "admin_recovery_public_key_changed",
			server_url: "https://example.com/server",
			admin_recovery_public_key: "cd".repeat(32),
		});

		await jobSchedulerService.checkForJobs();

		expect(cryptoLibraryService.encryptDataPublicKey).not.toHaveBeenCalled();
		expect(apiClient.createJobUserMissingAdminSecret).not.toHaveBeenCalled();
	});

	it("decrypts group keys before encrypting them for admin recovery", async () => {
		apiClient.readJob.mockResolvedValue({
			data: {
				groups_missing_admin_secrets: [
					{
						group_id: "group-id",
						public_key: "group-public",
						secret_key: "encrypted-secret",
						secret_key_nonce: "secret-nonce",
						secret_key_type: "symmetric",
						private_key: "encrypted-private",
						private_key_nonce: "private-nonce",
						private_key_type: "asymmetric",
					},
				],
			},
		});

		await jobSchedulerService.checkForJobs();

		expect(cryptoLibraryService.decryptSecretKey).toHaveBeenCalledWith(
			"encrypted-secret",
			"secret-nonce",
		);
		expect(cryptoLibraryService.decryptPrivateKey).toHaveBeenCalledWith(
			"encrypted-private",
			"private-nonce",
			"group-public",
		);
		expect(cryptoLibraryService.encryptDataPublicKey).toHaveBeenNthCalledWith(
			1,
			"decrypted-encrypted-private",
			recoveryPublicKey,
			"decrypted-encrypted-private",
		);
		expect(cryptoLibraryService.encryptDataPublicKey).toHaveBeenNthCalledWith(
			2,
			"decrypted-encrypted-secret",
			recoveryPublicKey,
			"decrypted-encrypted-private",
		);
		expect(apiClient.createJobGroupMissingAdminSecret).toHaveBeenCalledWith(
			"token",
			"session-key",
			"group-id",
			"public-decrypted-encrypted-private",
			"nonce-decrypted-encrypted-private",
			"public-decrypted-encrypted-secret",
			"nonce-decrypted-encrypted-secret",
		);
	});

	it.each([
		"",
		"not-a-valid-key",
	])("does not submit admin recovery jobs for invalid key %p", async (adminRecoveryPublicKey) => {
		mockState.server.adminRecoveryPublicKey = adminRecoveryPublicKey;
		apiClient.readJob.mockResolvedValue({
			data: {
				users_missing_admin_secrets: [{}],
				groups_missing_admin_secrets: [{ group_id: "group-id" }],
			},
		});

		await jobSchedulerService.checkForJobs();

		expect(cryptoLibraryService.encryptDataPublicKey).not.toHaveBeenCalled();
		expect(apiClient.createJobUserMissingAdminSecret).not.toHaveBeenCalled();
		expect(apiClient.createJobGroupMissingAdminSecret).not.toHaveBeenCalled();
	});

	it("continues with later group jobs after one fails", async () => {
		cryptoLibraryService.decryptSecretKey
			.mockImplementationOnce(() => {
				throw new Error("malformed job");
			})
			.mockImplementation((value) => `decrypted-${value}`);
		apiClient.readJob.mockResolvedValue({
			data: {
				groups_missing_admin_secrets: [
					{
						group_id: "bad-group",
						secret_key_type: "symmetric",
					},
					{
						group_id: "good-group",
						secret_key: "secret",
						secret_key_nonce: "secret-nonce",
						secret_key_type: "symmetric",
						private_key: "private",
						private_key_nonce: "private-nonce",
						private_key_type: "symmetric",
					},
				],
			},
		});
		jest.spyOn(console, "log").mockImplementation(() => {});

		await jobSchedulerService.checkForJobs();

		expect(apiClient.createJobGroupMissingAdminSecret).toHaveBeenCalledTimes(1);
		expect(apiClient.createJobGroupMissingAdminSecret).toHaveBeenCalledWith(
			"token",
			"session-key",
			"good-group",
			"public-decrypted-private",
			"nonce-decrypted-private",
			"public-decrypted-secret",
			"nonce-decrypted-secret",
		);
	});

	it("propagates random nonces and ciphertexts produced by the real crypto library", async () => {
		const actualCryptoLibraryService =
			jest.requireActual("./crypto-library").default;
		const userKeyPair =
			actualCryptoLibraryService.generatePublicPrivateKeypair();
		const recoveryKeyPair =
			actualCryptoLibraryService.generatePublicPrivateKeypair();
		mockState.user.userPrivateKey = userKeyPair.private_key;
		mockState.user.userSecretKey = "cd".repeat(32);
		mockState.server.adminRecoveryPublicKey = recoveryKeyPair.public_key;
		hostService.checkHost.mockResolvedValue({
			status: "matched",
			server_url: "https://example.com/server",
			admin_recovery_public_key: recoveryKeyPair.public_key,
		});
		cryptoLibraryService.encryptDataPublicKey.mockImplementation(
			actualCryptoLibraryService.encryptDataPublicKey,
		);
		apiClient.readJob.mockResolvedValue({
			data: { users_missing_admin_secrets: [{}] },
		});

		await jobSchedulerService.checkForJobs();

		const [, , privateKey, privateKeyNonce, secretKey, secretKeyNonce] =
			apiClient.createJobUserMissingAdminSecret.mock.calls[0];
		expect(privateKey).toMatch(/^[0-9a-f]{160}$/);
		expect(secretKey).toMatch(/^[0-9a-f]{160}$/);
		expect(privateKeyNonce).toMatch(/^[0-9a-f]{48}$/);
		expect(secretKeyNonce).toMatch(/^[0-9a-f]{48}$/);
		expect(privateKeyNonce).not.toBe(secretKeyNonce);
	});
});
