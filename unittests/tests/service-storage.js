(function () {
    describe('Service: storage test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('storage exists', inject(function (storage) {
            expect(storage).toBeDefined();
        }));
    });

}).call();
