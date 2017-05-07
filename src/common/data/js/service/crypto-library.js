(function(angular, require, sha512, sha256) {
    'use strict';

    function InvalidRecoveryCodeException(message) {
        this.message = message;
        this.name = "InvalidRecoveryCodeException";
    }

    var cryptoLibrary = function($window, converter, helper) {

        /**
         * @ngdoc service
         * @name psonocli.cryptoLibrary
         *
         * @description
         * Service with all the cryptographic operations
         */

        var nacl = require('ecma-nacl');

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#randomBytes
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Random byte generator from nacl_factory.js
         * https://github.com/tonyg/js-nacl
         *
         * @param {int} count The amount of random bytes to return
         *
         * @returns {Uint8Array} Random byte array
         */
        var randomBytes = function (count) {
            if (typeof module !== 'undefined' && module.exports) {
                // add node.js implementations
                var crypto = require('crypto');
                return crypto.randomBytes(count)
            } else if ($window && $window.crypto && $window.crypto.getRandomValues) {
                // add in-browser implementation
                var bs = new Uint8Array(count);
                $window.crypto.getRandomValues(bs);
                return bs;
            } else {
                throw new Error("No cryptographic random number generator");
            }
        };


        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#generate_authkey
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * takes the sha512 of lowercase username as salt to generate scrypt password hash in hex called
         * the authkey, so basically:
         *
         * hex(scrypt(password, hex(sha512(lower(username)))))
         *
         * For compatibility reasons with other clients please use the following parameters if you create your own client:
         *
         * var c = 16384 // 2^14;
         * var r = 8;
         * var p = 1;
         * var l = 64;
         *
         * @param {string} username Username of the user (in email format)
         * @param {string} password Password of the user
         *
         * @returns {string} auth_key Scrypt hex value of the password with the sha512 of lowercase email as salt
         */
        var generate_authkey = function (username, password) {

            var u = 14; //2^14 = 16MB
            var r = 8;
            var p = 1;
            var l = 64; // 64 Bytes = 512 Bits

            // takes the sha512(username) as salt.
            // var salt = nacl.to_hex(nacl.crypto_hash_string(username.toLowerCase()));
            var salt = sha512(username.toLowerCase());


            return converter.to_hex(nacl.scrypt(converter.encode_utf8(password), converter.encode_utf8(salt), u, r, p, l, function(pDone) {}));
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#generate_secret_key
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * generates secret keys that is 32 Bytes or 256 Bits long and represented as hex
         *
         * @returns {string} Returns secret key (hex encoded, 32 byte long)
         */
        var generate_secret_key = function () {

            return converter.to_hex(randomBytes(32)); // 32 Bytes = 256 Bits
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#generate_public_private_keypair
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * generates public and private key pair
         * All keys are 32 Bytes or 256 Bits long and represented as hex
         *
         * @returns {PublicPrivateKeyPair} Returns object with a public-private-key-pair
         */
        var generate_public_private_keypair = function () {

            var sk = randomBytes(32);
            var pk = nacl.box.generate_pubkey(sk);

            return {
                public_key : converter.to_hex(pk), // 32 Bytes = 256 Bits
                private_key : converter.to_hex(sk) // 32 Bytes = 256 Bits
            };
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#encrypt_secret
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Takes the secret and encrypts that with the provided password. The crypto_box takes only 256 bits, therefore we
         * are using sha256(password+user_sauce) as key for encryption.
         * Returns the nonce and the cipher text as hex.
         *
         * @param {string} secret The secret you want to encrypt
         * @param {string} password The password you want to use to encrypt the secret
         * @param {string} user_sauce The user's sauce
         *
         * @returns {EncryptedValue} The encrypted text and the nonce
         */
        var encrypt_secret = function (secret, password, user_sauce) {

            // Lets first generate our key from our user_sauce and password
            var u = 14; //2^14 = 16MB
            var r = 8;
            var p = 1;
            var l = 64; // 64 Bytes = 512 Bits

            var salt = sha512(user_sauce);

            var k = converter.from_hex(sha256(converter.to_hex(nacl.scrypt(converter.encode_utf8(password), converter.encode_utf8(salt), u, r, p, l, function(pDone) {})))); // key

            // and now lets encrypt
            var m = converter.encode_utf8(secret); // message
            var n = randomBytes(24); // nonce
            var c = nacl.secret_box.pack(m, n, k); //encrypted message

            return {
                nonce: converter.to_hex(n),
                text: converter.to_hex(c)
            };

        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#decrypt_secret
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Takes the cipher text and decrypts that with the nonce and the sha256(password+user_sauce).
         * Returns the initial secret.
         *
         * @param {string} text The encrypted text
         * @param {string} nonce The nonce for the encrypted text
         * @param {string} password The password to decrypt the text
         * @param {string} user_sauce The users sauce used during encryption
         *
         * @returns {string} secret The decrypted secret
         */
        var decrypt_secret = function (text, nonce, password, user_sauce) {

            // Lets first generate our key from our user_sauce and password
            var u = 14; //2^14 = 16MB
            var r = 8;
            var p = 1;
            var l = 64; // 64 Bytes = 512 Bits

            var salt = sha512(user_sauce);

            var k = converter.from_hex(sha256(converter.to_hex(nacl.scrypt(converter.encode_utf8(password), converter.encode_utf8(salt), u, r, p, l, function(pDone) {})))); // key

            // and now lets decrypt
            var n = converter.from_hex(nonce);
            var c = converter.from_hex(text);
            var m1 = nacl.secret_box.open(c, n, k);

            return converter.decode_utf8(m1);
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#encrypt_data
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Takes the data and the secret_key as hex and encrypts the data.
         * Returns the nonce and the cipher text as hex.
         *
         * @param {string} data The data you want to encrypt
         * @param {string} secret_key The secret key you want to use to encrypt the data
         *
         * @returns {EncryptedValue} The encrypted text and the nonce
         */
        var encrypt_data = function (data, secret_key) {

            var k = converter.from_hex(secret_key);
            var m = converter.encode_utf8(data);
            var n = randomBytes(24);
            var c = nacl.secret_box.pack(m, n, k);

            return {
                nonce: converter.to_hex(n),
                text: converter.to_hex(c)
            };
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#decrypt_data
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Takes the cipher text and decrypts that with the nonce and the secret_key.
         * Returns the initial data.
         *
         * @param {string} text The encrypted text
         * @param {string} nonce The nonce of the encrypted text
         * @param {string} secret_key The secret key used in the past to encrypt the text
         *
         * @returns {string} The decrypted data
         */
        var decrypt_data = function (text, nonce, secret_key) {

            var k = converter.from_hex(secret_key);
            var n = converter.from_hex(nonce);
            var c = converter.from_hex(text);
            var m1 = nacl.secret_box.open(c, n, k);

            return converter.decode_utf8(m1);
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#encrypt_data_public_key
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Takes the data and encrypts that with a random nonce, the receivers public key and users private key.
         * Returns the nonce and the cipher text as hex.
         *
         * @param {string} data The data you want to encrypt
         * @param {string} public_key The public key you want to use for the encryption
         * @param {string} private_key The private key you want to use for the encryption
         *
         * @returns {EncryptedValue} The encrypted text and the nonce
         */
        var encrypt_data_public_key = function (data, public_key, private_key) {

            var p = converter.from_hex(public_key);
            var s = converter.from_hex(private_key);
            var m = converter.encode_utf8(data);
            var n = randomBytes(24);
            var c = nacl.box.pack(m, n, p, s);

            return {
                nonce: converter.to_hex(n),
                text: converter.to_hex(c)
            };
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#decrypt_data_public_key
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Takes the cipher text and decrypts that with the nonce, the senders public key and users private key.
         * Returns the initial data.
         *
         * @param {string} text The encrypted text
         * @param {string} nonce The nonce that belongs to the encrypted text
         * @param {string} public_key The pulic key you want to use to decrypt the text
         * @param {string} private_key The private key you want to use to encrypt the text
         *
         * @returns {string} The decrypted data
         */
        var decrypt_data_public_key = function (text, nonce, public_key, private_key) {

            var p = converter.from_hex(public_key);
            var s = converter.from_hex(private_key);
            var n = converter.from_hex(nonce);
            var c = converter.from_hex(text);
            var m1 = nacl.box.open(c, n, p, s);

            return converter.decode_utf8(m1);
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#generate_user_sauce
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * returns a 32 bytes long random hex value to be used as the user special sauce
         *
         * @returns {string} Returns a random user sauce (32 bytes, hex encoded)
         */
        var generate_user_sauce = function() {

            return converter.to_hex(randomBytes(32)); // 32 Bytes = 256 Bits
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#get_checksum
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * generates a n-long base58 checksum
         *
         * @param {string} str The string of which ones to have a checksum
         * @param {int} n The length of the checksum one wants to have
         *
         * @returns {string} Returns n base58 encoded chars as checksum
         */
        var get_checksum = function(str, n) {
            return converter.hex_to_base58(sha512(str)).substring(0, n);
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#generate_recovery_code
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * returns a 16 bytes long random base58 value to be used as recovery password including four base58 letters as checksum
         *
         * @returns {object} Returns a random user sauce (16 bytes, hex encoded)
         */
        var generate_recovery_code = function() {
            var password_bytes = randomBytes(16);// 16 Bytes = 128 Bits
            var password_hex = converter.to_hex(password_bytes);
            var password_words = converter.hex_to_words(password_hex);
            var password_base58 = converter.to_base58(password_bytes);

            // Then we split up everything in 11 digits long chunks
            var recovery_code_chunks = helper.split_string_in_chunks(password_base58, 11);
            // Then we loop over our chunks and use the base58 representation of the sha512 checksum to get 2 checksum
            // digits, and append them to the original chunk
            for (var i = 0; i < recovery_code_chunks.length; i++) {
                recovery_code_chunks[i] += get_checksum(recovery_code_chunks[i], 2);
            }

            return {
                bytes: password_bytes,
                hex: password_hex,
                words: password_words,
                base58: password_base58,
                base58_checksums: recovery_code_chunks.join('')
            };
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#recovery_code_strip_checksums
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Removes the checksums from a base58 encoded recovery code with checksums.
         * e.g. 'UaKSKNNixJY2ARqGDKXduo4c2N' becomes 'UaKSKNNixJYRqGDKXduo4c'
         *
         * @param {string} recovery_code_with_checksums The recovery code with checksums
         *
         * @returns {string} Returns recovery code without checksums
         */
        var recovery_code_strip_checksums = function(recovery_code_with_checksums) {

            var recovery_code_chunks = helper.split_string_in_chunks(recovery_code_with_checksums, 13);

            for (var i = 0; i < recovery_code_chunks.length; i++) {

                if (recovery_code_chunks[i].length < 2) {
                    throw new InvalidRecoveryCodeException("Recovery code chunks with a size < 2 are impossible");
                }
                recovery_code_chunks[i] = recovery_code_chunks[i].slice(0,-2);
            }
            return recovery_code_chunks.join('')
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#recovery_password_chunk_pass_checksum
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Tests if a given recovery password chunk can be valid according to the checksum
         * e.g. UaKSKNNixJY2A would return true and UaKSKNNixJY2B would return false
         *
         * @returns {boolean} Returns weather the password chunk is valid
         */
        var recovery_password_chunk_pass_checksum = function(chunk_with_checksum) {
            var password = chunk_with_checksum.substring(0, chunk_with_checksum.length -2);
            var checksum = chunk_with_checksum.substring(chunk_with_checksum.length -2);
            return get_checksum(password, 2) === checksum;
        };


        return {
            randomBytes: randomBytes,
            sha256: sha256,
            sha512: sha512,
            generate_authkey: generate_authkey,
            generate_secret_key: generate_secret_key,
            generate_public_private_keypair: generate_public_private_keypair,
            encrypt_secret: encrypt_secret,
            decrypt_secret: decrypt_secret,
            encrypt_data: encrypt_data,
            decrypt_data: decrypt_data,
            encrypt_data_public_key: encrypt_data_public_key,
            decrypt_data_public_key: decrypt_data_public_key,
            generate_user_sauce: generate_user_sauce,
            get_checksum: get_checksum,
            generate_recovery_code: generate_recovery_code,
            recovery_code_strip_checksums: recovery_code_strip_checksums,
            recovery_password_chunk_pass_checksum: recovery_password_chunk_pass_checksum
        };
    };

    var app = angular.module('psonocli');
    app.factory("cryptoLibrary", ['$window', 'converter', 'helper', cryptoLibrary]);

}(angular, require, sha512, sha256));

