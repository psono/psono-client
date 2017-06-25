(function () {
    describe('Service: cryptoLibrary test suite #1', function () {

        beforeEach(module('psonocli'));

        it('cryptoLibrary exists', inject(function (cryptoLibrary) {
            expect(cryptoLibrary).toBeDefined();
        }));


        var mockedWindow;
        beforeEach(function () {
            mockedWindow = {
                crypto: {
                    // No window.crypto.getRandomValues
                }
            };

            module(function ($provide) {
                $provide.value('$window', mockedWindow);
            });

        });

        return it('cryptoLibrary randomBytes', inject(function (cryptoLibrary) {
            expect( function(){ cryptoLibrary.randomBytes(64); } ).toThrow(
                new Error("No cryptographic random number generator")
            );
        }));
    });

}).call();



(function () {
    describe('Service: cryptoLibrary test suite #2', function () {

        beforeEach(module('psonocli'));

        it('cryptoLibrary exists', inject(function (cryptoLibrary) {
            expect(cryptoLibrary).toBeDefined();
        }));

        it('cryptoLibrary randomBytes', inject(function (cryptoLibrary) {
            expect(cryptoLibrary.randomBytes(16).length).toBe(16);
            expect(cryptoLibrary.randomBytes(32).length).toBe(32);
            expect(cryptoLibrary.randomBytes(64).length).toBe(64);
        }));

        /*
        it("randomBytes doesn't return the the same in 1000 repetitions", inject(function (cryptoLibrary) {
            var num, numbers, random_numbers;
            numbers = 1000;
            random_numbers = (function () {
                var i, ref, results;
                results = [];
                for (num = i = 1, ref = numbers; 1 <= ref ? i <= ref : i >= ref; num = 1 <= ref ? ++i : --i) {
                    results.push(cryptoLibrary.randomBytes(32));
                }
                return results;
            })();
            return expect((new Set(random_numbers)).size).toBe(numbers);
        }));
        */



        it('generate_authkey works', inject(function (cryptoLibrary) {
            expect(cryptoLibrary.generate_authkey('test@example.com', '123456'))
                .toBe('1ad635d464917db74a127b3de19c5bec9df932472c3e31ca8b18e872c641e8c828e9da35543ef36c0b013ab6c549a7ddbfe7b52b08e9e8704aca69f4c2fd68ea');
            return expect(cryptoLibrary.generate_authkey('test2@example.com', '1234567'))
                .toBe('3d97a9354e99760d543761c168b655ccc7e565ddd6ef1d6b83df66d8b50bc62708dfe2c2dc56a628fa24b71bf75fc49db85ce11fd64fadb0e458f3780dde1899');
        }));

        it('generate_secret_key returns a 32 bytes long key', inject(function (cryptoLibrary, converter) {
            var bytes;
            bytes = 32;
            return expect(converter.from_hex(cryptoLibrary.generate_secret_key()).length).toBe(bytes);
        }));

        it('generate_public_private_keypair returns a pair of 32 bytes long keys', inject(function (cryptoLibrary, converter) {
            var bytes, pair;
            bytes = 32;
            pair = cryptoLibrary.generate_public_private_keypair();
            expect(converter.from_hex(pair.private_key).length).toBe(bytes);
            return expect(converter.from_hex(pair.public_key).length).toBe(bytes);
        }));

        it('generate_public_private_keypair returned pairs are different', inject(function (cryptoLibrary) {
            var pair1, pair2;
            pair1 = cryptoLibrary.generate_public_private_keypair();
            pair2 = cryptoLibrary.generate_public_private_keypair();
            expect(pair1.private_key).toBe(pair1.private_key);
            expect(pair1.private_key).not.toBe(pair2.private_key);
            return expect(pair1.public_key).not.toBe(pair2.public_key);
        }));

        it('generate_user_sauce', inject(function (cryptoLibrary, converter) {
            var bytes, user_sauce1, user_sauce2;
            bytes = 32;
            user_sauce1 = cryptoLibrary.generate_user_sauce();
            user_sauce2 = cryptoLibrary.generate_user_sauce();
            expect(converter.from_hex(user_sauce1).length).toBe(bytes);
            return expect(user_sauce1).not.toBe(user_sauce2);
        }));

        it('get_checksum', inject(function (cryptoLibrary) {
            return expect(cryptoLibrary.get_checksum('RBLbEDsvgnU', 2)).toBe('4A');

        }));

        it('generate_recovery_code', inject(function (cryptoLibrary, helper, converter) {

            var recovery_code = cryptoLibrary.generate_recovery_code();

            expect(recovery_code.bytes.length).toBe(16);
            expect(recovery_code.hex).toBe(converter.to_hex(recovery_code.bytes));
            expect(recovery_code.hex).toBe(converter.words_to_hex(recovery_code.words));
            expect(recovery_code.hex).toBe(converter.base58_to_hex(recovery_code.base58));

            var chunks = helper.split_string_in_chunks(recovery_code.base58, 11);

            for (var i = 0; i < chunks.length; i++) {
                chunks[i] += cryptoLibrary.get_checksum(chunks[i], 2);
            }

            return expect(recovery_code.base58_checksums).toBe(chunks.join(''));
        }));

        it('recovery_code_strip_checksums', inject(function (cryptoLibrary) {
            var stripped = cryptoLibrary.recovery_code_strip_checksums('UaKSKNNixJY2ARqGDKXduo4c2N');
            return expect(stripped).toBe('UaKSKNNixJYRqGDKXduo4c');
        }));

        it('recovery_code_strip_checksums chunk < 2', inject(function (cryptoLibrary) {
            try {
                cryptoLibrary.recovery_code_strip_checksums('A');
            }
            catch(err) {
                return expect(err.name).toBe("InvalidRecoveryCodeException");
            }
            return expect("This line").toBe("should never be reached");
        }));

        it('recovery_password_chunk_pass_checksum positive', inject(function (cryptoLibrary) {
            return expect(cryptoLibrary.recovery_password_chunk_pass_checksum('UaKSKNNixJY2A')).toBeTruthy();
        }));

        it('recovery_password_chunk_pass_checksum negative', inject(function (cryptoLibrary) {
            return expect(cryptoLibrary.recovery_password_chunk_pass_checksum('UaKSKNNixJY2B')).toBeFalsy();
        }));

        it('decrypt_secret', inject(function (cryptoLibrary) {
            var data, nonce, password, text, user_sauce;
            data = '12345';
            password = 'myPassword';
            user_sauce = '6168de45af90c335967a8f9eae76f8f19bcb42fb8c3f602fee35f7617acdc489';
            nonce = 'ff786149d8242bb7802379bc5fd2f9ccc744a2e1f18bb0a8';
            text = 'a92528f78ca1f0812a4fb2ee5de4d16eb75d434318';
            return expect(cryptoLibrary.decrypt_secret(text, nonce, password, user_sauce)).toBe(data);
        }));

        it('encrypt_secret', inject(function (cryptoLibrary, converter) {
            var bytes_nonce, data, encrypted_data, encrypted_data2, password, user_sauce;
            bytes_nonce = 24;
            data = '12345';
            password = 'myPassword';
            user_sauce = '6168de45af90c335967a8f9eae76f8f19bcb42fb8c3f602fee35f7617acdc489';
            encrypted_data = cryptoLibrary.encrypt_secret(data, password, user_sauce);
            expect(encrypted_data.text).not.toBe(void 0);
            expect(encrypted_data.nonce).not.toBe(void 0);
            expect(converter.from_hex(encrypted_data.text).length).toBeGreaterThan(0);
            expect(converter.from_hex(encrypted_data.nonce).length).toBe(bytes_nonce);
            expect(cryptoLibrary.decrypt_secret(encrypted_data.text, encrypted_data.nonce, password, user_sauce)).toBe(data);
            encrypted_data2 = cryptoLibrary.encrypt_secret(data, password, user_sauce);
            return expect(encrypted_data.nonce).not.toBe(encrypted_data2.nonce);
        }));

        it('decrypt_data works', inject(function (cryptoLibrary) {
            var data, nonce, secret_key, text;
            data = "12345";
            secret_key = '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d';
            nonce = 'd65673e9abcf379493bba61a576535a82bcf8d735a915390';
            text = '9429f56f028a82ec44651bb7ea6b9f8baab3cd137e';
            return expect(cryptoLibrary.decrypt_data(text, nonce, secret_key)).toBe(data);
        }));

        it('encrypt_data works', inject(function (cryptoLibrary, converter) {
            var bytes_nonce, data, encrypted_data, encrypted_data2, secret_key;
            bytes_nonce = 24;
            data = "12345";
            secret_key = '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d';
            encrypted_data = cryptoLibrary.encrypt_data(data, secret_key);
            expect(encrypted_data.text).not.toBe(void 0);
            expect(encrypted_data.nonce).not.toBe(void 0);
            expect(converter.from_hex(encrypted_data.text).length).toBeGreaterThan(0);
            expect(converter.from_hex(encrypted_data.nonce).length).toBe(bytes_nonce);
            expect(cryptoLibrary.decrypt_data(encrypted_data.text, encrypted_data.nonce, secret_key)).toBe(data);
            encrypted_data2 = cryptoLibrary.encrypt_data(data, secret_key);
            return expect(encrypted_data.nonce).not.toBe(encrypted_data2.nonce);
        }));

        it('decrypt_data_public_key works', inject(function (cryptoLibrary) {
            var data, nonce, pair, pair2, text;
            data = "12345";
            pair = {
                public_key: 'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39',
                private_key: '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660'
            };
            pair2 = {
                public_key: '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a',
                private_key: 'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c'
            };
            nonce = '538a2fc024e1ff7a791da88874099709bdb60ad62653529b';
            text = '0eedec49906748988b011741c8df4214e4dbeeda76';
            return expect(cryptoLibrary.decrypt_data_public_key(text, nonce, pair2.public_key, pair.private_key)).toBe(data);
        }));

        it('encrypt_data_public_key works', inject(function (cryptoLibrary, converter) {
            var bytes_nonce, data, encrypted_data, encrypted_data2, pair, pair2;
            bytes_nonce = 24;
            data = "12345";
            pair = {
                public_key: 'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39',
                private_key: '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660'
            };
            pair2 = {
                public_key: '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a',
                private_key: 'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c'
            };
            encrypted_data = cryptoLibrary.encrypt_data_public_key(data, pair.public_key, pair2.private_key);
            expect(encrypted_data.text).not.toBe(void 0);
            expect(encrypted_data.nonce).not.toBe(void 0);
            expect(converter.from_hex(encrypted_data.text).length).toBeGreaterThan(0);
            expect(converter.from_hex(encrypted_data.nonce).length).toBe(bytes_nonce);
            expect(cryptoLibrary.decrypt_data_public_key(encrypted_data.text, encrypted_data.nonce, pair2.public_key, pair.private_key)).toBe(data);
            encrypted_data2 = cryptoLibrary.encrypt_data_public_key(data, pair.public_key, pair2.private_key);
            return expect(encrypted_data.nonce).not.toBe(encrypted_data2.nonce);
        }));

        it('nacl\'s signing.verify works', inject(function (cryptoLibrary, converter) {
            var nacl = require('ecma-nacl');
            // signing key pair can be generated from some seed array, which can
            // either be random itself, or be generated from a password
            var pair = nacl.signing.generate_keypair(cryptoLibrary.randomBytes(32));

            // make signature bytes, for msg
            var msgSig = nacl.signing.signature(converter.encode_utf8("test message that is some nice text or whatever that needs to be encrypted"), pair.skey);

            // verify signature
            var sigIsOK = nacl.signing.verify(msgSig, converter.encode_utf8("test message that is some nice text or whatever that needs to be encrypted"), pair.pkey);
            expect(sigIsOK).toBe(true);

        }));

        it('validate_signature', inject(function (cryptoLibrary, converter) {
            expect(cryptoLibrary.validate_signature(
                'test message that is some nice text or whatever that needs to be encrypted',
                '6e3302a696092fe3893d971391f94f2cb850d19fbbae9978122f0f465593bc06e65440e0ec929805b58e63fe719983201754a2a578c906c18b8ffa71e3234502',
                '967fd5c3c8386609c1ac57209a6f68a147a56518a7ed5df3285beea58d671f62'
            )).toBe(true);
        }));
    });

}).call();
