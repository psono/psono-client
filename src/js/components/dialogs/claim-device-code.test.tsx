import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import type { DeviceState } from "../../../types/state";
import {
	LOGOUT,
	SET_DEVICE_CODE,
	SET_USER_INFO_2,
	SET_USER_INFO_3,
} from "../../actions/action-types";
import device from "../../reducers/device";
import user from "../../reducers/user";
import deviceCodeService from "../../services/device-code";
import DialogDeviceClaimConsent from "./claim-device-code";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../services/device-code", () => ({
	__esModule: true,
	default: { claimDeviceCode: jest.fn() },
}));
jest.mock("../../services/store", () => ({ getStore: jest.fn() }));
jest.mock("../../services/datastore-setting", () => ({
	__esModule: true,
	default: {},
}));

const deviceCode = { id: "device-code-id", secretBoxKey: "secret-box-key" };
const theme = createTheme({
	palette: {
		lightGreyText: { main: "#aaa" },
		greyText: { main: "#808080" },
	},
});

function createDeviceStore(
	state: DeviceState = { deviceCode },
	userState = user(undefined, { type: "@@INIT" }),
) {
	return createStore(
		combineReducers({ device, user }),
		{ device: state, user: userState },
		applyMiddleware(thunk),
	);
}

function button(label: string): HTMLButtonElement {
	const element = Array.from(document.querySelectorAll("button")).find(
		(candidate) => candidate.textContent === label,
	);
	if (!element) throw new Error(`Missing button: ${label}`);
	return element;
}

describe("device-code approval dialog", () => {
	let container: HTMLDivElement;
	let store: ReturnType<typeof createDeviceStore>;
	const onClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest
			.mocked(deviceCodeService.claimDeviceCode)
			.mockResolvedValue({ data: { state: "claimed" } });
		store = createDeviceStore();
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	function renderDialog() {
		act(() => {
			ReactDOM.render(
				<Provider store={store}>
					<ThemeProvider theme={theme}>
						<DialogDeviceClaimConsent open onClose={onClose} />
					</ThemeProvider>
				</Provider>,
				container,
			);
		});
	}

	it("clears the stored code on approval and keeps the confirmation until the tab closes", async () => {
		renderDialog();
		await act(async () => button("APPROVE").click());

		expect(deviceCodeService.claimDeviceCode).toHaveBeenCalledWith(
			deviceCode.id,
			deviceCode.secretBoxKey,
		);
		expect(store.getState().device.deviceCode).toBeNull();
		expect(document.body.textContent).toContain(
			"DEVICE_CODE_CLAIMED_SUCCESSFULLY",
		);
		expect(button("CLOSE").disabled).toBe(false);
		expect(onClose).not.toHaveBeenCalled();

		// Reopen with the state that would be persisted, without clicking Close.
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		store = createDeviceStore(store.getState().device);
		renderDialog();
		expect(document.querySelector('[role="dialog"]')).toBeNull();
	});

	it("keeps the code after failed approval so the user can retry", async () => {
		jest.mocked(deviceCodeService.claimDeviceCode).mockRejectedValueOnce({
			data: { detail: "SERVER_OFFLINE" },
		});
		renderDialog();
		await act(async () => button("APPROVE").click());

		expect(store.getState().device.deviceCode).toEqual(deviceCode);
		expect(document.body.textContent).toContain("SERVER_OFFLINE");
		expect(button("APPROVE").disabled).toBe(false);

		await act(async () => button("APPROVE").click());
		expect(store.getState().device.deviceCode).toBeNull();
		act(() => button("CLOSE").click());
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("preserves a pending approval across session logout and re-login", async () => {
		store = createDeviceStore(
			{ deviceCode: null },
			{
				...store.getState().user,
				isLoggedIn: true,
				token: "expired-token",
				sessionSecretKey: "expired-session-key",
				userSecretKey: "user-secret-key",
			},
		);
		// The device URL is consumed before the first API call detects the expired session.
		store.dispatch({
			type: SET_DEVICE_CODE,
			id: deviceCode.id,
			secretBoxKey: deviceCode.secretBoxKey,
		});
		renderDialog();

		act(() => {
			store.dispatch({ type: LOGOUT, rememberMe: false });
			ReactDOM.unmountComponentAtNode(container);
		});
		expect(store.getState().user).toMatchObject({
			isLoggedIn: false,
			token: "",
			sessionSecretKey: "",
			userSecretKey: "",
		});
		expect(store.getState().device.deviceCode).toEqual(deviceCode);

		store.dispatch({
			type: SET_USER_INFO_2,
			userPrivateKey: "private-key",
			userPublicKey: "public-key",
			sessionSecretKey: "new-session-key",
			token: "new-token",
			userSauce: "sauce",
			authentication: "AUTHKEY",
			passwordSha1Prefix: "",
		});
		store.dispatch({
			type: SET_USER_INFO_3,
			userId: "user-id",
			userEmail: "user@example.com",
			userSecretKey: "user-secret-key",
			serverSecretExists: false,
			requirePasswordChange: false,
		});
		expect(store.getState().user.isLoggedIn).toBe(true);
		// Re-login remounts the dialog without setting the device code from the URL again.
		renderDialog();
		expect(document.querySelector('[role="dialog"]')).not.toBeNull();
		expect(deviceCodeService.claimDeviceCode).not.toHaveBeenCalled();
		await act(async () => button("APPROVE").click());
		expect(deviceCodeService.claimDeviceCode).toHaveBeenCalledWith(
			deviceCode.id,
			deviceCode.secretBoxKey,
		);
		expect(store.getState().device.deviceCode).toBeNull();
	});

	it("clears a cancelled approval so it cannot reappear after logout", () => {
		renderDialog();
		act(() => button("CANCEL").click());
		expect(store.getState().device.deviceCode).toBeNull();
		expect(deviceCodeService.claimDeviceCode).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);

		act(() => {
			store.dispatch({ type: LOGOUT, rememberMe: false });
			ReactDOM.unmountComponentAtNode(container);
		});
		renderDialog();
		expect(document.querySelector('[role="dialog"]')).toBeNull();
	});
});
