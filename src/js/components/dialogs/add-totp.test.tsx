import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import DialogAddTotp from "./add-totp";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../i18n", () => ({ t: (key: string) => key }));
jest.mock("../../services/store", () => ({ getStore: jest.fn() }));

const theme = createTheme();

function input(name: string) {
	const element = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
	if (!element) throw new Error(`Missing input: ${name}`);
	return element;
}

function change(name: string, value: string) {
	act(() => {
		const element = input(name);
		element.value = value;
		Simulate.change(element);
	});
}

function save() {
	const button = Array.from(document.querySelectorAll("button")).find(
		(candidate) => candidate.textContent === "SAVE",
	);
	if (!button) throw new Error("Missing save button");
	act(() => button.click());
}

describe("DialogAddTotp", () => {
	let container: HTMLDivElement;
	const onClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		container = document.createElement("div");
		document.body.appendChild(container);
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogAddTotp open onClose={onClose} />
				</ThemeProvider>,
				container,
			);
		});
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	it("preserves a short pasted secret when adding TOTP to a website password", () => {
		change(
			"totpUri",
			"otpauth://totp/TOTP?secret=abc&period=30&algorithm=SHA1&digits=6",
		);
		expect(input("totpCode").value).toBe("abc");
		expect(new URL(input("totpUri").value).searchParams.get("secret")).toBe(
			"abc",
		);
		save();
		expect(onClose).toHaveBeenCalledWith(30, "SHA1", 6, "abc");
	});

	it("adds a website-password TOTP from a URI and keeps manual changes synchronized", () => {
		change(
			"totpUri",
			"otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP&algorithm=SHA256&digits=8&period=60",
		);
		change("totpPeriod", "90");
		act(() => {
			Simulate.mouseDown(input("totpAlgorithm"));
		});
		const option = Array.from(
			document.querySelectorAll<HTMLElement>('[role="option"]'),
		).find((element) => element.textContent === "SHA512");
		if (!option) throw new Error("Missing SHA512 option");
		act(() => option.click());
		expect(new URL(input("totpUri").value).searchParams.get("period")).toBe(
			"90",
		);
		expect(new URL(input("totpUri").value).searchParams.get("algorithm")).toBe(
			"SHA512",
		);
		save();
		expect(onClose).toHaveBeenCalledWith(90, "SHA512", 8, "JBSWY3DPEHPK3PXP");
	});
});
