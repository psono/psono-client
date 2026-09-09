import accountService from "./account";
import apiClient from "./api-client";
import storage from "./storage";
import user from "./user";

let mockState;
const mockDispatch = jest.fn();

jest.mock("./store", () => ({
	getStore: () => ({
		getState: () => mockState,
		dispatch: mockDispatch,
	}),
}));
jest.mock("./api-client", () => ({
	__esModule: true,
	default: {
		logout: jest.fn(),
	},
}));
jest.mock("./account", () => ({
	__esModule: true,
	default: {
		isCurrentSession: jest.fn(),
		updateInfoCurrent: jest.fn(),
		logoutAll: jest.fn(),
		broadcastReinitializeAppEvent: jest.fn(),
		broadcastReinitializeBackgroundEvent: jest.fn(),
	},
}));
jest.mock("./storage", () => ({
	__esModule: true,
	default: {
		removeAll: jest.fn(),
		save: jest.fn(),
	},
}));

describe("Service: session-scoped logout", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockState = {
			user: {
				isLoggedIn: true,
				rememberMe: false,
				token: "old-token",
				sessionSecretKey: "old-session-key",
			},
		};
		apiClient.logout.mockResolvedValue({ data: {} });
	});

	it("does not clear local state for a token that is no longer persisted", async () => {
		accountService.isCurrentSession.mockResolvedValue(false);

		await expect(user.logout("", undefined, "old-token")).resolves.toEqual({
			response: "ignored",
		});

		expect(apiClient.logout).toHaveBeenCalledWith(
			"old-token",
			"old-session-key",
			undefined,
			undefined,
		);
		expect(storage.removeAll).not.toHaveBeenCalled();
	});

	it("clears local state when the rejected session is still current", async () => {
		accountService.isCurrentSession.mockResolvedValue(true);

		await expect(user.logout("", undefined, "old-token")).resolves.toEqual({
			response: "success",
		});

		expect(accountService.updateInfoCurrent).toHaveBeenCalled();
		expect(storage.removeAll).toHaveBeenCalled();
		expect(accountService.broadcastReinitializeAppEvent).toHaveBeenCalled();
		expect(
			accountService.broadcastReinitializeBackgroundEvent,
		).toHaveBeenCalled();
	});

	it("keeps explicit logout behavior unchanged", async () => {
		accountService.isCurrentSession.mockResolvedValue(false);

		await expect(user.logout()).resolves.toEqual({ response: "success" });

		expect(accountService.isCurrentSession).not.toHaveBeenCalled();
		expect(storage.removeAll).toHaveBeenCalled();
	});
});
