import browserClient from "./browser-client";

describe("Service: browser client test suite", () => {
	const originalTarget = global.TARGET;
	const originalBrowser = global.browser;
	const originalChrome = global.chrome;
	const originalUrl = window.location.href;

	afterEach(() => {
		global.TARGET = originalTarget;
		global.browser = originalBrowser;
		global.chrome = originalChrome;
		window.history.replaceState({}, "", originalUrl);
	});

	it("sends Chrome messages only to the specified frame", () => {
		const sendMessage = jest.fn();
		global.TARGET = "chrome";
		global.chrome = { tabs: { sendMessage } };

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
		global.TARGET = "chrome";
		global.chrome = { tabs: { sendMessage } };

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
		global.TARGET = "firefox";
		global.browser = { tabs: { sendMessage } };

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
		global.TARGET = "chrome";

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
		global.TARGET = "webclient";
		window.history.replaceState({}, "", page);

		expect(browserClient.getSamlReturnToUrl("saml-state")).toBe(
			`${window.location.origin}${callback}#!/saml/token/saml-state/`,
		);
		expect(browserClient.getOidcReturnToUrl("oidc-state")).toBe(
			`${window.location.origin}${callback}#!/oidc/token/oidc-state/`,
		);
	});

	it("updates a specific Chrome tab", async () => {
		const update = jest.fn((_tabId, _options, callback) => callback());
		global.TARGET = "chrome";
		global.chrome = { tabs: { update } };

		await browserClient.replaceTabUrlInTab(42, "/data/index.html#!/");

		expect(update).toHaveBeenCalledWith(
			42,
			{ url: "/data/index.html#!/" },
			expect.any(Function),
		);
	});

	it("updates a specific Firefox tab", async () => {
		const update = jest.fn(() => Promise.resolve());
		global.TARGET = "firefox";
		global.browser = { tabs: { update } };

		await browserClient.replaceTabUrlInTab(42, "/data/index.html#!/");

		expect(update).toHaveBeenCalledWith(42, {
			url: "/data/index.html#!/",
		});
	});
});
