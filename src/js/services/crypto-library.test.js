import React from 'react';
import cryptoLibrary from './crypto-library';
import converter from './converter';
import helper from './helper';

describe('Service: cryptoLibrary test suite #1', function() {
    it('cryptoLibrary exists', function() {
        expect(cryptoLibrary).toBeDefined();
    });
});

describe('Service: cryptoLibrary test suite #2', function() {
    it('cryptoLibrary exists', function() {
        expect(cryptoLibrary).toBeDefined();
    });

    it('cryptoLibrary randomBytes', function() {
        expect(cryptoLibrary.randomBytes(16).length).toBe(16);
        expect(cryptoLibrary.randomBytes(32).length).toBe(32);
        expect(cryptoLibrary.randomBytes(64).length).toBe(64);
    });

    /*
    it("randomBytes doesn't return the the same in 1000 repetitions", function () {
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
    });
    */

    it('generateAuthkey works', function() {
        expect(
            cryptoLibrary.generateAuthkey('test@example.com', '123456')
        ).toBe(
            '1ad635d464917db74a127b3de19c5bec9df932472c3e31ca8b18e872c641e8c828e9da35543ef36c0b013ab6c549a7ddbfe7b52b08e9e8704aca69f4c2fd68ea'
        );
        return expect(
            cryptoLibrary.generateAuthkey('test2@example.com', '1234567')
        ).toBe(
            '3d97a9354e99760d543761c168b655ccc7e565ddd6ef1d6b83df66d8b50bc62708dfe2c2dc56a628fa24b71bf75fc49db85ce11fd64fadb0e458f3780dde1899'
        );
    });

    it('generateAuthkey works', function() {
        expect(
            cryptoLibrary.generateAuthkey('test@example.com', '123456')
        ).toBe(
            '1ad635d464917db74a127b3de19c5bec9df932472c3e31ca8b18e872c641e8c828e9da35543ef36c0b013ab6c549a7ddbfe7b52b08e9e8704aca69f4c2fd68ea'
        );
        return expect(
            cryptoLibrary.generateAuthkey('test2@example.com', '1234567')
        ).toBe(
            '3d97a9354e99760d543761c168b655ccc7e565ddd6ef1d6b83df66d8b50bc62708dfe2c2dc56a628fa24b71bf75fc49db85ce11fd64fadb0e458f3780dde1899'
        );
    });

    it('generate_secret_key returns a 32 bytes long key', function() {
        let bytes;
        bytes = 32;
        return expect(
            converter.fromHex(cryptoLibrary.generateSecretKey()).length
        ).toBe(bytes);
    });

    it('sha1 abc', function() {
        const abc = cryptoLibrary.sha1("abc");
        return expect(
            abc
        ).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    });

    it('sha256 abc', function() {
        const abc = cryptoLibrary.sha256("abc");
        return expect(
            abc
        ).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });

    it('sha512 abc', function() {
        const abc = cryptoLibrary.sha512("abc");
        return expect(
            abc
        ).toBe("ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f");
    });

    it('sha1 empty string', function() {
        const empty = cryptoLibrary.sha1("");
        return expect(
            empty
        ).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    });

    it('sha256 empty string', function() {
        const empty = cryptoLibrary.sha256("");
        return expect(
            empty
        ).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });

    it('sha512 empty string', function() {
        const empty = cryptoLibrary.sha512("");
        return expect(
            empty
        ).toBe("cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e");
    });

    it('generatePublicPrivateKeypair returns a pair of 32 bytes long keys', function() {
        let bytes, pair;
        bytes = 32;
        pair = cryptoLibrary.generatePublicPrivateKeypair();
        expect(converter.fromHex(pair.private_key).length).toBe(bytes);
        return expect(converter.fromHex(pair.public_key).length).toBe(bytes);
    });

    it('generatePublicPrivateKeypair returned pairs are different', function() {
        let pair1, pair2;
        pair1 = cryptoLibrary.generatePublicPrivateKeypair();
        pair2 = cryptoLibrary.generatePublicPrivateKeypair();
        expect(pair1.private_key).toBe(pair1.private_key);
        expect(pair1.private_key).not.toBe(pair2.private_key);
        return expect(pair1.public_key).not.toBe(pair2.public_key);
    });

    it('generateUserSauce', function() {
        let bytes, user_sauce1, user_sauce2;
        bytes = 32;
        user_sauce1 = cryptoLibrary.generateUserSauce();
        user_sauce2 = cryptoLibrary.generateUserSauce();
        expect(converter.fromHex(user_sauce1).length).toBe(bytes);
        return expect(user_sauce1).not.toBe(user_sauce2);
    });

    it('getChecksum', function() {
        return expect(cryptoLibrary.getChecksum('RBLbEDsvgnU', 2)).toBe('4A');
    });

    it('generateRecoveryCode', function() {
        const recovery_code = cryptoLibrary.generateRecoveryCode();

        expect(recovery_code.bytes.length).toBe(16);
        expect(recovery_code.hex).toBe(converter.toHex(recovery_code.bytes));
        expect(recovery_code.hex).toBe(
            converter.wordsToHex(recovery_code.words)
        );
        expect(recovery_code.hex).toBe(
            converter.base58ToHex(recovery_code.base58)
        );

        const chunks = helper.splitStringInChunks(recovery_code.base58, 11);

        for (let i = 0; i < chunks.length; i++) {
            chunks[i] += cryptoLibrary.getChecksum(chunks[i], 2);
        }

        return expect(recovery_code.base58_checksums).toBe(chunks.join(''));
    });

    it('recoveryCodeStripChecksums', function() {
        const stripped = cryptoLibrary.recoveryCodeStripChecksums(
            'UaKSKNNixJY2ARqGDKXduo4c2N'
        );
        return expect(stripped).toBe('UaKSKNNixJYRqGDKXduo4c');
    });

    it('recoveryCodeStripChecksums chunk < 2', function() {
        try {
            cryptoLibrary.recoveryCodeStripChecksums('A');
        } catch (err) {
            return expect(err.name).toBe('InvalidRecoveryCodeException');
        }
        return expect('This line').toBe('should never be reached');
    });

    it('recoveryPasswordChunkPassChecksum positive', function() {
        return expect(
            cryptoLibrary.recoveryPasswordChunkPassChecksum('UaKSKNNixJY2A')
        ).toBeTruthy();
    });

    it('recoveryPasswordChunkPassChecksum negative', function() {
        return expect(
            cryptoLibrary.recoveryPasswordChunkPassChecksum('UaKSKNNixJY2B')
        ).toBeFalsy();
    });

    it('decryptSecret', function() {
        let data, nonce, password, text, user_sauce;
        data = '12345';
        password = 'myPassword';
        user_sauce =
            '6168de45af90c335967a8f9eae76f8f19bcb42fb8c3f602fee35f7617acdc489';
        nonce = 'ff786149d8242bb7802379bc5fd2f9ccc744a2e1f18bb0a8';
        text = 'a92528f78ca1f0812a4fb2ee5de4d16eb75d434318';
        return expect(
            cryptoLibrary.decryptSecret(text, nonce, password, user_sauce)
        ).toBe(data);
    });

    it('encryptSecret', function() {
        let bytes_nonce,
            data,
            encrypted_data,
            encrypted_data2,
            password,
            user_sauce;
        bytes_nonce = 24;
        data = '12345';
        password = 'myPassword';
        user_sauce =
            '6168de45af90c335967a8f9eae76f8f19bcb42fb8c3f602fee35f7617acdc489';
        encrypted_data = cryptoLibrary.encryptSecret(
            data,
            password,
            user_sauce
        );
        expect(encrypted_data.text).not.toBe(void 0);
        expect(encrypted_data.nonce).not.toBe(void 0);
        expect(converter.fromHex(encrypted_data.text).length).toBeGreaterThan(
            0
        );
        expect(converter.fromHex(encrypted_data.nonce).length).toBe(
            bytes_nonce
        );
        expect(
            cryptoLibrary.decryptSecret(
                encrypted_data.text,
                encrypted_data.nonce,
                password,
                user_sauce
            )
        ).toBe(data);
        encrypted_data2 = cryptoLibrary.encryptSecret(
            data,
            password,
            user_sauce
        );
        return expect(encrypted_data.nonce).not.toBe(encrypted_data2.nonce);
    });

    it('decryptData works', function() {
        let data, nonce, secret_key, text;
        data = '12345';
        secret_key =
            '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d';
        nonce = 'd65673e9abcf379493bba61a576535a82bcf8d735a915390';
        text = '9429f56f028a82ec44651bb7ea6b9f8baab3cd137e';
        return expect(cryptoLibrary.decryptData(text, nonce, secret_key)).toBe(
            data
        );
    });

    it('encryptData works', function() {
        let bytes_nonce, data, encrypted_data, encrypted_data2, secret_key;
        bytes_nonce = 24;
        data = '12345';
        secret_key =
            '9f3edbf7760d8ec1e8fd4a9c623b4fe569f324bf42c78770ef0a40a56495f92d';
        encrypted_data = cryptoLibrary.encryptData(data, secret_key);
        expect(encrypted_data.text).not.toBe(void 0);
        expect(encrypted_data.nonce).not.toBe(void 0);
        expect(converter.fromHex(encrypted_data.text).length).toBeGreaterThan(
            0
        );
        expect(converter.fromHex(encrypted_data.nonce).length).toBe(
            bytes_nonce
        );
        expect(
            cryptoLibrary.decryptData(
                encrypted_data.text,
                encrypted_data.nonce,
                secret_key
            )
        ).toBe(data);
        encrypted_data2 = cryptoLibrary.encryptData(data, secret_key);
        return expect(encrypted_data.nonce).not.toBe(encrypted_data2.nonce);
    });

    it('decryptDataPublicKey works', function() {
        let data, nonce, pair, pair2, text;
        data = '12345';
        pair = {
            public_key:
                'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39',
            private_key:
                '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660'
        };
        pair2 = {
            public_key:
                '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a',
            private_key:
                'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c'
        };
        nonce = '538a2fc024e1ff7a791da88874099709bdb60ad62653529b';
        text = '0eedec49906748988b011741c8df4214e4dbeeda76';
        return expect(
            cryptoLibrary.decryptDataPublicKey(
                text,
                nonce,
                pair2.public_key,
                pair.private_key
            )
        ).toBe(data);
    });

    it('encryptDataPublicKey works', function() {
        let bytes_nonce, data, encrypted_data, encrypted_data2, pair, pair2;
        bytes_nonce = 24;
        data = '12345';
        pair = {
            public_key:
                'ed7293c239164855aca4c2e6edb19e09bba41e3451603ec427782d45f2d57b39',
            private_key:
                '035f8aa4c86658a36d995df47c8e3d1e9a7a2a2f3efdcbdc1451ed4354350660'
        };
        pair2 = {
            public_key:
                '57531faba711e6e9bdea25229e63db4ce6eb79f0872d97cbfec74df0382dbf3a',
            private_key:
                'a04c3fbcb4dcf5df44bc433668bb686aac8991f83e993b971e73a0b37ace362c'
        };
        encrypted_data = cryptoLibrary.encryptDataPublicKey(
            data,
            pair.public_key,
            pair2.private_key
        );
        expect(encrypted_data.text).not.toBe(void 0);
        expect(encrypted_data.nonce).not.toBe(void 0);
        expect(converter.fromHex(encrypted_data.text).length).toBeGreaterThan(
            0
        );
        expect(converter.fromHex(encrypted_data.nonce).length).toBe(
            bytes_nonce
        );
        expect(
            cryptoLibrary.decryptDataPublicKey(
                encrypted_data.text,
                encrypted_data.nonce,
                pair2.public_key,
                pair.private_key
            )
        ).toBe(data);
        encrypted_data2 = cryptoLibrary.encryptDataPublicKey(
            data,
            pair.public_key,
            pair2.private_key
        );
        return expect(encrypted_data.nonce).not.toBe(encrypted_data2.nonce);
    });

    it('generateUuid', function() {
        const regex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
        expect(regex.test(cryptoLibrary.generateUuid())).toBe(true);
    });

    it("nacl's signing.verify works", function() {
        const nacl = require('ecma-nacl');
        // signing key pair can be generated from some seed array, which can
        // either be random itself, or be generated from a password
        const pair = nacl.signing.generate_keypair(
            cryptoLibrary.randomBytes(32)
        );

        // make signature bytes, for msg
        const msgSig = nacl.signing.signature(
            converter.encodeUtf8(
                'test message that is some nice text or whatever that needs to be encrypted'
            ),
            pair.skey
        );

        // verify signature
        const sigIsOK = nacl.signing.verify(
            msgSig,
            converter.encodeUtf8(
                'test message that is some nice text or whatever that needs to be encrypted'
            ),
            pair.pkey
        );
        expect(sigIsOK).toBe(true);
    });

    it('validate_signature', function() {
        expect(
            cryptoLibrary.validateSignature(
                'test message that is some nice text or whatever that needs to be encrypted',
                '6e3302a696092fe3893d971391f94f2cb850d19fbbae9978122f0f465593bc06e65440e0ec929805b58e63fe719983201754a2a578c906c18b8ffa71e3234502',
                '967fd5c3c8386609c1ac57209a6f68a147a56518a7ed5df3285beea58d671f62'
            )
        ).toBe(true);
    });
});
