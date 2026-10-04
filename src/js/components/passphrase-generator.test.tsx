import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { SettingsState } from "../../types/state";
import { wordlists } from "../services/passphrase";
import PassphraseGenerator from "./passphrase-generator";

let mockState: {
	settingsDatastore: Partial<SettingsState>;
	server: { compliancePasswordGeneratorDefaultWordLength?: number };
};
let mockLanguage = "fr-CA";

jest.mock("react-redux", () => ({
	useSelector: (selector: (state: typeof mockState) => unknown) =>
		selector(mockState),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: mockLanguage },
	}),
	initReactI18next: { type: "3rdParty", init: () => undefined },
}));
jest.mock("../services/store", () => ({ getStore: jest.fn() }));

describe("Passphrase generator preferences and strength display", () => {
	let container: HTMLDivElement;
	const onChange = jest.fn();

	beforeEach(() => {
		onChange.mockClear();
		mockLanguage = "fr-CA";
		mockState = { settingsDatastore: {}, server: {} };
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
				<ThemeProvider theme={createTheme()}>
					<PassphraseGenerator onChange={onChange} />
				</ThemeProvider>,
				container,
			);
		});
	}
	function assertGeneratedWords(language: string, count: number) {
		const value: string =
			onChange.mock.calls[onChange.mock.calls.length - 1][0];
		const parts = value.split("-");
		expect(parts).toHaveLength(count);
		for (const part of parts) {
			expect(wordlists[language]).toContain(
				part.replace(/[0-9]/g, "").toLowerCase(),
			);
		}
	}

	it("defaults to four words in the frontend's French dictionary", () => {
		render();
		assertGeneratedWords("fr", 4);
		expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
	});

	it.each([
		["da-DK", "da"],
		["fi-FI", "fi"],
		["nb-NO", "no"],
		["sv-SE", "sv"],
		["pt-BR", "pt"],
		["pl-PL", "pl"],
		["ru-RU", "ru"],
		["uk-UA", "uk"],
	])("uses the %s frontend locale's %s dictionary by default", (locale, language) => {
		mockLanguage = locale;
		render();
		assertGeneratedWords(language, 4);
	});

	it("uses a saved English dictionary and length despite a French frontend", () => {
		mockState.settingsDatastore = {
			passphraseWordCount: 6,
			passphraseLanguage: "en",
		};
		mockState.server.compliancePasswordGeneratorDefaultWordLength = 8;
		render();
		assertGeneratedWords("en", 6);
	});

	it("uses the admin length when there is no persisted user preference", () => {
		mockState.server.compliancePasswordGeneratorDefaultWordLength = 7;
		render();
		assertGeneratedWords("fr", 7);
	});

	it("regenerates on valid length changes and blocks lengths below two", () => {
		render();
		const count = container.querySelector<HTMLInputElement>(
			'input[type="number"]',
		)!;
		act(() => {
			count.value = "2";
			Simulate.change(count);
		});
		assertGeneratedWords("fr", 2);
		const previousCalls = onChange.mock.calls.length;
		act(() => {
			count.value = "1";
			Simulate.change(count);
		});
		expect(onChange).toHaveBeenCalledTimes(previousCalls);
		expect(count.getAttribute("aria-invalid")).toBe("true");
		expect(
			container.querySelector<HTMLButtonElement>(
				'button[aria-label="GENERATE_PASSPHRASE"]',
			)!.disabled,
		).toBe(true);
	});

	it("hides the generator entropy after manual edits and restores it on regeneration", () => {
		render();
		const value = container.querySelector<HTMLInputElement>(
			'input:not([type="number"]):not([aria-hidden="true"])',
		)!;
		act(() => {
			value.value = "Edited1-passphrase";
			Simulate.change(value);
		});
		expect(onChange).toHaveBeenLastCalledWith("Edited1-passphrase");
		expect(container.querySelector('[role="progressbar"]')).toBeNull();
		act(() => {
			Simulate.click(
				container.querySelector('button[aria-label="GENERATE_PASSPHRASE"]')!,
			);
		});
		assertGeneratedWords("fr", 4);
		expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
	});
});
