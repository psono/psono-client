import { Grid } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as OTPAuth from "otpauth";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import qrCode from "../services/qr-code";
import TotpFields, { type TotpParameters } from "./totp-fields";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../i18n", () => ({ t: (key: string) => key }));
jest.mock("../services/store", () => ({ getStore: jest.fn() }));
jest.mock("../services/qr-code", () => ({
	readFromImage: jest.fn(),
}));

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

function button(label: string) {
	const element = Array.from(document.querySelectorAll("button")).find(
		(item) => item.getAttribute("aria-label") === label,
	);
	if (!element) throw new Error(`Missing button: ${label}`);
	return element;
}

function uploadImage(file: File) {
	act(() => {
		const element = input("totpQrImage");
		Object.defineProperty(element, "files", {
			configurable: true,
			value: [file],
		});
		Simulate.change(element);
	});
}

describe("TotpFields", () => {
	let container: HTMLDivElement;
	const onValidityChange = jest.fn();
	const onTitleSuggestion = jest.fn();
	const qrUri =
		"otpauth://totp/Example:alice@example.com?secret=abc&algorithm=SHA256&digits=8&period=60";

	function Form() {
		const [value, setValue] = useState(initialValue);
		return (
			<ThemeProvider theme={theme}>
				<Grid container>
					<TotpFields
						value={value}
						onChange={setValue}
						onValidityChange={onValidityChange}
						onTitleSuggestion={onTitleSuggestion}
					/>
				</Grid>
			</ThemeProvider>
		);
	}

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(qrCode.readFromImage).mockResolvedValue(qrUri);
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

	it("imports a QR image using the URI parser and suggests its title", async () => {
		const image = new File(["image"], "qr.png", { type: "image/png" });
		uploadImage(image);
		expect(onValidityChange).toHaveBeenLastCalledWith(false);
		await act(async () => {});
		expect(qrCode.readFromImage).toHaveBeenCalledWith(image);
		expect(input("totpCode").value).toBe("abc");
		expect(input("totpPeriod").value).toBe("60");
		expect(input("totpDigits").value).toBe("8");
		expect(input("totpAlgorithm").value).toBe("SHA256");
		expect(new URL(input("totpUri").value).searchParams.get("secret")).toBe(
			"abc",
		);
		expect(onTitleSuggestion).toHaveBeenLastCalledWith("Example");
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
	});

	it("opens the image picker from the URI icon to the left of show/hide", () => {
		const uriField = input("totpUri").closest(".MuiInputBase-root")!;
		expect(
			Array.from(uriField.querySelectorAll("button"), (item) =>
				item.getAttribute("aria-label"),
			),
		).toEqual(["TOTP_IMPORT_QR_IMAGE", "SHOW_OR_HIDE_PASSWORD"]);
		const click = jest
			.spyOn(input("totpQrImage"), "click")
			.mockImplementation(() => {});
		act(() => button("TOTP_IMPORT_QR_IMAGE").click());
		expect(click).toHaveBeenCalled();
		click.mockRestore();
	});

	it("extracts a TOTP from a pasted screenshot", async () => {
		const image = new File(["image"], "screenshot.png", { type: "image/png" });
		const preventDefault = jest.fn();
		act(() => {
			Simulate.paste(input("totpUri"), {
				clipboardData: {
					items: [{ type: "image/png", getAsFile: () => image }],
				} as unknown as DataTransfer,
				preventDefault,
			});
		});
		await act(async () => {});
		expect(preventDefault).toHaveBeenCalled();
		expect(qrCode.readFromImage).toHaveBeenCalledWith(image);
		expect(input("totpCode").value).toBe("abc");
	});

	it("leaves ordinary text paste to the URI input", () => {
		const preventDefault = jest.fn();
		act(() => {
			Simulate.paste(input("totpUri"), {
				clipboardData: {
					items: [{ type: "text/plain" }],
				} as unknown as DataTransfer,
				preventDefault,
			});
		});
		expect(preventDefault).not.toHaveBeenCalled();
		expect(qrCode.readFromImage).not.toHaveBeenCalled();
	});

	it.each([
		"https://example.com",
		"otpauth://hotp/Example?secret=abc&counter=1",
		"otpauth://totp/Example?secret=INVALID!",
	])("does not replace existing fields with a non-TOTP QR code: %s", async (text) => {
		const uri = input("totpUri").value;
		jest.mocked(qrCode.readFromImage).mockResolvedValue(text);
		uploadImage(new File(["image"], "qr.png", { type: "image/png" }));
		await act(async () => {});
		expect(container.textContent).toContain("INVALID_TOTP_URI");
		expect(input("totpCode").value).toBe(initialValue.code);
		expect(input("totpUri").value).toBe(uri);
		expect(onTitleSuggestion).not.toHaveBeenCalled();
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
	});

	it.each([
		["TOTP_QR_NOT_FOUND", "TOTP_QR_NOT_FOUND"],
		["Image decoding failed", "TOTP_QR_READ_ERROR"],
	])("reports image errors without changing the existing TOTP: %s", async (message, expected) => {
		jest.mocked(qrCode.readFromImage).mockRejectedValue(new Error(message));
		uploadImage(new File(["image"], "qr.png", { type: "image/png" }));
		await act(async () => {});
		expect(container.textContent).toContain(expected);
		expect(input("totpCode").value).toBe(initialValue.code);
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
	});

	it("skips scanning if the user edits while the scanner is loading", async () => {
		uploadImage(new File(["image"], "qr.png", { type: "image/png" }));
		change("totpCode", "GEZDGNBVGY3TQOJQ");
		await act(async () => {});
		expect(qrCode.readFromImage).not.toHaveBeenCalled();
		expect(input("totpCode").value).toBe("GEZDGNBVGY3TQOJQ");
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
	});

	it("does not overwrite manual changes with a late scan result", async () => {
		let finish!: (uri: string) => void;
		jest.mocked(qrCode.readFromImage).mockReturnValue(
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		uploadImage(new File(["image"], "qr.png", { type: "image/png" }));
		await act(async () => {});
		change("totpCode", "GEZDGNBVGY3TQOJQ");
		await act(async () => {
			finish(qrUri);
		});
		expect(input("totpCode").value).toBe("GEZDGNBVGY3TQOJQ");
		expect(onTitleSuggestion).not.toHaveBeenCalled();
		expect(onValidityChange).toHaveBeenLastCalledWith(true);
	});
});
