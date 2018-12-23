(function () {
    describe('Service: managerDatastorePassword test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('managerDatastorePassword exists', inject(function (managerDatastorePassword) {
            expect(managerDatastorePassword).toBeDefined();
        }));
    });

}).call();
