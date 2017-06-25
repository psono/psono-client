(function () {
    describe('Service: managerExport test suite', function () {

        beforeEach(module('psonocli'));

        it('managerExport exists', inject(function (managerExport) {
            expect(managerExport).toBeDefined();
        }));

        it('on and emit', inject(function (managerExport) {

            var has_been_called = false;

            managerExport.on("my_event", function() {
                has_been_called = true;
            });
            managerExport.emit("my_event");

            expect(has_been_called).toBeTruthy();
        }));

    });

}).call();
