(function () {
    describe('Service: managerImport test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('managerImport exists', inject(function (managerImport) {
            expect(managerImport).toBeDefined();
        }));

        it('on and emit', inject(function (managerImport) {

            var has_been_called = false;

            managerImport.on("my_event", function() {
                has_been_called = true;
            });
            managerImport.emit("my_event");

            expect(has_been_called).toBeTruthy();
        }));

        it('on and false emit', inject(function (managerImport) {

            var has_been_called = false;

            managerImport.on("my_event1", function() {
                has_been_called = true;
            });
            managerImport.emit("my_event2");

            expect(has_been_called).toBeFalsy();
        }));

        it('register_importer', inject(function (managerImport) {

            var importer_code = 'test_importer';
            var importer = {
                name: 'Test Importer',
                value: importer_code,
                parser: function(data) {
                    return {
                        datastore: {},
                        secrets: []
                    }
                }
            };

            managerImport.register_importer(importer_code, importer);
            expect(managerImport.get_importer()).toEqual([importer]);

        }));

    });

}).call();
