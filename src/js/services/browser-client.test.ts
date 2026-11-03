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

	it.each([
		[
			"index.html#!/datastore/edit/website_password/secret-id",
			"http://localhost/data/index.html#!/datastore/edit/website_password/secret-id",
		],
		["https://example.com/login", "https://example.com/login"],
	])("opens Safari popup link %s as a tab", async (url, expectedUrl) => {
		testGlobals.TARGET = "safari";
		window.history.replaceState({}, "", "/data/default_popup.html");
		const create = jest.fn((_options, callback) => callback());
		const open = jest.spyOn(window, "open").mockImplementation(() => null);
		testGlobals.chrome = {
			tabs: { create },
			runtime: {},
		} as unknown as typeof chrome;

		await expect(browserClient.openTab(url)).resolves.toBeNull();

		expect(create).toHaveBeenCalledWith(
			{ url: expectedUrl },
			expect.any(Function),
		);
		expect(open).not.toHaveBeenCalled();
	});

	afterEach(() => {
		jest.restoreAllMocks();
		browserClient.clearConfigCache();
		testGlobals.TARGET = originalTarget;
		testGlobals.browser = originalBrowser;
		testGlobals.chrome = originalChrome;
		window.history.replaceState({}, "", originalUrl);
	});

	it.each([
		"javascript:alert(1)",
		"javascript://example.com/%0aalert(1)",
		"JaVaScRiPt:alert(1)",
		" \tjava\nscript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"vbscript:msgbox(1)",
	])("opens a blank tab instead of an unsafe URL: %s", async (url) => {
		const open = jest.spyOn(window, "open").mockReturnValue(null);

		await browserClient.openTab(url);

		expect(open).toHaveBeenCalledTimes(1);
		expect(open).toHaveBeenCalledWith("about:blank", "_blank");
	});

	it.each([
		"https://example.com/login",
		"http://example.com/login",
		"mailto:user@example.com",
		"https://www.elster.de/eportal/login/softpse",
		"register.html",
		"lost-password.html",
		"delete-user.html",
		"logout-success.html",
		"index.html",
		"index.html#!/datastore/edit/website_password/example-id",
		"index.html#!/account/change-password",
		"enforce-two-fa.html",
		"key-transfer.html",
		"open-secret.html#!/secret/website_password/example-id",
		"download-file.html#!/file/download/example-id",
	])("opens a valid URL unchanged: %s", async (url) => {
		const newWindow = {} as Window;
		const open = jest.spyOn(window, "open").mockReturnValue(newWindow);

		await expect(browserClient.openTab(url)).resolves.toBe(newWindow);

		expect(open).toHaveBeenCalledTimes(1);
		expect(open).toHaveBeenCalledWith(url, "_blank");
	});

	it("resolves to null when the browser blocks a new tab", async () => {
		jest.spyOn(window, "open").mockReturnValue(null);

		await expect(
			browserClient.openTab("https://example.com/login"),
		).resolves.toBeNull();
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

	describe("writeToClipboard", () => {
		let write: jest.Mock;
		let writeText: jest.Mock;
		let hasFocus: jest.SpyInstance;
		let clipboardItems: Array<Record<string, Promise<Blob>>>;
		const originalClipboardItem = (globalThis as { ClipboardItem?: unknown })
			.ClipboardItem;

		beforeEach(() => {
			jest.spyOn(device, "isSafari").mockReturnValue(false);
			hasFocus = jest.spyOn(document, "hasFocus").mockReturnValue(true);
			write = jest.fn().mockResolvedValue(undefined);
			writeText = jest.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, "clipboard", {
				value: { write, writeText },
				configurable: true,
			});
			clipboardItems = [];
			(globalThis as { ClipboardItem?: unknown }).ClipboardItem = class {
				constructor(items: Record<string, Promise<Blob>>) {
					clipboardItems.push(items);
				}
			};
		});

		afterEach(() => {
			(globalThis as { ClipboardItem?: unknown }).ClipboardItem =
				originalClipboardItem;
		});

		it("hands the pending content to the browser while the popup has focus", async () => {
			let resolveContent: (content: string) => void = () => {};
			const pending = new Promise<string>((resolve) => {
				resolveContent = resolve;
			});

			const result = browserClient.writeToClipboard(() => pending);

			expect(write).toHaveBeenCalledTimes(1);
			// the focus may be lost before the content arrives, the write was already handed over
			hasFocus.mockReturnValue(false);
			resolveContent("secret");
			await result;
			const blob = await clipboardItems[0]["text/plain"];
			expect(blob.type).toBe("text/plain");
			expect(blob.size).toBe("secret".length);
			expect(writeText).not.toHaveBeenCalled();
		});

		it("falls back to writeText if the browser rejects the clipboard item", async () => {
			write.mockRejectedValue(new Error("NotAllowedError"));

			await browserClient.writeToClipboard(() => Promise.resolve("secret"));

			expect(writeText).toHaveBeenCalledWith("secret");
		});

		it("still skips the write if the popup has no focus when copying", async () => {
			hasFocus.mockReturnValue(false);

			await browserClient.writeToClipboard(() => Promise.resolve("secret"));

			expect(write).not.toHaveBeenCalled();
			expect(writeText).not.toHaveBeenCalled();
		});

		it("rejects if the content cannot be loaded", async () => {
			const error = { errors: ["SERVER_OFFLINE"] };
			write.mockImplementation(async ([item]) => {
				await (item as unknown as { items: Promise<Blob> }).items;
			});
			(globalThis as { ClipboardItem?: unknown }).ClipboardItem = class {
				items: Promise<Blob>;
				constructor(items: Record<string, Promise<Blob>>) {
					this.items = items["text/plain"];
				}
			};

			await expect(
				browserClient.writeToClipboard(() => Promise.reject(error)),
			).rejects.toBe(error);
			expect(writeText).not.toHaveBeenCalled();
		});
	});
});
