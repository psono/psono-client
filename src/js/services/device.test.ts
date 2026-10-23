/**
 * @jest-environment jsdom
 */

import device from "../services/device";
import { initStore } from "./store";

const testGlobals = globalThis as typeof globalThis & { TARGET: typeof TARGET };

describe("Service: device test suite", () => {
	it("device exists", () => {
		expect(device).toBeDefined();
	});

	it("getDeviceFingerprint", async () => {
		await initStore();
		expect(device.getDeviceFingerprint()).toEqual(expect.any(String));
	});

	it("isChrome", () => {
		expect(device.isChrome()).toEqual(expect.any(Boolean));
	});

	it("isFirefox", () => {
		expect(device.isFirefox()).toEqual(expect.any(Boolean));
	});

	it("getDeviceDescription", () => {
		expect(device.getDeviceDescription()).toEqual(expect.any(String));
	});
});

describe("WebAuthn second-factor availability", () => {
	const originalTarget = testGlobals.TARGET;

	afterEach(() => {
		testGlobals.TARGET = originalTarget;
		jest.restoreAllMocks();
	});

	it.each([
		["firefox", "149.0", false],
		["firefox", "150.0", true],
		["firefox", "151.0", true],
		["firefox", "150.0a1", true],
		["firefox", "", false],
		["webclient", "149.0", true],
		["chrome", "149.0", true],
		["electron", "150.0", false],
	] as const)("%s on Firefox %s: %s", (target, version, supported) => {
		// Load dependencies without initializing extension-only listeners.
		testGlobals.TARGET = "webclient";
		jest
			.spyOn(navigator, "userAgent", "get")
			.mockReturnValue(
				`Mozilla/5.0 (X11; Linux x86_64; rv:${version}) Gecko/20100101 Firefox/${version}`,
			);
		jest.isolateModules(() => {
			const service: typeof device = require("./device").default;
			testGlobals.TARGET = target;
			expect(service.supportsWebauthn()).toBe(supported);
		});
	});
});
