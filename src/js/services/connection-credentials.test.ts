import connectionCredentialsService from "./connection-credentials";
import type {
	ConnectionAuthenticationSettings,
	ReadReferencedCredential,
} from "../../types/auth";

// Only the settings projection used by this service is needed in the mock store.
const mockGetStore = jest.fn<
	{
		getState: () => {
			settingsDatastore: {
				connectionAuthentication: ConnectionAuthenticationSettings;
			};
		};
	},
	[]
>();

jest.mock("./store", () => ({
	getStore: () => mockGetStore(),
}));

describe("connection credentials", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetStore.mockReturnValue({
			getState: () => ({
				settingsDatastore: {
					connectionAuthentication: {
						schema_version: 1,
						by_connection_secret_id: {},
					},
				},
			}),
		});
	});

	it("uses the complete embedded SSH authentication", async () => {
		await expect(
			connectionCredentialsService.resolveConnectionAuthentication(
				"ssh_connection",
				"connection-id",
				{
					ssh_connection_authentication_type: "password",
					ssh_connection_username: "alice",
					ssh_connection_password: "secret",
				},
				jest.fn<
					ReturnType<ReadReferencedCredential>,
					Parameters<ReadReferencedCredential>
				>(),
			),
		).resolves.toEqual({
			source: "connection",
			type: "password",
			username: "alice",
			password: "secret",
			private_key: "",
		});
	});

	it("allows an optional username for embedded VNC password authentication", () => {
		expect(
			connectionCredentialsService.embeddedAuthentication("vnc_connection", {
				vnc_connection_password: "secret",
			}),
		).toEqual({
			source: "connection",
			type: "password",
			username: "",
			password: "secret",
			private_key: "",
		});
		expect(
			connectionCredentialsService.embeddedAuthentication("vnc_connection", {
				vnc_connection_username: "alice",
				vnc_connection_password: "",
			}),
		).toBeNull();
	});

	it("resolves username and password from one application password", async () => {
		mockGetStore.mockReturnValue({
			getState: () => ({
				settingsDatastore: {
					connectionAuthentication: {
						schema_version: 1,
						by_connection_secret_id: {
							"connection-id": {
								type: "application_password",
								secret_id: "credential-id",
								secret_key: "credential-key",
							},
						},
					},
				},
			}),
		});
		const readSecret = jest
			.fn<
				ReturnType<ReadReferencedCredential>,
				Parameters<ReadReferencedCredential>
			>()
			.mockResolvedValue({
				application_password_username: "bob",
				application_password_password: "password",
			});

		await expect(
			connectionCredentialsService.resolveConnectionAuthentication(
				"rdp_connection",
				"connection-id",
				{},
				readSecret,
			),
		).resolves.toEqual({
			source: "reference",
			type: "password",
			username: "bob",
			password: "password",
			private_key: "",
		});
		expect(readSecret).toHaveBeenCalledWith("credential-id", "credential-key");
	});

	it("uses the personal username with one SSH key reference", async () => {
		mockGetStore.mockReturnValue({
			getState: () => ({
				settingsDatastore: {
					connectionAuthentication: {
						schema_version: 1,
						by_connection_secret_id: {
							"connection-id": {
								type: "ssh_own_key",
								secret_id: "key-id",
								secret_key: "key-secret",
								username: "carol",
							},
						},
					},
				},
			}),
		});
		const readSecret = jest
			.fn<
				ReturnType<ReadReferencedCredential>,
				Parameters<ReadReferencedCredential>
			>()
			.mockResolvedValue({ ssh_own_key_private: "private-key" });
		await expect(
			connectionCredentialsService.resolveConnectionAuthentication(
				"ssh_connection",
				"connection-id",
				{},
				readSecret,
			),
		).resolves.toEqual({
			source: "reference",
			type: "private_key",
			username: "carol",
			password: "",
			private_key: "private-key",
		});
		expect(readSecret).toHaveBeenCalledWith("key-id", "key-secret");
	});

	it("allows only application password references for VNC", async () => {
		const readSecret = jest
			.fn<
				ReturnType<ReadReferencedCredential>,
				Parameters<ReadReferencedCredential>
			>()
			.mockResolvedValue({
				application_password_password: "password",
			});
		await expect(
			connectionCredentialsService.resolveAuthenticationReference(
				"vnc_connection",
				{
					type: "application_password",
					secret_id: "credential-id",
					secret_key: "credential-key",
				},
				readSecret,
			),
		).resolves.toEqual({
			source: "reference",
			type: "password",
			username: "",
			password: "password",
			private_key: "",
		});
		await expect(
			connectionCredentialsService.resolveAuthenticationReference(
				"vnc_connection",
				{
					type: "ssh_own_key",
					secret_id: "key-id",
					secret_key: "key-secret",
					username: "alice",
				},
				readSecret,
			),
		).rejects.toMatchObject({ code: "BROKEN_REFERENCE" });
	});

	it("fails closed instead of mixing a broken reference with embedded data", async () => {
		mockGetStore.mockReturnValue({
			getState: () => ({
				settingsDatastore: {
					connectionAuthentication: {
						schema_version: 1,
						by_connection_secret_id: {
							"connection-id": {
								type: "application_password",
								secret_id: "missing-id",
								secret_key: "missing-key",
							},
						},
					},
				},
			}),
		});
		await expect(
			connectionCredentialsService.resolveConnectionAuthentication(
				"ssh_connection",
				"connection-id",
				{
					ssh_connection_authentication_type: "password",
					ssh_connection_username: "fallback",
					ssh_connection_password: "fallback",
				},
				jest
					.fn<
						ReturnType<ReadReferencedCredential>,
						Parameters<ReadReferencedCredential>
					>()
					.mockRejectedValue(new Error("missing")),
			),
		).rejects.toMatchObject({ code: "BROKEN_REFERENCE" });
	});

	it("stores the referenced secret key and strips display metadata", () => {
		expect(
			connectionCredentialsService.sanitizeConnectionAuthentication({
				datastore_id: "must-not-be-stored",
				secret_id: "secret-id",
				secret_key: "secret-key",
				label: "stale label",
				type: "ssh_own_key",
				username: "dave",
			}),
		).toEqual({
			secret_id: "secret-id",
			secret_key: "secret-key",
			type: "ssh_own_key",
			username: "dave",
		});
	});
});
