import browserClient from "./browser-client";
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
		testGlobals.TARGET = originalTarget;
		testGlobals.browser = originalBrowser;
		testGlobals.chrome = originalChrome;
		window.history.replaceState({}, "", originalUrl);
	});

	it("sends Chrome messages only to the specified frame", () => {
		const sendMessage = jest.fn();
		testGlobals.TARGET = "chrome";
		testGlobals.chrome = { tabs: { sendMessage } } as unknown as typeof chrome;

		browserClient.emitFrame(42, 7, "fillpassword", { password: "secret" });

		expect(sendMessage).toHaveBeenCalledWith(
			42,
			{ event: "fillpassword", data: { password: "secret" } },
			{ frameId: 7 },
		);
	});

	it("passes the callback to Chrome frame messages", () => {
		const callback = jest.fn();
		const sendMessage = jest.fn();
		testGlobals.TARGET = "chrome";
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

	it("includes SSO state in browser extension return URLs", () => {
		testGlobals.TARGET = "chrome";

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

	it("updates a specific Chrome tab", async () => {
		const update = jest.fn(
			(
				_tabId: number,
				_options: chrome.tabs.UpdateProperties,
				callback: () => void,
			) => callback(),
		);
		testGlobals.TARGET = "chrome";
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
});
