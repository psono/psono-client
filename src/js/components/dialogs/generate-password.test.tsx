import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import settingsReducer from "../../reducers/settings-datastore";
import DialogGeneratePassword from "./generate-password";

let mockState = {
	settingsDatastore: settingsReducer(undefined, { type: "@@INIT" }),
	server: {},
};

jest.mock("react-redux", () => ({
	useSelector: (selector: (state: typeof mockState) => unknown) =>
		selector(mockState),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { bits?: string; strength?: string }) =>
			options?.bits ? `${key} ${options.bits} ${options.strength}` : key,
		i18n: { language: "en" },
	}),
	initReactI18next: { type: "3rdParty", init: () => undefined },
}));
jest.mock("../../services/store", () => ({ getStore: jest.fn() }));
jest.mock("../../services/datastore-password", () => ({
	__esModule: true,
	default: {
		generate: (
			length: number | string,
			uppercase: string,
			lowercase: string,
			numbers: string,
			special: string,
		) => {
			const symbols = [uppercase[0], lowercase[0], numbers[0], special[0]]
				.filter(Boolean)
				.join("");
			return symbols
				? symbols
						.repeat(Math.ceil(Number(length) / symbols.length))
						.slice(0, Math.ceil(Number(length)))
				: "";
		},
	},
}));

describe("Password and passphrase generator switching", () => {
	let container: HTMLDivElement;
	const onConfirm = jest.fn();
	const theme = createTheme({
		palette: {
			checked: { main: "#008000" },
			greyText: { main: "#808080" },
			lightGreyText: { main: "#cccccc" },
		},
	});

	beforeEach(() => {
		onConfirm.mockClear();
		mockState.settingsDatastore = settingsReducer(undefined, {
			type: "@@INIT",
		});
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
					<DialogGeneratePassword
						open
						onClose={() => undefined}
						onConfirm={onConfirm}
					/>
				</ThemeProvider>,
				container,
			);
		});
	}
	async function chooseGenerator(value: string) {
		act(() => {
			Simulate.mouseDown(document.querySelector('[aria-haspopup="listbox"]')!, {
				button: 0,
			});
		});
		await act(async () => {
			Simulate.click(
				document.querySelector(`[role="option"][data-value="${value}"]`)!,
			);
		});
	}
	function confirm() {
		const button = Array.from(document.querySelectorAll("button")).find(
			(candidate) => candidate.textContent === "CONFIRM",
		)!;
		act(() => {
			Simulate.click(button);
		});
		return onConfirm.mock.calls[onConfirm.mock.calls.length - 1][0] as string;
	}

	it("starts with the password generator when no preference is saved", async () => {
		await render();
		expect(document.querySelector("#passwordLength")).not.toBeNull();
		expect(confirm()).toHaveLength(16);
		expect(
			document.querySelector(
				'[role="progressbar"][aria-label="PASSWORD_STRENGTH"]',
			),
		).not.toBeNull();
	});

	it("updates the strength estimate when length and character sets change", async () => {
		Object.assign(mockState.settingsDatastore, {
			passwordLength: 4,
			passwordLettersUppercase: "A",
			passwordLettersLowercase: "a",
			passwordNumbers: "1",
			passwordSpecialChars: "!",
		});
		await render();
		expect(document.body.textContent).toContain("PASSWORD_ENTROPY 4.6 WEAK");
		const length = document.querySelector<HTMLInputElement>("#passwordLength")!;
		act(() => {
			length.value = "8";
			Simulate.change(length);
		});
		expect(document.body.textContent).toContain("PASSWORD_ENTROPY 15.3 WEAK");
		const uppercase = document.querySelector<HTMLInputElement>(
			'input[type="checkbox"]',
		)!;
		act(() => {
			uppercase.checked = false;
			Simulate.change(uppercase);
		});
		expect(document.body.textContent).toContain("PASSWORD_ENTROPY 12.5 WEAK");
	});

	it("hides the password entropy after manual edits and restores it on regeneration", async () => {
		await render();
		const password = document.querySelector<HTMLInputElement>("#password")!;
		act(() => {
			password.value = "Edited1!";
			Simulate.change(password);
		});
		expect(document.querySelector('[role="progressbar"]')).toBeNull();
		expect(document.body.textContent).toContain("PASSWORD_ENTROPY_EDITED");
		act(() => {
			Simulate.click(document.querySelector('button[aria-label="generate"]')!);
		});
		expect(
			document.querySelector(
				'[role="progressbar"][aria-label="PASSWORD_STRENGTH"]',
			),
		).not.toBeNull();
	});

	it("starts with the user's preferred passphrase generator", async () => {
		mockState.settingsDatastore.defaultPasswordGenerator = "passphrase";
		mockState.settingsDatastore.passphraseWordCount = 6;
		await render();
		expect(document.querySelector("#passwordLength")).toBeNull();
		expect(confirm().split("-")).toHaveLength(6);
	});

	it("switches in both directions and confirms the selected generator's value", async () => {
		await render();
		await chooseGenerator("passphrase");
		expect(confirm().split("-")).toHaveLength(4);
		expect(document.querySelector('[role="progressbar"]')).not.toBeNull();
		await chooseGenerator("password");
		expect(document.querySelector("#passwordLength")).not.toBeNull();
		expect(confirm()).toHaveLength(16);
	});
});
