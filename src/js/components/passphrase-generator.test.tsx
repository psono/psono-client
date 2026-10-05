import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { SettingsState } from "../../types/state";
import * as passphraseService from "../services/passphrase";
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
		jest.restoreAllMocks();
	});
	async function render() {
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={createTheme()}>
					<PassphraseGenerator onChange={onChange} />
				</ThemeProvider>,
				container,
			);
		});
	}
	async function assertGeneratedWords(language: string, count: number) {
		const words = await passphraseService.loadWordlist(language);
		const value: string =
			onChange.mock.calls[onChange.mock.calls.length - 1][0];
		const parts = value.split("-");
		expect(parts).toHaveLength(count);
		for (const part of parts) {
			expect(words).toContain(part.replace(/[0-9]/g, "").toLowerCase());
		}
	}

	it("defaults to four words in the frontend's French dictionary", async () => {
		await render();
		await assertGeneratedWords("fr", 4);
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
	])("uses the %s frontend locale's %s dictionary by default", async (locale, language) => {
		mockLanguage = locale;
		await render();
		await assertGeneratedWords(language, 4);
	});

	it("uses a saved English dictionary and length despite a French frontend", async () => {
		mockState.settingsDatastore = {
			passphraseWordCount: 6,
			passphraseLanguage: "en",
		};
		mockState.server.compliancePasswordGeneratorDefaultWordLength = 8;
		await render();
		await assertGeneratedWords("en", 6);
	});

	it("uses the admin length when there is no persisted user preference", async () => {
		mockState.server.compliancePasswordGeneratorDefaultWordLength = 7;
		await render();
		await assertGeneratedWords("fr", 7);
	});

	it("regenerates on valid length changes and blocks lengths below two", async () => {
		await render();
		const count = container.querySelector<HTMLInputElement>(
			'input[type="number"]',
		)!;
		await act(async () => {
			count.value = "2";
			Simulate.change(count);
		});
		await assertGeneratedWords("fr", 2);
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

	it("hides the generator entropy after manual edits and restores it on regeneration", async () => {
		await render();
		const value = container.querySelector<HTMLInputElement>(
			'input:not([type="number"]):not([aria-hidden="true"])',
		)!;
		act(() => {
			value.value = "Edited1-passphrase";
			Simulate.change(value);
		});
		expect(onChange).toHaveBeenLastCalledWith("Edited1-passphrase");
		expect(container.querySelector('[role="progressbar"]')).toBeNull();
		await act(async () => {
			Simulate.click(
				container.querySelector('button[aria-label="GENERATE_PASSPHRASE"]')!,
			);
		});
		await assertGeneratedWords("fr", 4);
		expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
	});

	it("discards an older dictionary load after the selected language changes", async () => {
		let resolveFrench!: (value: string) => void;
		let resolveEnglish!: (value: string) => void;
		jest
			.spyOn(passphraseService, "generatePassphrase")
			.mockReturnValueOnce(
				new Promise((resolve) => {
					resolveFrench = resolve;
				}),
			)
			.mockReturnValueOnce(
				new Promise((resolve) => {
					resolveEnglish = resolve;
				}),
			);
		await render();
		const input = container.querySelector<HTMLInputElement>(
			'input:not([type="number"]):not([aria-hidden="true"])',
		)!;
		expect(input.disabled).toBe(true);
		expect(onChange).toHaveBeenLastCalledWith("");
		act(() => {
			Simulate.mouseDown(
				container.querySelector('[aria-haspopup="listbox"]')!,
				{ button: 0 },
			);
		});
		await act(async () => {
			Simulate.click(
				document.querySelector('[role="option"][data-value="en"]')!,
			);
		});
		await act(async () => {
			resolveEnglish("English1-passphrase");
		});
		expect(onChange).toHaveBeenLastCalledWith("English1-passphrase");
		expect(input.disabled).toBe(false);
		await act(async () => {
			resolveFrench("French1-passphrase");
		});
		expect(onChange).toHaveBeenLastCalledWith("English1-passphrase");
	});

	it("reports a failed dictionary load and allows retrying generation", async () => {
		jest.spyOn(console, "error").mockImplementation(() => undefined);
		jest
			.spyOn(passphraseService, "generatePassphrase")
			.mockRejectedValueOnce(new Error("Chunk load failed"));
		await render();
		expect(container.querySelector('[role="alert"]')!.textContent).toBe(
			"UNKNOWN_ERROR",
		);
		expect(onChange).toHaveBeenLastCalledWith("");
		await act(async () => {
			Simulate.click(
				container.querySelector('button[aria-label="GENERATE_PASSPHRASE"]')!,
			);
		});
		await assertGeneratedWords("fr", 4);
		expect(container.querySelector('[role="alert"]')).toBeNull();
	});
});
