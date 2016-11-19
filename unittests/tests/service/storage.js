(function () {
    describe('Service: storage test suite', function () {

        beforeEach(module('psonocli'));

        it('storage exists', inject(function (storage) {
            expect(storage).toBeDefined();
        }));
    });

}).call();
