(function () {
    describe('Service: managerDatastorePassword test suite', function () {

        beforeEach(module('psonocli'));

        it('managerDatastorePassword exists', inject(function (managerDatastorePassword) {
            expect(managerDatastorePassword).toBeDefined();
        }));
    });

}).call();
