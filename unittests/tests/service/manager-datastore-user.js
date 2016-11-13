(function () {
    describe('Service: managerDatastoreUser test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('managerDatastoreUser exists', inject(function (managerDatastoreUser) {
            expect(managerDatastoreUser).toBeDefined();
        }));
    });

}).call();
