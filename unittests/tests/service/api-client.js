(function () {
    describe('Service: apiClient test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('apiClient exists', inject(function (apiClient) {
            expect(apiClient).toBeDefined();
        }));
    });

}).call();
