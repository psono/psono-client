(function () {
    describe('Service: browserClient test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('browserClient exists', inject(function (browserClient) {
            expect(browserClient).toBeDefined();
        }));
    });

}).call();
