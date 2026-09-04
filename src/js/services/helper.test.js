import React from "react";
import helperService from "./helper";

describe("Service: helper test suite", () => {
	it("helper exists", () => {
		expect(helperService).toBeDefined();
	});

	it("parse_url www domain", () => {
		expect(
			helperService.parseUrl("https://www.example.com/url-part/#is-not-part"),
		).toEqual({
			scheme: "https",
			authority: "www.example.com",
			authority_without_www: "example.com",
			base_url: "https://www.example.com",
			full_domain: "www.example.com",
			full_domain_without_www: "example.com",
			port: null,
			path: "/url-part/",
			query: null,
			fragment: "is-not-part",
		});
	});

	it("parse_url www domain", () => {
		expect(helperService.parseUrl("https://")).toEqual({
			scheme: null,
			authority: null,
			authority_without_www: null,
			base_url: null,
			full_domain: null,
			full_domain_without_www: null,
			port: null,
			path: null,
			query: null,
			fragment: null,
		});
	});

	it("parse_url top lvl domain", () => {
		expect(
			helperService.parseUrl("https://example.com/url-part/#is-not-part"),
		).toEqual({
			scheme: "https",
			authority: "example.com",
			authority_without_www: "example.com",
			base_url: "https://example.com",
			full_domain: "example.com",
			full_domain_without_www: "example.com",
			port: null,
			path: "/url-part/",
			query: null,
			fragment: "is-not-part",
		});
	});

	it("parse_url chrome extension", () => {
		expect(
			helperService.parseUrl(
				"chrome-extension://nknmfipbcebafiaclacheccehghgikkk/data/index.html#!/account/multifactor-authentication",
			),
		).toEqual({
			scheme: "chrome-extension",
			authority: "nknmfipbcebafiaclacheccehghgikkk",
			authority_without_www: "nknmfipbcebafiaclacheccehghgikkk",
			base_url: "chrome-extension://nknmfipbcebafiaclacheccehghgikkk",
			full_domain: "nknmfipbcebafiaclacheccehghgikkk",
			full_domain_without_www: "nknmfipbcebafiaclacheccehghgikkk",
			port: null,
			path: "/data/index.html",
			query: null,
			fragment: "!/account/multifactor-authentication",
		});
	});

	it("parse_url sub domain", () => {
		expect(
			helperService.parseUrl("http://test.example.com/url-part/#is-not-part"),
		).toEqual({
			scheme: "http",
			authority: "test.example.com",
			authority_without_www: "test.example.com",
			base_url: "http://test.example.com",
			full_domain: "test.example.com",
			full_domain_without_www: "test.example.com",
			port: null,
			path: "/url-part/",
			query: null,
			fragment: "is-not-part",
		});
	});

	it("parse_url sub domain with port", () => {
		expect(
			helperService.parseUrl(
				"http://test.example.com:6000/url-part/#is-not-part",
			),
		).toEqual({
			scheme: "http",
			authority: "test.example.com:6000",
			authority_without_www: "test.example.com:6000",
			base_url: "http://test.example.com:6000",
			full_domain: "test.example.com",
			full_domain_without_www: "test.example.com",
			port: "6000",
			path: "/url-part/",
			query: null,
			fragment: "is-not-part",
		});
	});

	it("parse_url with capital letters in url", () => {
		expect(
			helperService.parseUrl(
				"http://TEST.example.com:6000/url-Part/#is-not-part",
			),
		).toEqual({
			scheme: "http",
			authority: "test.example.com:6000",
			authority_without_www: "test.example.com:6000",
			base_url: "http://test.example.com:6000",
			full_domain: "test.example.com",
			full_domain_without_www: "test.example.com",
			port: "6000",
			path: "/url-Part/",
			query: null,
			fragment: "is-not-part",
		});
	});
	it("parse_url ipv4 address", () => {
		expect(
			helperService.parseUrl("http://1.2.3.4:5092/url-part/#is-not-part"),
		).toEqual({
			scheme: "http",
			authority: "1.2.3.4:5092",
			authority_without_www: "1.2.3.4:5092",
			base_url: "http://1.2.3.4:5092",
			full_domain: "1.2.3.4",
			full_domain_without_www: "1.2.3.4",
			port: "5092",
			path: "/url-part/",
			query: null,
			fragment: "is-not-part",
		});
	});

	it("parse_url ipv6 address", () => {
		expect(
			helperService.parseUrl(
				"http://[2001:db8:3333:4444:5555:6666:7777:8888]:5092/url-part/#is-not-part",
			),
		).toEqual({
			scheme: "http",
			authority: "[2001:db8:3333:4444:5555:6666:7777:8888]:5092",
			authority_without_www: "[2001:db8:3333:4444:5555:6666:7777:8888]:5092",
			base_url: "http://[2001:db8:3333:4444:5555:6666:7777:8888]:5092",
			full_domain: "[2001:db8:3333:4444:5555:6666:7777:8888]",
			full_domain_without_www: "[2001:db8:3333:4444:5555:6666:7777:8888]",
			port: "5092",
			path: "/url-part/",
			query: null,
			fragment: "is-not-part",
		});
	});

	it("parse_url empty", () => {
		expect(helperService.parseUrl("")).toEqual({
			scheme: null,
			authority: null,
			authority_without_www: null,
			base_url: null,
			full_domain: null,
			full_domain_without_www: null,
			port: null,
			path: null,
			query: null,
			fragment: null,
		});
	});

	it("parse_url just ip", () => {
		expect(helperService.parseUrl("1.2.3.4")).toEqual({
			scheme: "http",
			authority: "1.2.3.4",
			authority_without_www: "1.2.3.4",
			base_url: "http://1.2.3.4",
			full_domain: "1.2.3.4",
			full_domain_without_www: "1.2.3.4",
			port: null,
			path: "/",
			query: null,
			fragment: null,
		});
	});

	it("getDomainWithoutWww sub domain", () => {
		expect(
			helperService.getDomainWithoutWww(
				"http://test.example.com/url-part/#is-not-part",
			),
		).toEqual("test.example.com");
	});

	it("getDomain www domain", () => {
		expect(
			helperService.getDomainWithoutWww(
				"http://www.example.com/url-part/#is-not-part",
			),
		).toEqual("example.com");
	});

	it("getDomain top level domain", () => {
		expect(
			helperService.getDomainWithoutWww(
				"http://example.com/url-part/#is-not-part",
			),
		).toEqual("example.com");
	});

	it("arrayStartsWith a no array", () => {
		expect(helperService.arrayStartsWith("a", ["a"])).toBeFalsy();
	});

	it("arrayStartsWith b no array", () => {
		expect(helperService.arrayStartsWith(["a"], "a")).toBeFalsy();
	});

	it("arrayStartsWith a.length < b.lenght", () => {
		expect(helperService.arrayStartsWith(["a"], ["a", "b"])).toBeFalsy();
	});

	it("arrayStartsWith a = b", () => {
		expect(helperService.arrayStartsWith(["a", "b"], ["a", "b"])).toBeTruthy();
	});

	it("arrayStartsWith a != b", () => {
		expect(helperService.arrayStartsWith(["a", "b"], ["a", "c"])).toBeFalsy();
	});

	it("arrayStartsWith a starts with b", () => {
		expect(
			helperService.arrayStartsWith(["a", "b", "c"], ["a", "b"]),
		).toBeTruthy();
	});

	it("createList", () => {
		const list = [];

		helperService.createList(
			{
				items: ["a", "b"],
				folders: [
					{
						items: ["c", "d"],
						// no folders
					},
					{
						// two folder parallel
						items: ["e", "f"],
						folders: [
							{
								// at least two folder level handled
								items: ["g", "h"],
								folders: [
									// empty folders
								],
							},
						],
					},
				],
			},
			list,
		);

		expect(list).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
	});

	it("duplicateObject", () => {
		const orig_obj = {
			a: ["b"],
			c: true,
		};

		const dubl_obj = helperService.duplicateObject(orig_obj);

		expect(orig_obj).toEqual(dubl_obj);
		dubl_obj.c = false;
		expect(orig_obj).not.toEqual(dubl_obj);
	});

	it("isValidUsername not allowed chars", () => {
		expect(helperService.isValidUsername("ab@cd") === true).toBeFalsy();
	});

	it("isValidUsername too small", () => {
		expect(helperService.isValidUsername("ab") === true).toBeFalsy();
	});

	it("isValidUsername start with .", () => {
		expect(helperService.isValidUsername(".abcd") === true).toBeFalsy();
	});

	it("isValidUsername start with -", () => {
		expect(helperService.isValidUsername("-abcd") === true).toBeFalsy();
	});

	it("isValidUsername end with .", () => {
		expect(helperService.isValidUsername("abcd.") === true).toBeFalsy();
	});

	it("isValidUsername end with -", () => {
		expect(helperService.isValidUsername("abcd-") === true).toBeFalsy();
	});

	it("isValidUsername double occurrence of .", () => {
		expect(helperService.isValidUsername("abc..def") === true).toBeFalsy();
	});

	it("isValidUsername double occurrence of -", () => {
		expect(helperService.isValidUsername("abc--def") === true).toBeFalsy();
	});

	it("isValidUsername occurrence of .-", () => {
		expect(helperService.isValidUsername("abc.-def") === true).toBeFalsy();
	});

	it("isValidUsername occurrence of -.", () => {
		expect(helperService.isValidUsername("abc-.def") === true).toBeFalsy();
	});

	it("isValidUsername valid", () => {
		expect(helperService.isValidUsername("abc") === null).toBeTruthy();
	});

	it("removeFromArray", () => {
		const array = [1, 2, 5, 7];
		const search = 5;
		const target = [1, 2, 7];

		helperService.removeFromArray(array, search);

		expect(array).toEqual(target);
	});

	it("removeFromArray_own_cmp_fct", () => {
		const array = [1, 2, 5, 5, 7];
		const search = 5;
		const target = [5, 5];

		const cmp_fct = (a, b) => a !== b;

		helperService.removeFromArray(array, search, cmp_fct);

		expect(array).toEqual(target);
	});

	it("formFullUsername without email syntax", () => {
		const username = "test";
		const domain = "example.com";

		const full_username = helperService.formFullUsername(username, domain);

		expect(full_username).toEqual(username + "@" + domain);
	});

	it("formFullUsername with email syntax", () => {
		const username = "test@example1.com";
		const domain = "example.com";

		const full_username = helperService.formFullUsername(username, domain);

		expect(full_username).toEqual(username);
	});

	it("isValidPassword_successful", () => {
		const password1 = "ab123456789012";

		const is_valid = helperService.isValidPassword(password1, password1);

		expect(is_valid).toEqual(null);
	});

	it("isValidPassword_too_short", () => {
		const password1 = "a2345678901";

		const is_valid = helperService.isValidPassword(password1, password1);

		expect(is_valid).toEqual("PASSWORD_TOO_SHORT_MIN_REQUIRED");
	});

	it("isValidPassword_no_match", () => {
		const password1 = "a2345678901234";
		const password2 = "b2345678901235";

		const is_valid = helperService.isValidPassword(password1, password2);

		expect(is_valid).toEqual("PASSWORDS_DONT_MATCH");
	});

	it("isValidPassword_not_complex_enough", () => {
		const password1 = "12345678901234";
		const password2 = "12345678901234";

		const is_valid = helperService.isValidPassword(password1, password2);

		expect(is_valid).toEqual("PASSWORD_NOT_COMPLEX_ENOUGH_MIN_REQUIRED");
	});

	it("isUrlFilterMatch direct match", () => {
		const authority = "example.com";
		const urlFilter = "example.com";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch empty url filter", () => {
		const authority = "example.com";
		const urlFilter = ""; // shouldn't match anything

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch empty authority", () => {
		const authority = "";
		const urlFilter = "example.com"; // shouldn't match if the authority is empty

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch undefined authority", () => {
		const authority = undefined;
		const urlFilter = "example.com"; // shouldn't match if the authority is undefined

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch undefined url filter", () => {
		const authority = "example.com";
		const urlFilter = undefined; // shouldn't match anything

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch subdomains not matched", () => {
		const authority = "sub.example.com";
		const urlFilter = "example.com"; // shouldn't match a subdomain

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch with port", () => {
		const authority = "example.com:8090";
		const urlFilter = "example.com:8090"; // should match

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch with different ports", () => {
		const authority = "example.com:8090";
		const urlFilter = "example.com:8091"; // should not match

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch with port and wildcard", () => {
		const authority = "sub.example.com:8090";
		const urlFilter = "*.example.com:8090"; // should match

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch with different ports and wildcard", () => {
		const authority = "sub.example.com:8090";
		const urlFilter = "*.example.com"; // should not match

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch with port", () => {
		const parsedUrl = helperService.parseUrl(
			"http://example.com:8090/whatever.php",
		);
		const urlFilter = "example.com:8090"; // should match

		expect(
			helperService.isUrlFilterMatch(parsedUrl.authority, urlFilter),
		).toBeTruthy();
	});

	it("isUrlFilterMatch wildcard match with sub domain", () => {
		const authority = "sub.example.com";
		const urlFilter = "*.example.com";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch wildcard match with sub sub domain", () => {
		const authority = "sub.sub.example.com";
		const urlFilter = "*.example.com";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch wildcard match with invalid wildcard", () => {
		const authority = "sub.sub.example.com";
		const urlFilter = "*example.com"; // potentially dangerous (e.g. evilexample.com) so shouldn't match

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch wildcard match with apex domain", () => {
		const authority = "example.com";
		const urlFilter = "*.example.com";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch with authority being caps while urlfilter being all lowercase", () => {
		const authority = "sub.sub.Example.com";
		const urlFilter = "*.example.com";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch with urlfilter being caps while authority being all lowercase", () => {
		const authority = "sub.sub.example.com";
		const urlFilter = "*.Example.com";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	// Port wildcard functionality tests
	it("isUrlFilterMatch port wildcard basic match", () => {
		const authority = "blub.com:234";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard with different port", () => {
		const authority = "blub.com:1234";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard with high port number", () => {
		const authority = "blub.com:65535";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard with no port in authority", () => {
		const authority = "blub.com";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard wrong domain", () => {
		const authority = "other.com:234";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch port wildcard with similar but wrong domain", () => {
		const authority = "notblub.com:234";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch combined domain and port wildcard match", () => {
		const authority = "sub.blub.com:1234";
		const urlFilter = "*.blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch combined wildcard with different port", () => {
		const authority = "sub.blub.com:5678";
		const urlFilter = "*.blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch combined wildcard with no port in authority", () => {
		const authority = "sub.blub.com";
		const urlFilter = "*.blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch combined wildcard wrong domain", () => {
		const authority = "sub.other.com:1234";
		const urlFilter = "*.blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeFalsy();
	});

	it("isUrlFilterMatch combined wildcard with deep subdomain", () => {
		const authority = "deep.sub.blub.com:8080";
		const urlFilter = "*.blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard case insensitive", () => {
		const authority = "BLUB.COM:234";
		const urlFilter = "blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch combined wildcard case insensitive", () => {
		const authority = "SUB.BLUB.COM:1234";
		const urlFilter = "*.blub.com:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard with mixed case filter", () => {
		const authority = "blub.com:234";
		const urlFilter = "BLUB.COM:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard with customer scenario", () => {
		const authority = "subdomain.domain.de:34111";
		const urlFilter = "subdomain.domain.de:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch domain wildcard with port wildcard for customer scenario", () => {
		const authority = "subdomain.domain.de:34111";
		const urlFilter = "*.domain.de:*";

		expect(helperService.isUrlFilterMatch(authority, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch port wildcard with changing ports for customer scenario", () => {
		const authority1 = "subdomain.domain.de:34111";
		const authority2 = "subdomain.domain.de:35222";
		const authority3 = "subdomain.domain.de:8080";
		const urlFilter = "subdomain.domain.de:*";

		expect(helperService.isUrlFilterMatch(authority1, urlFilter)).toBeTruthy();
		expect(helperService.isUrlFilterMatch(authority2, urlFilter)).toBeTruthy();
		expect(helperService.isUrlFilterMatch(authority3, urlFilter)).toBeTruthy();
	});

	it("isUrlFilterMatch existing functionality should still work", () => {
		// Ensure we didn't break existing functionality
		const testCases = [
			{ authority: "example.com", filter: "example.com", expected: true },
			{ authority: "example.com:80", filter: "example.com:80", expected: true },
			{ authority: "sub.example.com", filter: "*.example.com", expected: true },
			{
				authority: "sub.example.com:443",
				filter: "*.example.com",
				expected: false,
			},
			{
				authority: "example.com:80",
				filter: "example.com:443",
				expected: false,
			},
		];

		testCases.forEach((testCase) => {
			expect(
				helperService.isUrlFilterMatch(testCase.authority, testCase.filter),
			).toBe(testCase.expected);
		});
	});

	it("validates connection ports", () => {
		expect(helperService.isValidPort(1)).toBeTruthy();
		expect(helperService.isValidPort("22")).toBeTruthy();
		expect(helperService.isValidPort(65535)).toBeTruthy();
		expect(helperService.isValidPort(0)).toBeFalsy();
		expect(helperService.isValidPort(65536)).toBeFalsy();
		expect(helperService.isValidPort("22.5")).toBeFalsy();
		expect(helperService.isValidPort("invalid")).toBeFalsy();
	});

	it("validates hostnames case-insensitively", () => {
		expect(helperService.isValidHostname("example.com")).toBeTruthy();
		expect(helperService.isValidHostname("Example.COM")).toBeTruthy();
		expect(helperService.isValidHostname("example.com/path")).toBeFalsy();
	});
});
