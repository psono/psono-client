import { createStore } from "redux";
import type { PasswordLeaf } from "../../types/datastore";
import rootReducer from "../reducers";
import i18n from "../i18n";
import background from "./background";
import browser from "./browser";
import browserClient from "./browser-client";
import storage from "./storage";
import * as storeService from "./store";
import user from "./user";
import vaultLock, * as vaultLockService from "./vault-lock";

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

describe("background tabs", () => {
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

	describe("logout on browser close", () => {
		beforeEach(() => {
			jest.spyOn(user, "logout").mockResolvedValue({ response: "success" });
			jest.spyOn(vaultLock, "getConfiguration").mockReturnValue(undefined);
			jest
				.spyOn(vaultLockService, "lockAllSessions")
				.mockImplementation(() => {});
		});

		const removalListener = () => {
			background.activateAfterStore();
			return jest.mocked(browser.tabs.onRemoved.addListener).mock.calls[0][0];
		};

		it("keeps the session with tabs in other windows and logs out only after the last tab closes", () => {
			let tabs = Array.from({ length: 11 }, (_, id) => ({
				id,
				windowId: id < 3 ? 1 : 2,
			})) as chrome.tabs.Tab[];
			queryTabs.mockImplementation((query, callback) => {
				callback(
					query.currentWindow ? tabs.filter((tab) => tab.windowId === 1) : tabs,
				);
			});
			const removed = removalListener();
			for (const tabId of [3, 4, 5]) {
				tabs = tabs.filter((tab) => tab.id !== tabId);
				removed(tabId, { windowId: 2, isWindowClosing: false });
			}
			expect(user.logout).not.toHaveBeenCalled();
			expect(vaultLockService.lockAllSessions).not.toHaveBeenCalled();

			for (const tab of [...tabs]) {
				expect(user.logout).not.toHaveBeenCalled();
				tabs = tabs.filter((remaining) => remaining.id !== tab.id);
				removed(tab.id!, { windowId: tab.windowId, isWindowClosing: true });
			}
			expect(user.logout).toHaveBeenCalledTimes(1);
			expect(vaultLockService.lockAllSessions).not.toHaveBeenCalled();
		});

		it("preserves trusted sessions without making later untrusted close detection drift", () => {
			const state = storeService.getStore().getState();
			state.user.trustDevice = true;
			let tabs = [1, 2, 3].map((id) => ({
				id,
				windowId: id === 1 ? 1 : 2,
			})) as chrome.tabs.Tab[];
			queryTabs.mockImplementation((query, callback) => {
				callback(
					query.currentWindow ? tabs.filter((tab) => tab.windowId === 1) : tabs,
				);
			});
			const removed = removalListener();
			for (const tab of [...tabs]) {
				tabs = tabs.filter((remaining) => remaining.id !== tab.id);
				removed(tab.id!, { windowId: tab.windowId, isWindowClosing: true });
			}
			expect(user.logout).not.toHaveBeenCalled();
			expect(vaultLockService.lockAllSessions).not.toHaveBeenCalled();

			const newTab = { id: 4, windowId: 3 } as chrome.tabs.Tab;
			tabs = [newTab];
			for (const [created] of jest.mocked(browser.tabs.onCreated.addListener)
				.mock.calls) {
				created(newTab);
			}
			state.user.trustDevice = false;
			tabs = [];
			removed(newTab.id!, { windowId: newTab.windowId, isWindowClosing: true });
			expect(user.logout).toHaveBeenCalledTimes(1);
		});

		it("locks instead of logging out when vault locking is enabled", () => {
			jest.spyOn(vaultLock, "getConfiguration").mockReturnValue({
				enabled: true,
			} as ReturnType<typeof vaultLock.getConfiguration>);
			const removed = removalListener();
			removed(1, { windowId: 1, isWindowClosing: true });
			expect(vaultLockService.lockAllSessions).toHaveBeenCalledTimes(1);
			expect(user.logout).not.toHaveBeenCalled();
		});

		it("does not treat a failed tab query as an empty browser", () => {
			const removed = removalListener();
			queryTabs.mockImplementation((_query, callback) => {
				Object.defineProperty(browser.runtime, "lastError", {
					configurable: true,
					value: { message: "Tab query failed" },
				});
				try {
					callback([]);
				} finally {
					delete browser.runtime.lastError;
				}
			});
			removed(1, { windowId: 1, isWindowClosing: true });
			expect(user.logout).not.toHaveBeenCalled();
			expect(vaultLockService.lockAllSessions).not.toHaveBeenCalled();
		});
	});
});
