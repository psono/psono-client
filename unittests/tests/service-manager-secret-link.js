(function () {
    describe('Service: managerSecretLink test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('managerSecretLink exists', inject(function (managerSecretLink) {
            expect(managerSecretLink).toBeDefined();
        }));
    });

}).call();
