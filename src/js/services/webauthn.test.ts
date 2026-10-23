import apiClient from "./api-client";
import helper from "./helper";
import * as store from "./store";
import webauthn from "./webauthn";
import type { WebauthnVerificationOptions } from "../../types/auth";

const testGlobals = globalThis as typeof globalThis & { TARGET: typeof TARGET };
const firefoxOrigin =
	"moz-extension://ofcjppepgijefpoodofipcbkfnbnkgghlndbaocdngagmdgooiejchclkancledi";

describe("Service: WebAuthn extension context", () => {
	const originalTarget = testGlobals.TARGET;
	const originalBrowser = globalThis.browser;

	afterEach(() => {
		testGlobals.TARGET = originalTarget;
		globalThis.browser = originalBrowser;
		jest.restoreAllMocks();
	});

	it("uses Firefox's stable origin and the /info/ web_client hostname for both ceremonies", async () => {
		testGlobals.TARGET = "firefox";
		globalThis.browser = {
			runtime: { id: "{3dce78ca-2a07-4017-9111-998d4f826625}" },
		} as typeof browser;
		const state = {
			user: { token: "token", sessionSecretKey: "secret" },
			server: {
				url: "https://api.example.com/server",
				webClient: "https://vault.example.com:8443/psono/",
			},
		};
		jest.spyOn(store, "getStore").mockReturnValue({
			getState: () => state,
		} as unknown as ReturnType<typeof store.getStore>);
		jest.spyOn(apiClient, "createWebauthn").mockResolvedValue({
			data: { id: "credential", options: {} },
		} as Awaited<ReturnType<typeof apiClient.createWebauthn>>);
		jest.spyOn(apiClient, "webauthnVerifyInit").mockResolvedValue({
			data: { options: {} },
		} as Awaited<ReturnType<typeof apiClient.webauthnVerifyInit>>);

		await webauthn.createWebauthn("Security key");
		await webauthn.verifyWebauthnInit();

		expect(apiClient.createWebauthn).toHaveBeenCalledWith(
			"token",
			"secret",
			"Security key",
			firefoxOrigin,
			"vault.example.com",
		);
		expect(apiClient.webauthnVerifyInit).toHaveBeenCalledWith(
			"token",
			"secret",
			firefoxOrigin,
			"vault.example.com",
			false,
		);
	});

	it("preserves the page origin for web clients", async () => {
		testGlobals.TARGET = "webclient";
		jest.spyOn(store, "getStore").mockReturnValue({
			getState: () => ({
				user: { token: "token", sessionSecretKey: "secret" },
			}),
		} as unknown as ReturnType<typeof store.getStore>);
		jest.spyOn(apiClient, "webauthnVerifyInit").mockResolvedValue({
			data: { options: {} },
		} as Awaited<ReturnType<typeof apiClient.webauthnVerifyInit>>);

		await webauthn.verifyWebauthnInit();

		expect(apiClient.webauthnVerifyInit).toHaveBeenCalledWith(
			"token",
			"secret",
			window.location.origin,
			undefined,
			false,
		);
	});
});

describe("Shared WebAuthn credentials and automatic Chromium compatibility", () => {
	const originalTarget = testGlobals.TARGET;
	const originalCredentials = Object.getOwnPropertyDescriptor(
		navigator,
		"credentials",
	);
	const chromeOrigin = "chrome-extension://eljmjmgjkbmpmfljlmklcfineebidmlo";
	const state = {
		user: { token: "token", sessionSecretKey: "secret" },
		server: { webClient: "https://vault.example.com/psono/" },
	};
	const shared: WebauthnVerificationOptions = {
		options: {
			challenge: "shared-challenge",
			rpId: "vault.example.com",
			allowCredentials: [{ id: "c2hhcmVk", type: "public-key" }],
		},
		legacy_available: true,
	};
	const legacy: WebauthnVerificationOptions = {
		options: {
			challenge: "legacy-challenge",
			rpId: "eljmjmgjkbmpmfljlmklcfineebidmlo",
			allowCredentials: [{ id: "bGVnYWN5", type: "public-key" }],
		},
	};
	let getCredential: jest.Mock;

	beforeEach(() => {
		testGlobals.TARGET = "chrome";
		state.user.token = "token";
		jest.spyOn(store, "getStore").mockReturnValue({
			getState: () => state,
		} as unknown as ReturnType<typeof store.getStore>);
		jest.spyOn(helper, "parseUrl").mockReturnValue({
			base_url: chromeOrigin,
		} as ReturnType<typeof helper.parseUrl>);
		jest
			.spyOn(apiClient, "webauthnVerifyInit")
			.mockResolvedValue({ data: legacy });
		getCredential = jest.fn();
		Object.defineProperty(navigator, "credentials", {
			configurable: true,
			value: { get: getCredential },
		});
	});

	afterEach(() => {
		if (originalCredentials) {
			Object.defineProperty(navigator, "credentials", originalCredentials);
		} else {
			Reflect.deleteProperty(navigator, "credentials");
		}
		testGlobals.TARGET = originalTarget;
		jest.restoreAllMocks();
	});

	it("requests the webclient RP ID from Chrome while keeping the extension origin", async () => {
		jest.spyOn(apiClient, "createWebauthn").mockResolvedValue({
			data: { id: "credential", options: {} },
		} as Awaited<ReturnType<typeof apiClient.createWebauthn>>);
		await webauthn.createWebauthn("Shared key");
		await webauthn.verifyWebauthnInit();
		expect(apiClient.createWebauthn).toHaveBeenCalledWith(
			"token",
			"secret",
			"Shared key",
			chromeOrigin,
			"vault.example.com",
		);
		expect(apiClient.webauthnVerifyInit).toHaveBeenCalledWith(
			"token",
			"secret",
			chromeOrigin,
			"vault.example.com",
			false,
		);
	});

	it("uses the shared credential without a second ceremony when it succeeds", async () => {
		const credential = { id: "shared" };
		getCredential.mockResolvedValue(credential);
		await expect(webauthn.getCredential(shared)).resolves.toBe(credential);
		expect(getCredential).toHaveBeenCalledTimes(1);
		expect(getCredential).toHaveBeenCalledWith({
			publicKey: {
				...shared.options,
				challenge: new TextEncoder().encode("shared-challenge"),
				allowCredentials: [
					{ id: new TextEncoder().encode("shared").buffer, type: "public-key" },
				],
			},
		});
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});

	it.each([
		"NotAllowedError",
		"NotSupportedError",
		"SecurityError",
	])("automatically tries the legacy scope once after %s", async (name) => {
		const credential = { id: "legacy" };
		getCredential
			.mockRejectedValueOnce(new DOMException("Shared scope unavailable", name))
			.mockResolvedValueOnce(credential);
		await expect(webauthn.getCredential(shared)).resolves.toBe(credential);
		expect(apiClient.webauthnVerifyInit).toHaveBeenCalledWith(
			"token",
			"secret",
			chromeOrigin,
			"vault.example.com",
			true,
		);
		expect(getCredential).toHaveBeenCalledTimes(2);
		expect(getCredential.mock.calls[1][0].publicKey.rpId).toBe(
			legacy.options.rpId,
		);
	});

	it("does not loop when the legacy ceremony also fails", async () => {
		const error = new DOMException(
			"No credential available",
			"NotAllowedError",
		);
		getCredential.mockRejectedValue(error);
		await expect(webauthn.getCredential(shared)).rejects.toBe(error);
		expect(getCredential).toHaveBeenCalledTimes(2);
		expect(apiClient.webauthnVerifyInit).toHaveBeenCalledTimes(1);
	});

	it("accepts an old server's extension-scoped options without compatibility metadata", async () => {
		const credential = { id: "legacy" };
		getCredential.mockResolvedValue(credential);
		await expect(webauthn.getCredential(legacy)).resolves.toBe(credential);
		expect(getCredential.mock.calls[0][0].publicKey.rpId).toBe(
			legacy.options.rpId,
		);
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});

	it("does not fall back when no legacy credential is registered", async () => {
		const error = new DOMException("Cancelled", "NotAllowedError");
		getCredential.mockRejectedValue(error);
		await expect(
			webauthn.getCredential({ ...shared, legacy_available: false }),
		).rejects.toBe(error);
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});

	it("does not treat unexpected browser errors as a legacy-scope failure", async () => {
		const error = new TypeError("Malformed options");
		getCredential.mockRejectedValue(error);
		await expect(webauthn.getCredential(shared)).rejects.toBe(error);
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});

	it("does not restart a prompt after logout", async () => {
		const error = new DOMException("Cancelled", "NotAllowedError");
		getCredential.mockImplementationOnce(async () => {
			state.user.token = "";
			throw error;
		});
		await expect(webauthn.getCredential(shared)).rejects.toBe(error);
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});

	it("does not start a credential prompt after the login screen was cancelled", async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			webauthn.getCredential(shared, controller.signal),
		).rejects.toMatchObject({ name: "AbortError" });
		expect(getCredential).not.toHaveBeenCalled();
	});

	it("does not fall back after the login screen aborts a pending ceremony", async () => {
		const controller = new AbortController();
		const error = new DOMException("Cancelled", "NotAllowedError");
		getCredential.mockImplementationOnce(async () => {
			controller.abort();
			throw error;
		});
		await expect(
			webauthn.getCredential(shared, controller.signal),
		).rejects.toBe(error);
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});

	it("does not restart a prompt if the account changes during fallback initialization", async () => {
		const error = new DOMException("Cancelled", "NotAllowedError");
		getCredential.mockRejectedValueOnce(error);
		jest
			.mocked(apiClient.webauthnVerifyInit)
			.mockImplementationOnce(async () => {
				state.user.token = "another-account-token";
				return { data: legacy };
			});
		await expect(webauthn.getCredential(shared)).rejects.toBe(error);
		expect(getCredential).toHaveBeenCalledTimes(1);
	});

	it("does not use the Chromium fallback in Firefox", async () => {
		testGlobals.TARGET = "firefox";
		const error = new DOMException("Cancelled", "NotAllowedError");
		getCredential.mockRejectedValue(error);
		await expect(webauthn.getCredential(shared)).rejects.toBe(error);
		expect(apiClient.webauthnVerifyInit).not.toHaveBeenCalled();
	});
});
