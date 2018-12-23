(function () {
    describe('Service: managerWidget test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('managerWidget exists', inject(function (managerWidget) {
            expect(managerWidget).toBeDefined();
        }));
    });

}).call();
