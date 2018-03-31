(function () {
    describe('Service: managerWidget test suite', function () {

        beforeEach(module('psonocli'));

        it('managerWidget exists', inject(function (managerWidget) {
            expect(managerWidget).toBeDefined();
        }));
    });

}).call();
