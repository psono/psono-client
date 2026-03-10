import React from "react";
import datastorePasswordService from "./datastore-password";

describe("Service: datastorePasswordService test suite #1", () => {
	it("datastorePasswordService exists", () => {
		expect(datastorePasswordService).toBeDefined();
	});

	it("escapeRegExp: strength test lowercase success", () => {
		const password = "test";
		const characters = "abcdefghijklmnopqrstuvwxyz";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("escapeRegExp: strength test uppercase success", () => {
		const password = "TEST";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("escapeRegExp: strength test lowercase failure", () => {
		const password = "TEST";
		const characters = "abcdefghijklmnopqrstuvwxyz";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeFalsy();
	});

	it("escapeRegExp: strength test uppercase failure", () => {
		const password = "test";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeFalsy();
	});

	it("escapeRegExp: strength test special chars dash success", () => {
		const password = "test-";
		const characters = ",-.";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});

	it("escapeRegExp: strength test special chars dot success", () => {
		const password = "test.";
		const characters = ",-.";
		const test = password.match(
			new RegExp(
				"([" + datastorePasswordService.escapeRegExp(characters) + "])",
				"g",
			),
		);
		return expect(test).toBeTruthy();
	});
});
