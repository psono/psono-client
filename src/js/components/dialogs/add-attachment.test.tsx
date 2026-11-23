import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import apiClient from "../../services/api-client";
import notification from "../../services/notification";
import DialogAddAttachment from "./add-attachment";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../i18n", () => ({ t: (key: string) => key }));
jest.mock("../../services/store", () => ({
	getStore: () => ({ getState: () => ({ user: {} }) }),
}));
jest.mock("../../services/api-client", () => ({
	createFile: jest.fn(),
	deleteFile: jest.fn(),
}));
jest.mock("../../services/crypto-library", () => ({
	generateSecretKey: () => "key",
	encryptFile: async () => new Uint8Array([1, 2, 3]),
	sha512: () => "hash",
	encryptData: () => ({ text: "ticket", nonce: "nonce" }),
}));
jest.mock("../../services/notification", () => ({ push: jest.fn() }));
jest.mock(
	"../select-field/file-destination",
	() => (props: { onChange: (value: unknown) => void }) => (
		<button
			type="button"
			onClick={() =>
				props.onChange({
					id: "shard",
					destination_type: "shard",
					fileserver: [{ fileserver_url: "https://files.example" }],
				})
			}
		>
			SELECT_STORAGE
		</button>
	),
);

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = globalThis.fetch;
const theme = createTheme();

function click(label: string) {
	const button = Array.from(document.querySelectorAll("button")).find(
		(element) => element.textContent === label,
	);
	if (!button) throw new Error(`Missing ${label}`);
	button.click();
}

describe("attachment upload failure handling through the Fileserver transport", () => {
	let container: HTMLDivElement;
	const onClose = jest.fn();
	beforeEach(async () => {
		jest.clearAllMocks();
		fetchMock.mockReset();
		globalThis.fetch = fetchMock;
		jest.spyOn(console, "error").mockImplementation(() => {});
		jest.mocked(apiClient.createFile).mockResolvedValue({
			data: {
				file_id: "file",
				file_transfer_id: "transfer",
				file_transfer_secret_key: "transfer-key",
			},
		});
		jest.mocked(apiClient.deleteFile).mockResolvedValue({ data: {} });
		container = document.createElement("div");
		document.body.appendChild(container);
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogAddAttachment
						open
						item={{ secret_id: "secret" }}
						onClose={onClose}
					/>
				</ThemeProvider>,
				container,
			);
		});
		act(() => click("SELECT_STORAGE"));
		selectFile(new File(["content"], "example.txt"));
	});
	function selectFile(file: File) {
		act(() => {
			const input =
				document.querySelector<HTMLInputElement>('input[type="file"]')!;
			Object.defineProperty(input, "files", {
				configurable: true,
				value: [file],
			});
			Simulate.change(input);
		});
	}
	async function upload() {
		const completed = onClose.mock.calls.length;
		act(() => click("ADD"));
		await act(async () => {
			// FileReader completes in a separate task, after the click handler returns.
			for (let attempt = 0; attempt < 100; attempt++) {
				if (
					document.querySelector('[role="alert"]') ||
					onClose.mock.calls.length > completed
				)
					return;
				await new Promise((resolve) => setTimeout(resolve, 10));
			}
			throw new Error("Upload did not settle");
		});
	}
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		globalThis.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it.each([
		400, 403, 500, 503,
	])("shows an error and never returns a completed attachment for HTTP %s", async (status) => {
		fetchMock.mockResolvedValue({ ok: false, status } as Response);
		await upload();
		expect(document.querySelector('[role="alert"]')?.textContent).toBe(
			"UPLOAD_FAILED",
		);
		expect(onClose).not.toHaveBeenCalled();
		expect(notification.push).not.toHaveBeenCalled();
		expect(apiClient.deleteFile).toHaveBeenCalledWith(
			undefined,
			undefined,
			"file",
		);
		act(() => click("CLOSE"));
		expect(onClose).toHaveBeenCalledWith(null);
	});

	it.each([
		new TypeError("Network interrupted"),
		new DOMException("Timed out", "TimeoutError"),
	])("shows transport failures and remains retryable: %s", async (error) => {
		fetchMock.mockRejectedValueOnce(error);
		await upload();
		expect(document.querySelector('[role="alert"]')).not.toBeNull();
		expect(onClose).not.toHaveBeenCalled();
		fetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);
		await upload();
		expect(document.querySelector('[role="alert"]')).toBeNull();
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith(
			expect.objectContaining({
				filename: "example.txt",
				file_chunks: [{ hash: "hash", position: 1 }],
			}),
		);
		expect(apiClient.createFile).toHaveBeenCalledTimes(2);
	});

	it("stops after a partial multi-chunk upload and retries from a fresh transfer", async () => {
		const file = new File(["small synthetic chunk"], "large.txt");
		// Exercise chunk boundaries without allocating hundreds of megabytes.
		Object.defineProperty(file, "size", { value: 3 * 128 * 1024 * 1024 });
		jest.spyOn(file, "slice").mockImplementation(() => new Blob(["chunk"]));
		selectFile(file);
		fetchMock
			.mockResolvedValueOnce({ ok: true, status: 201 } as Response)
			.mockResolvedValueOnce({ ok: false, status: 500 } as Response);
		await upload();
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(onClose).not.toHaveBeenCalled();
		expect(document.querySelector('[role="alert"]')).not.toBeNull();
		expect(apiClient.deleteFile).toHaveBeenCalledTimes(1);
		jest.mocked(apiClient.createFile).mockResolvedValue({
			data: {
				file_id: "retry-file",
				file_transfer_id: "retry-transfer",
				file_transfer_secret_key: "retry-key",
			},
		});
		fetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);
		await upload();
		expect(fetchMock).toHaveBeenCalledTimes(5);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith(
			expect.objectContaining({
				file_id: "retry-file",
				file_chunks: [
					{ hash: "hash", position: 1 },
					{ hash: "hash", position: 2 },
					{ hash: "hash", position: 3 },
				],
			}),
		);
		expect(
			(fetchMock.mock.calls[2][1]?.body as FormData).get("file_transfer_id"),
		).toBe("retry-transfer");
	});

	it("still reports upload failure when best-effort cleanup also fails", async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);
		jest
			.mocked(apiClient.deleteFile)
			.mockRejectedValueOnce(new TypeError("offline"));
		await upload();
		expect(document.querySelector('[role="alert"]')?.textContent).toBe(
			"UPLOAD_FAILED",
		);
		expect(onClose).not.toHaveBeenCalled();
	});
});
