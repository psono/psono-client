(function () {
    describe('Service: manager test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('manager exists', inject(function (manager) {
            expect(manager).toBeDefined();
        }));


    });

}).call();
