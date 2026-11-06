import type {
	MessageRequest,
	MessageSender,
	SendResponse,
} from "../types/browser";

jest.mock("redux-persist", () => ({ persistStore: jest.fn() }));
jest.mock("./services/background", () => ({
	__esModule: true,
	default: {
		activate: jest.fn(),
		activateAfterStore: jest.fn(),
		watchBrowserActionState: jest.fn(),
		onTabActivated: jest.fn(),
		onTabUpdated: jest.fn(),
		onWindowFocusChanged: jest.fn(),
		onMessage: jest.fn(),
	},
}));
jest.mock("./services/store", () => ({
	initStore: jest.fn(),
	registerPersistor: jest.fn(),
}));
jest.mock("./services/vault-lock", () => ({
	__esModule: true,
	default: {
		getAccountId: () => "alice",
		completeInitialization: jest.fn(),
	},
}));

describe("Chrome worker message startup", () => {
	let listener: (
		request: MessageRequest,
		sender: MessageSender,
		respond: SendResponse,
	) => boolean;
	let finishInitialization: (store: object) => void;
	let background: typeof import("./services/background")["default"];
	let channel: BroadcastChannel;
	const store = { dispatch: jest.fn((action) => action()) };

	beforeEach(() => {
		jest.resetModules();
		Object.defineProperty(globalThis, "chrome", {
			configurable: true,
			value: {
				runtime: {
					onMessage: {
						addListener: jest.fn((handler) => {
							listener = handler;
						}),
					},
				},
				tabs: {
					onActivated: { addListener: jest.fn() },
					onUpdated: { addListener: jest.fn() },
				},
				windows: { onFocusChanged: { addListener: jest.fn() } },
			},
		});
		jest.spyOn(globalThis, "BroadcastChannel").mockImplementation(() => {
			channel = {
				onmessage: null,
				postMessage: jest.fn(),
				close: jest.fn(),
			} as unknown as BroadcastChannel;
			return channel;
		});
		background = require("./services/background").default;
		require("./services/store").initStore.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishInitialization = resolve;
				}),
		);
		require("redux-persist").persistStore.mockImplementation(
			(_store: object, _options: unknown, ready: () => void) => {
				ready();
				return { getState: () => ({ bootstrapped: true }) };
			},
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		delete (globalThis as { chrome?: unknown }).chrome;
	});

	it.each([
		{ event: "status", data: "locked" },
		{
			event: "website-password-update",
			data: [{ secret_id: "secret", name: "Example" }],
		},
	])("keeps the first refresh port open until initialization completes (%s)", async (response) => {
		require("./background-chrome");
		expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
		const request = {
			event: "website-password-refresh",
			data: "https://example.com/",
		};
		const sender = { tab: { id: 42, url: "https://example.com/" } };
		const respond = jest.fn();
		jest
			.spyOn(background, "onMessage")
			.mockImplementation((_request, _sender, sendResponse) => {
				sendResponse(response);
				return false;
			});

		expect(listener(request, sender, respond)).toBe(true);
		expect(respond).not.toHaveBeenCalled();
		await new Promise((resolve) => setTimeout(resolve, 0));
		finishInitialization(store);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(background.onMessage).toHaveBeenCalledWith(request, sender, respond);
		expect(respond).toHaveBeenCalledTimes(1);
		expect(respond).toHaveBeenCalledWith(response);
	});

	it("waits for account reinitialization without registering another listener", async () => {
		require("./background-chrome");
		await new Promise((resolve) => setTimeout(resolve, 0));
		finishInitialization(store);
		await new Promise((resolve) => setTimeout(resolve, 0));
		channel.onmessage!({
			data: { event: "reinitialize-background" },
		} as MessageEvent);
		const respond = jest.fn();
		expect(
			listener({ event: "is-logged-in", data: undefined }, {}, respond),
		).toBe(true);
		expect(background.onMessage).not.toHaveBeenCalled();
		await new Promise((resolve) => setTimeout(resolve, 0));
		finishInitialization(store);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(background.onMessage).toHaveBeenCalledTimes(1);
		expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
		expect(background.activateAfterStore).toHaveBeenCalledTimes(1);
		expect(background.watchBrowserActionState).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.onActivated.addListener).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledTimes(1);
	});

	it("registers tab-switch wake-up listeners before hydration and handles the switch without a popup message", async () => {
		require("./background-chrome");
		expect(chrome.tabs.onActivated.addListener).toHaveBeenCalledTimes(1);
		expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalledTimes(1);
		expect(chrome.windows.onFocusChanged.addListener).toHaveBeenCalledTimes(1);
		const activated = jest.mocked(chrome.tabs.onActivated.addListener).mock
			.calls[0][0];
		const activeInfo = { tabId: 42, windowId: 1 };
		activated(activeInfo);
		expect(background.onTabActivated).not.toHaveBeenCalled();
		await new Promise((resolve) => setTimeout(resolve, 0));
		finishInitialization(store);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(background.onTabActivated).toHaveBeenCalledWith(activeInfo);
		expect(background.onMessage).not.toHaveBeenCalled();
	});

	it("answers with an error if worker initialization fails", async () => {
		jest.spyOn(console, "error").mockImplementation(() => {});
		require("./services/store").initStore.mockRejectedValueOnce(
			new Error("Vault initialization failed"),
		);
		require("./background-chrome");
		const respond = jest.fn();
		expect(
			listener({ event: "is-logged-in", data: undefined }, {}, respond),
		).toBe(true);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(background.onMessage).not.toHaveBeenCalled();
		expect(respond).toHaveBeenCalledTimes(1);
		expect(respond).toHaveBeenCalledWith({
			error: "Vault initialization failed",
		});
	});

	it("leaves offscreen messages to their owning document", () => {
		require("./background-chrome");
		for (const event of [
			"get-offline-cache-encryption-key-offscreen",
			"set-offline-cache-encryption-key-offscreen",
		]) {
			const respond = jest.fn();
			expect(listener({ event, data: undefined }, {}, respond)).toBe(false);
			expect(respond).not.toHaveBeenCalled();
		}
	});
});
