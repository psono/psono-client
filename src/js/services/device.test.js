/**
 * @jest-environment jsdom
 */


import React from 'react';
import device from "../services/device";
import {initStore} from "./store";

describe('Service: device test suite', function () {

    it('device exists', function () {
        expect(device).toBeDefined();
    });

    it('getDeviceFingerprint', async function () {
        await initStore()
        expect(device.getDeviceFingerprint()).toEqual(expect.any(String));
    });

    it('isChrome', function () {
        expect(device.isChrome()).toEqual(expect.any(Boolean));
    });

    it('isFirefox', function () {
        expect(device.isFirefox()).toEqual(expect.any(Boolean));
    });

    it('getDeviceDescription', function () {
        expect(device.getDeviceDescription()).toEqual(expect.any(String));
    });

});
