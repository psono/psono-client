import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import LoginView from "./index";
import LoginForm from "./login-form";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../components/config-logo", () => () => null);
jest.mock("../../components/frame-controls", () => () => null);
jest.mock(
	"../../components/dark-box",
	() =>
		({ children }: React.PropsWithChildren<{}>) => <div>{children}</div>,
);
jest.mock("./login-form", () => jest.fn(() => <div>Login form</div>));

const testGlobals = globalThis as typeof globalThis & { TARGET: typeof TARGET };
const theme = createTheme();

describe("Firefox popup login", () => {
	const originalTarget = testGlobals.TARGET;
	const originalBrowser = globalThis.browser;
	const originalUrl = window.location.href;
	let container: HTMLDivElement;
	let createTab: jest.Mock;
	let closePopup: jest.SpyInstance;

	beforeEach(() => {
		jest.clearAllMocks();
		testGlobals.TARGET = "firefox";
		window.history.replaceState({}, "", "/data/default_popup.html");
		container = document.createElement("div");
		document.body.appendChild(container);
		createTab = jest.fn();
		globalThis.browser = {
			tabs: { create: createTab },
			runtime: { getURL: (path: string) => `moz-extension://test-id/${path}` },
		} as unknown as typeof browser;
		closePopup = jest.spyOn(window, "close").mockImplementation(() => {});
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		window.history.replaceState({}, "", originalUrl);
		testGlobals.TARGET = originalTarget;
		globalThis.browser = originalBrowser;
		jest.restoreAllMocks();
	});

	const render = () => {
		ReactDOM.render(
			<ThemeProvider theme={theme}>
				<MemoryRouter>
					<LoginView fullWidth />
				</MemoryRouter>
			</ThemeProvider>,
			container,
		);
	};

	it("opens a real tab without mounting the popup login form and closes only after creation", async () => {
		let resolveTab!: (tab: object) => void;
		createTab.mockReturnValue(
			new Promise((resolve) => {
				resolveTab = resolve;
			}),
		);
		const windowOpen = jest.spyOn(window, "open");
		act(render);

		expect(LoginForm).not.toHaveBeenCalled();
		expect(createTab).toHaveBeenCalledWith({
			url: "moz-extension://test-id/data/index.html",
			active: true,
		});
		expect(windowOpen).not.toHaveBeenCalled();
		expect(closePopup).not.toHaveBeenCalled();
		// Re-rendering or clicking the fallback must not create another tab.
		act(() => {
			render();
			container.querySelector("button")!.click();
		});
		expect(createTab).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveTab({ id: 1 });
		});
		expect(closePopup).toHaveBeenCalledTimes(1);
	});

	it("keeps the popup open and lets the user retry if tab creation fails", async () => {
		createTab.mockRejectedValueOnce(new Error("Tab creation failed"));
		jest.spyOn(console, "error").mockImplementation(() => {});
		await act(async () => {
			render();
		});
		expect(closePopup).not.toHaveBeenCalled();
		expect(LoginForm).not.toHaveBeenCalled();

		createTab.mockResolvedValueOnce({ id: 1 });
		await act(async () => {
			container.querySelector("button")!.click();
		});
		expect(createTab).toHaveBeenCalledTimes(2);
		expect(closePopup).toHaveBeenCalledTimes(1);
	});

	it.each([
		["firefox", "/data/index.html"],
		["chrome", "/data/default_popup.html"],
		["webclient", "/index.html"],
	] as const)("renders the login form for %s at %s", (target, path) => {
		testGlobals.TARGET = target;
		window.history.replaceState({}, "", path);
		act(render);
		expect(LoginForm).toHaveBeenCalled();
		expect(createTab).not.toHaveBeenCalled();
		expect(closePopup).not.toHaveBeenCalled();
	});
});
