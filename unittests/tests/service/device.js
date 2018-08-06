(function () {
    describe('Service: device test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('device exists', inject(function (device) {
            expect(device).toBeDefined();
        }));

        it('get_device_fingerprint', inject(function (device) {
            expect(device.get_device_fingerprint()).toEqual(jasmine.any(Number));
        }));

        it('is_ie', inject(function (device) {
            expect(device.is_ie()).toEqual(jasmine.any(Boolean));
        }));

        it('is_chrome', inject(function (device) {
            expect(device.is_chrome()).toEqual(jasmine.any(Boolean));
        }));

        it('is_firefox', inject(function (device) {
            expect(device.is_firefox()).toEqual(jasmine.any(Boolean));
        }));

        it('is_safari', inject(function (device) {
            expect(device.is_safari()).toEqual(jasmine.any(Boolean));
        }));

        it('is_opera', inject(function (device) {
            expect(device.is_opera()).toEqual(jasmine.any(Boolean));
        }));

        it('get_device_description', inject(function (device) {
            expect(device.get_device_description()).toEqual(jasmine.any(String));
        }));

    });

}).call();
