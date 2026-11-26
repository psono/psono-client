import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import linkCleanup, {
	LinkCleanupError,
	type LinkCleanupResult,
} from "../services/secret-link";
import LinkCleanup from "./link-cleanup";

let mockOffline = false;
let mockSupported = true;
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) =>
		selector({ server: {} }),
}));
jest.mock("../services/host", () => ({
	__esModule: true,
	default: { supportsSecretLinkCleanup: () => mockSupported },
}));
jest.mock("./use-offline-mode", () => ({ useOfflineMode: () => mockOffline }));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, values: Record<string, unknown> = {}) => {
			const translations = jest.requireActual<Record<string, string>>(
				"../../common/data/translations/locale-en.json",
			);
			return (translations[key] ?? String(values.defaultValue ?? key)).replace(
				/{{(\w+)}}/g,
				(_, name: string) => String(values[name]),
			);
		},
	}),
}));
jest.mock("../services/secret-link", () => ({
	__esModule: true,
	LinkCleanupError: class extends Error {
		result: LinkCleanupResult;
		details?: string;
		constructor(message: string, value: LinkCleanupResult, details?: string) {
			super(message);
			this.result = value;
			this.details = details;
		}
	},
	default: { cleanup: jest.fn() },
}));

describe("manual secret link cleanup", () => {
	let container: HTMLDivElement;
	beforeEach(() => {
		jest.clearAllMocks();
		mockOffline = false;
		mockSupported = true;
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
				<ThemeProvider theme={createTheme()}>
					<LinkCleanup />
				</ThemeProvider>,
				container,
			);
		});
	}
	const button = () => container.querySelector("button")!;

	it("shows the decrypted error code and request path when cleanup fails", async () => {
		jest
			.mocked(linkCleanup.cleanup)
			.mockRejectedValueOnce(
				new LinkCleanupError(
					"LINK_CLEANUP_FAILED",
					{ moved: 0, deleted: 0, skipped: 0 },
					"GET /share/example/: REQUEST_TIME_TOO_OLD",
				),
			);
		await render();
		await act(async () => {
			button().click();
		});
		expect(container.textContent).toContain(
			"GET /share/example/: REQUEST_TIME_TOO_OLD",
		);
	});

	it("silently skips inaccessible shares and only shows the cleanup summary", async () => {
		jest.mocked(linkCleanup.cleanup).mockResolvedValueOnce({
			moved: 1,
			deleted: 0,
			skipped: 2,
			unavailableShares: ["denied-share"],
		});
		await render();
		await act(async () => {
			button().click();
		});
		expect(container.textContent).not.toContain("denied-share");
		expect(container.textContent).not.toContain("These shares no longer exist");
		expect(container.textContent).toContain(
			"Links moved: 1. Stale links removed: 0. Links skipped: 2.",
		);
		expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1);
	});

	it("hides the cleanup section on unsupported servers without starting a scan", async () => {
		mockSupported = false;
		await render();
		expect(container.querySelector("section")).toBeNull();
		expect(container.querySelector("button")).toBeNull();
		expect(linkCleanup.cleanup).not.toHaveBeenCalled();
		mockSupported = true;
		await render();
		expect(button().textContent).toBe("Clean up secret links");
		expect(linkCleanup.cleanup).not.toHaveBeenCalled();
	});

	it("only starts after a click and shows progress until repairs finish", async () => {
		let finish!: (result: LinkCleanupResult) => void;
		jest.mocked(linkCleanup.cleanup).mockImplementation((onProgress) => {
			onProgress?.({
				phase: "repair",
				completed: 1,
				total: 4,
				moved: 1,
				deleted: 0,
				skipped: 0,
			});
			return new Promise((resolve) => {
				finish = resolve;
			});
		});
		await render();
		expect(linkCleanup.cleanup).not.toHaveBeenCalled();
		await act(async () => {
			button().click();
		});
		expect(linkCleanup.cleanup).toHaveBeenCalledTimes(1);
		expect(button().disabled).toBe(true);
		expect(container.textContent).toContain("Repairing secret links… 1 of 4.");
		await act(async () => {
			button().click();
		});
		expect(linkCleanup.cleanup).toHaveBeenCalledTimes(1);
		await act(async () => {
			finish({ moved: 2, deleted: 2, skipped: 1 });
		});
		expect(button().disabled).toBe(false);
		expect(container.querySelector("[role=progressbar]")).toBeNull();
		expect(container.textContent).toContain(
			"Links moved: 2. Stale links removed: 2. Links skipped: 1.",
		);
	});

	it("disables cleanup when browsing offline", async () => {
		mockOffline = true;
		await render();
		expect(button().disabled).toBe(true);
		await act(async () => {
			button().click();
		});
		expect(linkCleanup.cleanup).not.toHaveBeenCalled();
	});

	it("reports failures with completed repairs and allows a retry", async () => {
		jest
			.mocked(linkCleanup.cleanup)
			.mockRejectedValueOnce(
				new LinkCleanupError("LINK_CLEANUP_FAILED", {
					moved: 1,
					deleted: 2,
					skipped: 0,
				}),
			)
			.mockResolvedValueOnce({ moved: 0, deleted: 0, skipped: 0 });
		await render();
		await act(async () => {
			button().click();
		});
		expect(container.textContent).toContain(
			"Secret link cleanup could not be completed.",
		);
		expect(container.textContent).toContain(
			"Links moved: 1. Stale links removed: 2.",
		);
		expect(button().disabled).toBe(false);
		await act(async () => {
			button().click();
		});
		expect(container.textContent).not.toContain(
			"Secret link cleanup could not be completed.",
		);
		expect(container.textContent).toContain(
			"Links moved: 0. Stale links removed: 0.",
		);
	});
});
