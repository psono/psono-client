import browserClient from "./browser-client";

describe("Service: browser client test suite", () => {
	const originalTarget = global.TARGET;
	const originalBrowser = global.browser;
	const originalChrome = global.chrome;

	afterEach(() => {
		global.TARGET = originalTarget;
		global.browser = originalBrowser;
		global.chrome = originalChrome;
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
});
