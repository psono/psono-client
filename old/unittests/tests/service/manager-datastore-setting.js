(function () {
    describe('Service: managerDatastoreSetting test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('settings exists', inject(function (managerDatastoreSetting) {
            expect(managerDatastoreSetting).toBeDefined();
        }));

    });

}).call();
