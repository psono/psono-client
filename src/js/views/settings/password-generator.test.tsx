import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import {
	SET_DEFAULT_PASSWORD_GENERATOR,
	SET_PASSPHRASE_CONFIG,
} from "../../actions/action-types";
import settingsReducer from "../../reducers/settings-datastore";
import SettingsPasswordGeneratorView from "./password-generator";

let mockState = {
	settingsDatastore: settingsReducer(undefined, { type: "@@INIT" }),
	server: {},
};
const mockSetDefault = jest.fn((value: "password" | "passphrase") => {
	mockState.settingsDatastore = settingsReducer(mockState.settingsDatastore, {
		type: SET_DEFAULT_PASSWORD_GENERATOR,
		defaultPasswordGenerator: value,
	});
});
const mockSetPassphrase = jest.fn((count: number, language: string) => {
	mockState.settingsDatastore = settingsReducer(mockState.settingsDatastore, {
		type: SET_PASSPHRASE_CONFIG,
		passphraseWordCount: count,
		passphraseLanguage: language,
	});
});

jest.mock("react-redux", () => ({
	useSelector: (selector: (state: typeof mockState) => unknown) =>
		selector(mockState),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
	initReactI18next: { type: "3rdParty", init: () => undefined },
}));
jest.mock("../../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({
		setDefaultPasswordGenerator: mockSetDefault,
		setPassphraseConfig: mockSetPassphrase,
		setPasswordConfig: jest.fn(),
	}),
}));
jest.mock("../../services/store", () => ({ getStore: jest.fn() }));

describe("Generator settings default preference", () => {
	let container: HTMLDivElement;
	const theme = createTheme();

	beforeEach(() => {
		jest.clearAllMocks();
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
	function render() {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<SettingsPasswordGeneratorView />
				</ThemeProvider>,
				container,
			);
		});
	}
	function defaultSection() {
		return container.querySelector<HTMLElement>(
			'section[aria-labelledby="default-password-generator-title"]',
		)!;
	}
	function chooseDefault(value: string) {
		act(() => {
			Simulate.mouseDown(
				container.querySelector("#defaultPasswordGenerator")!,
				{ button: 0 },
			);
		});
		act(() => {
			Simulate.click(
				document.querySelector(`[role="option"][data-value="${value}"]`)!,
			);
		});
	}
	function saveDefault() {
		const button = Array.from(defaultSection().querySelectorAll("button")).find(
			(candidate) => candidate.textContent === "SAVE",
		)!;
		act(() => {
			Simulate.click(button);
		});
	}

	it("shows the default choice above the password and passphrase options", () => {
		render();
		const section = defaultSection();
		expect(section).not.toBeNull();
		expect(section.textContent).toContain("PASSWORD_GENERATOR");
		expect(
			section.compareDocumentPosition(
				container.querySelector("#passwordLength")!,
			) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("saves and reloads a passphrase default without changing the word count or language", () => {
		Object.assign(mockState.settingsDatastore, {
			passphraseWordCount: 6,
			passphraseLanguage: "da",
		});
		render();
		chooseDefault("passphrase");
		saveDefault();
		expect(mockSetDefault).toHaveBeenLastCalledWith("passphrase");
		expect(mockState.settingsDatastore.passphraseWordCount).toBe(6);
		expect(mockState.settingsDatastore.passphraseLanguage).toBe("da");
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		render();
		expect(
			container.querySelector("#defaultPasswordGenerator")!.textContent,
		).toBe("PASSPHRASE_GENERATOR");
	});

	it("allows saving a default while other generator options contain unsaved invalid values", () => {
		render();
		const count = container.querySelector<HTMLInputElement>(
			'input[type="number"]',
		)!;
		act(() => {
			count.value = "1";
			Simulate.change(count);
		});
		chooseDefault("passphrase");
		saveDefault();
		expect(mockSetDefault).toHaveBeenLastCalledWith("passphrase");
		expect(mockState.settingsDatastore.passphraseWordCount).toBe(4);
		// Saving another section must also retain the current unsaved field value.
		render();
		expect(count.value).toBe("1");
	});

	it("preserves the selected default when saving or resetting passphrase options", () => {
		mockState.settingsDatastore.defaultPasswordGenerator = "passphrase";
		render();
		const count = container.querySelector<HTMLInputElement>(
			'input[type="number"]',
		)!;
		act(() => {
			count.value = "7";
			Simulate.change(count);
		});
		const saves = Array.from(container.querySelectorAll("button")).filter(
			(candidate) => candidate.textContent === "SAVE",
		);
		act(() => {
			Simulate.click(saves[saves.length - 1]);
		});
		expect(mockSetPassphrase).toHaveBeenLastCalledWith(7, "");
		expect(mockState.settingsDatastore.defaultPasswordGenerator).toBe(
			"passphrase",
		);
		const resets = Array.from(container.querySelectorAll("button")).filter(
			(candidate) => candidate.textContent === "RESET",
		);
		act(() => {
			Simulate.click(resets[resets.length - 1]);
		});
		expect(mockState.settingsDatastore.defaultPasswordGenerator).toBe(
			"passphrase",
		);
	});

	it("resets the default to the password generator", () => {
		mockState.settingsDatastore.defaultPasswordGenerator = "passphrase";
		render();
		const reset = Array.from(defaultSection().querySelectorAll("button")).find(
			(candidate) => candidate.textContent === "RESET",
		)!;
		act(() => {
			Simulate.click(reset);
		});
		expect(mockSetDefault).toHaveBeenLastCalledWith("password");
		expect(
			container.querySelector("#defaultPasswordGenerator")!.textContent,
		).toBe("PASSWORD_GENERATOR");
	});
});
