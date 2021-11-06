(function () {
    describe('Service: storage test suite', function () {

        beforeEach(module('psonocli', function ($translateProvider) {

            $translateProvider.translations('en', {});
        }));

        it('storage exists', inject(function (storage) {
            expect(storage).toBeDefined();
        }));

        it('insert', inject(function (storage) {

            var key = 'the_dummy_key';
            var value = 'the_dummy_value';

            var db_entry = storage.insert('config', {key: key, value: value});

            expect(db_entry.hasOwnProperty("key")).toBeTruthy();
            expect(db_entry.hasOwnProperty("value")).toBeTruthy();
            expect(db_entry.hasOwnProperty("meta")).toBeTruthy();
            expect(db_entry.meta.hasOwnProperty("revision")).toBeTruthy();
            expect(db_entry.key).toBe(key);
            expect(db_entry.value).toBe(value);
            expect(db_entry.meta.revision).toBe(0);
        }));

        it('update', inject(function (storage) {

            var key = 'another_dummy_key';
            var value = 'another_dummy_value';
            var value2 = 'another_dummy_value2';

            var db_entry = storage.insert('config', {key: key, value: value});

            expect(db_entry.key).toBe(key);
            expect(db_entry.value).toBe(value);
            expect(db_entry.meta.revision).toBe(0);

            db_entry.value = value2;

            var db_entry2 = storage.update('config', db_entry);

            expect(db_entry.meta.revision).toBe(1);
            expect(db_entry.key).toBe(key);
            expect(db_entry.value).toBe(value2);

            expect(db_entry2.hasOwnProperty("key")).toBeTruthy();
            expect(db_entry2.hasOwnProperty("value")).toBeTruthy();
            expect(db_entry2.hasOwnProperty("meta")).toBeTruthy();
            expect(db_entry2.meta.hasOwnProperty("revision")).toBeTruthy();
            expect(db_entry2.key).toBe(key);
            expect(db_entry2.value).toBe(value2);
            expect(db_entry2.meta.revision).toBe(1);

        }));

        it('upsert_as_single_items', inject(function (storage) {

            var a_key = 'a1_dummy_key';
            var a_value = 'a1_dummy_value';
            var a_value2 = 'a1_dummy_value2';

            var b_key = 'b1_dummy_key';
            var b_value2 = 'b1_dummy_value2';

            storage.insert('config', {key: a_key, value: a_value});

            storage.upsert('config', {key: a_key, value: a_value2});
            storage.upsert('config', {key: b_key, value: b_value2});

            expect(storage.find_key('config', a_key).value).toBe(a_value2);
            expect(storage.find_key('config', b_key).value).toBe(b_value2);

        }));

        it('upsert_as_array', inject(function (storage) {

            var a_key = 'a2_dummy_key';
            var a_value = 'a2_dummy_value';
            var a_value2 = 'a2_dummy_value2';

            var b_key = 'b2_dummy_key';
            var b_value2 = 'b2_dummy_value2';

            storage.insert('config', {key: a_key, value: a_value});

            storage.upsert('config', [{key: a_key, value: a_value2}, {key: b_key, value: b_value2}]);

            expect(storage.find_key('config', a_key).value).toBe(a_value2);
            expect(storage.find_key('config', b_key).value).toBe(b_value2);

        }));

        it('where', inject(function (storage) {

            var key1 = storage.insert('config', {key: 'key1', value: 'value1'});
            var key2 = storage.insert('config', {key: 'key2', value: 'value2'});
            var key3 = storage.insert('config', {key: 'key3', value: 'value3'});
            var key4 = storage.insert('config', {key: 'key4', value: 'value4'});

            var filtered_values = storage.where('config', function(entry) {
                return entry.key === 'key2' || entry.key === 'key3';
            });

            expect(filtered_values.length).toBe(2);
        }));

        it('key_exists', inject(function (storage) {

            var key = 'third_dummy_key';
            var value = 'third_dummy_value';

            expect(storage.key_exists('config', key)).toBeFalsy();

            var db_entry = storage.insert('config', {key: key, value: value});

            expect(storage.key_exists('config', key)).toBeTruthy();

            storage.remove('config', db_entry);

            expect(storage.key_exists('config', key)).toBeFalsy();

        }));

        it('remove', inject(function (storage) {

            var key = 'fourth_dummy_key';
            var value = 'fourth_dummy_value';

            var db_entry = storage.insert('config', {key: key, value: value});

            expect(storage.key_exists('config', key)).toBeTruthy();

            storage.remove('config', db_entry);

            expect(storage.key_exists('config', key)).toBeFalsy();

        }));

        it('remove_all_with_db', inject(function (storage) {

            var key = 'fifth_dummy_key';
            var value = 'fifth_dummy_value';

            var db_entry = storage.insert('config', {key: key, value: value});

            expect(storage.key_exists('config', key)).toBeTruthy();

            storage.remove_all('config');

            expect(storage.key_exists('config', key)).toBeFalsy();

        }));

        it('remove_all_without_db', inject(function (storage) {

            var key = 'sixth_dummy_key';
            var value = 'sixth_dummy_value';

            storage.insert('config', {key: key, value: value});

            expect(storage.key_exists('config', key)).toBeTruthy();

            storage.remove_all();

            expect(storage.key_exists('config', key)).toBeFalsy();

        }));

    });

}).call();
