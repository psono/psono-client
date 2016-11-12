(function () {
    describe('Service: managerBase test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('managerBase exists', inject(function (managerBase) {
            expect(managerBase).toBeDefined();
        }));
    });

}).call();
