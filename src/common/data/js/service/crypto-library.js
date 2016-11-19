(function(angular, require, sha512, sha256) {
    'use strict';

    /**
     * @ngdoc service
     * @name psonocli.cryptoLibrary
     * @description
     * Service with all the cryptographic operations
     */

    //var nacl = nacl_factory.instantiate();
    var nacl = require('ecma-nacl');

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#randomBytes
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * Random byte generator from nacl_factory.js
     *
     * @param {number} count The amount of random bytes to return
     *
     * @returns {Uint8Array} Random byte array
     */
    var randomBytes = function (count) {

        if (typeof module !== 'undefined' && module.exports) {
            // add node.js implementations
            var crypto = require('crypto');
            return crypto.randomBytes(count)
        } else if (window && window.crypto && window.crypto.getRandomValues) {
            // add in-browser implementation
            var bs = new Uint8Array(count);
            window.crypto.getRandomValues(bs);
            return bs;
        } else {
            throw { name: "No cryptographic random number generator",
                message: "Your browser does not support cryptographic random number generation." };
        }
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#encode_utf8
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * encodes utf8 from nacl_factory.js
     *
     * @param {string} to_encode String to encode
     *
     * @returns {string} Encoded string
     */
    var encode_utf8 = function (to_encode) {

        return encode_latin1(unescape(encodeURIComponent(to_encode)));
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#encode_latin1
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * encodes latin1 from nacl_factory.js
     *
     * @param {string} to_encode String to encode
     *
     * @returns {string} Encoded string
     */
    var encode_latin1 = function (to_encode) {

        var result = new Uint8Array(to_encode.length);
        for (var i = 0; i < to_encode.length; i++) {
            var c = to_encode.charCodeAt(i);
            if ((c & 0xff) !== c) throw {message: "Cannot encode string in Latin1", str: to_encode};
            result[i] = (c & 0xff);
        }
        return result;
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#decode_utf8
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * decodes utf8 from nacl_factory.js
     *
     * @param {string} to_decode encoded utf-8 string
     *
     * @returns {string} Decoded string
     */
    var decode_utf8 = function (to_decode) {

        return decodeURIComponent(escape(decode_latin1(to_decode)));
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#decode_latin1
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * decodes latin1 from nacl_factory.js
     *
     * @param {string} to_decode encoded latin1 string
     *
     * @returns {string} Decoded string
     */
    var decode_latin1 = function (to_decode) {

        var encoded = [];
        for (var i = 0; i < to_decode.length; i++) {
            encoded.push(String.fromCharCode(to_decode[i]));
        }
        return encoded.join('');
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#to_hex
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * Uint8Array to hex converter from nacl_factory.js
     *
     * @param {Uint8Array} val As Uint8Array encoded value
     *
     * @returns {string} Returns hex representation
     */
    var to_hex = function (val) {

        var encoded = [];
        for (var i = 0; i < val.length; i++) {
            encoded.push("0123456789abcdef"[(val[i] >> 4) & 15]);
            encoded.push("0123456789abcdef"[val[i] & 15]);
        }
        return encoded.join('');
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#from_hex
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * hex to Uint8Array converter from nacl_factory.js
     *
     * @param {string} val As hex encoded value
     *
     * @returns {Uint8Array} Returns Uint8Array representation
     */
    var from_hex = function (val) {

        var result = new Uint8Array(val.length / 2);
        for (var i = 0; i < val.length / 2; i++) {
            result[i] = parseInt(val.substr(2*i,2),16);
        }
        return result;
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
     * var n = 16384 // 2^14;
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

        var n = 14; //2^14 = 16MB
        var r = 8;
        var p = 1;
        var l = 64; // 64 Bytes = 512 Bits

        // takes the sha512(username) as salt.
        // var salt = nacl.to_hex(nacl.crypto_hash_string(username.toLowerCase()));
        var salt = sha512(username.toLowerCase());

        return to_hex(nacl.scrypt(encode_utf8(password), encode_utf8(salt), n, r, p, l, function(pDone) {}));
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

        return to_hex(randomBytes(32)); // 32 Bytes = 256 Bits
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
            public_key : to_hex(pk), // 32 Bytes = 256 Bits
            private_key : to_hex(sk) // 32 Bytes = 256 Bits
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

        var k = from_hex(sha256(password + user_sauce)); // key
        var m = encode_utf8(secret); // message
        var n = randomBytes(24); // nonce
        var c = nacl.secret_box.pack(m, n, k); //encrypted message

        return {
            nonce: to_hex(n),
            text: to_hex(c)
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

        var k = from_hex(sha256(password + user_sauce));
        var n = from_hex(nonce);
        var c = from_hex(text);
        var m1 = nacl.secret_box.open(c, n, k);

        return decode_utf8(m1);
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
     * @returns {EncryptedValue} The encrypted text and the nonce
     */
    var encrypt_data = function (data, secret_key) {

        var k = from_hex(secret_key);
        var m = encode_utf8(data);
        var n = randomBytes(24);
        var c = nacl.secret_box.pack(m, n, k);

        return {
            nonce: to_hex(n),
            text: to_hex(c)
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

        var k = from_hex(secret_key);
        var n = from_hex(nonce);
        var c = from_hex(text);
        var m1 = nacl.secret_box.open(c, n, k);

        return decode_utf8(m1);
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

        var p = from_hex(public_key);
        var s = from_hex(private_key);
        var m = encode_utf8(data);
        var n = randomBytes(24);
        var c = nacl.box.pack(m, n, p, s);

        return {
            nonce: to_hex(n),
            text: to_hex(c)
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

        var p = from_hex(public_key);
        var s = from_hex(private_key);
        var n = from_hex(nonce);
        var c = from_hex(text);
        var m1 = nacl.box.open(c, n, p, s);

        return decode_utf8(m1);
    };

    /**
     * @ngdoc
     * @name psonocli.cryptoLibrary#decrypt_data_public_key
     * @methodOf psonocli.cryptoLibrary
     *
     * @description
     * returns a 32 bytes long random hex value to be used as the user special sauce
     *
     * @returns {string} Returns a random user sauce (32 bytes, hex encoded)
     */
    var generate_user_sauce = function() {

        return to_hex(randomBytes(32)); // 32 Bytes = 256 Bits
    };

    var cryptoLibrary = function() {

        return {
            to_hex: to_hex,
            from_hex: from_hex,
            randomBytes: randomBytes,

            generate_authkey: generate_authkey,
            generate_secret_key: generate_secret_key,
            generate_public_private_keypair: generate_public_private_keypair,
            encrypt_secret: encrypt_secret,
            decrypt_secret: decrypt_secret,
            encrypt_data: encrypt_data,
            decrypt_data: decrypt_data,
            encrypt_data_public_key: encrypt_data_public_key,
            decrypt_data_public_key: decrypt_data_public_key,
            generate_user_sauce: generate_user_sauce
        };
    };

    var app = angular.module('psonocli');
    app.factory("cryptoLibrary", [cryptoLibrary]);

}(angular, require, sha512, sha256));
