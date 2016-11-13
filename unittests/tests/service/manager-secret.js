(function () {
    describe('Service: managerSecret test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('managerSecret exists', inject(function (managerSecret) {
            expect(managerSecret).toBeDefined();
        }));
    });

}).call();
