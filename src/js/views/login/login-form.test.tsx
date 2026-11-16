import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import type { AuthResponse, EncryptedLoginData } from "../../../types/auth";
import type { ClientConfiguration } from "../../../types/browser";
import apiClient from "../../services/api-client";
import browserClient from "../../services/browser-client";
import cryptoLibrary from "../../services/crypto-library";
import device from "../../services/device";
import ssoRedirect from "../../services/sso-redirect";
import * as store from "../../services/store";
import user from "../../services/user";
import LoginForm from "./login-form";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	initReactI18next: { type: "3rdParty", init: () => {} },
}));
jest.mock("../../components/footer-links", () => () => null);

// Capture render regressions without leaving an unhandled rejection in Jest.
class RecordRenderFailure extends React.Component<
	{ onError: (error: Error) => void; children: React.ReactNode },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(error: Error) {
		this.props.onError(error);
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

const theme = createTheme({
	palette: {
		lightGreyText: { main: "#ddd" },
		greyText: { main: "#aaa" },
		checked: { main: "#fff" },
		blueBackground: { main: "#123" },
	},
});

describe.each([
	"oidc",
	"saml",
] as const)("Login form: %s callback errors", (protocol) => {
	const login = protocol === "oidc" ? "oidcLogin" : "samlLogin";
	const tokenId = "123e4567-e89b-42d3-a456-426614174000";
	let container: HTMLDivElement;
	let resolveApi: (response: AuthResponse<EncryptedLoginData>) => void;
	let rejectApi: (error: unknown) => void;
	let originalFailure: unknown;
	let renderFailure: jest.Mock;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
		renderFailure = jest.fn();
		originalFailure = undefined;
		jest.spyOn(console, "error").mockImplementation(() => {});
		jest.spyOn(store, "getStore").mockReturnValue({
			getState: () => ({
				user: { username: "", trustDevice: false, rememberMe: false },
				server: {
					url: "https://psono.example/server",
					publicKey: "ab".repeat(32),
				},
			}),
		} as ReturnType<typeof store.getStore>);
		jest.spyOn(browserClient, "getClientType").mockReturnValue("webclient");
		jest.spyOn(browserClient, "getConfig").mockResolvedValue({
			backend_servers: [{ url: "https://psono.example/server" }],
			authentication_methods: ["AUTHKEY", "OIDC", "SAML"],
			oidc_provider: [],
			saml_provider: [],
		} as unknown as ClientConfiguration);
		jest.spyOn(ssoRedirect, "consume").mockResolvedValue({
			type: protocol,
			state: "00".repeat(16),
			tokenId,
		});
		jest.spyOn(device, "getDeviceFingerprint").mockReturnValue("test-device");
		jest.spyOn(device, "getDeviceDescription").mockReturnValue("test-browser");
		jest.spyOn(apiClient, login).mockReturnValue(
			new Promise((resolve, reject) => {
				resolveApi = resolve;
				rejectApi = reject;
			}),
		);
		const realLogin = user[login];
		jest.spyOn(user, login).mockImplementation((token) =>
			realLogin(token).catch((error: unknown) => {
				originalFailure = error;
				throw error;
			}),
		);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		jest.restoreAllMocks();
	});

	async function renderCallback() {
		await act(async () => {
			ReactDOM.render(
				<RecordRenderFailure onError={renderFailure}>
					<ThemeProvider theme={theme}>
						<MemoryRouter>
							<LoginForm {...{ [`${protocol}TokenId`]: tokenId }} />
						</MemoryRouter>
					</ThemeProvider>
				</RecordRenderFailure>,
				container,
			);
		});
		expect(apiClient[login]).toHaveBeenCalledTimes(1);
		expect(container.querySelector("form")).not.toBeNull();
	}

	function expectLoginError(message: string) {
		expect(renderFailure).not.toHaveBeenCalled();
		expect(container.querySelector("form")).not.toBeNull();
		expect(container.querySelector('[role="alert"]')?.textContent).toBe(
			message,
		);
	}

	it("displays a normal API error array", async () => {
		await renderCallback();
		await act(async () => {
			rejectApi({ data: { non_field_errors: ["AUTHENTICATION_FAILED"] } });
		});
		expectLoginError("AUTHENTICATION_FAILED");
	});

	it("displays a string API error and allows it to be dismissed", async () => {
		await renderCallback();
		await act(async () => {
			rejectApi({ data: { non_field_errors: "AUTHENTICATION_FAILED" } });
		});
		expect(originalFailure).toBe("AUTHENTICATION_FAILED");
		expectLoginError("AUTHENTICATION_FAILED");
		act(() => {
			container
				.querySelector<HTMLButtonElement>('[role="alert"] button')!
				.click();
		});
		expect(container.querySelector('[role="alert"]')).toBeNull();
		expect(container.querySelector("form")).not.toBeNull();
	});

	it("displays the original login-response decryption exception", async () => {
		const decrypt = jest.spyOn(cryptoLibrary, "decryptDataPublicKey");
		await renderCallback();
		await act(async () => {
			resolveApi({
				data: {
					login_info: "00".repeat(32),
					login_info_nonce: "00".repeat(24),
				},
			});
		});
		expect(decrypt).toHaveBeenCalledTimes(1);
		expect(originalFailure).toBeInstanceOf(Error);
		expectLoginError((originalFailure as Error).message);
	});

	it.each([
		["missing", undefined],
		["null", null],
		["object", { unexpected: "response" }],
		["number", 42],
		["invalid array entry", [{ unexpected: "response" }]],
	])("shows a fallback for a %s API error", async (_name, error) => {
		await renderCallback();
		await act(async () => {
			rejectApi({ data: { non_field_errors: error } });
		});
		expectLoginError("UNKNOWN_ERROR");
		expect(console.error).toHaveBeenCalledWith(
			"Unexpected login error:",
			Array.isArray(error) ? error[0] : error,
		);
	});
});
