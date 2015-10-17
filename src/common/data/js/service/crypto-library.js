(function(angular, nacl_factory, scrypt_module_factory) {
    'use strict';

    var nacl = nacl_factory.instantiate();

    /* Im afraid people will send/use shaXXX hashes of their password for other purposes, therefore I add this special
     * sauce to every hash. This special sauce can be considered a constant and will never change. Its no secret but
     * it should not be used for anything else besides the reasons below */
    var special_sauce = 'c8db7c084e181fbd0c616ed445545375a40d9a3ddc3f9d8fac1dba860579cbc1';//sha256 of 'danielandsaschatryingtheirbest'

    /**
     * takes the sha512 of lowercase email (+ special sauce) as salt to generate scrypt password hash in hex called the
     * authkey, so basically:
     *
     * hex(scrypt(password, hex(sha512(lower(email)+special_sauce))))
     *
     * For compatibility reasons with other clients please use the following parameters if you create your own client:
     *
     * var n = 16384 // 2^14;
     * var r = 8;
     * var p = 1;
     * var l = 64;
     *
     * var special_sauce = 'c8db7c084e181fbd0c616ed445545375a40d9a3ddc3f9d8fac1dba860579cbc1'
     *
     * @param {string} email - email address of the user
     * @param {string} password - password of the user
     * @returns auth_key - scrypt hex value of the password with the sha512 of lowercase email as salt
     */
    var generate_authkey = function (email, password) {

        var n = 16384; //2^14
        var r = 8;
        var p = 1;
        var l = 64; // 64 Bytes = 512 Bits

        var scrypt = scrypt_module_factory();

        // takes the email address basically as salt. sha512 is used to enforce minimum length
        var salt = nacl.to_hex(nacl.crypto_hash_string(email.toLowerCase() + special_sauce));

        return scrypt.to_hex(scrypt.crypto_scrypt(scrypt.encode_utf8(password), scrypt.encode_utf8(salt), n, r, p, l));
    };

    /**
     * generates secret keys that is 32 Bytes or 256 Bits long and represented as hex
     *
     * @returns {{public_key: string, private_key: string, secret_key: string}}
     */
    var generate_secret_key = function () {

        return nacl.to_hex(nacl.random_bytes(32)); // 32 Bytes = 256 Bits
    };

    /**
     * generates public and private key pair
     * All keys are 32 Bytes or 256 Bits long and represented as hex
     *
     * @returns {{public_key: string, private_key: string}}
     */
    var generate_public_private_keypair = function () {

        var pair = nacl.crypto_box_keypair();

        return {
            public_key : nacl.to_hex(pair.boxPk), // 32 Bytes = 256 Bits
            private_key : nacl.to_hex(pair.boxSk) // 32 Bytes = 256 Bits
        };
    };

    /**
     * Takes the secret and encrypts that with the provided password. The crypto_box takes only 256 bits, therefore we
     * are using sha256(password+special_sauce) as key for encryption.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} secret
     * @param {string} password
     * @returns {{nonce: string, ciphertext: string}}
     */
    var encrypt_secret = function (secret, password) {

        var k = nacl.crypto_hash_sha256(nacl.encode_utf8(password + special_sauce));
        var m = nacl.encode_utf8(secret);
        var n = nacl.crypto_secretbox_random_nonce();
        var c = nacl.crypto_secretbox(m, n, k);

        return {
            nonce: nacl.to_hex(n),
            ciphertext: nacl.to_hex(c)
        };

    };

    /**
     * Takes the cipher text and decrypts that with the nonce and the sha256(password+special_sauce).
     * Returns the initial secret.
     *
     * @param {string} ciphertext
     * @param {string} nonce
     * @param {string} password
     *
     * @returns {string} secret
     */
    var decrypt_secret = function (ciphertext, nonce, password) {

        var k = nacl.crypto_hash_sha256(nacl.encode_utf8(password + special_sauce));
        var n = nacl.from_hex(nonce);
        var c = nacl.from_hex(ciphertext);
        var m1 = nacl.crypto_secretbox_open(c, n, k);

        return nacl.decode_utf8(m1);
    };

    /**
     * Takes the data and the secret_key as hex and encrypts the data.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} data
     * @param {string} secret_key
     * @returns {{nonce: string, ciphertext: string}}
     */
    var encrypt_data = function (data, secret_key) {

        var k = nacl.from_hex(secret_key);
        var m = nacl.encode_utf8(data);
        var n = nacl.crypto_secretbox_random_nonce();
        var c = nacl.crypto_secretbox(m, n, k);

        return {
            nonce: nacl.to_hex(n),
            ciphertext: nacl.to_hex(c)
        };
    };

    /**
     * Takes the cipher text and decrypts that with the nonce and the secret_key.
     * Returns the initial data.
     *
     * @param {string} ciphertext
     * @param {string} nonce
     * @param {string} secret_key
     *
     * @returns {string} data
     */
    var decrypt_data = function (ciphertext, nonce, secret_key) {

        var k = nacl.from_hex(secret_key);
        var n = nacl.from_hex(nonce);
        var c = nacl.from_hex(ciphertext);
        var m1 = nacl.crypto_secretbox_open(c, n, k);

        return nacl.decode_utf8(m1);
    };

    /**
     * Takes the data and encrypts that with a random nonce, the receivers public key and users private key.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} data
     * @param {string} public_key
     * @param {string} private_key
     * @returns {{nonce: string, ciphertext: string}}
     */
    var encrypt_data_public_key = function (data, public_key, private_key) {

        var p = nacl.from_hex(public_key);
        var s = nacl.from_hex(private_key);
        var m = nacl.encode_utf8(data);
        var n = nacl.crypto_box_random_nonce();
        var c = nacl.crypto_box(m, n, p, s);

        return {
            nonce: nacl.to_hex(n),
            ciphertext: nacl.to_hex(c)
        };
    };

    /**
     * Takes the cipher text and decrypts that with the nonce, the senders public key and users private key.
     * Returns the initial data.
     *
     * @param {string} ciphertext
     * @param {string} nonce
     * @param {string} public_key
     * @param {string} private_key
     *
     * @returns {string} data
     */
    var decrypt_data_public_key = function (ciphertext, nonce, public_key, private_key) {

        var p = nacl.from_hex(public_key);
        var s = nacl.from_hex(private_key);
        var n = nacl.from_hex(nonce);
        var c = nacl.from_hex(ciphertext);
        var m1 = nacl.crypto_box_open(c, n, p, s);

        return nacl.decode_utf8(m1);
    };

    var cryptoLibrary = function() {

        return {
            generate_authkey: generate_authkey,
            generate_secret_key: generate_secret_key,
            generate_public_private_keypair: generate_public_private_keypair,
            encrypt_secret: encrypt_secret,
            decrypt_secret: decrypt_secret,
            encrypt_data: encrypt_data,
            decrypt_data: decrypt_data,
            encrypt_data_public_key: encrypt_data_public_key,
            decrypt_data_public_key: decrypt_data_public_key
        };
    };

    var app = angular.module('passwordManagerApp');
    app.factory("cryptoLibrary", [cryptoLibrary]);

}(angular, nacl_factory, scrypt_module_factory));
