import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { EntrySecretData } from "../../../types/entry-ui";
import secretService from "../../services/secret";
import fileTransferService from "../../services/file-transfer";
import cryptoLibrary from "../../services/crypto-library";
import apiClient from "../../services/api-client";
import DialogNewEntry from "./new-entry";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../i18n", () => ({ t: (key: string) => key }));
jest.mock("../../services/store", () => ({
	getStore: () => ({
		getState: () => ({
			user: {},
			server: { disableCallbacks: true, version: "5.4.0" },
			settingsDatastore: {},
		}),
	}),
}));
jest.mock("../../services/secret", () => {
	const actual = jest.requireActual("../../services/secret");
	Object.assign(actual.default, {
		createSecret: jest.fn(),
		writeSecret: jest.fn(),
	});
	return actual;
});
jest.mock("../../services/offline-cache", () => ({ isActive: () => false }));
jest.mock("../../services/file-transfer", () => ({
	...jest.requireActual("../../services/file-transfer").default,
	readShards: jest.fn().mockResolvedValue([]),
	createFile: jest.fn(),
	upload: jest.fn(),
	deleteFile: jest.fn(),
}));
jest.mock("../../services/file-repository", () => ({
	...jest.requireActual("../../services/file-repository").default,
	readFileRepositories: jest.fn().mockResolvedValue([]),
}));
jest.mock("../markdown-notes-field", () => () => null);
jest.mock("../totp-circle", () => () => null);
jest.mock("./decrypt-gpg-message", () => () => null);
jest.mock("./encrypt-gpg-message", () => () => null);
jest.mock("./generate-new-gpg-key", () => () => null);
jest.mock("./generate-new-ssh-key", () => () => null);
jest.mock("./import-gpg-key-as-text", () => () => null);
jest.mock("../select-field/entry-type", () => {
	const React = jest.requireActual<typeof import("react")>("react");
	return (props: { value: string; onChange: (value: string) => void }) => (
		<select
			name="entryType"
			value={props.value}
			onChange={(event) => props.onChange(event.target.value)}
		>
			<option value="website_password">Website password</option>
			<option value="totp">Authenticator</option>
			<option value="file">File</option>
		</select>
	);
});
jest.mock(
	"../select-field/file-destination",
	() => (props: { onChange: (value: unknown) => void }) => (
		<button
			type="button"
			onClick={() => props.onChange({ id: "shard", destination_type: "shard" })}
		>
			SELECT_STORAGE
		</button>
	),
);

const theme = createTheme({
	palette: { checked: { main: "#008000" }, greyText: { main: "#808080" } },
});
const filter = "example.com, login.example.org";
const secret: EntrySecretData = {
	totp_title: "Example account",
	totp_code: "JBSWY3DPEHPK3PXP",
	totp_period: 30,
	totp_digits: 6,
	totp_algorithm: "SHA1",
};

function input(name: string) {
	const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(
		`[name="${name}"]`,
	);
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
		(candidate) => candidate.textContent === label,
	);
	if (!element) throw new Error(`Missing button: ${label}`);
	return element;
}

function selectAlgorithm(algorithm: string) {
	act(() => {
		Simulate.mouseDown(input("totpAlgorithm"));
	});
	const option = Array.from(
		document.querySelectorAll<HTMLElement>('[role="option"]'),
	).find((element) => element.textContent === algorithm);
	if (!option) throw new Error(`Missing algorithm: ${algorithm}`);
	act(() => option.click());
}

async function saveAndClose() {
	act(() => {
		document
			.querySelector<HTMLButtonElement>('button[aria-label="SAVE_AND_CLOSE"]')!
			.click();
	});
	await act(async () => {
		Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
			.find((item) => item.textContent === "SAVE_AND_CLOSE")!
			.click();
	});
}

describe("DialogNewEntry", () => {
	let container: HTMLDivElement;
	const onCreate = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest
			.mocked(secretService.createSecret)
			.mockResolvedValue({ secret_id: "secret-id", secret_key: "secret-key" });
		jest
			.mocked(secretService.writeSecret)
			.mockResolvedValue({ secret_id: "secret-id" });
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

	function renderNewTotp() {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogNewEntry
						open
						onClose={() => {}}
						onCreate={onCreate}
						parentDatastoreId="datastore-id"
					/>
				</ThemeProvider>,
				container,
			);
		});
		change("entryType", "totp");
		change("totpTitle", secret.totp_title!);
	}

	it.each([
		false,
		true,
	])("cleans up the standalone file link and remains retryable (cleanup fails: %s)", async (cleanupFails) => {
		renderNewTotp();
		change("entryType", "file");
		act(() => button("SELECT_STORAGE").click());
		act(() => {
			const fileInput =
				document.querySelector<HTMLInputElement>('input[type="file"]')!;
			Object.defineProperty(fileInput, "files", {
				value: [new File(["content"], "example.txt")],
			});
			Simulate.change(fileInput);
		});
		jest
			.spyOn(FileReader.prototype, "readAsArrayBuffer")
			.mockImplementation(function (this: FileReader) {
				Object.defineProperty(this, "result", {
					value: new Uint8Array([1, 2, 3]).buffer,
				});
				this.dispatchEvent(new ProgressEvent("load"));
			});
		jest
			.spyOn(cryptoLibrary, "encryptFile")
			.mockResolvedValue(new Uint8Array([4, 5, 6]));
		jest.mocked(fileTransferService.createFile).mockResolvedValue({
			file_id: "file",
			file_transfer_id: "transfer",
			file_transfer_secret_key: "key",
		});
		const deleteFileLink = jest.spyOn(apiClient, "deleteFileLink");
		if (cleanupFails)
			deleteFileLink.mockRejectedValueOnce(new Error("offline"));
		else deleteFileLink.mockResolvedValueOnce({ data: {} });
		jest
			.mocked(fileTransferService.upload)
			.mockRejectedValueOnce(new Error("HTTP 500"));
		await act(async () => button("SAVE").click());
		expect(onCreate).not.toHaveBeenCalled();
		const linkId = jest.mocked(fileTransferService.createFile).mock.calls[0][4];
		expect(linkId).toEqual(expect.any(String));
		expect(deleteFileLink).toHaveBeenCalledWith(undefined, undefined, linkId);
		expect(deleteFileLink).toHaveBeenCalledTimes(1);
		expect(fileTransferService.deleteFile).not.toHaveBeenCalled();
		expect(document.body.textContent).toContain("UPLOAD_FAILED");
		expect(button("SAVE").disabled).toBe(false);
		jest.mocked(fileTransferService.upload).mockResolvedValue(undefined);
		await act(async () => button("SAVE").click());
		expect(fileTransferService.createFile).toHaveBeenCalledTimes(2);
		expect(onCreate).toHaveBeenCalledTimes(1);
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({ type: "file", file_id: "file" }),
			false,
		);
		expect(deleteFileLink).toHaveBeenCalledTimes(1);
	});

	it("creates a standalone TOTP from a URI with standard defaults", async () => {
		renderNewTotp();
		change("totpPeriod", "60");
		change("totpDigits", "8");
		selectAlgorithm("SHA512");
		change(
			"totpUri",
			"  otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example  ",
		);
		expect(input("totpPeriod").value).toBe("30");
		expect(input("totpDigits").value).toBe("6");
		expect(input("totpAlgorithm").value).toBe("SHA1");
		expect(input("totpCode").value).toBe(secret.totp_code);
		await act(async () => button("SAVE").click());
		expect(
			jest.mocked(secretService.createSecret).mock.calls[0][0],
		).toMatchObject(secret);
	});

	it.each([
		[
			"psonoclient.chickahoona.com:demo@psonoclient.chickahoona.com",
			"",
			"psonoclient.chickahoona.com",
		],
		["demo@example.com", "&issuer=Example%20Company", "Example Company"],
		["Example%20Company%3Ademo%40example.com", "", "Example Company"],
		["demo%40example.com", "", "demo@example.com"],
	])("fills an empty title from the URI label %s and issuer %s", async (label, issuer, title) => {
		renderNewTotp();
		change("totpTitle", "");
		change(
			"totpUri",
			`otpauth://totp/${label}?secret=P7XI7NYPR3S7UT4S${issuer}`,
		);
		expect(input("totpTitle").value).toBe(title);
		await act(async () => button("SAVE").click());
		expect(
			jest.mocked(secretService.createSecret).mock.calls[0][0],
		).toMatchObject({
			totp_title: title,
			totp_code: "P7XI7NYPR3S7UT4S",
		});
	});

	it("preserves an existing title when pasting a URI", () => {
		renderNewTotp();
		change(
			"totpUri",
			"otpauth://totp/Example:demo@example.com?secret=P7XI7NYPR3S7UT4S",
		);
		expect(input("totpTitle").value).toBe(secret.totp_title);
	});

	it("only suggests a title from a valid pasted URI", () => {
		renderNewTotp();
		change("totpTitle", "");
		change(
			"totpUri",
			"otpauth://totp/Example:demo@example.com?secret=INVALID!",
		);
		expect(input("totpTitle").value).toBe("");
		change("totpCode", secret.totp_code!);
		expect(input("totpTitle").value).toBe("");
	});

	it.each([
		"abc",
		"AbC",
		"MY======",
		"jbswy3dpehpk3pxp",
	])("preserves the pasted secret %s through URI updates and saving", async (code) => {
		renderNewTotp();
		change(
			"totpUri",
			`otpauth://totp/TOTP?secret=${code}&period=30&algorithm=SHA1&digits=6`,
		);
		expect(input("totpCode").value).toBe(code);
		expect(new URL(input("totpUri").value).searchParams.get("secret")).toBe(
			code,
		);
		change("totpPeriod", "60");
		expect(new URL(input("totpUri").value).searchParams.get("secret")).toBe(
			code,
		);
		await act(async () => button("SAVE").click());
		expect(
			jest.mocked(secretService.createSecret).mock.calls[0][0],
		).toMatchObject({ totp_code: code, totp_period: 60 });
	});

	it("saves changes to every TOTP parameter during creation", async () => {
		renderNewTotp();
		change(
			"totpUri",
			"otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=SHA256&digits=8&period=60",
		);
		change("totpPeriod", "45");
		change("totpDigits", "7");
		selectAlgorithm("SHA512");
		change("totpCode", "GEZDGNBV GY3TQOJQ");
		await act(async () => button("SAVE").click());
		expect(
			jest.mocked(secretService.createSecret).mock.calls[0][0],
		).toMatchObject({
			totp_code: "GEZDGNBVGY3TQOJQ",
			totp_period: 45,
			totp_digits: 7,
			totp_algorithm: "SHA512",
		});
	});

	it.each<[string, boolean]>([
		["", false],
		[filter, false],
		["", true],
		[filter, true],
	])("creates an authenticator with optional filter %p (close: %p)", async (urlFilter, close) => {
		renderNewTotp();
		change("totpCode", secret.totp_code!);
		act(() => button("ADVANCED").click());
		change("totpUrlFilter", urlFilter);
		if (close) {
			await saveAndClose();
		} else {
			await act(async () => button("SAVE").click());
		}
		expect(secretService.createSecret).toHaveBeenCalledTimes(1);
		expect(
			jest.mocked(secretService.createSecret).mock.calls[0][0],
		).toMatchObject(secret);
		const content = jest.mocked(secretService.createSecret).mock.calls[0][0];
		if (urlFilter) {
			expect(content).toHaveProperty("totp_url_filter", urlFilter);
		} else {
			expect(content).not.toHaveProperty("totp_url_filter");
		}
		expect(onCreate).toHaveBeenCalledTimes(1);
		expect(onCreate.mock.calls[0][0].urlfilter).toBe(urlFilter || undefined);
		expect(onCreate.mock.calls[0][1]).toBe(close);
	});
});
