(function () {
    describe('Service: managerSecretLink test suite', function () {

        beforeEach(module('psonocli'));

        it('managerSecretLink exists', inject(function (managerSecretLink) {
            expect(managerSecretLink).toBeDefined();
        }));
    });

}).call();
