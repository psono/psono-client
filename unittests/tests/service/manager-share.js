(function () {
    describe('Service: managerShare test suite', function () {

        beforeEach(module('psonocli'));

        it('managerShare exists', inject(function (managerShare) {
            expect(managerShare).toBeDefined();
        }));
    });

}).call();
