(function(angular, require, sha512, sha256, scrypt_module_factory, debug) {
    'use strict';

    //var nacl = nacl_factory.instantiate();
    var nacl = require('ecma-nacl');

    /* Im afraid people will send/use shaXXX hashes of their password for other purposes, therefore I add this special
     * sauce to every hash. This special sauce can be considered a constant and will never change. Its no secret but
     * it should not be used for anything else besides the reasons below */
    var special_sauce = 'b6acbb9b2077ba2011643b17c24bafea3b8d7066565546cfbde020790a64b469';//sha256 of 'our-chosen-sexy-sauce'


    /**
     * Random byte generator from nacl_factory.js
     *
     * @param count
     * @returns {*}
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
     * encodes utf8 from nacl_factory.js
     *
     * @param s
     * @returns {*}
     */
    function encode_utf8(s) {
        return encode_latin1(unescape(encodeURIComponent(s)));
    }

    /**
     * encodes latin1 from nacl_factory.js
     *
     * @param s
     * @returns {Uint8Array}
     */
    function encode_latin1(s) {
        var result = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if ((c & 0xff) !== c) throw {message: "Cannot encode string in Latin1", str: s};
            result[i] = (c & 0xff);
        }
        return result;
    }

    /**
     * decodes utf8 from nacl_factory.js
     *
     * @param bs
     * @returns {string}
     */
    function decode_utf8(bs) {
        return decodeURIComponent(escape(decode_latin1(bs)));
    }

    /**
     * decodes latin1 from nacl_factory.js
     *
     * @param bs
     * @returns {string}
     */
    function decode_latin1(bs) {
        var encoded = [];
        for (var i = 0; i < bs.length; i++) {
            encoded.push(String.fromCharCode(bs[i]));
        }
        return encoded.join('');
    }

    /**
     * Uint8Array to hex converter from nacl_factory.js
     *
     * @param bs
     * @returns {string}
     */
    function to_hex(bs) {
        var encoded = [];
        for (var i = 0; i < bs.length; i++) {
            encoded.push("0123456789abcdef"[(bs[i] >> 4) & 15]);
            encoded.push("0123456789abcdef"[bs[i] & 15]);
        }
        return encoded.join('');
    }

    /**
     * hex to Uint8Array converter from nacl_factory.js
     *
     * @param s
     * @returns {Uint8Array}
     */
    function from_hex(s) {
        var result = new Uint8Array(s.length / 2);
        for (var i = 0; i < s.length / 2; i++) {
            result[i] = parseInt(s.substr(2*i,2),16);
        }
        return result;
    }


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
     * var special_sauce = 'b6acbb9b2077ba2011643b17c24bafea3b8d7066565546cfbde020790a64b469'
     *
     * @param {string} email - email address of the user
     * @param {string} password - password of the user
     * @returns auth_key - scrypt hex value of the password with the sha512 of lowercase email as salt
     */
    var generate_authkey = function (email, password) {

        if( debug ) {
            console.log("generate_authkey");
        }

        var n = 16384; //2^14
        var r = 8;
        var p = 1;
        var l = 64; // 64 Bytes = 512 Bits

        var scrypt = scrypt_module_factory();

        // takes the email address basically as salt. sha512 is used to enforce minimum length
        //var salt = nacl.to_hex(nacl.crypto_hash_string(email.toLowerCase() + special_sauce));
        var salt = sha512(email.toLowerCase() + special_sauce);

        return scrypt.to_hex(scrypt.crypto_scrypt(scrypt.encode_utf8(password), scrypt.encode_utf8(salt), n, r, p, l));
    };

    /**
     * generates secret keys that is 32 Bytes or 256 Bits long and represented as hex
     *
     * @returns {{public_key: string, private_key: string, secret_key: string}}
     */
    var generate_secret_key = function () {

        if( debug ) {
            console.log("generate_secret_key");
        }

        return to_hex(randomBytes(32)); // 32 Bytes = 256 Bits
    };

    /**
     * generates public and private key pair
     * All keys are 32 Bytes or 256 Bits long and represented as hex
     *
     * @returns {{public_key: string, private_key: string}}
     */
    var generate_public_private_keypair = function () {

        if( debug ) {
            console.log("generate_public_private_keypair");
        }

        var sk = randomBytes(32);
        var pk = nacl.box.generate_pubkey(sk);


        return {
            public_key : to_hex(pk), // 32 Bytes = 256 Bits
            private_key : to_hex(sk) // 32 Bytes = 256 Bits
        };
    };

    /**
     * Takes the secret and encrypts that with the provided password. The crypto_box takes only 256 bits, therefore we
     * are using sha256(password+special_sauce) as key for encryption.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} secret
     * @param {string} password
     * @returns {{nonce: string, text: string}}
     */
    var encrypt_secret = function (secret, password) {

        if( debug ) {
            console.log("encrypt_secret");
        }

        var k = from_hex(sha256(password + special_sauce));
        var m = encode_utf8(secret);
        var n = randomBytes(24);
        var c = nacl.secret_box.pack(m, n, k);

        return {
            nonce: to_hex(n),
            text: to_hex(c)
        };

    };

    /**
     * Takes the cipher text and decrypts that with the nonce and the sha256(password+special_sauce).
     * Returns the initial secret.
     *
     * @param {string} text
     * @param {string} nonce
     * @param {string} password
     *
     * @returns {string} secret
     */
    var decrypt_secret = function (text, nonce, password) {

        if( debug ) {
            console.log("decrypt_secret");
        }

        var k = from_hex(sha256(password + special_sauce));
        var n = from_hex(nonce);
        var c = from_hex(text);
        var m1 = nacl.secret_box.open(c, n, k);

        return decode_utf8(m1);
    };

    /**
     * Takes the data and the secret_key as hex and encrypts the data.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} data
     * @param {string} secret_key
     * @returns {{nonce: string, text: string}}
     */
    var encrypt_data = function (data, secret_key) {

        if( debug ) {
            console.log("encrypt_data");
        }

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
     * Takes the cipher text and decrypts that with the nonce and the secret_key.
     * Returns the initial data.
     *
     * @param {string} text
     * @param {string} nonce
     * @param {string} secret_key
     *
     * @returns {string} data
     */
    var decrypt_data = function (text, nonce, secret_key) {

        if( debug ) {
            console.log("decrypt_data");
            console.log(text);
            console.log(nonce);
            console.log(secret_key);
        }

        var k = from_hex(secret_key);
        var n = from_hex(nonce);
        var c = from_hex(text);
        var m1 = nacl.secret_box.open(c, n, k);

        return decode_utf8(m1);
    };

    /**
     * Takes the data and encrypts that with a random nonce, the receivers public key and users private key.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} data
     * @param {string} public_key
     * @param {string} private_key
     * @returns {{nonce: string, text: string}}
     */
    var encrypt_data_public_key = function (data, public_key, private_key) {

        if( debug ) {
            console.log("encrypt_data_public_key");
        }

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
     * Takes the cipher text and decrypts that with the nonce, the senders public key and users private key.
     * Returns the initial data.
     *
     * @param {string} text
     * @param {string} nonce
     * @param {string} public_key
     * @param {string} private_key
     *
     * @returns {string} data
     */
    var decrypt_data_public_key = function (text, nonce, public_key, private_key) {

        if( debug ) {
            console.log("decrypt_data_public_key");
        }

        var p = from_hex(public_key);
        var s = from_hex(private_key);
        var n = from_hex(nonce);
        var c = from_hex(text);
        var m1 = nacl.box.open(c, n, p, s);

        return decode_utf8(m1);
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

}(angular, require, sha512, sha256, scrypt_module_factory, false));
