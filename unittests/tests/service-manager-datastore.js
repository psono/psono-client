(function () {
    describe('Service: managerDatastore test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('managerDatastore exists', inject(function (managerDatastore) {
            expect(managerDatastore).toBeDefined();
        }));
    });

}).call();
