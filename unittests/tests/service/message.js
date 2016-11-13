(function () {
    describe('Service: message test suite', function () {

        beforeEach(module('passwordManagerApp'));

        it('message exists', inject(function (message) {
            expect(message).toBeDefined();
        }));
    });

}).call();
