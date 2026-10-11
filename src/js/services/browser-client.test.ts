import browserClient from "./browser-client";
import device from "./device";
import notification from "./notification";
import * as storeService from "./store";
import type { AppState } from "../../types/state";
import type { FirefoxBrowser } from "../../types/browser";

// Tests replace only the extension APIs exercised by each target.
const testGlobals = globalThis as unknown as {
	TARGET: typeof TARGET;
	browser: FirefoxBrowser;
	chrome: typeof chrome;
};

describe("Service: browser client test suite", () => {
	const originalTarget = testGlobals.TARGET;
	const originalBrowser = testGlobals.browser;
	const originalChrome = testGlobals.chrome;
	const originalUrl = window.location.href;

	afterEach(() => {
		jest.restoreAllMocks();
		browserClient.clearConfigCache();
		testGlobals.TARGET = originalTarget;
		testGlobals.browser = originalBrowser;
		testGlobals.chrome = originalChrome;
		window.history.replaceState({}, "", originalUrl);
	});

	it.each([
		"chrome",
		"safari",
	] as const)("sends %s messages only to the specified frame", (target) => {
		const sendMessage = jest.fn();
		testGlobals.TARGET = target;
		testGlobals.chrome = { tabs: { sendMessage } } as unknown as typeof chrome;

		browserClient.emitFrame(42, 7, "fillpassword", { password: "secret" });

		expect(sendMessage).toHaveBeenCalledWith(
			42,
			{ event: "fillpassword", data: { password: "secret" } },
			{ frameId: 7 },
		);
	});

	it.each([
		"chrome",
		"safari",
	] as const)("passes the callback to %s frame messages", (target) => {
		const callback = jest.fn();
		const sendMessage = jest.fn();
		testGlobals.TARGET = target;
		testGlobals.chrome = { tabs: { sendMessage } } as unknown as typeof chrome;

		browserClient.emitFrame(42, 0, "get-username", {}, callback);

		expect(sendMessage).toHaveBeenCalledWith(
			42,
			{ event: "get-username", data: {} },
			{ frameId: 0 },
			callback,
		);
	});

	it("sends Firefox messages only to the specified frame", async () => {
		const response = { username: "user" };
		const callback = jest.fn();
		const sendMessage = jest.fn(() => Promise.resolve(response));
		testGlobals.TARGET = "firefox";
		testGlobals.browser = {
			tabs: { sendMessage },
		} as unknown as FirefoxBrowser;

		browserClient.emitFrame(42, 7, "get-username", {}, callback);
		await Promise.resolve();

		expect(sendMessage).toHaveBeenCalledWith(
			42,
			{ event: "get-username", data: {} },
			{ frameId: 7 },
		);
		expect(callback).toHaveBeenCalledWith(response);
	});

	it.each([
		"chrome",
		"firefox",
		"safari",
	] as const)("includes SSO state in %s extension return URLs", (target) => {
		testGlobals.TARGET = target;

		expect(browserClient.getSamlReturnToUrl("saml-state")).toBe(
			"https://psono.com/redirect#!/saml/token/saml-state/",
		);
		expect(browserClient.getOidcReturnToUrl("oidc-state")).toBe(
			"https://psono.com/redirect#!/oidc/token/oidc-state/",
		);
	});

	it.each([
		["/index.html", "/index.html"],
		["/psono/index.html", "/psono/index.html"],
		["/psono/", "/psono/index.html"],
		[
			"/psono/index.html?next=https://other.example/path#!/login",
			"/psono/index.html",
		],
	])("includes SSO state in web-client return URLs from %s", (page, callback) => {
		testGlobals.TARGET = "webclient";
		window.history.replaceState({}, "", page);

		expect(browserClient.getSamlReturnToUrl("saml-state")).toBe(
			`${window.location.origin}${callback}#!/saml/token/saml-state/`,
		);
		expect(browserClient.getOidcReturnToUrl("oidc-state")).toBe(
			`${window.location.origin}${callback}#!/oidc/token/oidc-state/`,
		);
	});

	it.each([
		"chrome",
		"safari",
	] as const)("updates a specific %s tab", async (target) => {
		const update = jest.fn(
			(
				_tabId: number,
				_options: chrome.tabs.UpdateProperties,
				callback: () => void,
			) => callback(),
		);
		testGlobals.TARGET = target;
		testGlobals.chrome = { tabs: { update } } as unknown as typeof chrome;

		await browserClient.replaceTabUrlInTab(42, "/data/index.html#!/");

		expect(update).toHaveBeenCalledWith(
			42,
			{ url: "/data/index.html#!/" },
			expect.any(Function),
		);
	});

	it("updates a specific Firefox tab", async () => {
		const update = jest.fn(() => Promise.resolve());
		testGlobals.TARGET = "firefox";
		testGlobals.browser = { tabs: { update } } as unknown as FirefoxBrowser;

		await browserClient.replaceTabUrlInTab(42, "/data/index.html#!/");

		expect(update).toHaveBeenCalledWith(42, {
			url: "/data/index.html#!/",
		});
	});

	it("recognizes Safari as an extension and uses its runtime URL scheme", async () => {
		testGlobals.TARGET = "safari";
		testGlobals.chrome = {
			runtime: {
				getURL: (path: string) => `safari-web-extension://installation/${path}`,
			},
		} as unknown as typeof chrome;
		expect(device.isWebclient()).toBe(false);
		expect(browserClient.getClientType()).toBe("safari_extension");
		expect(await browserClient.getBaseUrl()).toBe(
			"safari-web-extension://installation/data/",
		);
		expect(browserClient.getURL("data/index.html")).toBe(
			"safari-web-extension://installation/data/index.html",
		);
	});

	it("loads Safari configuration without accessing unsupported managed storage", async () => {
		testGlobals.TARGET = "safari";
		testGlobals.chrome = {} as typeof chrome;
		jest.spyOn(storeService, "getStore").mockReturnValue({
			getState: () =>
				({
					persistent: {
						remoteConfigJson: { allow_registration: false },
						knownHosts: [],
					},
				}) as unknown as AppState,
		} as ReturnType<typeof storeService.getStore>);
		const config = await browserClient.getConfig();
		expect(config.allow_registration).toBe(false);
		expect(config.base_url).toBe("https://www.psono.pw/");
		expect(config.backend_servers[0].url).toBe("https://www.psono.pw/server");
	});

	it("does not access unsupported Safari privacy, authentication or notification APIs", async () => {
		testGlobals.TARGET = "safari";
		testGlobals.chrome = {} as typeof chrome;
		testGlobals.browser = {} as FirefoxBrowser;
		const infoSend = jest
			.spyOn(notification, "infoSend")
			.mockImplementation(() => {});
		expect(await browserClient.passwordSavingControlledByThisExtension()).toBe(
			false,
		);
		expect(await browserClient.disableBrowserPasswordSaving()).toBe(false);
		expect(() =>
			browserClient.registerAuthRequiredListener(jest.fn()),
		).not.toThrow();
		expect(() => browserClient.notify("test")).not.toThrow();
		expect(infoSend).toHaveBeenCalledWith("test");
	});
});
