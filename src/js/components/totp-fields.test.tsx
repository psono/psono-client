import { Grid } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as OTPAuth from "otpauth";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import TotpFields, { type TotpParameters } from "./totp-fields";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../i18n", () => ({ t: (key: string) => key }));
jest.mock("../services/store", () => ({ getStore: jest.fn() }));

const theme = createTheme();
const initialValue: TotpParameters = {
	period: 30,
	algorithm: "SHA1",
	digits: 6,
	code: "JBSWY3DPEHPK3PXP",
};

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

describe("TotpFields", () => {
	let container: HTMLDivElement;
	const onValidityChange = jest.fn();

	function Form() {
		const [value, setValue] = useState(initialValue);
		return (
			<ThemeProvider theme={theme}>
				<Grid container>
					<TotpFields
						value={value}
						onChange={setValue}
						onValidityChange={onValidityChange}
					/>
				</Grid>
			</ThemeProvider>
		);
	}

	beforeEach(() => {
		jest.clearAllMocks();
		container = document.createElement("div");
		document.body.appendChild(container);
		act(() => {
			ReactDOM.render(<Form />, container);
		});
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	it("synchronizes all TOTP settings and preserves URI metadata", () => {
		expect(new URL(input("totpUri").value).searchParams.get("secret")).toBe(
			initialValue.code,
		);
		change(
			"totpUri",
			"otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=SHA256&digits=8&period=60",
		);
		expect(input("totpPeriod").value).toBe("60");
		expect(input("totpDigits").value).toBe("8");
		expect(input("totpAlgorithm").value).toBe("SHA256");
		change("totpPeriod", "45");
		change("totpDigits", "7");
		act(() => {
			Simulate.mouseDown(input("totpAlgorithm"));
		});
		const option = Array.from(
			document.querySelectorAll<HTMLElement>('[role="option"]'),
		).find((element) => element.textContent === "SHA512");
		if (!option) throw new Error("Missing SHA512 option");
		act(() => option.click());
		change("totpCode", "GEZDGNBV GY3TQOJQ");
		const uri = new URL(input("totpUri").value);
		expect(uri.pathname).toBe("/Example:alice@example.com");
		expect(Object.fromEntries(uri.searchParams)).toEqual({
			issuer: "Example",
			secret: "GEZDGNBVGY3TQOJQ",
			period: "45",
			algorithm: "SHA512",
			digits: "7",
		});
	});

	it("keeps encoded labels and issuers usable by OTPAuth after updating settings", () => {
		change(
			"totpUri",
			"otpauth://totp/Example%20Co:alice%2Btest%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example+Co",
		);
		change("totpPeriod", "60");
		const parsed = OTPAuth.URI.parse(input("totpUri").value);
		expect(parsed.issuer).toBe("Example Co");
		expect(parsed.label).toBe("alice+test@example.com");
		expect(parsed).toBeInstanceOf(OTPAuth.TOTP);
		expect((parsed as OTPAuth.TOTP).period).toBe(60);
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
	});

	it.each([
		"not a URI",
		"otpauth://hotp/Example?secret=JBSWY3DPEHPK3PXP&counter=1",
		"otpauth://totp/Example?issuer=Example",
		"otpauth://totp/Example?secret=INVALID!",
		"otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP&period=0",
		"otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP&digits=abc",
		"otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP&algorithm=SHA224",
	])("rejects invalid or unsupported URIs without overwriting settings: %s", (uri) => {
		change("totpUri", uri);
		expect(input("totpUri").value).toBe(uri);
		expect(input("totpCode").value).toBe(initialValue.code);
		expect(input("totpPeriod").value).toBe("30");
		expect(container.textContent).toContain("INVALID_TOTP_URI");
		expect(onValidityChange).toHaveBeenLastCalledWith(false);
		change("totpDigits", "8");
		expect(container.textContent).not.toContain("INVALID_TOTP_URI");
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
		expect(new URL(input("totpUri").value).searchParams.get("digits")).toBe(
			"8",
		);
	});

	it("clears the URI when the secret is removed and can recover from an invalid URI", () => {
		change("totpUri", "otpauth://");
		change("totpUri", "otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP");
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
		change("totpCode", "");
		expect(input("totpUri").value).toBe("");
		expect(input("totpCode").value).toBe("");
	});
});
