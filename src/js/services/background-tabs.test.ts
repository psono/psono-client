import { createStore } from "redux";
import type { PasswordLeaf } from "../../types/datastore";
import rootReducer from "../reducers";
import i18n from "../i18n";
import background from "./background";
import browser from "./browser";
import browserClient from "./browser-client";
import storage from "./storage";
import * as storeService from "./store";

jest.mock("./browser", () => ({
	__esModule: true,
	default: {
		runtime: { onMessage: { addListener: jest.fn() } },
		tabs: {
			onActivated: { addListener: jest.fn() },
			onUpdated: { addListener: jest.fn() },
			onCreated: { addListener: jest.fn() },
			onRemoved: { addListener: jest.fn() },
			get: jest.fn(),
			query: jest.fn(),
		},
	},
}));

describe("background badge tab switches", () => {
	// Chrome supports callback overloads as well as the Promise signatures that
	// jest.mocked infers from its types. These handlers use the callback API.
	const getTab = browser.tabs.get as unknown as jest.Mock<
		void,
		[number, (tab: chrome.tabs.Tab) => void]
	>;
	const queryTabs = browser.tabs.query as unknown as jest.Mock<
		void,
		[chrome.tabs.QueryInfo, (tabs: chrome.tabs.Tab[]) => void]
	>;
	const firstTab = { id: 1, url: "https://first.example/login", active: true };
	const secondTab = {
		id: 2,
		url: "https://second.example/login",
		active: true,
	};
	const entries: PasswordLeaf[] = [
		"first.example",
		"first.example",
		"second.example",
	].map((urlfilter, index) => ({
		key: `secret-${index}`,
		secret_id: `secret-${index}`,
		secret_key: "key",
		type: "website_password",
		urlfilter,
	}));
	const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

	beforeEach(() => {
		Object.defineProperty(globalThis, "chrome", {
			configurable: true,
			value: browser,
		});
		const state = rootReducer(undefined, { type: "@@INIT" });
		state.user.isLoggedIn = true;
		jest
			.spyOn(storeService, "getStore")
			.mockReturnValue(createStore(rootReducer, state));
		jest
			.spyOn(browserClient, "disableBrowserPasswordSaving")
			.mockResolvedValue(undefined);
		jest
			.spyOn(browserClient, "registerAuthRequiredListener")
			.mockImplementation(() => {});
		jest.spyOn(browserClient, "setIcon").mockImplementation(() => {});
		jest.spyOn(browserClient, "setBadgeText").mockImplementation(() => {});
		jest.spyOn(browserClient, "getActiveTab").mockResolvedValue(firstTab);
		jest.spyOn(storage, "keys").mockResolvedValue(["secret"]);
		jest
			.spyOn(storage, "where")
			.mockImplementation(async (_db, filter) =>
				entries.filter((entry) => filter(entry)),
			);
		jest
			.spyOn(globalThis, "setInterval")
			.mockReturnValue(0 as unknown as ReturnType<typeof setInterval>);
		jest.spyOn(i18n, "on").mockImplementation(() => {});
		queryTabs.mockImplementation((_query, callback) => {
			callback([]);
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
		delete (globalThis as { chrome?: unknown }).chrome;
	});

	it("refreshes for the new tab before its tabs.get callback, ignoring an old active-tab lookup", async () => {
		let finishOldLookup!: (tab: typeof firstTab) => void;
		jest
			.mocked(browserClient.getActiveTab)
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						finishOldLookup = resolve;
					}),
			)
			.mockResolvedValue(secondTab);
		let finishTabGet!: () => void;
		getTab.mockImplementation((_id, callback) => {
			finishTabGet = () => callback?.(secondTab as chrome.tabs.Tab);
		});
		background.activateAfterStore();
		const activated = jest.mocked(browser.tabs.onActivated.addListener).mock
			.calls[0][0];

		activated({ tabId: secondTab.id, windowId: 1 });
		finishOldLookup(firstTab);
		await settle();
		finishTabGet();
		await settle();

		expect(browserClient.setBadgeText).toHaveBeenLastCalledWith("1");
	});

	it("changes the count on tab switches without reloading and ignores background tab loads", async () => {
		getTab.mockImplementation((id, callback) => {
			callback?.(
				(id === firstTab.id ? firstTab : secondTab) as chrome.tabs.Tab,
			);
		});
		background.activateAfterStore();
		const activated = jest.mocked(browser.tabs.onActivated.addListener).mock
			.calls[0][0];
		const updated = jest.mocked(browser.tabs.onUpdated.addListener).mock
			.calls[0][0];
		await settle();
		expect(browserClient.setBadgeText).toHaveBeenLastCalledWith("2");

		jest.mocked(browserClient.getActiveTab).mockResolvedValue(secondTab);
		activated({ tabId: secondTab.id, windowId: 1 });
		await settle();
		expect(browserClient.setBadgeText).toHaveBeenLastCalledWith("1");

		updated(firstTab.id, { status: "complete" }, {
			...firstTab,
			active: false,
		} as chrome.tabs.Tab);
		await settle();
		expect(browserClient.setBadgeText).toHaveBeenLastCalledWith("1");

		jest.mocked(browserClient.getActiveTab).mockResolvedValue(firstTab);
		activated({ tabId: firstTab.id, windowId: 1 });
		await settle();
		expect(browserClient.setBadgeText).toHaveBeenLastCalledWith("2");
	});
});
