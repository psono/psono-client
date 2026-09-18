import apiClient from "./api-client";
import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";
import device from "./device";
import ssoRedirect from "./sso-redirect";
import storage from "./storage";
import * as store from "./store";
import user from "./user";

const testGlobals = globalThis as typeof globalThis & { TARGET: typeof TARGET };

interface PendingDatabase {
	keys: jest.Mock<Promise<string[]>, []>;
	setItem: jest.Mock<Promise<Map<string, unknown>>, [string, unknown]>;
	getItem: jest.Mock<Promise<unknown>, [string]>;
	removeItem: jest.Mock<Promise<boolean>, [string]>;
}

describe("Service: user SSO initiation", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("binds SAML initiation to persisted extension state", async () => {
		jest
			.spyOn(browserClient, "getClientType")
			.mockReturnValue("chrome_extension");
		jest.spyOn(ssoRedirect, "createPending").mockResolvedValue("saml-state");
		jest
			.spyOn(browserClient, "getSamlReturnToUrl")
			.mockReturnValue("https://psono.com/saml-return");
		jest.spyOn(apiClient, "samlInitiateLogin").mockResolvedValue({
			data: { saml_redirect_url: "https://idp.example/saml" },
		});

		await expect(user.getSamlRedirectUrl(7)).resolves.toEqual({
			saml_redirect_url: "https://idp.example/saml",
		});
		expect(ssoRedirect.createPending).toHaveBeenCalledWith("saml");
		expect(browserClient.getSamlReturnToUrl).toHaveBeenCalledWith("saml-state");
		expect(apiClient.samlInitiateLogin).toHaveBeenCalledWith(
			7,
			"https://psono.com/saml-return",
		);
	});

	it("binds OIDC initiation to persisted extension state", async () => {
		jest
			.spyOn(browserClient, "getClientType")
			.mockReturnValue("firefox_extension");
		jest.spyOn(ssoRedirect, "createPending").mockResolvedValue("oidc-state");
		jest
			.spyOn(browserClient, "getOidcReturnToUrl")
			.mockReturnValue("https://psono.com/oidc-return");
		jest.spyOn(apiClient, "oidcInitiateLogin").mockResolvedValue({
			data: { oidc_redirect_url: "https://idp.example/oidc" },
		});

		await expect(user.getOidcRedirectUrl(9)).resolves.toEqual({
			oidc_redirect_url: "https://idp.example/oidc",
		});
		expect(ssoRedirect.createPending).toHaveBeenCalledWith("oidc");
		expect(browserClient.getOidcReturnToUrl).toHaveBeenCalledWith("oidc-state");
		expect(apiClient.oidcInitiateLogin).toHaveBeenCalledWith(
			9,
			"https://psono.com/oidc-return",
		);
	});
});

describe.each([
	["saml", "getSamlRedirectUrl", "samlInitiateLogin", "samlLogin"],
	["oidc", "getOidcRedirectUrl", "oidcInitiateLogin", "oidcLogin"],
] as const)("Web-client %s login state", (type, initiate, apiInitiate, login) => {
	const state = "000102030405060708090a0b0c0d0e0f";
	const tokenId = "123e4567-e89b-42d3-a456-426614174000";
	const originalTarget = testGlobals.TARGET;
	const originalUrl = window.location.href;
	const apiError = ["TEST_LOGIN_API_REACHED"];
	let pending: Map<string, unknown>;
	let database: PendingDatabase;

	beforeEach(() => {
		testGlobals.TARGET = "webclient";
		window.history.replaceState({}, "", "/psono/index.html");
		pending = new Map();
		database = {
			keys: jest.fn(async () => [...pending.keys()]),
			setItem: jest.fn(async (key: string, value: unknown) =>
				pending.set(key, value),
			),
			getItem: jest.fn(async (key: string) => pending.get(key)),
			removeItem: jest.fn(async (key: string) => pending.delete(key)),
		};
		// This fake implements just the LocalForage operations used by SSO state.
		jest
			.spyOn(storage, "get")
			.mockReturnValue(database as unknown as ReturnType<typeof storage.get>);
		jest
			.spyOn(globalThis.crypto, "getRandomValues")
			.mockImplementation(<T extends ArrayBufferView | null>(bytes: T): T => {
				if (bytes) {
					new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength).set([
						...Array(16).keys(),
					]);
				}
				return bytes;
			});
		jest.spyOn(Date, "now").mockReturnValue(1000);
		jest.spyOn(apiClient, apiInitiate).mockResolvedValue({
			data: {
				saml_redirect_url: "https://idp.example/saml",
				oidc_redirect_url: "https://idp.example/oidc",
			},
		});
		// Stop at the API boundary: these tests verify which callbacks may exchange
		// a token, using the real URL parser, pending-state validation and login service.
		jest.spyOn(apiClient, login).mockRejectedValue({
			data: { non_field_errors: apiError },
		});
		jest.spyOn(store, "getStore").mockReturnValue({
			getState: () => ({
				server: { publicKey: "server-public-key" },
				user: { trustDevice: false },
			}),
		} as ReturnType<typeof store.getStore>);
		jest.spyOn(cryptoLibrary, "generatePublicPrivateKeypair").mockReturnValue({
			public_key: "session-public-key",
			private_key: "session-private-key",
		});
		jest.spyOn(cryptoLibrary, "encryptDataPublicKey").mockReturnValue({
			text: "encrypted-login-info",
			nonce: "login-info-nonce",
		});
		jest.spyOn(device, "getDeviceFingerprint").mockReturnValue("fingerprint");
		jest.spyOn(device, "getDeviceDescription").mockReturnValue("description");
	});

	afterEach(() => {
		jest.restoreAllMocks();
		testGlobals.TARGET = originalTarget;
		window.history.replaceState({}, "", originalUrl);
	});

	function navigateToCallback(
		fragment = `#!/${type}/token/${state}/${tokenId}`,
	) {
		window.history.replaceState({}, "", `/psono/index.html${fragment}`);
	}

	async function expectRejected() {
		await expect(user[login](tokenId)).rejects.toEqual([
			"AUTHENTICATION_FAILED",
		]);
		expect(apiClient[login]).not.toHaveBeenCalled();
		expect(cryptoLibrary.generatePublicPrivateKeypair).not.toHaveBeenCalled();
	}

	it("persists state before initiation and exchanges a matching callback once", async () => {
		await user[initiate](7);
		const returnToUrl = `${window.location.origin}/psono/index.html#!/${type}/token/${state}/`;
		expect(apiClient[apiInitiate]).toHaveBeenCalledWith(7, returnToUrl);
		expect(pending.get(`pending-sso-redirect-${state}`)).toEqual({
			state,
			type,
			expiresAt: 3601000,
		});

		// Navigate to the actual return URL sent to the server, with its token appended.
		window.history.replaceState({}, "", returnToUrl + tokenId);
		await expect(user[login](tokenId)).rejects.toEqual(apiError);
		expect(apiClient[login]).toHaveBeenCalledTimes(1);
		expect(
			(
				JSON.parse(
					jest.mocked(cryptoLibrary.encryptDataPublicKey).mock.calls[0][0],
				) as Record<string, string>
			)[`${type}_token_id`],
		).toBe(tokenId);
		expect(pending.has(`pending-sso-redirect-${state}`)).toBe(false);

		await expect(user[login](tokenId)).rejects.toEqual([
			"AUTHENTICATION_FAILED",
		]);
		expect(apiClient[login]).toHaveBeenCalledTimes(1);
	});

	it("rejects a callback when this browser has no pending login", async () => {
		navigateToCallback();
		await expectRejected();
	});

	it("rejects a callback with another login's state", async () => {
		await user[initiate](7);
		navigateToCallback(
			`#!/${type}/token/ffffffffffffffffffffffffffffffff/${tokenId}`,
		);
		await expectRejected();
	});

	it.each([
		["no callback", ""],
		["a token-only callback", `#!/${type}/token/${tokenId}`],
		["a missing token", `#!/${type}/token/${state}/`],
		["a malformed token", `#!/${type}/token/${state}/not-a-token`],
		["extra path segments", `#!/${type}/token/${state}/${tokenId}/extra`],
		["a query string", `?next=attacker#!/${type}/token/${state}/${tokenId}`],
	])("rejects %s before token exchange", async (_name, fragment) => {
		await user[initiate](7);
		navigateToCallback(fragment);
		await expectRejected();
	});

	it("rejects a callback for the other authentication protocol", async () => {
		await user[initiate](7);
		const otherType = type === "saml" ? "oidc" : "saml";
		navigateToCallback(`#!/${otherType}/token/${state}/${tokenId}`);
		await expectRejected();
	});

	it("rejects pending state created for the other authentication protocol", async () => {
		await ssoRedirect.createPending(type === "saml" ? "oidc" : "saml");
		navigateToCallback();
		await expectRejected();
	});

	it("rejects expired pending state", async () => {
		await user[initiate](7);
		jest.mocked(Date.now).mockReturnValue(3601001);
		navigateToCallback();
		await expectRejected();
	});

	it("rejects a token different from the validated callback token", async () => {
		await user[initiate](7);
		navigateToCallback(
			`#!/${type}/token/${state}/223e4567-e89b-42d3-a456-426614174000`,
		);
		await expectRejected();
	});

	it.each([
		"getItem",
		"removeItem",
	] as const)("fails closed if pending-state %s fails", async (method) => {
		await user[initiate](7);
		navigateToCallback();
		database[method].mockRejectedValue(new Error("Storage unavailable"));
		await expectRejected();
	});

	it("does not initiate a login if state cannot be persisted", async () => {
		database.setItem.mockRejectedValue(new Error("Storage unavailable"));
		await expect(user[initiate](7)).rejects.toThrow("Storage unavailable");
		expect(apiClient[apiInitiate]).not.toHaveBeenCalled();
	});

	it("allows only one simultaneous exchange of a callback", async () => {
		await user[initiate](7);
		navigateToCallback();
		const results = await Promise.allSettled([
			user[login](tokenId),
			user[login](tokenId),
		]);
		expect(
			results.map((result) =>
				result.status === "rejected" ? result.reason : undefined,
			),
		).toEqual(expect.arrayContaining([apiError, ["AUTHENTICATION_FAILED"]]));
		expect(apiClient[login]).toHaveBeenCalledTimes(1);
	});

	it.each([
		"chrome_extension",
		"firefox_extension",
	] as const)("allows %s callbacks already validated by the background", async (clientType) => {
		jest.spyOn(browserClient, "getClientType").mockReturnValue(clientType);
		navigateToCallback(`#!/${type}/token/${tokenId}`);

		await expect(user[login](tokenId)).rejects.toEqual(apiError);
		expect(apiClient[login]).toHaveBeenCalledTimes(1);
		expect(database.getItem).not.toHaveBeenCalled();
	});
});
