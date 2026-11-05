import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import offlineCache from "../../services/offline-cache";
import SettingsOfflineCacheView from "./offline-cache";

let mockDisabledByServer = false;
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) =>
		selector({
			server: { complianceDisableOfflineMode: mockDisabledByServer },
		}),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			jest.requireActual<Record<string, string>>(
				"../../../common/data/translations/locale-en.json",
			)[key] || key,
	}),
}));
jest.mock("../../services/offline-cache", () => ({
	__esModule: true,
	default: {
		canUse: jest.fn(),
		listEndpoints: jest.fn(),
		incrementalUpdate: jest.fn(),
		refreshEndpoint: jest.fn(),
	},
}));
jest.mock("../../services/vault-lock", () => ({
	__esModule: true,
	default: { subscribe: () => () => {} },
}));

const theme = createTheme();
describe("offline cache settings", () => {
	let container: HTMLDivElement;
	beforeEach(() => {
		jest.resetAllMocks();
		mockDisabledByServer = false;
		jest.mocked(offlineCache.canUse).mockReturnValue(true);
		jest.mocked(offlineCache.listEndpoints).mockResolvedValue(["/secret/one/"]);
		jest.mocked(offlineCache.incrementalUpdate).mockResolvedValue(undefined);
		jest.mocked(offlineCache.refreshEndpoint).mockResolvedValue(undefined);
		container = document.createElement("div");
		document.body.appendChild(container);
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});
	async function render() {
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<MemoryRouter>
						<SettingsOfflineCacheView />
					</MemoryRouter>
				</ThemeProvider>,
				container,
			);
		});
	}
	function refreshAll() {
		return Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent === "Refresh offline cache",
		)!;
	}

	it("refreshes the complete cache and disables controls until the update finishes", async () => {
		let finish!: () => void;
		jest.mocked(offlineCache.incrementalUpdate).mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		await render();
		await act(async () => {
			refreshAll().click();
		});
		expect(offlineCache.incrementalUpdate).toHaveBeenCalledWith(true);
		expect(refreshAll().disabled).toBe(true);
		expect(container.querySelector("[role=progressbar]")).not.toBeNull();
		await act(async () => {
			finish();
		});
		expect(refreshAll().disabled).toBe(false);
		expect(container.textContent).toContain(
			"The offline cache has been updated.",
		);
	});

	it("refreshes a single endpoint without downloading the entire cache", async () => {
		await render();
		await act(async () => {
			container
				.querySelector<HTMLButtonElement>(
					'button[aria-label="Refresh: /secret/one/"]',
				)!
				.click();
		});
		expect(offlineCache.refreshEndpoint).toHaveBeenCalledWith("/secret/one/");
		expect(offlineCache.incrementalUpdate).not.toHaveBeenCalled();
		expect(offlineCache.listEndpoints).toHaveBeenCalledTimes(2);
	});

	it("shows refresh errors without a success message", async () => {
		jest
			.mocked(offlineCache.incrementalUpdate)
			.mockRejectedValue(new Error("offline"));
		await render();
		await act(async () => {
			refreshAll().click();
		});
		expect(container.textContent).toContain(
			"The offline cache could not be updated.",
		);
		expect(container.textContent).not.toContain(
			"The offline cache has been updated.",
		);
		expect(refreshAll().disabled).toBe(false);
	});

	it("paginates cached endpoints", async () => {
		jest
			.mocked(offlineCache.listEndpoints)
			.mockResolvedValue(
				Array.from({ length: 12 }, (_, index) => `/secret/${index}/`),
			);
		await render();
		expect(container.textContent).toContain("/secret/0/");
		expect(container.textContent).not.toContain("/secret/11/");
		act(() => {
			container
				.querySelector<HTMLButtonElement>(
					'button[aria-label="Go to next page"]',
				)!
				.click();
		});
		expect(container.textContent).toContain("/secret/11/");
	});

	it("honors server policy and explains why the cache is disabled", async () => {
		mockDisabledByServer = true;
		jest.mocked(offlineCache.canUse).mockReturnValue(false);
		await render();
		expect(refreshAll().disabled).toBe(true);
		expect(container.textContent).toContain(
			"Your server has disabled the offline cache.",
		);
		expect(container.querySelector("table")).toBeNull();
	});

	it("links to automatic-locking settings when locking is disabled", async () => {
		jest.mocked(offlineCache.canUse).mockReturnValue(false);
		await render();
		expect(refreshAll().disabled).toBe(true);
		expect(container.textContent).toContain("Enable automatic locking");
		expect(
			container.querySelector('a[href="/settings/general"]'),
		).not.toBeNull();
	});
});
