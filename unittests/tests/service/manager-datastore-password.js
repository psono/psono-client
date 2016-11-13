(function () {
    describe('Service: managerDatastorePassword test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('managerDatastorePassword exists', inject(function (managerDatastorePassword) {
            expect(managerDatastorePassword).toBeDefined();
        }));
    });

}).call();
