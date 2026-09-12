import { createInstance } from "i18next";
import React from "react";
import en from "../../common/data/translations/locale-en.json";
import i18n from "../i18n";
import backgroundService from "./background";
import browserClient from "./browser-client";
import converterService from "./converter";
import notificationBarService from "./notification-bar";
import ssoRedirect from "./sso-redirect";

describe("Service: helper test suite", () => {
	it("helper exists", () => {
		expect(backgroundService).toBeDefined();
	});

	it("urlfilter with perfect match of a regular domains", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"https://example.com/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "example.com",
		};
		return expect(filter(leaf)).toBeTruthy();
	});

	it("urlfilter with different ports should not pass secrets", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"http://example.com:8000/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "example.com",
		};
		return expect(filter(leaf)).toBeFalsy();
	});

	it("urlfilter with www works for www domains", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"https://www.example.com/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "www.example.com",
		};
		return expect(filter(leaf)).toBeTruthy();
	});

	it("urlfilter shouldn not match subdomains", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"https://abc.example.com/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "example.com",
		};
		return expect(filter(leaf)).toBeFalsy();
	});

	it("urlfilter should not match subdomains (including www.)", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"https://www.example.com/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "example.com",
		};
		return expect(filter(leaf)).toBeFalsy();
	});

	it("urlfilter with multiple domains", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"https://www.example.com/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "www.example.com, narf.com",
		};
		return expect(filter(leaf)).toBeTruthy();
	});

	it("urlfilter www url filter should not match a site without www.)", () => {
		const filter = backgroundService.getSearchWebsitePasswordsByUrlfilter(
			"https://example.com/url-part/#is-not-part",
		);
		const leaf = {
			type: "website_password",
			urlfilter: "www.example.com",
		};
		return expect(filter(leaf)).toBeFalsy();
	});
});

describe("Iframe login approval", () => {
	beforeEach(async () => {
		const translator = createInstance();
		await translator.init({
			lng: "en",
			resources: { en: { translation: en } },
			interpolation: { escapeValue: false },
		});
		jest.spyOn(i18n, "t").mockImplementation(translator.t.bind(translator));
		jest.spyOn(notificationBarService, "create").mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([
		["sender origin", { origin: "https://frame.example:8443" }],
		[
			"sender URL fallback",
			{ url: "https://frame.example:8443/login?next=/account#form" },
		],
		[
			"inherited sender origin",
			{ origin: "https://frame.example:8443", url: "about:blank" },
		],
	])("renders the destination from the %s for an authority-only request", (_, frame) => {
		const sendResponse = jest.fn();
		expect(
			backgroundService.approveIframeLogin(
				{ data: { authority: "payload.example", autofill_id: "autofill-id" } },
				{
					...frame,
					frameId: 3,
					tab: { id: 42, url: "https://top-level.example/" },
				},
				sendResponse,
			),
		).toBe(true);

		expect(notificationBarService.create).toHaveBeenCalledWith(
			en.APPROVE_IFRAME_LOGIN,
			expect.stringContaining("add frame.example:8443 to your url filters."),
			expect.any(Array),
		);
		expect(sendResponse).not.toHaveBeenCalled();
	});

	it.each([
		["ALLOW", true],
		["CANCEL", false],
	])("ignores a payload origin and responds to %s", (buttonTitle, approved) => {
		const sendResponse = jest.fn();
		backgroundService.approveIframeLogin(
			{ data: { origin: "https://payload.example" } },
			{
				origin: "http://frame.example:8080",
				frameId: 3,
				tab: { id: 42, url: "https://top-level.example/" },
			},
			sendResponse,
		);

		const [, description, buttons] =
			notificationBarService.create.mock.calls[0];
		expect(description).toContain(
			"add frame.example:8080 to your url filters.",
		);
		expect(description).not.toContain("payload.example");
		expect(sendResponse).not.toHaveBeenCalled();

		buttons.find((button) => button.title === i18n.t(buttonTitle)).onClick();
		expect(sendResponse).toHaveBeenCalledTimes(1);
		expect(sendResponse).toHaveBeenCalledWith({
			event: "approve-iframe-login-response",
			data: approved,
		});
	});

	it.each([
		["missing", {}],
		["malformed URL", { url: "not a URL" }],
		["opaque URL", { url: "about:blank" }],
		["unsupported protocol", { url: "file:///login.html" }],
		["opaque origin", { origin: "null", url: "https://frame.example/login" }],
		[
			"malformed origin",
			{ origin: "not an origin", url: "https://frame.example/login" },
		],
	])("declines requests with %s frame identity", (_, frame) => {
		const sendResponse = jest.fn();
		expect(
			backgroundService.approveIframeLogin(
				{
					data: {
						origin: "https://payload.example",
						authority: "payload.example",
					},
				},
				{ ...frame, frameId: 3, tab: { id: 42 } },
				sendResponse,
			),
		).toBe(false);
		expect(notificationBarService.create).not.toHaveBeenCalled();
		expect(sendResponse).toHaveBeenCalledWith({
			event: "approve-iframe-login-response",
			data: false,
		});
	});
});

describe("SSO redirect handling", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("validates the authenticated sender URL and updates the sending tab", async () => {
		const redirect = {
			type: "saml",
			tokenId: "123e4567-e89b-42d3-a456-426614174000",
		};
		jest.spyOn(ssoRedirect, "consume").mockResolvedValue(redirect);
		jest
			.spyOn(browserClient, "replaceTabUrlInTab")
			.mockResolvedValue(undefined);
		const sendResponse = jest.fn();

		expect(
			backgroundService.oidcSamlRedirectDetected(
				{ data: { url: "https://attacker.example/forged" } },
				{
					frameId: 0,
					tab: { id: 42 },
					url: "https://psono.com/redirect#!/saml/token/state/token",
				},
				sendResponse,
			),
		).toBe(true);
		await Promise.resolve();
		await Promise.resolve();

		expect(ssoRedirect.consume).toHaveBeenCalledWith(
			"https://psono.com/redirect#!/saml/token/state/token",
		);
		expect(browserClient.replaceTabUrlInTab).toHaveBeenCalledWith(
			42,
			"/data/index.html#!/saml/token/123e4567-e89b-42d3-a456-426614174000",
		);
		expect(sendResponse).toHaveBeenCalledWith({
			event: "status",
			data: "ok",
		});
	});

	it("ignores redirects without matching pending state", async () => {
		jest.spyOn(ssoRedirect, "consume").mockResolvedValue(null);
		jest.spyOn(browserClient, "replaceTabUrlInTab");
		const sendResponse = jest.fn();

		backgroundService.oidcSamlRedirectDetected(
			{},
			{
				frameId: 0,
				tab: { id: 42 },
				url: "https://psono.com/redirect#!/oidc/token/state/token",
			},
			sendResponse,
		);
		await Promise.resolve();

		expect(browserClient.replaceTabUrlInTab).not.toHaveBeenCalled();
		expect(sendResponse).toHaveBeenCalledWith({
			event: "status",
			data: "ignored",
		});
	});

	it("rejects redirect messages from child frames", () => {
		jest.spyOn(ssoRedirect, "consume");

		expect(
			backgroundService.oidcSamlRedirectDetected(
				{},
				{
					frameId: 3,
					tab: { id: 42 },
					url: "https://psono.com/redirect#!/oidc/token/state/token",
				},
				jest.fn(),
			),
		).toBe(false);
		expect(ssoRedirect.consume).not.toHaveBeenCalled();
	});
});
