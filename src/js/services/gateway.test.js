import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import gatewayService from "./gateway";
import secretService from "./secret";

let mockState;
let mockGatewayWindow;
const mockSetGatewayClusterSelection = jest.fn().mockResolvedValue("saved");

jest.mock("./store", () => ({
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: jest.fn(() => ({
		setGatewayClusterSelection: mockSetGatewayClusterSelection,
	})),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		getGatewayClusters: jest.fn(),
		launchGateway: jest.fn(),
	},
}));
jest.mock("./crypto-library", () => ({
	__esModule: true,
	default: {
		generateSecretKey: jest.fn(() => "ab".repeat(32)),
		encryptData: jest.fn(() => ({ text: "ciphertext", nonce: "nonce" })),
	},
}));
jest.mock("./secret", () => ({
	__esModule: true,
	default: { readSecret: jest.fn() },
}));
jest.mock("./storage", () => ({
	__esModule: true,
	default: { findKey: jest.fn() },
}));

const sshItem = {
	type: "ssh_connection",
	secret_id: "ssh-secret",
	secret_key: "ssh-key",
};

const sshConnection = {
	ssh_connection_host: "ssh.example.com",
	ssh_connection_port: 22,
	ssh_connection_authentication_type: "password",
	ssh_connection_username: "alice",
	ssh_connection_password: "password",
	ssh_connection_notes: "must not leave the client",
	unknown_option: "ignored",
};

describe("Service: gateway", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockState = {
			user: { token: "token", sessionSecretKey: "session-key" },
			settingsDatastore: {
				gatewayClusterSelection: {
					schema_version: 1,
					by_connection_secret_id: {},
				},
				connectionAuthentication: {
					schema_version: 1,
					by_connection_secret_id: {},
				},
			},
		};
		secretService.readSecret.mockResolvedValue(sshConnection);
		apiClient.launchGateway.mockResolvedValue({
			data: {
				launch_id: "launch-id",
				gateway_url: "https://gateway.example/guacamole/",
				valid_till: "2030-01-01T00:00:00Z",
			},
		});
		mockGatewayWindow = {
			close: jest.fn(),
			location: { replace: jest.fn() },
			opener: window,
		};
		window.open = jest.fn(() => mockGatewayWindow);
	});

	it("builds and encrypts a strict SSH password payload", async () => {
		await gatewayService.launch(sshItem, "cluster-a");

		expect(secretService.readSecret).toHaveBeenCalledWith(
			"ssh-secret",
			"ssh-key",
		);
		expect(cryptoLibrary.encryptData).toHaveBeenCalledWith(
			JSON.stringify({
				version: 1,
				protocol: "ssh",
				hostname: "ssh.example.com",
				port: 22,
				authentication: {
					type: "password",
					username: "alice",
					password: "password",
				},
			}),
			"ab".repeat(32),
		);
		expect(apiClient.launchGateway).toHaveBeenCalledWith(
			"token",
			"session-key",
			"cluster-a",
			"ssh-secret",
			"ciphertext",
			"nonce",
		);
		expect(window.open).toHaveBeenCalledWith("about:blank", "_blank");
		expect(mockGatewayWindow.location.replace).toHaveBeenCalledWith(
			"https://gateway.example/guacamole/#/client/cHNvbm8tY29ubmVjdGlvbgBjAHBzb25v?psono-launch=launch-id&psono-key=" +
				"ab".repeat(32),
		);
		expect(mockGatewayWindow.opener).toBeNull();
	});

	it("builds the private-key SSH authentication variant", async () => {
		secretService.readSecret.mockResolvedValue({
			ssh_connection_host: "ssh.example.com",
			ssh_connection_port: 2222,
			ssh_connection_authentication_type: "private_key",
			ssh_connection_username: "alice",
			ssh_connection_private_key: "private-key-data",
			ssh_connection_notes: "ignored",
		});

		await gatewayService.launch(sshItem, "cluster-a");

		expect(JSON.parse(cryptoLibrary.encryptData.mock.calls[0][0])).toEqual({
			version: 1,
			protocol: "ssh",
			hostname: "ssh.example.com",
			port: 2222,
			authentication: {
				type: "private_key",
				username: "alice",
				private_key: "private-key-data",
			},
		});
	});

	it("resolves a personal credential reference for a strict RDP payload", async () => {
		const item = {
			type: "rdp_connection",
			secret_id: "rdp-secret",
			secret_key: "rdp-key",
		};
		mockState.settingsDatastore.connectionAuthentication.by_connection_secret_id[
			"rdp-secret"
		] = {
			type: "application_password",
			secret_id: "credential-secret",
			secret_key: "credential-key",
		};
		secretService.readSecret
			.mockResolvedValueOnce({
				rdp_connection_host: "rdp.example.com",
				rdp_connection_port: 3389,
				rdp_connection_domain: "EXAMPLE",
				rdp_connection_ignore_certificate: true,
				rdp_connection_notes: "ignored",
			})
			.mockResolvedValueOnce({
				application_password_username: "bob",
				application_password_password: "credential-password",
			});

		await gatewayService.launch(item, "cluster-b");

		expect(secretService.readSecret).toHaveBeenNthCalledWith(
			2,
			"credential-secret",
			"credential-key",
		);
		expect(apiClient.launchGateway).toHaveBeenCalledWith(
			"token",
			"session-key",
			"cluster-b",
			"rdp-secret",
			"ciphertext",
			"nonce",
		);
		expect(JSON.parse(cryptoLibrary.encryptData.mock.calls[0][0])).toEqual({
			version: 1,
			protocol: "rdp",
			hostname: "rdp.example.com",
			port: 3389,
			domain: "EXAMPLE",
			ignore_certificate: true,
			authentication: {
				type: "password",
				username: "bob",
				password: "credential-password",
			},
		});
	});

	it("validates RDP certificates by default", () => {
		expect(
			gatewayService.buildPayload(
				"rdp_connection",
				{
					rdp_connection_host: "rdp.example.com",
					rdp_connection_port: 3389,
					rdp_connection_domain: "",
				},
				{ type: "password", username: "bob", password: "secret" },
			),
		).toEqual(expect.objectContaining({ ignore_certificate: false }));
	});

	it("builds a strict VNC payload with an optional username", () => {
		expect(
			gatewayService.buildPayload(
				"vnc_connection",
				{
					vnc_connection_host: "vnc.example.com",
					vnc_connection_port: 5900,
					vnc_connection_notes: "ignored",
				},
				{ type: "password", password: "secret" },
			),
		).toEqual({
			version: 1,
			protocol: "vnc",
			hostname: "vnc.example.com",
			port: 5900,
			authentication: {
				type: "password",
				username: "",
				password: "secret",
			},
		});
	});

	it("rejects non-http and insecure public gateway URLs", () => {
		expect(() =>
			gatewayService.buildGatewayUrl("javascript:alert(1)", "launch", "key"),
		).toThrow();
		expect(() =>
			gatewayService.buildGatewayUrl("not a URL", "launch", "key"),
		).toThrow();
		expect(() =>
			gatewayService.buildGatewayUrl(
				"http://gateway.example/guacamole/",
				"launch",
				"key",
			),
		).toThrow();
		expect(
			gatewayService.buildGatewayUrl(
				"http://localhost:8080/guacamole/",
				"launch",
				"key",
			),
		).toContain("http://localhost:8080/guacamole/");
	});

	it("rejects payload values outside the gateway parser contract", () => {
		expect(() =>
			gatewayService.buildPayload(
				"ssh_connection",
				{ ssh_connection_host: "bad host", ssh_connection_port: 22 },
				{ type: "password", username: "alice", password: "secret" },
			),
		).toThrow();
		expect(() =>
			gatewayService.buildPayload(
				"ssh_connection",
				{ ssh_connection_host: "host", ssh_connection_port: 22 },
				{ type: "password", username: "a".repeat(257), password: "secret" },
			),
		).toThrow();
		expect(() =>
			gatewayService.buildPayload(
				"ssh_connection",
				{ ssh_connection_host: "host", ssh_connection_port: 22 },
				{ type: "private_key", username: "alice", private_key: "key\u0000" },
			),
		).toThrow();
		expect(() =>
			gatewayService.buildPayload(
				"vnc_connection",
				{ vnc_connection_host: "host", vnc_connection_port: 5900 },
				{ type: "password", username: "", password: "" },
			),
		).toThrow();
		expect(() =>
			gatewayService.buildPayload(
				"vnc_connection",
				{ vnc_connection_host: "host", vnc_connection_port: 5900 },
				{ type: "password", username: "user\u0000", password: "secret" },
			),
		).toThrow();
	});

	it("fails before reading or creating a launch when popups are blocked", async () => {
		window.open.mockReturnValueOnce(null);

		await expect(gatewayService.launch(sshItem, "cluster-a")).rejects.toEqual(
			expect.objectContaining({ code: "GATEWAY_POPUP_BLOCKED" }),
		);
		expect(secretService.readSecret).not.toHaveBeenCalled();
		expect(apiClient.launchGateway).not.toHaveBeenCalled();
	});

	it("returns the reusable selector for multiple clusters", async () => {
		apiClient.getGatewayClusters.mockResolvedValue({
			data: {
				clusters: [
					{ id: "a", title: "A" },
					{ id: "b", title: "B" },
				],
			},
		});

		await expect(gatewayService.prepareLaunch(sshItem)).resolves.toEqual({
			launched: false,
			clusters: [
				{ id: "a", title: "A" },
				{ id: "b", title: "B" },
			],
		});
		expect(apiClient.getGatewayClusters).toHaveBeenCalledWith(
			"token",
			"session-key",
		);
		expect(apiClient.launchGateway).not.toHaveBeenCalled();
		expect(mockGatewayWindow.close).toHaveBeenCalled();
	});

	it("rejects zero clusters and auto-launches one cluster", async () => {
		apiClient.getGatewayClusters.mockResolvedValueOnce({
			data: { clusters: [] },
		});
		await expect(gatewayService.prepareLaunch(sshItem)).rejects.toEqual(
			expect.objectContaining({ code: "GATEWAY_NO_CLUSTERS" }),
		);

		apiClient.getGatewayClusters.mockResolvedValueOnce({
			data: { clusters: [{ id: "only", title: "Only" }] },
		});
		await expect(gatewayService.prepareLaunch(sshItem)).resolves.toEqual({
			launched: true,
			clusters: [{ id: "only", title: "Only" }],
		});
		expect(apiClient.launchGateway).toHaveBeenCalledWith(
			"token",
			"session-key",
			"only",
			"ssh-secret",
			"ciphertext",
			"nonce",
		);
	});

	it("auto-launches a remembered cluster and clears a stale selection", async () => {
		mockState.settingsDatastore.gatewayClusterSelection.by_connection_secret_id[
			"ssh-secret"
		] = "remembered";
		apiClient.getGatewayClusters.mockResolvedValueOnce({
			data: {
				clusters: [
					{ id: "other", title: "Other" },
					{ id: "remembered", title: "Remembered" },
				],
			},
		});
		await gatewayService.prepareLaunch(sshItem);
		expect(apiClient.launchGateway).toHaveBeenLastCalledWith(
			"token",
			"session-key",
			"remembered",
			"ssh-secret",
			"ciphertext",
			"nonce",
		);

		mockState.settingsDatastore.gatewayClusterSelection.by_connection_secret_id[
			"ssh-secret"
		] = "stale";
		apiClient.getGatewayClusters.mockResolvedValueOnce({
			data: { clusters: [{ id: "current", title: "Current" }] },
		});
		await gatewayService.prepareLaunch(sshItem);
		expect(mockSetGatewayClusterSelection).toHaveBeenCalledWith(
			"ssh-secret",
			null,
		);
		expect(apiClient.launchGateway).toHaveBeenLastCalledWith(
			"token",
			"session-key",
			"current",
			"ssh-secret",
			"ciphertext",
			"nonce",
		);
	});

	it("persists an explicitly remembered selection before launch", async () => {
		await gatewayService.launchSelected(sshItem, "selected", true);
		expect(mockSetGatewayClusterSelection).toHaveBeenCalledWith(
			"ssh-secret",
			"selected",
		);
		expect(apiClient.launchGateway).toHaveBeenCalledWith(
			"token",
			"session-key",
			"selected",
			"ssh-secret",
			"ciphertext",
			"nonce",
		);
	});
});
