(function () {
    describe('Service: manager test suite', function () {

        beforeEach(module('psonocli'));

        it('manager exists', inject(function (manager) {
            expect(manager).toBeDefined();
        }));
    });

}).call();
