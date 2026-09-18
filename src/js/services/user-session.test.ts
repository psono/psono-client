import actualAccountService from "./account";
import actualApiClient from "./api-client";
import storage from "./storage";
import user from "./user";
import { SET_SERVER_INFO } from "../actions/action-types";
import serverReducer from "../reducers/server";

const accountService = jest.mocked(actualAccountService, true);
const apiClient = jest.mocked(actualApiClient, true);
let mockState: {
	user: {
		isLoggedIn: boolean;
		hasTwoFactor: boolean;
		rememberMe: boolean;
		token: string;
		sessionSecretKey: string;
	};
	server: ReturnType<typeof serverReducer>;
};
const mockDispatch = jest.fn<void, [unknown]>();

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

describe("Service: user session state", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockState = {
			user: {
				isLoggedIn: true,
				hasTwoFactor: false,
				rememberMe: false,
				token: "old-token",
				sessionSecretKey: "old-session-key",
			},
			server: serverReducer(undefined, { type: "@@INIT" }),
		};
		apiClient.logout.mockResolvedValue({ data: {} });
	});

	it("preserves MFA enforcement results across a sparse host reset", () => {
		expect(user.requireTwoFaSetup()).toBe(false);

		mockState.server = serverReducer(mockState.server, {
			type: SET_SERVER_INFO,
			info: {},
		});
		expect(user.requireTwoFaSetup()).toBeUndefined();

		mockState.server = serverReducer(mockState.server, {
			type: SET_SERVER_INFO,
			info: {
				compliance_enforce_2fa: true,
				allowed_second_factors: ["webauthn_2fa"],
			},
		});
		expect(user.requireTwoFaSetup()).toBe(true);

		mockState.user.hasTwoFactor = true;
		expect(user.requireTwoFaSetup()).toBe(false);
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
