/**
 * @jest-environment jsdom
 */

import React from "react";
import device from "../services/device";
import { initStore } from "./store";

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
