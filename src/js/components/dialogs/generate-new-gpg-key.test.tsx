import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { GenerateKeyOptions, SerializedKeyPair } from "openpgp";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { GpgKeyDialogCallback } from "../../../types/dialogs";
import DialogGenerateNewGpgKey from "./generate-new-gpg-key";

const generatedKeys = {
	privateKey: [
		"-----BEGIN PGP PRIVATE KEY BLOCK-----",
		"generated-private-key",
		"-----END PGP PRIVATE KEY BLOCK-----",
	].join("\n"),
	publicKey: [
		"-----BEGIN PGP PUBLIC KEY BLOCK-----",
		"generated-public-key",
		"-----END PGP PUBLIC KEY BLOCK-----",
	].join("\n"),
	revocationCertificate: "generated-revocation-certificate",
} satisfies SerializedKeyPair<string> & { revocationCertificate: string };

const mockGenerateKey = jest.fn<
	Promise<typeof generatedKeys>,
	[GenerateKeyOptions & { format?: "armored" }]
>();
const mockHkpConstructor = jest.fn<void, [keyServer?: string]>();
const mockUpload = jest.fn<Promise<void>, [publicKey: string]>();

jest.mock("openpgp", () => ({
	generateKey: (...args: Parameters<typeof mockGenerateKey>) =>
		mockGenerateKey(...args),
}));

jest.mock("@openpgp/hkp-client", () => ({
	__esModule: true,
	default: class MockHKP {
		constructor(keyServer?: string) {
			mockHkpConstructor(keyServer);
		}

		upload(publicKey: string) {
			return mockUpload(publicKey);
		}
	},
}));

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../services/store", () => ({
	getStore: () => ({
		getState: () => ({
			user: { userEmail: "initial@example.test" },
			settingsDatastore: { gpgHkpKeyServer: "https://keys.example.test" },
		}),
	}),
}));

const theme = createTheme({
	palette: {
		checked: { main: "#008000" },
		greyText: { main: "#808080" },
	},
});

function getInput(selector: string): HTMLInputElement {
	const input = document.querySelector<HTMLInputElement>(selector);
	if (!input) throw new Error(`Missing dialog input: ${selector}`);
	return input;
}

function getGenerateButton(): HTMLButtonElement {
	const button = Array.from(document.querySelectorAll("button")).find(
		(candidate) => candidate.textContent === "GENERATE",
	);
	if (!button) throw new Error("Missing generate button");
	return button;
}

describe("DialogGenerateNewGpgKey", () => {
	let container: HTMLDivElement;
	const onNewGpgKeysGenerated = jest.fn<
		void,
		Parameters<GpgKeyDialogCallback>
	>();
	const onClose = jest.fn<void, []>();

	beforeEach(() => {
		jest.clearAllMocks();
		mockGenerateKey.mockResolvedValue(generatedKeys);
		mockUpload.mockResolvedValue(undefined);
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	function renderCompletedForm() {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogGenerateNewGpgKey
						open
						onClose={onClose}
						onNewGpgKeysGenerated={onNewGpgKeysGenerated}
					/>
				</ThemeProvider>,
				container,
			);
		});

		expect(getGenerateButton().disabled).toBe(true);
		expect(getInput('input[name="email"]').value).toBe("initial@example.test");

		for (const [field, value] of Object.entries({
			title: "Work signing key",
			name: "Alice Example",
			email: "alice@example.test",
		})) {
			const input = getInput(`input[name="${field}"]`);
			act(() => {
				input.value = value;
				Simulate.change(input);
			});
		}
		expect(getGenerateButton().disabled).toBe(false);
	}

	it("uploads the OpenPGP v5 armored public key when publishing is selected", async () => {
		renderCompletedForm();
		const publish = getInput('input[type="checkbox"]');
		expect(publish.checked).toBe(false);
		act(() => {
			publish.click();
		});
		expect(publish.checked).toBe(true);

		await act(async () => {
			getGenerateButton().click();
		});

		expect(mockGenerateKey).toHaveBeenCalledTimes(1);
		expect(mockGenerateKey).toHaveBeenCalledWith({
			userIDs: [{ name: "Alice Example", email: "alice@example.test" }],
			type: "rsa",
			rsaBits: 4096,
			passphrase: "",
		});
		expect(mockHkpConstructor).toHaveBeenCalledTimes(1);
		expect(mockHkpConstructor).toHaveBeenCalledWith(
			"https://keys.example.test",
		);
		expect(mockUpload).toHaveBeenCalledTimes(1);
		expect(mockUpload).toHaveBeenCalledWith(generatedKeys.publicKey);
		expect(onNewGpgKeysGenerated).toHaveBeenCalledTimes(1);
		expect(onNewGpgKeysGenerated).toHaveBeenCalledWith(
			"Work signing key",
			"Alice Example",
			"alice@example.test",
			generatedKeys.privateKey,
			generatedKeys.publicKey,
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it("returns the generated keys without publishing by default", async () => {
		renderCompletedForm();
		expect(getInput('input[type="checkbox"]').checked).toBe(false);

		await act(async () => {
			getGenerateButton().click();
		});

		expect(mockGenerateKey).toHaveBeenCalledTimes(1);
		expect(mockHkpConstructor).not.toHaveBeenCalled();
		expect(mockUpload).not.toHaveBeenCalled();
		expect(onNewGpgKeysGenerated).toHaveBeenCalledTimes(1);
		expect(onNewGpgKeysGenerated).toHaveBeenCalledWith(
			"Work signing key",
			"Alice Example",
			"alice@example.test",
			generatedKeys.privateKey,
			generatedKeys.publicKey,
		);
		expect(onClose).not.toHaveBeenCalled();
	});
});
