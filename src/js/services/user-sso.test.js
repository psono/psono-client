import apiClient from "./api-client";
import browserClient from "./browser-client";
import ssoRedirect from "./sso-redirect";
import user from "./user";

describe("Service: user SSO initiation", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("binds SAML initiation to persisted extension state", async () => {
		jest
			.spyOn(browserClient, "getClientType")
			.mockReturnValue("chrome_extension");
		jest.spyOn(ssoRedirect, "createPending").mockResolvedValue("saml-state");
		jest
			.spyOn(browserClient, "getSamlReturnToUrl")
			.mockReturnValue("https://psono.com/saml-return");
		jest.spyOn(apiClient, "samlInitiateLogin").mockResolvedValue({
			data: { saml_redirect_url: "https://idp.example/saml" },
		});

		await expect(user.getSamlRedirectUrl(7)).resolves.toEqual({
			saml_redirect_url: "https://idp.example/saml",
		});
		expect(ssoRedirect.createPending).toHaveBeenCalledWith("saml");
		expect(browserClient.getSamlReturnToUrl).toHaveBeenCalledWith("saml-state");
		expect(apiClient.samlInitiateLogin).toHaveBeenCalledWith(
			7,
			"https://psono.com/saml-return",
		);
	});

	it("binds OIDC initiation to persisted extension state", async () => {
		jest
			.spyOn(browserClient, "getClientType")
			.mockReturnValue("firefox_extension");
		jest.spyOn(ssoRedirect, "createPending").mockResolvedValue("oidc-state");
		jest
			.spyOn(browserClient, "getOidcReturnToUrl")
			.mockReturnValue("https://psono.com/oidc-return");
		jest.spyOn(apiClient, "oidcInitiateLogin").mockResolvedValue({
			data: { oidc_redirect_url: "https://idp.example/oidc" },
		});

		await expect(user.getOidcRedirectUrl(9)).resolves.toEqual({
			oidc_redirect_url: "https://idp.example/oidc",
		});
		expect(ssoRedirect.createPending).toHaveBeenCalledWith("oidc");
		expect(browserClient.getOidcReturnToUrl).toHaveBeenCalledWith("oidc-state");
		expect(apiClient.oidcInitiateLogin).toHaveBeenCalledWith(
			9,
			"https://psono.com/oidc-return",
		);
	});

	it("keeps web-client SSO return URLs unchanged", async () => {
		jest.spyOn(browserClient, "getClientType").mockReturnValue("webclient");
		jest.spyOn(ssoRedirect, "createPending");
		jest
			.spyOn(browserClient, "getSamlReturnToUrl")
			.mockReturnValue("https://vault.example/index.html#!/saml/token/");
		jest.spyOn(apiClient, "samlInitiateLogin").mockResolvedValue({ data: {} });

		await user.getSamlRedirectUrl(7);

		expect(ssoRedirect.createPending).not.toHaveBeenCalled();
		expect(browserClient.getSamlReturnToUrl).toHaveBeenCalledWith(undefined);
	});
});
