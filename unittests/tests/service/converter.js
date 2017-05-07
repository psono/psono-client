(function () {
    describe('Service: converter test suite', function () {

        beforeEach(module('psonocli'));

        it('converter exists', inject(function (converter) {
            expect(converter).toBeDefined();
        }));



        it('to_hex returns real hex values', inject(function (converter) {
            return expect(converter.to_hex(new Uint8Array([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
                10, 11, 12, 13, 14, 15
            ]))).toBe('000102030405060708090a0b0c0d0e0f');
        }));

        it('from_hex returns the true Uint8Array', inject(function (converter) {
            return expect(converter.to_hex(converter.from_hex('000102030405060708090a0b0c0d0e0f'))).toBe('000102030405060708090a0b0c0d0e0f');
        }));

        it('to_base58 returns the true Uint8Array', inject(function (converter) {
            return expect(converter.to_base58(new Uint8Array([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
                10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
                20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
                30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
                40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
                50, 51, 52, 53, 54, 55, 56, 57
            ]))).toBe('17zGKMk8LJ2vxPFJLY5ZT29kPLxuY4YedQ2wsCWP5aYENhQ93SGhYcc3XZaWR5w7pEvXozuf3daKVr');
        }));

        it('from_base58 returns the true Uint8Array', inject(function (converter) {
            return expect(converter.to_base58(converter.from_base58('17zGKMk8LJ2vxPFJLY5ZT29kPLxuY4YedQ2wsCWP5aYENhQ93SGhYcc3XZaWR5w7pEvXozuf3daKVr')))
                .toBe('17zGKMk8LJ2vxPFJLY5ZT29kPLxuY4YedQ2wsCWP5aYENhQ93SGhYcc3XZaWR5w7pEvXozuf3daKVr');
        }));

        it('hex_to_base58', inject(function (converter) {
            return expect(converter.hex_to_base58('000102030405060708090a0b0c0d0e0f')).toBe('12drXXUifSrRnXLGbXg8E');
        }));

        it('base58_to_hex', inject(function (converter) {
            return expect(converter.base58_to_hex('12drXXUifSrRnXLGbXg8E')).toBe('000102030405060708090a0b0c0d0e0f');
        }));

        it('uuid_to_hex', inject(function (converter) {
            return expect(converter.uuid_to_hex('3682454d-d080-44c2-b58c-721ef6459e32'))
                .toBe('3682454dd08044c2b58c721ef6459e32');
        }));

        it('hex_to_uuid', inject(function (converter) {
            return expect(converter.hex_to_uuid('28b461d094d84a32b546f8cc382d49f0'))
                .toBe('28b461d0-94d8-4a32-b546-f8cc382d49f0');
        }));

        it('words_to_hex', inject(function (converter) {
            return expect(converter.words_to_hex(['lazy', 'lock', 'lock', 'price', 'economy', 'enable', 'arctic', 'animal', 'aunt', 'damp', 'novel', 'party']))
                .toBe('000102030405060708090a0b0c0d0e0f');
        }));

        it('hex_to_words', inject(function (converter) {
            return expect(converter.hex_to_words('000102030405060708090a0b0c0d0e0f'))
                .toEqual(['lazy', 'lock', 'lock', 'price', 'economy', 'enable', 'arctic', 'animal', 'aunt', 'damp', 'novel', 'party']);
        }));


        it('from_base_x:ambiguous alphabet', inject(function (converter) {
            return expect(function() { converter.from_base_x('ABAAAB', 'ABB') }).toThrow(
                new TypeError('B is ambiguous')
            );
        }));

        it('from_base_x:value not in alphabet', inject(function (converter) {
            return expect(function() { converter.from_base_x('AZB', 'AB') }).toThrow(
                new Error('Non-base2 character')
            );
        }));

        it('from_base_x:val.length = 0', inject(function (converter) {
            return expect(converter.from_base_x('', 'AB')).toEqual(new Uint8Array(0));
        }));

        it('to_base_x', inject(function (converter) {
            return expect(converter.to_base_x('', 'AB')).toBe('');
        }));

        return it('encode_latin1', inject(function (converter) {
            var to_encode = String.fromCharCode(0x100);
            return expect(function(){ converter.encode_latin1(to_encode) }).toThrow(
                new Error("Cannot encode string in Latin1:" + to_encode)
            );
        }));
    });

}).call();
