(function () {
    describe('Service: browserClient test suite', function () {

        beforeEach(module('psonocli'));

        it('browserClient exists', inject(function (browserClient) {
            expect(browserClient).toBeDefined();
        }));
    });

}).call();
