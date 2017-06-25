(function () {
    describe('Service: managerSecurityReport test suite', function () {

        beforeEach(module('psonocli'));

        it('managerSecurityReport exists', inject(function (managerSecurityReport) {
            expect(managerSecurityReport).toBeDefined();
        }));

        it('on and emit', inject(function (managerSecurityReport) {

            var has_been_called = false;

            managerSecurityReport.on("my_event", function() {
                has_been_called = true;
            });
            managerSecurityReport.emit("my_event");

            expect(has_been_called).toBeTruthy();
        }));

    });

}).call();
