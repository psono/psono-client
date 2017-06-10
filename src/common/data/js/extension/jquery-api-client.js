/**
 Some words in advance before you start implementing your own client that are really important:
 - Keep the clients password hidden at all costs
 - Keep the clients passwords sha256 hidden at all cost
 - Keep the clients passwords sha512 hidden at all cost
 ... and all other "weak" hashes of the users password! If you really really really need something coming from
 the users password, use "strong" hashes bcrypt / scrypt / ...
 - Never use a nonce twice
 - Never use the special sauce in any sha256 / sha512 besides for the reasons below as its an additional
 "hardening" of our implementation.
 */

var ClassClient = function (backend, require, jQuery, sha512) {
    "use strict";

    //var nacl = nacl_factory.instantiate();
    var nacl = require('ecma-nacl');



    /**
     * Random byte generator from nacl_factory.js
     *
     * @param count
     * @returns {*}
     */
    var randomBytes = function (count) {
        var bs;
        if (typeof module !== 'undefined' && module.exports) {
            // add node.js implementations
            var crypto = require('crypto');
            return crypto.randomBytes(count)
        } else if (window && window.crypto && window.crypto.getRandomValues) {
            // add in-browser implementation
            bs = new Uint8Array(count);
            window.crypto.getRandomValues(bs);
            return bs;
        } else if (window && window.msCrypto && window.msCrypto.getRandomValues) {
            // add in-browser implementation
            bs = new Uint8Array(count);
            window.msCrypto.getRandomValues(bs);
            return bs;
        } else {
            throw new Error("No cryptographic random number generator");
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
     * @param {string} username - username of the user (in email format)
     * @param {string} password - password of the user
     * @returns auth_key - scrypt hex value of the password with the sha512 of lowercase email as salt
     */
    this.generate_authkey = function (username, password) {

        var n = 14; //2^14 = 16MB
        var r = 8;
        var p = 1;
        var l = 64; // 64 Bytes = 512 Bits

        // takes the sha512(username) as salt.
        // var salt = nacl.to_hex(nacl.crypto_hash_string(username.toLowerCase() + special_sauce));
        var salt = sha512(username.toLowerCase());

        return to_hex(nacl.scrypt(encode_utf8(password), encode_utf8(salt), n, r, p, l, function(pDone) {}));
    };

    /**
     * generates secret keys that is 32 Bytes or 256 Bits long and represented as hex
     *
     * @returns {{public_key: string, private_key: string, secret_key: string}}
     */
    this.generate_secret_key = function () {
        return to_hex(randomBytes(32)); // 32 Bytes = 256 Bits
    };

    /**
     * generates public and private key pair
     * All keys are 32 Bytes or 256 Bits long and represented as hex
     *
     * @returns {{public_key: string, private_key: string}}
     */
    this.generate_public_private_keypair = function () {

        var sk = randomBytes(32);
        var pk = nacl.box.generate_pubkey(sk);


        return {
            public_key : to_hex(pk), // 32 Bytes = 256 Bits
            private_key : to_hex(sk) // 32 Bytes = 256 Bits
        };
    };

    /**
     * Takes the secret and encrypts that with the provided password. The crypto_box takes only 256 bits, therefore we
     * are using sha256(password+user_sauce) as key for encryption.
     * Returns the nonce and the cipher text as hex.
     *
     * @param {string} secret
     * @param {string} password
     * @param {string} user_sauce
     * @returns {{nonce: string, ciphertext: string}}
     */
    this.encrypt_secret = function (secret, password, user_sauce) {

        var k = from_hex(sha256(password + user_sauce));
        var m = encode_utf8(secret);
        var n = randomBytes(24);
        var c = nacl.secret_box.pack(m, n, k);

        return {
            nonce: to_hex(n),
            ciphertext: to_hex(c)
        };

    };

    /**
     * Takes the cipher text and decrypts that with the nonce and the sha256(password+user_sauce).
     * Returns the initial secret.
     *
     * @param {string} ciphertext
     * @param {string} nonce
     * @param {string} password
     * @param {string} user_sauce
     *
     * @returns {string} secret
     */
    this.decrypt_secret = function (ciphertext, nonce, password, user_sauce) {

        var k = from_hex(sha256(password + user_sauce));
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
     * @returns {{nonce: string, ciphertext: string}}
     */
    this.encrypt_data = function (data, secret_key) {

        var k = from_hex(secret_key);
        var m = encode_utf8(data);
        var n = randomBytes(24);
        var c = nacl.secret_box.pack(m, n, k);

        return {
            nonce: to_hex(n),
            ciphertext: to_hex(c)
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
    this.decrypt_data = function (ciphertext, nonce, secret_key) {

        var k = from_hex(secret_key);
        var n = from_hex(nonce);
        var c = from_hex(ciphertext);
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
     * @returns {{nonce: string, ciphertext: string}}
     */
    this.encrypt_data_public_key = function (data, public_key, private_key) {

        var p = from_hex(public_key);
        var s = from_hex(private_key);
        var m = encode_utf8(data);
        var n = randomBytes(24);
        var c = nacl.box.pack(m, n, p, s);

        return {
            nonce: to_hex(n),
            ciphertext: to_hex(c)
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
    this.decrypt_data_public_key = function (ciphertext, nonce, public_key, private_key) {


        var p = from_hex(public_key);
        var s = from_hex(private_key);
        var n = from_hex(nonce);
        var c = from_hex(ciphertext);
        var m1 = nacl.box.open(c, n, p, s);

        return decode_utf8(m1);
    };

    /**
     * Ajax GET request with the token as authentication to get the current user's secret
     *
     * @param {string} token - authentication token of the user, returned by authentication_login(email, authkey)
     * @param {uuid} [secret_id=null] - the secret ID
     *
     * @returns {promise}
     */
    this.read_secret = function (token, secret_id) {

        //optional parameter secret_id
        if (secret_id === undefined) { secret_id = null; }

        var endpoint = '/secret/' + (secret_id === null ? '' : secret_id + '/');
        var connection_type = "GET";

        return jQuery.ajax({
            type: connection_type,
            url: backend + endpoint,
            data: null, // No data required for get
            dataType: 'text', // will be json but for the demo purposes we insist on text
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Token " + token);
            }
        });
    };
};


