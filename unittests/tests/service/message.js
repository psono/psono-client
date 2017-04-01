(function () {
    describe('Service: message test suite', function () {

        beforeEach(module('psonocli'));

        it('message exists', inject(function (message) {
            expect(message).toBeDefined();
        }));
    });

}).call();
