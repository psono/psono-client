(function () {
    describe('Service: importKeePassXml test suite', function () {

        beforeEach(module('psonocli'));

        it('importKeePassXml exists', inject(function (importKeePassXml) {
            expect(importKeePassXml).toBeDefined();
        }));

    });

}).call();
