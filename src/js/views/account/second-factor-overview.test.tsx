import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import MultifactorAuthenticatorGoogleAuthenticator from "./multifactor-authentication-google-authenticator";
import SecondFactorOverview from "./second-factor-overview";

const mockReadGa = jest.fn<
	Promise<Array<{ id: string; title: string; active: boolean }>>,
	[]
>();
const mockCreateGa = jest.fn<
	Promise<{ id: string; uri: string } | void>,
	[string]
>();
const mockActivateGa = jest.fn<Promise<boolean>, [string, string]>();

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../services/google-authenticator", () => ({
	__esModule: true,
	default: {
		readGa: () => mockReadGa(),
		createGa: (title: string) => mockCreateGa(title),
		activateGa: (id: string, code: string) => mockActivateGa(id, code),
	},
}));

jest.mock("../../components/table", () => ({
	__esModule: true,
	default: () => <div data-testid="factor-table">Factor table</div>,
}));

jest.mock("../../components/text-field/qr", () => ({
	__esModule: true,
	default: ({ value }: { value: string }) => (
		<div data-testid="qr-code">{value}</div>
	),
}));

const theme = createTheme();

describe("second-factor overview", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		jest.clearAllMocks();
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	it("shows creation for empty and inactive lists but the table for an active factor", () => {
		const onCreate = jest.fn<void, []>();
		const renderOverview = (
			rows: [string, string, boolean][] | null,
			loadError = false,
		) => {
			act(() => {
				ReactDOM.render(
					<ThemeProvider theme={theme}>
						<SecondFactorOverview
							rows={rows}
							loadError={loadError}
							onCreate={onCreate}
						>
							<div data-testid="factor-table">Factor table</div>
						</SecondFactorOverview>
					</ThemeProvider>,
					container,
				);
			});
		};

		renderOverview(null);
		expect(container.textContent).not.toContain(
			"NO_ACTIVE_SECOND_FACTOR_TITLE",
		);

		renderOverview(null, true);
		expect(container.textContent).toContain("SECOND_FACTOR_LIST_LOAD_FAILED");
		expect(container.textContent).not.toContain(
			"NO_ACTIVE_SECOND_FACTOR_TITLE",
		);

		renderOverview([]);
		expect(container.textContent).toContain("NO_ACTIVE_SECOND_FACTOR_TITLE");
		expect(container.querySelector('[data-testid="factor-table"]')).toBeNull();

		renderOverview([["1", "Unfinished", false]]);
		expect(container.textContent).toContain("NO_ACTIVE_SECOND_FACTOR_TITLE");
		expect(container.querySelector('[data-testid="factor-table"]')).toBeNull();
		const createButton = Array.from(container.querySelectorAll("button")).find(
			(button) => button.textContent === "CREATE",
		);
		act(() => createButton!.click());
		expect(onCreate).toHaveBeenCalledTimes(1);

		renderOverview([
			["1", "Unfinished", false],
			["2", "Enabled", true],
		]);
		expect(
			container.querySelector('[data-testid="factor-table"]'),
		).not.toBeNull();
		expect(container.textContent).not.toContain(
			"NO_ACTIVE_SECOND_FACTOR_TITLE",
		);
	});

	it("opens the existing TOTP setup form from the empty state", async () => {
		mockReadGa.mockResolvedValue([]);
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<MultifactorAuthenticatorGoogleAuthenticator
						open
						onClose={() => {}}
					/>
				</ThemeProvider>,
				container,
			);
			await Promise.resolve();
		});

		const createButton = Array.from(document.querySelectorAll("button")).find(
			(button) => button.textContent === "CREATE",
		);
		expect(createButton).toBeDefined();
		expect(document.activeElement).toBe(createButton);
		act(() => createButton!.click());
		expect(document.querySelector('input[name="title"]')).not.toBeNull();
		expect(document.body.textContent).toContain("GENERATE");
	});

	it("shows the QR code and activation field together after generating TOTP", async () => {
		mockReadGa
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([{ id: "factor-1", title: "Work", active: true }]);
		mockCreateGa.mockResolvedValue({
			id: "factor-1",
			uri: "otpauth://totp/Work?secret=abc",
		});
		mockActivateGa.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<MultifactorAuthenticatorGoogleAuthenticator
						open
						onClose={() => {}}
					/>
				</ThemeProvider>,
				container,
			);
			await Promise.resolve();
		});

		const clickButton = (text: string) => {
			const button = Array.from(document.querySelectorAll("button")).find(
				(candidate) => candidate.textContent === text,
			);
			if (!button) throw new Error(`Missing ${text} button`);
			button.click();
		};

		act(() => clickButton("CREATE"));
		act(() => {
			const input = document.querySelector<HTMLInputElement>(
				'input[name="title"]',
			)!;
			input.value = "Work";
			Simulate.change(input);
		});
		await act(async () => {
			clickButton("GENERATE");
			await Promise.resolve();
		});

		expect(mockCreateGa).toHaveBeenCalledWith("Work");
		expect(document.body.textContent).toContain("TOTP_SETUP_STEP_1_TITLE");
		expect(document.body.textContent).toContain("TOTP_SETUP_STEP_2_TITLE");
		expect(document.querySelector('[data-testid="qr-code"]')?.textContent).toBe(
			"otpauth://totp/Work?secret=abc",
		);
		expect(document.querySelector('input[name="code"]')).not.toBeNull();

		act(() => {
			const input =
				document.querySelector<HTMLInputElement>('input[name="code"]')!;
			input.value = "123456";
			Simulate.change(input);
		});
		await act(async () => {
			clickButton("ACTIVATE");
			await Promise.resolve();
		});
		expect(mockActivateGa).toHaveBeenCalledWith("factor-1", "123456");
		expect(document.body.textContent).toContain("CODE_INCORRECT");
		expect(document.querySelector('[data-testid="qr-code"]')).not.toBeNull();

		await act(async () => {
			clickButton("ACTIVATE");
			await Promise.resolve();
		});
		expect(
			document.querySelector('[data-testid="factor-table"]'),
		).not.toBeNull();
	});

	it("keeps the title form open if generating the TOTP fails", async () => {
		mockReadGa.mockResolvedValue([]);
		mockCreateGa.mockResolvedValue(undefined);

		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<MultifactorAuthenticatorGoogleAuthenticator
						open
						onClose={() => {}}
					/>
				</ThemeProvider>,
				container,
			);
			await Promise.resolve();
		});

		const createButton = Array.from(document.querySelectorAll("button")).find(
			(button) => button.textContent === "CREATE",
		)!;
		act(() => createButton.click());
		act(() => {
			const input = document.querySelector<HTMLInputElement>(
				'input[name="title"]',
			)!;
			input.value = "Work";
			Simulate.change(input);
		});
		const generateButton = Array.from(document.querySelectorAll("button")).find(
			(button) => button.textContent === "GENERATE",
		)!;
		await act(async () => {
			generateButton.click();
			await Promise.resolve();
		});

		expect(document.body.textContent).toContain("TOTP_SETUP_GENERATION_FAILED");
		expect(document.querySelector('input[name="title"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="qr-code"]')).toBeNull();
	});
});
