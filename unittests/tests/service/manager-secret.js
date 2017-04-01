(function () {
    describe('Service: managerSecret test suite', function () {

        beforeEach(module('psonocli'));

        it('managerSecret exists', inject(function (managerSecret) {
            expect(managerSecret).toBeDefined();
        }));
    });

}).call();
