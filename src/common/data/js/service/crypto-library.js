(function(angular, require, sha512, sha256, sha1, uuid, blake) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.cryptoLibrary
     * @requires $window
     * @requires psonocli.converter
     * @requires psonocli.helper
     *
     * @description
     * Service with all the cryptographic operations
     */

    function InvalidRecoveryCodeException(message) {
        this.message = message;
        this.name = "InvalidRecoveryCodeException";
    }

    var cryptoLibrary = function($window, $timeout, converter, helper) {

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
            var bs;
            if (typeof module !== 'undefined' && module.exports) {
                // add node.js implementations
                var crypto = require('crypto');
                return crypto.randomBytes(count)
            } else if ($window && $window.crypto && $window.crypto.getRandomValues) {
                // add in-browser implementation
                bs = new Uint8Array(count);
                $window.crypto.getRandomValues(bs);
                return bs;
            } else if ($window && $window.msCrypto && $window.msCrypto.getRandomValues) {
                // add in-browser implementation
                bs = new Uint8Array(count);
                $window.msCrypto.getRandomValues(bs);
                return bs;
            } else {
                throw new Error("No cryptographic random number generator");
            }
        };

        var scrypt_lookup_table = {};

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#clear_scrypt_lookup_table
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * flushes the scrypt lookup table after 60 seconds
         */
        function clear_scrypt_lookup_table() {
            $timeout(function() {
                scrypt_lookup_table = {};
            }, 60000);
        }

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#blake2b
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Returns the blake2b hash
         * Base: https://github.com/dcposch/blakejs
         *
         * @param {Uint8Array} input The input data
         * @param {Uint8Array} key (optional) key Uint8Array, up to 64 bytes
         * @param {Uint8Array} outlen (optional) output length in bytes, default 64
         *
         * @returns {String} Returns the hex representation of the hash
         */
        var blake2b = function (input, key, outlen) {
            return converter.to_hex(blake.blake2b(input, key, outlen))
        };


        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#password_scrypt
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Scrypt wrapper for psono to create for a password and a salt the fix scrypt hash.
         *
         * @param {string} password the password one wants to hash
         * @param {string} salt The fix salt one wants to use
         *
         * @returns {string} The scrypt hash
         */
        function password_scrypt(password, salt) {

            // Lets first generate our key from our user_sauce and password
            var u = 14; //2^14 = 16MB
            var r = 8;
            var p = 1;
            var l = 64; // 64 Bytes = 512 Bits
            var k;

            var lookup_hash = sha512(password) + sha512(salt);

            if (scrypt_lookup_table.hasOwnProperty(lookup_hash)) {
                k = scrypt_lookup_table[lookup_hash];
            } else {
                k = converter.to_hex(nacl.scrypt(converter.encode_utf8(password), converter.encode_utf8(salt), u, r, p, l, function(pDone) {}));
                scrypt_lookup_table[lookup_hash] = k;
                clear_scrypt_lookup_table()
            }
            return k;
        }

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
            // takes the sha512(username) as salt.
            // var salt = nacl.to_hex(nacl.crypto_hash_string(username.toLowerCase()));
            var salt = sha512(username.toLowerCase());
            return password_scrypt(password, salt);
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

            var salt = sha512(user_sauce);
            var k = converter.from_hex(sha256(password_scrypt(password, salt))); // key

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
        function decrypt_secret (text, nonce, password, user_sauce) {

            var salt = sha512(user_sauce);
            var k = converter.from_hex(sha256(password_scrypt(password, salt)));

            // and now lets decrypt
            var n = converter.from_hex(nonce);
            var c = converter.from_hex(text);
            var m1 = nacl.secret_box.open(c, n, k);

            return converter.decode_utf8(m1);
        }

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#encrypt_file
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Encrypts a file (in Uint8 representation)
         *
         * @param {Uint8Array} data The data of the file in Uint8Array encoding
         * @param {string} secret_key The secret key you want to use to encrypt the data
         *
         * @returns {Uint8Array} The encrypted text prepended with the nonce
         */
        var encrypt_file = function (data, secret_key) {
            var k = converter.from_hex(secret_key);
            var n = randomBytes(24);

            return nacl.secret_box.formatWN.pack(data, n, k);
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#decrypt_file
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Decrypts a file (in Uint8 representation) with prepended nonce
         *
         * @param {Uint8Array} text The encrypted data of the file in Uint8Array encoding with prepended nonce
         * @param {string} secret_key The secret key used in the past to encrypt the text
         *
         * @returns {string} The decrypted data
         */
        var decrypt_file = function (text, secret_key) {
            var k = converter.from_hex(secret_key);

            return nacl.secret_box.formatWN.open(text, k);
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

        // /**
        //  * @ngdoc
        //  * @name psonocli.cryptoLibrary#encrypt_data
        //  * @methodOf psonocli.cryptoLibrary
        //  *
        //  * @description
        //  * Takes the data and the secret_key as hex and encrypts the data.
        //  * Returns the nonce and the cipher text as hex.
        //  *
        //  * @param {string} data The data you want to encrypt
        //  * @param {string} secret_key The secret key you want to use to encrypt the data
        //  * @param {string} format The data returned, either hex or raw
        //  *
        //  * @returns {EncryptedValue} The encrypted text and the nonce
        //  */
        // var encrypt_data = function (data, secret_key, format) {
        //
        //     var k = converter.from_hex(secret_key);
        //
        //     var m;
        //     if (typeof(data) === 'string') {
        //         m = converter.encode_utf8(data);
        //     } else {
        //         m = data;
        //     }
        //
        //     var n = randomBytes(24);
        //     var c = nacl.secret_box.pack(m, n, k);
        //
        //     if (format === 'hex') {
        //         return {
        //             nonce: converter.to_hex(n),
        //             text: converter.to_hex(c)
        //         };
        //     } else if (format === 'raw') {
        //         return {
        //             nonce: n,
        //             text: c
        //         };
        //     } else {
        //         // default hex
        //         return {
        //             nonce: converter.to_hex(n),
        //             text: converter.to_hex(c)
        //         };
        //     }
        // };

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
            if (chunk_with_checksum.length < 2) return false;
            var password = chunk_with_checksum.substring(0, chunk_with_checksum.length -2);
            var checksum = chunk_with_checksum.substring(chunk_with_checksum.length -2);
            return get_checksum(password, 2) === checksum;
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#generate_uuid
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Generates a uuid
         *
         * @returns {uuid} Returns weather the password chunk is valid
         */
        var generate_uuid = function() {
            return uuid.v4();
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#validate_signature
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Returns whether the provided message and verify_key produce the correct signature or not
         *
         * @param {string} message The raw message to verify
         * @param {string} signature The hex representation of the signature
         * @param {string} verify_key The hex representation of the verification key
         *
         * @returns {boolean} Returns whether the signature is correct or not
         */
        var validate_signature = function(message, signature, verify_key) {
            return nacl.signing.verify(converter.from_hex(signature), converter.encode_utf8(message), converter.from_hex(verify_key));
        };

        /**
         * @ngdoc
         * @name psonocli.cryptoLibrary#get_verify_key
         * @methodOf psonocli.cryptoLibrary
         *
         * @description
         * Returns the verify key for a given seed
         *
         * @param {string} seed The seed
         *
         * @returns {boolean} Returns the verify key for a given seed
         */
        var get_verify_key = function(seed) {

            var pair = nacl.signing.generate_keypair(converter.from_hex(seed));

            return converter.to_hex(pair.pkey);
        };

        return {
            randomBytes: randomBytes,
            sha1: sha1,
            sha256: sha256,
            sha512: sha512,
            blake2b: blake2b,
            password_scrypt: password_scrypt,
            generate_authkey: generate_authkey,
            generate_secret_key: generate_secret_key,
            generate_public_private_keypair: generate_public_private_keypair,
            encrypt_secret: encrypt_secret,
            decrypt_secret: decrypt_secret,
            encrypt_file: encrypt_file,
            decrypt_file: decrypt_file,
            encrypt_data: encrypt_data,
            decrypt_data: decrypt_data,
            encrypt_data_public_key: encrypt_data_public_key,
            decrypt_data_public_key: decrypt_data_public_key,
            generate_user_sauce: generate_user_sauce,
            get_checksum: get_checksum,
            generate_recovery_code: generate_recovery_code,
            recovery_code_strip_checksums: recovery_code_strip_checksums,
            recovery_password_chunk_pass_checksum: recovery_password_chunk_pass_checksum,
            generate_uuid: generate_uuid,
            validate_signature: validate_signature,
            get_verify_key: get_verify_key
        };
    };

    var app = angular.module('psonocli');
    app.factory("cryptoLibrary", ['$window', '$timeout', 'converter', 'helper', cryptoLibrary]);

}(angular, require, sha512, sha256, sha1, uuid, blake));

