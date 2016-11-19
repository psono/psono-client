(function () {
    describe('Service: managerDatastoreUser test suite', function () {

        beforeEach(module('psonocli'));

        it('managerDatastoreUser exists', inject(function (managerDatastoreUser) {
            expect(managerDatastoreUser).toBeDefined();
        }));
    });

}).call();
