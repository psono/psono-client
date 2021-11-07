/**
 * Service with all the cryptographic operations
 */

import * as OTPAuth from "otpauth";
import nacl from "ecma-nacl";
import uuid from "uuid-js";
import sha1 from "js-sha1";
import sha512 from "js-sha512";
import sha256 from "js-sha256";

import helper from "./helper";
import converter from "./converter";

function InvalidRecoveryCodeException(message) {
    this.message = message;
    this.name = "InvalidRecoveryCodeException";
}

/**
 * Random byte generator from nacl_factory.js
 * https://github.com/tonyg/js-nacl
 *
 * @param {int} count The amount of random bytes to return
 *
 * @returns {Uint8Array} Random byte array
 */
var randomBytes = function (count) {
    let bs;
    if (typeof module !== "undefined" && module.exports) {
        // add node.js implementations
        const crypto = require("crypto");
        return crypto.randomBytes(count);
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
 * Returns a cryptographically secure random number between 0 (included) and 1 (excluded)
 *
 * @returns {number} Random number between 0 and 1
 */
var random = function () {
    let bs;
    let byte;
    if (window && window.crypto && window.crypto.getRandomValues) {
        // add in-browser implementation
        bs = new Uint32Array(1);
        window.crypto.getRandomValues(bs);
        byte = bs[0];
    } else if (window && window.msCrypto && window.msCrypto.getRandomValues) {
        // add in-browser implementation
        bs = new Uint32Array(1);
        window.msCrypto.getRandomValues(bs);
        byte = bs[0];
    } else {
        throw new Error("No cryptographic random number generator");
    }

    return byte / (0xffffffff + 1);
};

var scrypt_lookup_table = {};

/**
 * flushes the scrypt lookup table after 60 seconds
 */
function clearScryptLookupTable() {
    setTimeout(function () {
        scrypt_lookup_table = {};
    }, 60000);
}

/**
 * Scrypt wrapper for psono to create for a password and a salt the fix scrypt hash.
 *
 * @param {string} password the password one wants to hash
 * @param {string} salt The fix salt one wants to use
 *
 * @returns {string} The scrypt hash
 */
function passwordScrypt(password, salt) {
    // Lets first generate our key from our user_sauce and password
    const u = 14; //2^14 = 16MB
    const r = 8;
    const p = 1;
    const l = 64; // 64 Bytes = 512 Bits
    let k;

    const lookup_hash = sha512(password) + sha512(salt);

    if (scrypt_lookup_table.hasOwnProperty(lookup_hash)) {
        k = scrypt_lookup_table[lookup_hash];
    } else {
        k = converter.toHex(nacl.scrypt(converter.encodeUtf8(password), converter.encodeUtf8(salt), u, r, p, l, function (pDone) {}));
        scrypt_lookup_table[lookup_hash] = k;
        clearScryptLookupTable();
    }
    return k;
}

/**
 * takes the sha512 of lowercase username as salt to generate scrypt password hash in hex called
 * the authkey, so basically:
 *
 * hex(scrypt(password, hex(sha512(lower(username)))))
 *
 * For compatibility reasons with other clients please use the following parameters if you create your own client:
 *
 * const c = 16384 // 2^14;
 * const r = 8;
 * const p = 1;
 * const l = 64;
 *
 * @param {string} username Username of the user (in email format)
 * @param {string} password Password of the user
 *
 * @returns {string} auth_key Scrypt hex value of the password with the sha512 of lowercase email as salt
 */
var generateAuthkey = function (username, password) {
    const salt = sha512(username.toLowerCase());
    return passwordScrypt(password, salt);
};

/**
 * generates secret keys that is 32 Bytes or 256 Bits long and represented as hex
 *
 * @returns {string} Returns secret key (hex encoded, 32 byte long)
 */
var generateSecretKey = function () {
    return converter.toHex(randomBytes(32)); // 32 Bytes = 256 Bits
};

/**
 * generates public and private key pair
 * All keys are 32 Bytes or 256 Bits long and represented as hex
 *
 * @returns {PublicPrivateKeyPair} Returns object with a public-private-key-pair
 */
var generatePublicPrivateKeypair = function () {
    const sk = randomBytes(32);
    const pk = nacl.box.generate_pubkey(sk);

    return {
        public_key: converter.toHex(pk), // 32 Bytes = 256 Bits
        private_key: converter.toHex(sk), // 32 Bytes = 256 Bits
    };
};

/**
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
var encryptSecret = function (secret, password, user_sauce) {
    const salt = sha512(user_sauce);
    const k = converter.fromHex(sha256(passwordScrypt(password, salt))); // key

    // and now lets encrypt
    const m = converter.encodeUtf8(secret); // message
    const n = randomBytes(24); // nonce
    const c = nacl.secret_box.pack(m, n, k); //encrypted message

    return {
        nonce: converter.toHex(n),
        text: converter.toHex(c),
    };
};

/**
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
function decryptSecret(text, nonce, password, user_sauce) {
    const salt = sha512(user_sauce);
    const k = converter.fromHex(sha256(passwordScrypt(password, salt)));

    // and now lets decrypt
    const n = converter.fromHex(nonce);
    const c = converter.fromHex(text);
    const m1 = nacl.secret_box.open(c, n, k);

    return converter.decodeUtf8(m1);
}

/**
 * runs async jobs
 *
 * @param job
 * @param kwargs
 * @param transfers
 *
 * @returns {PromiseLike<any> | f | * | e | promise}
 */
var runCryptoWorkAsync = function (job, kwargs, transfers) {
    return new Promise((resolve, reject) => {
        const crypto_worker = new Worker("js/crypto-worker.js");

        function handle_message_from_worker(msg) {
            crypto_worker.terminate();
            resolve(msg.data.kwargs);
        }

        crypto_worker.addEventListener("message", handle_message_from_worker);
        crypto_worker.postMessage(
            {
                job: job,
                kwargs: kwargs,
            },
            transfers
        );
    });
};

/**
 * Encrypts a file (in Uint8 representation)
 *
 * @param {Uint8Array} data The data of the file in Uint8Array encoding
 * @param {string} secret_key The secret key you want to use to encrypt the data
 *
 * @returns {Promise} A promise that will return the encrypted file with the nonce as Uint8Array
 */
var encryptFile = function (data, secret_key) {
    const k = converter.fromHex(secret_key).buffer;
    const n = randomBytes(24).buffer;
    const arrayBuffer = data.buffer;

    return runCryptoWorkAsync(
        "encrypt_file",
        {
            data: arrayBuffer,
            k: k,
            n: n,
        },
        [arrayBuffer]
    ).then(function (buffer) {
        return new Uint8Array(buffer);
    });
};

/**
 * Decrypts a file (in Uint8 representation) with prepended nonce
 *
 * @param {Uint8Array} text The encrypted data of the file in Uint8Array encoding with prepended nonce
 * @param {string} secret_key The secret key used in the past to encrypt the text
 *
 * @returns {Promise} A promise that will return the decrypted data as Uint8Array
 */
var decryptFile = function (text, secret_key) {
    const k = converter.fromHex(secret_key).buffer;
    const arrayBuffer = text.buffer;

    return runCryptoWorkAsync(
        "decrypt_file",
        {
            text: arrayBuffer,
            k: k,
        },
        [arrayBuffer]
    ).then(function (buffer) {
        return new Uint8Array(buffer);
    });
};

/**
 * Takes the data and the secret_key as hex and encrypts the data.
 * Returns the nonce and the cipher text as hex.
 *
 * @param {string} data The data you want to encrypt
 * @param {string} secret_key The secret key you want to use to encrypt the data
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
var encryptData = function (data, secret_key) {
    const k = converter.fromHex(secret_key);
    const m = converter.encodeUtf8(data);
    const n = randomBytes(24);
    const c = nacl.secret_box.pack(m, n, k);

    return {
        nonce: converter.toHex(n),
        text: converter.toHex(c),
    };
};

/**
 * Takes the cipher text and decrypts that with the nonce and the secret_key.
 * Returns the initial data.
 *
 * @param {string} text The encrypted text
 * @param {string} nonce The nonce of the encrypted text
 * @param {string} secret_key The secret key used in the past to encrypt the text
 *
 * @returns {string} The decrypted data
 */
var decryptData = function (text, nonce, secret_key) {
    const k = converter.fromHex(secret_key);
    const n = converter.fromHex(nonce);
    const c = converter.fromHex(text);
    const m1 = nacl.secret_box.open(c, n, k);

    return converter.decodeUtf8(m1);
};

/**
 * Takes the data and encrypts that with a random nonce, the receivers public key and users private key.
 * Returns the nonce and the cipher text as hex.
 *
 * @param {string} data The data you want to encrypt
 * @param {string} public_key The public key you want to use for the encryption
 * @param {string} private_key The private key you want to use for the encryption
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
var encryptDataPublicKey = function (data, public_key, private_key) {
    const p = converter.fromHex(public_key);
    const s = converter.fromHex(private_key);
    const m = converter.encodeUtf8(data);
    const n = randomBytes(24);
    const c = nacl.box.pack(m, n, p, s);

    return {
        nonce: converter.toHex(n),
        text: converter.toHex(c),
    };
};

/**
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
var decryptDataPublicKey = function (text, nonce, public_key, private_key) {
    const p = converter.fromHex(public_key);
    const s = converter.fromHex(private_key);
    const n = converter.fromHex(nonce);
    const c = converter.fromHex(text);
    const m1 = nacl.box.open(c, n, p, s);

    return converter.decodeUtf8(m1);
};

/**
 * returns a 32 bytes long random hex value to be used as the user special sauce
 *
 * @returns {string} Returns a random user sauce (32 bytes, hex encoded)
 */
var generateUserSauce = function () {
    return converter.toHex(randomBytes(32)); // 32 Bytes = 256 Bits
};

/**
 * generates a n-long base58 checksum
 *
 * @param {string} str The string of which ones to have a checksum
 * @param {int} n The length of the checksum one wants to have
 *
 * @returns {string} Returns n base58 encoded chars as checksum
 */
var getChecksum = function (str, n) {
    return converter.hexToBase58(sha512(str)).substring(0, n);
};

/**
 * returns a 16 bytes long random base58 value to be used as recovery password including four base58 letters as checksum
 *
 * @returns {object} Returns a random user sauce (16 bytes, hex encoded)
 */
var generateRecoveryCode = function () {
    const password_bytes = randomBytes(16); // 16 Bytes = 128 Bits
    const password_hex = converter.toHex(password_bytes);
    const password_words = converter.hexToWords(password_hex);
    const password_base58 = converter.toBase58(password_bytes);

    // Then we split up everything in 11 digits long chunks
    const recovery_code_chunks = helper.splitStringInChunks(password_base58, 11);
    // Then we loop over our chunks and use the base58 representation of the sha512 checksum to get 2 checksum
    // digits, and append them to the original chunk
    for (let i = 0; i < recovery_code_chunks.length; i++) {
        recovery_code_chunks[i] += getChecksum(recovery_code_chunks[i], 2);
    }

    return {
        bytes: password_bytes,
        hex: password_hex,
        words: password_words,
        base58: password_base58,
        base58_checksums: recovery_code_chunks.join(""),
    };
};

/**
 * Removes the checksums from a base58 encoded recovery code with checksums.
 * e.g. 'UaKSKNNixJY2ARqGDKXduo4c2N' becomes 'UaKSKNNixJYRqGDKXduo4c'
 *
 * @param {string} recovery_code_with_checksums The recovery code with checksums
 *
 * @returns {string} Returns recovery code without checksums
 */
var recoveryCodeStripChecksums = function (recovery_code_with_checksums) {
    const recovery_code_chunks = helper.splitStringInChunks(recovery_code_with_checksums, 13);

    for (let i = 0; i < recovery_code_chunks.length; i++) {
        if (recovery_code_chunks[i].length < 2) {
            throw new InvalidRecoveryCodeException("Recovery code chunks with a size < 2 are impossible");
        }
        recovery_code_chunks[i] = recovery_code_chunks[i].slice(0, -2);
    }
    return recovery_code_chunks.join("");
};

/**
 * Tests if a given recovery password chunk can be valid according to the checksum
 * e.g. UaKSKNNixJY2A would return true and UaKSKNNixJY2B would return false
 *
 * @returns {boolean} Returns weather the password chunk is valid
 */
var recoveryPasswordChunkPassChecksum = function (chunk_with_checksum) {
    if (chunk_with_checksum.length < 2) return false;
    const password = chunk_with_checksum.substring(0, chunk_with_checksum.length - 2);
    const checksum = chunk_with_checksum.substring(chunk_with_checksum.length - 2);
    return getChecksum(password, 2) === checksum;
};

/**
 * Generates a uuid
 *
 * @returns {uuid} Returns a random uuid
 */
var generateUuid = function () {
    const uuidv4 = uuid.create();
    return uuidv4.toString();
};

/**
 * Returns whether the provided message and verify_key produce the correct signature or not
 *
 * @param {string} message The raw message to verify
 * @param {string} signature The hex representation of the signature
 * @param {string} verify_key The hex representation of the verification key
 *
 * @returns {boolean} Returns whether the signature is correct or not
 */
var validateSignature = function (message, signature, verify_key) {
    return nacl.signing.verify(converter.fromHex(signature), converter.encodeUtf8(message), converter.fromHex(verify_key));
};

/**
 * Returns the verify key for a given seed
 *
 * @param {string} seed The seed
 *
 * @returns {string} Returns the verify key for a given seed
 */
var getVerifyKey = function (seed) {
    const pair = nacl.signing.generate_keypair(converter.fromHex(seed));

    return converter.toHex(pair.pkey);
};

/**
 * Returns the TOTP code of a given token
 *
 * From bellstrand/totp-generator licensed under MIT
 *
 * @param {string} key The key in base32
 * @param {int} period The period e.g. 30 for 30 second intervals
 * @param {string} algorithm The algorithm SHA1, SHA224, SHA256, SHA384, SHA512, SHA3-224, SHA3-256, SHA3-384 and SHA3-512
 * @param {int} digits The amount of digits for the totp code, e.g. 6
 *
 * @returns {string} Returns the TOTP token
 */
var getTotpToken = function (key, period, algorithm, digits) {
    const options = {};
    options.issuer = "";
    options.label = "";
    options.period = period || 30;
    options.algorithm = algorithm || "SHA1";
    options.digits = digits || 6;
    options.secret = key; // or "OTPAuth.Secret.fromBase32('NB2W45DFOIZA')"

    // Create a new TOTP object.
    const totp = new OTPAuth.TOTP(options);

    // Generate a token.
    return totp.generate();
};

const service = {
    random: random,
    randomBytes: randomBytes,
    sha1: sha1,
    sha256: sha256,
    sha512: sha512,
    generateAuthkey: generateAuthkey,
    generateSecretKey: generateSecretKey,
    generatePublicPrivateKeypair: generatePublicPrivateKeypair,
    encryptSecret: encryptSecret,
    decryptSecret: decryptSecret,
    encryptFile: encryptFile,
    decryptFile: decryptFile,
    encryptData: encryptData,
    decryptData: decryptData,
    encryptDataPublicKey: encryptDataPublicKey,
    decryptDataPublicKey: decryptDataPublicKey,
    generateUserSauce: generateUserSauce,
    getChecksum: getChecksum,
    generateRecoveryCode: generateRecoveryCode,
    recoveryCodeStripChecksums: recoveryCodeStripChecksums,
    recoveryPasswordChunkPassChecksum: recoveryPasswordChunkPassChecksum,
    generateUuid: generateUuid,
    validateSignature: validateSignature,
    getVerifyKey: getVerifyKey,
    getTotpToken: getTotpToken,
};

export default service;
