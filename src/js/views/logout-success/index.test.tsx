import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import user from "../../services/user";
import LogoutSuccessView from "./index";

const mockTranslate = (key: string, value?: { seconds: number }) => {
	if (key === "REDIRECTING_IN_SECONDS")
		return `Redirecting in ${value?.seconds}`;
	return key;
};

jest.mock("../../services/user", () => ({
	__esModule: true,
	default: { logout: jest.fn() },
}));
jest.mock("../../services/browser-client", () => ({
	__esModule: true,
	default: { getClientType: () => "webclient" },
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: mockTranslate }),
}));
jest.mock("../../components/config-logo", () => () => null);
jest.mock(
	"../../components/dark-box",
	() =>
		({ children }: React.PropsWithChildren<{}>) => <div>{children}</div>,
);

describe("logout completion", () => {
	let container: HTMLDivElement;
	const theme = createTheme();
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(user.logout).mockReset();
		sessionStorage.removeItem("psono_logout_redirect_url");
		container = document.createElement("div");
		document.body.appendChild(container);
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		sessionStorage.removeItem("psono_logout_redirect_url");
		jest.useRealTimers();
	});
	const render = () => {
		ReactDOM.render(
			<ThemeProvider theme={theme}>
				<LogoutSuccessView />
			</ThemeProvider>,
			container,
		);
	};

	it("waits for logout before showing success or allowing navigation home", async () => {
		let finish!: (result: { response: "success" }) => void;
		jest.mocked(user.logout).mockReturnValue(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		act(render);
		expect(container.textContent).toContain("LOGGING_OUT");
		expect(container.textContent).not.toContain("LOGOUT_SUCCESSFUL");
		expect(
			container
				.querySelector('a[href="index.html"]')
				?.getAttribute("aria-disabled"),
		).toBe("true");
		await act(async () => {
			finish({ response: "success" });
		});
		expect(container.textContent).toContain("LOGOUT_SUCCESSFUL");
		expect(
			container
				.querySelector('a[href="index.html"]')
				?.getAttribute("aria-disabled"),
		).not.toBe("true");
		expect(user.logout).toHaveBeenCalledTimes(1);
	});

	it("retains the stored SSO redirect and runs its countdown after logout", async () => {
		sessionStorage.setItem(
			"psono_logout_redirect_url",
			"https://identity.test/logout",
		);
		jest.mocked(user.logout).mockResolvedValue({ response: "success" });
		await act(async () => {
			render();
		});
		expect(container.textContent).toContain("Redirecting in 3");
		expect(sessionStorage.getItem("psono_logout_redirect_url")).toBeNull();
		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(container.textContent).toContain("Redirecting in 2");
		expect(user.logout).toHaveBeenCalledTimes(1);
	});
});
