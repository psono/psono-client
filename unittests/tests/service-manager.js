(function () {
    describe('Service: manager test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('manager exists', inject(function (manager) {
            expect(manager).toBeDefined();
        }));
    });

}).call();
