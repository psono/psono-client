(function () {
    describe('Service: manager test suite', function () {

        beforeEach(module('psonocli'));

        it('manager exists', inject(function (manager) {
            expect(manager).toBeDefined();
        }));

        it('manager exists', inject(function (manager, storage) {

            var db = 'db';
            var key = 'key';

            spyOn(storage, 'find_one');

            manager.find_one(db, key);

            expect(storage.find_one).toHaveBeenCalledWith(db, {'key': key});

        }));



    });

}).call();
