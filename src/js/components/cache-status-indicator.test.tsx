import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { cacheStatus } from "../services/offline-cache";
import offlineCache from "../services/offline-cache";
import CacheStatusIndicator from "./cache-status-indicator";

let mockOffline = false;
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: jest.fn(),
}));
jest.mock("../services/api-client", () => ({ __esModule: true, default: {} }));
jest.mock("../services/storage", () => ({ __esModule: true, default: {} }));
jest.mock("../services/store", () => ({ getStore: jest.fn() }));
jest.mock("../services/vault-lock", () => ({
	__esModule: true,
	default: { subscribe: () => () => {} },
}));
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) =>
		selector({
			user: { isLoggedIn: true },
			client: { offlineMode: mockOffline },
		}),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			jest.requireActual<Record<string, string>>(
				"../../common/data/translations/locale-en.json",
			)[key] || key,
	}),
}));
jest.mock("../services/device", () => ({
	__esModule: true,
	default: { hasTitlebar: () => false },
}));
jest.mock("../services/offline-cache", () => {
	const actual = jest.requireActual("../services/offline-cache");
	actual.default.incrementalUpdate = jest.fn(async () => {});
	return actual;
});
const theme = createTheme();

describe("cache loading and offline indicator", () => {
	let container: HTMLDivElement;
	let resources: ReturnType<typeof cacheStatus.register>[];
	beforeEach(() => {
		jest.clearAllMocks();
		mockOffline = false;
		resources = [];
		container = document.createElement("div");
		document.body.appendChild(container);
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		for (const resource of resources) resource.dispose();
		container.remove();
	});
	function render() {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<CacheStatusIndicator />
				</ThemeProvider>,
				container,
			);
		});
	}
	function register(kind: "datastore" | "entry", retry?: () => void) {
		const resource = cacheStatus.register(kind, retry);
		resources.push(resource);
		return resource;
	}

	it("is hidden when the client is online and idle", () => {
		render();
		expect(container.querySelector("button")).toBeNull();
	});
	it("shows a spinner while loading and distinguishes entry refresh from datastore refresh", () => {
		render();
		const datastore = register("datastore");
		const entry = register("entry");
		act(() => {
			datastore.update({ refreshing: true, cached: true, offline: false });
		});
		expect(
			container.querySelector('button[aria-label="Refreshing passwords…"]'),
		).not.toBeNull();
		act(() => {
			entry.update({ refreshing: true, cached: true, offline: false });
		});
		expect(
			container.querySelector('button[aria-label="Refreshing entry…"]'),
		).not.toBeNull();
		expect(container.querySelector("[role=progressbar]")).not.toBeNull();
		act(() => {
			entry.dispose();
			datastore.dispose();
		});
		expect(container.querySelector("button")).toBeNull();
	});
	it("explains offline access and retries active loads when requested", async () => {
		const retry = jest.fn();
		const entry = register("entry", retry);
		entry.update({ refreshing: false, cached: true, offline: true });
		render();
		const button = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Offline — using saved data"]',
		)!;
		expect(button).not.toBeNull();
		act(() => button.click());
		expect(document.body.textContent).toContain(
			"changes cannot be saved until you reconnect",
		);
		const retryButton = Array.from(document.querySelectorAll("button")).find(
			(button) => button.textContent === "Retry",
		)!;
		await act(async () => retryButton.click());
		expect(retry).toHaveBeenCalledTimes(1);
		expect(offlineCache.incrementalUpdate).toHaveBeenCalledWith(true);
	});
	it("also indicates fallback responses outside the current browsing loader", () => {
		mockOffline = true;
		render();
		expect(
			container.querySelector(
				'button[aria-label="Offline — using saved data"]',
			),
		).not.toBeNull();
	});
});
