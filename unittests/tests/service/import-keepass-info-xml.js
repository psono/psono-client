(function () {
    describe('Service: importKeePassXml test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('importKeePassXml exists', inject(function (importKeePassXml) {
            expect(importKeePassXml).toBeDefined();
        }));

    });

}).call();
