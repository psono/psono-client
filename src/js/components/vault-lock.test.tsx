import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import type { AppState } from "../../types/state";
import type { LockConfiguration } from "../services/vault-lock";
import vaultLock from "../services/vault-lock";
import { LockSettings, VaultGate } from "./vault-lock";

let mockState: Pick<AppState, "user" | "server">;
let mockConfiguration: LockConfiguration;
let mockLocked = false;
let mockSupported = true;
const mockLockListeners = new Set<() => void>();
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) =>
			jest.requireActual<Record<string, string>>(
				"../../common/data/translations/locale-en.json",
			)[key] || key,
	}),
}));
jest.mock("../services/vault-lock", () => ({
	__esModule: true,
	LOCK_UNAVAILABLE: "LOCK_UNAVAILABLE",
	LOCK_REQUIRED_UNAVAILABLE: "LOCK_REQUIRED_UNAVAILABLE",
	default: {
		getConfiguration: () => mockConfiguration,
		isLocked: () => mockLocked,
		isSupported: async () => mockSupported,
		getSupport: async () => ({
			supported: mockSupported,
			checks: [
				{
					name: "LOCK_CHECK_PLATFORM",
					status: mockSupported ? "available" : "unavailable",
				},
			],
		}),
		subscribe: (listener: () => void) => {
			mockLockListeners.add(listener);
			return () => {
				mockLockListeners.delete(listener);
			};
		},
		touch: jest.fn(),
		unlock: jest.fn(async () => {}),
		update: jest.fn(async () => {}),
		lock: jest.fn(),
		enable: jest.fn(async () => {}),
	},
}));
jest.mock("../services/offline-cache", () => ({
	__esModule: true,
	default: { incrementalUpdate: async () => {} },
}));
jest.mock("../services/user", () => ({
	__esModule: true,
	isLogoutPage: (route: string) =>
		globalThis.location.pathname.endsWith("/logout-success.html") ||
		route === "/logout",
	default: { logout: jest.fn(async () => {}) },
}));
jest.mock("./dialogs/change-account", () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock("./config-logo", () => () => null);

const theme = createTheme({
	palette: {
		blueBackground: { main: "#151f2b" },
		lightGreyText: { main: "#b1b6c1" },
		lightBackground: { main: "#ffffff" },
		greyText: { main: "#666666" },
	},
});
const testGlobals = globalThis as typeof globalThis & { TARGET: typeof TARGET };

describe("vault access gate", () => {
	const originalTarget = testGlobals.TARGET;
	const originalBrowser = globalThis.browser;
	const originalUrl = window.location.href;
	let container: HTMLDivElement;
	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		jest.clearAllMocks();
		jest.mocked(vaultLock.enable).mockReset().mockResolvedValue(undefined);
		jest.mocked(vaultLock.update).mockReset().mockResolvedValue(undefined);
		jest.mocked(vaultLock.unlock).mockReset().mockResolvedValue(undefined);
		mockLocked = false;
		mockSupported = true;
		mockConfiguration = { enabled: false, keyId: "key-id", timeout: 60 };
		mockState = {
			user: { isLoggedIn: true, username: "alice" },
			server: { complianceEnforceLocking: false },
		} as Pick<AppState, "user" | "server">;
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		window.history.replaceState({}, "", originalUrl);
		testGlobals.TARGET = originalTarget;
		globalThis.browser = originalBrowser;
		jest.restoreAllMocks();
	});
	async function render(element: React.ReactElement, route = "/") {
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<MemoryRouter initialEntries={[route]}>{element}</MemoryRouter>
				</ThemeProvider>,
				container,
			);
		});
		return container;
	}
	function configureBrowser(
		target: typeof TARGET,
		path: string,
		createTab: jest.Mock,
	) {
		testGlobals.TARGET = target;
		window.history.replaceState({}, "", path);
		globalThis.browser = {
			tabs: { create: createTab },
			runtime: { getURL: (file: string) => `moz-extension://test-id/${file}` },
		} as unknown as typeof browser;
		mockConfiguration.enabled = true;
		mockLocked = true;
		mockState.user.isLoggedIn = false;
		return jest.spyOn(window, "close").mockImplementation(() => {});
	}

	it.each([
		["/data/logout-success.html", "/"],
		["/index.html", "/logout"],
	])("allows logout without unlocking at %s and %s", async (path, route) => {
		window.history.replaceState({}, "", path);
		mockConfiguration.enabled = true;
		mockLocked = true;
		mockState.user.isLoggedIn = false;
		mockState.server.complianceEnforceLocking = true;
		const view = await render(
			<VaultGate>
				<div data-logout="true">Signing out</div>
			</VaultGate>,
			route,
		);
		expect(view.querySelector('[data-logout="true"]')).not.toBeNull();
		expect(view.textContent).not.toContain("Vault locked");
		expect(vaultLock.unlock).not.toHaveBeenCalled();
		expect(vaultLock.enable).not.toHaveBeenCalled();
	});

	it("hands Firefox popup unlocking to a real tab without starting WebAuthn in the popup", async () => {
		let finish!: (tab: object) => void;
		const createTab = jest.fn(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		const closePopup = configureBrowser(
			"firefox",
			"/data/default_popup.html",
			createTab,
		);
		const screen = (
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>
		);
		const view = await render(screen);
		expect(createTab).toHaveBeenCalledWith({
			url: "moz-extension://test-id/data/index.html",
			active: true,
		});
		expect(closePopup).not.toHaveBeenCalled();
		expect(vaultLock.unlock).not.toHaveBeenCalled();
		expect(view.querySelector('[data-secret="private"]')).toBeNull();
		await render(screen);
		act(() => {
			Array.from(view.querySelectorAll("button"))
				.find((button) => button.textContent === "Unlock")!
				.click();
		});
		expect(createTab).toHaveBeenCalledTimes(1);
		await act(async () => {
			finish({ id: 1 });
		});
		expect(closePopup).toHaveBeenCalledTimes(1);
		expect(vaultLock.unlock).not.toHaveBeenCalled();
	});

	it("keeps the Firefox popup open and allows retry when tab creation fails", async () => {
		const createTab = jest
			.fn()
			.mockRejectedValueOnce(new Error("Tab creation failed"));
		const closePopup = configureBrowser(
			"firefox",
			"/data/default_popup.html",
			createTab,
		);
		jest.spyOn(console, "error").mockImplementation(() => {});
		const view = await render(
			<VaultGate>
				<div>Secret</div>
			</VaultGate>,
		);
		expect(closePopup).not.toHaveBeenCalled();
		createTab.mockResolvedValueOnce({ id: 1 });
		await act(async () => {
			Array.from(view.querySelectorAll("button"))
				.find((button) => button.textContent === "Unlock")!
				.click();
		});
		expect(createTab).toHaveBeenCalledTimes(2);
		expect(closePopup).toHaveBeenCalledTimes(1);
		expect(vaultLock.unlock).not.toHaveBeenCalled();
	});

	it.each([
		["firefox", "/data/index.html"],
		["chrome", "/data/default_popup.html"],
		["webclient", "/index.html"],
	] as const)("unlocks directly for %s at %s", async (target, path) => {
		const createTab = jest.fn();
		const closePopup = configureBrowser(target, path, createTab);
		const view = await render(
			<VaultGate>
				<div>Secret</div>
			</VaultGate>,
		);
		await act(async () => {
			Array.from(view.querySelectorAll("button"))
				.find((button) => button.textContent === "Unlock")!
				.click();
		});
		expect(vaultLock.unlock).toHaveBeenCalledTimes(1);
		expect(createTab).not.toHaveBeenCalled();
		expect(closePopup).not.toHaveBeenCalled();
	});

	it("does not redirect an already unlocked Firefox popup", async () => {
		const createTab = jest.fn();
		const closePopup = configureBrowser(
			"firefox",
			"/data/default_popup.html",
			createTab,
		);
		mockLocked = false;
		mockState.user.isLoggedIn = true;
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector('[data-secret="private"]')).not.toBeNull();
		expect(createTab).not.toHaveBeenCalled();
		expect(closePopup).not.toHaveBeenCalled();
	});

	it("unmounts vault content while locked and exposes the device unlock action", async () => {
		mockConfiguration.enabled = true;
		mockLocked = true;
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector("[data-secret]")).toBeNull();
		expect(view.querySelector("h5")?.textContent).toBe("Vault locked");
		const unlock = Array.from(view.querySelectorAll("button")).find(
			(button) => button.textContent === "Unlock",
		)!;
		await act(async () => {
			unlock.click();
		});
		expect(vaultLock.unlock).toHaveBeenCalledTimes(1);
	});

	it("allows continuing without locking when optional setup is unsupported", async () => {
		mockSupported = false;
		const view = await render(<LockSettings setup />);
		const button = Array.from(view.querySelectorAll("button")).find(
			(button) => button.textContent === "Continue without automatic locking",
		)!;
		expect(button.disabled).toBe(false);
	});

	it("keeps unsupported locking visible and disabled in General settings", async () => {
		mockSupported = false;
		const view = await render(<LockSettings />);
		expect(view.textContent).toContain("Automatic locking");
		expect(view.textContent).toContain(
			"Platform authenticator with user verification: Unavailable",
		);
		expect(
			view.querySelector<HTMLInputElement>('input[type="checkbox"]')!.disabled,
		).toBe(true);
	});

	it("prevents enforced vault access when platform PRF support is missing", async () => {
		mockState.server.complianceEnforceLocking = true;
		mockSupported = false;
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector("[data-secret]")).toBeNull();
		expect(view.querySelector('[role="alert"]')).not.toBeNull();
		expect(view.querySelectorAll("input")).toHaveLength(0);
	});

	it("uses an enable button instead of a toggle on the required setup screen", async () => {
		mockState.server.complianceEnforceLocking = true;
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector('input[type="checkbox"]')).toBeNull();
		const enable = view.querySelector<HTMLButtonElement>(
			'button[aria-label="Enable automatic locking"]',
		);
		expect(enable).not.toBeNull();
		expect(enable!.disabled).toBe(false);
		expect(view.querySelector('[data-secret="private"]')).toBeNull();
		expect(view.textContent).not.toContain(
			"Continue without automatic locking",
		);
	});

	it("disables enrollment and shows a loader while pending, prevents duplicate prompts, and allows retry after cancellation", async () => {
		mockState.server.complianceEnforceLocking = true;
		let cancel!: (error: Error) => void;
		jest.mocked(vaultLock.enable).mockImplementation(
			() =>
				new Promise((_resolve, reject) => {
					cancel = reject;
				}),
		);
		const view = await render(
			<VaultGate>
				<div>Secret</div>
			</VaultGate>,
		);
		const enable = view.querySelector<HTMLButtonElement>(
			'button[aria-label="Enable automatic locking"]',
		)!;
		act(() => {
			enable.click();
			enable.click();
		});
		expect(vaultLock.enable).toHaveBeenCalledTimes(1);
		expect(enable.disabled).toBe(true);
		expect(enable.getAttribute("aria-busy")).toBe("true");
		expect(view.querySelector('[role="progressbar"]')).not.toBeNull();
		expect(
			view.querySelector<HTMLInputElement>('input[type="number"]')!.disabled,
		).toBe(true);
		await act(async () => {
			cancel(new DOMException("Verification cancelled", "NotAllowedError"));
		});
		expect(enable.disabled).toBe(false);
		expect(view.querySelector('[role="progressbar"]')).toBeNull();
		expect(
			view.querySelector<HTMLInputElement>('input[type="number"]')!.disabled,
		).toBe(false);
		expect(view.textContent).toContain("Verification cancelled");
		jest.mocked(vaultLock.enable).mockResolvedValue(undefined);
		await act(async () => enable.click());
		expect(vaultLock.enable).toHaveBeenCalledTimes(2);
	});

	it("leaves required setup once enrollment succeeds", async () => {
		mockState.server.complianceEnforceLocking = true;
		jest.mocked(vaultLock.enable).mockImplementation(async () => {
			mockConfiguration = { ...mockConfiguration, enabled: true };
			for (const listener of mockLockListeners) listener();
		});
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		await act(async () =>
			view
				.querySelector<HTMLButtonElement>(
					'button[aria-label="Enable automatic locking"]',
				)!
				.click(),
		);
		expect(view.querySelector('[data-secret="private"]')).not.toBeNull();
		expect(
			view.querySelector('button[aria-label="Enable automatic locking"]'),
		).toBeNull();
	});

	it("keeps the toggle and timeout save action in general settings", async () => {
		mockState.server.complianceEnforceLocking = true;
		mockConfiguration.enabled = true;
		const view = await render(<LockSettings />);
		const toggle = view.querySelector<HTMLInputElement>(
			'input[type="checkbox"]',
		)!;
		expect(toggle.checked).toBe(true);
		expect(toggle.disabled).toBe(true);
		expect(
			view.querySelector('button[aria-label="Enable automatic locking"]'),
		).toBeNull();
		expect(
			Array.from(view.querySelectorAll("button")).some(
				(button) => button.textContent === "Save",
			),
		).toBe(true);
	});

	it("defaults timeout action to Lock and saves Logout with the timeout", async () => {
		mockConfiguration.enabled = true;
		const view = await render(<LockSettings />);
		const action = view.querySelector<HTMLInputElement>(
			".MuiSelect-nativeInput",
		)!;
		expect(action.value).toBe("LOCK");
		act(() => {
			action.value = "LOGOUT";
			Simulate.change(action);
		});
		await act(async () => {
			Array.from(view.querySelectorAll("button"))
				.find((button) => button.textContent === "Save")!
				.click();
		});
		expect(vaultLock.update).toHaveBeenCalledWith(
			true,
			60,
			false,
			undefined,
			"LOGOUT",
		);
	});

	it("permits vault access when optional locking is disabled", async () => {
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector("[data-secret]")).not.toBeNull();
	});

	it("honors the remembered locking preference on a fresh login", async () => {
		mockConfiguration.requested = true;
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector("[data-secret]")).toBeNull();
		expect(view.querySelector("h5")?.textContent).toBe(
			"Configure automatic locking",
		);
		expect(view.querySelector("h6")).toBeNull();
		expect(view.querySelector("p")?.textContent).toMatch(
			/^With automatic locking enabled/,
		);
		expect(view.querySelector('input[type="checkbox"]')).toBeNull();
		const enable = view.querySelector<HTMLButtonElement>(
			'button[aria-label="Enable automatic locking"]',
		)!;
		const skip = Array.from(view.querySelectorAll("button")).find(
			(button) => button.textContent === "Continue without automatic locking",
		)!;
		expect(enable.parentElement).toBe(skip.parentElement);
		expect(enable.parentElement!.querySelectorAll("button")[0]).toBe(enable);
		expect(enable.parentElement!.querySelectorAll("button")[1]).toBe(skip);
	});

	it("continues without locking and clears the remembered request without prompting for WebAuthn", async () => {
		mockConfiguration.requested = true;
		jest.mocked(vaultLock.update).mockImplementation(async () => {
			mockConfiguration = { ...mockConfiguration, requested: false };
			for (const listener of mockLockListeners) listener();
		});
		const view = await render(
			<VaultGate>
				<div data-secret="private">Secret</div>
			</VaultGate>,
		);
		// Opting out must not be blocked by an unfinished/invalid timeout edit.
		act(() => {
			const timeout = view.querySelector<HTMLInputElement>(
				'input[type="number"]',
			)!;
			timeout.value = "0";
			Simulate.change(timeout);
		});
		await act(async () => {
			Array.from(view.querySelectorAll("button"))
				.find(
					(button) =>
						button.textContent === "Continue without automatic locking",
				)!
				.click();
		});
		expect(vaultLock.update).toHaveBeenCalledWith(
			false,
			60,
			false,
			undefined,
			"LOCK",
		);
		expect(vaultLock.enable).not.toHaveBeenCalled();
		expect(view.querySelector('[data-secret="private"]')).not.toBeNull();
	});

	it("disables both optional setup choices while enrollment is running", async () => {
		mockConfiguration.requested = true;
		let cancel!: (error: Error) => void;
		jest.mocked(vaultLock.enable).mockImplementation(
			() =>
				new Promise((_resolve, reject) => {
					cancel = reject;
				}),
		);
		const view = await render(
			<VaultGate>
				<div>Secret</div>
			</VaultGate>,
		);
		const enable = view.querySelector<HTMLButtonElement>(
			'button[aria-label="Enable automatic locking"]',
		)!;
		const skip = Array.from(view.querySelectorAll("button")).find(
			(button) => button.textContent === "Continue without automatic locking",
		)!;
		act(() => enable.click());
		expect(enable.disabled).toBe(true);
		expect(skip.disabled).toBe(true);
		act(() => skip.click());
		expect(vaultLock.update).not.toHaveBeenCalled();
		expect(view.querySelector('[role="progressbar"]')).not.toBeNull();
		await act(async () => {
			cancel(new DOMException("Cancelled", "NotAllowedError"));
		});
		expect(enable.disabled).toBe(false);
		expect(skip.disabled).toBe(false);
	});

	it("explains unavailable optional locking and still permits continuing", async () => {
		mockConfiguration.requested = true;
		mockSupported = false;
		const view = await render(
			<VaultGate>
				<div>Secret</div>
			</VaultGate>,
		);
		expect(view.querySelector("h5")?.textContent).toBe(
			"Configure automatic locking",
		);
		expect(view.textContent).toContain(
			"Automatic locking isn’t available on this device",
		);
		expect(view.textContent).toContain("Continue without automatic locking");
		expect(
			view.querySelector('button[aria-label="Enable automatic locking"]'),
		).toBeNull();
	});
});
