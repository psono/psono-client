import React from "react";
import backgroundService from "./background";
import browserClient from "./browser-client";
import converterService from "./converter";
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
