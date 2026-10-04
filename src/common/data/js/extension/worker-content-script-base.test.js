const ClassWorkerContentScriptBase = require("./worker-content-script-base");

describe("content script messaging", () => {
	let runtime;
	let base;

	beforeEach(() => {
		runtime = {
			onMessage: { addListener: jest.fn() },
			sendMessage: jest.fn(),
		};
		base = ClassWorkerContentScriptBase({ runtime }, jest.fn());
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("checks lastError before using a response from a closed message port", () => {
		const lastError = jest.fn(() => ({
			message: "The message port closed before a response was received.",
		}));
		Object.defineProperty(runtime, "lastError", { get: lastError });
		const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
		const callback = jest.fn();
		runtime.sendMessage.mockImplementation((message, respond) => respond());

		base.emit("website-password-refresh", {}, callback);

		expect(lastError).toHaveBeenCalledTimes(1);
		expect(callback).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledWith(
			"Unable to send extension message:",
			"website-password-refresh",
			"The message port closed before a response was received.",
		);
	});

	it("delivers successful responses to callbacks and registered event handlers", () => {
		const response = { event: "website-password-update", data: [] };
		const callback = jest.fn();
		const handler = jest.fn();
		base.on(response.event, handler);
		runtime.sendMessage.mockImplementation((message, respond) =>
			respond(response),
		);

		base.emit("website-password-refresh", {}, callback);

		expect(callback).toHaveBeenCalledWith(response);
		expect(handler).toHaveBeenCalledWith(response.data);
	});

	it.each([undefined, null])("accepts an empty response (%s)", (response) => {
		runtime.sendMessage.mockImplementation((message, respond) =>
			respond(response),
		);
		expect(() => base.emit("notification-bar-ready", {})).not.toThrow();
	});
});
