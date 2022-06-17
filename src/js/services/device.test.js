/**
 * @jest-environment jsdom
 */


import React from 'react';
import device from "../services/device";

describe('Service: device test suite', function () {

    it('device exists', function () {
        expect(device).toBeDefined();
    });

    it('getDeviceFingerprint', function () {
        expect(device.getDeviceFingerprint()).toEqual(expect.any(String));
    });

    it('isIe', function () {
        expect(device.isIe()).toEqual(expect.any(Boolean));
    });

    it('isChrome', function () {
        expect(device.isChrome()).toEqual(expect.any(Boolean));
    });

    it('isFirefox', function () {
        expect(device.isFirefox()).toEqual(expect.any(Boolean));
    });

    it('isSafari', function () {
        expect(device.isSafari()).toEqual(expect.any(Boolean));
    });

    it('isOpera', function () {
        expect(device.isOpera()).toEqual(expect.any(Boolean));
    });

    it('getDeviceDescription', function () {
        expect(device.getDeviceDescription()).toEqual(expect.any(String));
    });

});
