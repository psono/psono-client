import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import vaultLock from "../services/vault-lock";
import LockCountdown from "./lock-countdown";

let mockLoggedIn = true;
let mockEnabled = true;
let mockDeadline = 0;
let mockAction = "LOCK";
const mockListeners = new Set<() => void>();
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) =>
		selector({ user: { isLoggedIn: mockLoggedIn } }),
}));
jest.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { time: string }) =>
			(
				jest.requireActual<Record<string, string>>(
					"../../common/data/translations/locale-en.json",
				)[key] || key
			).replace("{{time}}", options?.time ?? ""),
	}),
}));
jest.mock("../services/vault-lock", () => ({
	__esModule: true,
	default: {
		getConfiguration: () => ({ timeoutAction: mockAction }),
		getRemainingSeconds: jest.fn(() =>
			mockEnabled && mockDeadline > Date.now()
				? Math.ceil((mockDeadline - Date.now()) / 1000)
				: null,
		),
		subscribe: (listener: () => void) => {
			mockListeners.add(listener);
			return () => {
				mockListeners.delete(listener);
			};
		},
		touch: jest.fn(),
	},
}));

describe("automatic lock countdown", () => {
	let container: HTMLDivElement;
	beforeEach(() => {
		jest.useFakeTimers().setSystemTime(new Date("2026-10-28T12:00:00Z"));
		jest.clearAllMocks();
		mockLoggedIn = true;
		mockEnabled = true;
		mockAction = "LOCK";
		mockDeadline = Date.now() + 65000;
		container = document.createElement("div");
		document.body.appendChild(container);
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		jest.useRealTimers();
	});
	function render() {
		act(() => {
			ReactDOM.render(<LockCountdown />, container);
		});
	}

	it("counts down without extending the inactivity deadline", () => {
		render();
		expect(container.textContent).toBe("Locks in 01:05");
		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(container.textContent).toBe("Locks in 01:04");
		expect(vaultLock.touch).not.toHaveBeenCalled();
	});
	it("reflects a deadline reset by activity in another tab", () => {
		render();
		act(() => {
			jest.advanceTimersByTime(10000);
		});
		mockDeadline = Date.now() + 300000;
		act(() => {
			jest.advanceTimersByTime(1000);
		});
		expect(container.textContent).toBe("Locks in 04:59");
	});
	it("hides immediately when automatic locking is disabled", () => {
		render();
		mockEnabled = false;
		act(() => {
			for (const listener of mockListeners) listener();
		});
		expect(container.querySelector('[role="timer"]')).toBeNull();
	});
	it("supports hour-long timeouts and hides expired sessions", () => {
		mockDeadline = Date.now() + 3661000;
		render();
		expect(container.textContent).toBe("Locks in 1:01:01");
		act(() => {
			jest.advanceTimersByTime(3661000);
		});
		expect(container.querySelector('[role="timer"]')).toBeNull();
	});
	it("does not show a timer for logged-out users", () => {
		mockLoggedIn = false;
		render();
		expect(container.textContent).toBe("");
	});

	it("labels the countdown with the selected timeout action", () => {
		render();
		mockAction = "LOGOUT";
		act(() => {
			for (const listener of mockListeners) listener();
		});
		expect(container.textContent).toBe("Logs out in 01:05");
	});
});
