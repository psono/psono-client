(function () {
    describe('Service: managerDatastoreSetting test suite', function () {

        beforeEach(module('psonocli'));

        it('settings exists', inject(function (managerDatastoreSetting) {
            expect(managerDatastoreSetting).toBeDefined();
        }));

    });

}).call();
