/**
 * Service with all the cryptographic operations
 */

import * as OTPAuth from "otpauth";
import nacl from "ecma-nacl";
import uuid from "uuid-js";
import sha1 from "js-sha1";
import sha512 from "js-sha512";
import sha256 from "js-sha256";

import helperService from "./helper";
import converterService from "./converter";
import store from "./store";

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
function randomBytes(count) {
    let bs;

    if (typeof module !== "undefined" && module.exports) {
        // add node.js implementations
        const crypto = require("crypto");
        const buf = crypto.randomBytes(count);
        const bs = new Uint8Array(count);
        for (let i = 0; i < buf.length; ++i) {
            bs[i] = buf[i];
        }
        return bs;
    } else if (typeof window === "undefined") {
        // manifest v3 background script without access to window
        bs = new Uint8Array(count);
        crypto.getRandomValues(bs);
        return bs;
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
}

/**
 * Returns a cryptographically secure random number between 0 (included) and 1 (excluded)
 *
 * @returns {number} Random number between 0 and 1
 */
function random() {
    let bs;
    let byte;
    if (typeof window === "undefined") {
        // manifest v3 background script without access to window
        bs = new Uint32Array(1);
        crypto.getRandomValues(bs);
        byte = bs[0];
    } else if (window && window.crypto && window.crypto.getRandomValues) {
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
}

let scrypt_lookup_table = {};

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
        k = converterService.toHex(
            nacl.scrypt(
                converterService.encodeUtf8(password),
                converterService.encodeUtf8(salt),
                u,
                r,
                p,
                l,
                function (pDone) {}
            )
        );
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
function generateAuthkey(username, password) {
    const salt = sha512(username.toLowerCase());
    return passwordScrypt(password, salt);
}

/**
 * generates secret keys that is 32 Bytes or 256 Bits long and represented as hex
 *
 * @returns {string} Returns secret key (hex encoded, 32 byte long)
 */
function generateSecretKey() {
    return converterService.toHex(randomBytes(32)); // 32 Bytes = 256 Bits
}

/**
 * generates public and private key pair
 * All keys are 32 Bytes or 256 Bits long and represented as hex
 *
 * @returns {PublicPrivateKeyPair} Returns object with a public-private-key-pair
 */
function generatePublicPrivateKeypair() {
    const sk = randomBytes(32);
    const pk = nacl.box.generate_pubkey(sk);

    return {
        public_key: converterService.toHex(pk), // 32 Bytes = 256 Bits
        private_key: converterService.toHex(sk), // 32 Bytes = 256 Bits
    };
}

/**
 * Takes the secret and encrypts that with the provided password. The crypto_box takes only 256 bits, therefore we
 * are using sha256(password+userSauce) as key for encryption.
 * Returns the nonce and the cipher text as hex.
 *
 * @param {string} secret The secret you want to encrypt
 * @param {string} password The password you want to use to encrypt the secret
 * @param {string} userSauce The user's sauce
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
function encryptSecret(secret, password, userSauce) {
    const salt = sha512(userSauce);
    const k = converterService.fromHex(sha256(passwordScrypt(password, salt))); // key

    // and now lets encrypt
    const m = converterService.encodeUtf8(secret); // message
    const n = randomBytes(24); // nonce
    const c = nacl.secret_box.pack(m, n, k); //encrypted message

    return {
        nonce: converterService.toHex(n),
        text: converterService.toHex(c),
    };
}

/**
 * Takes the cipher text and decrypts that with the nonce and the sha256(password+userSauce).
 * Returns the initial secret.
 *
 * @param {string} text The encrypted text
 * @param {string} nonce The nonce for the encrypted text
 * @param {string} password The password to decrypt the text
 * @param {string} userSauce The users sauce used during encryption
 *
 * @returns {string} secret The decrypted secret
 */
function decryptSecret(text, nonce, password, userSauce) {
    const salt = sha512(userSauce);
    const k = converterService.fromHex(sha256(passwordScrypt(password, salt)));

    // and now lets decrypt
    const n = converterService.fromHex(nonce);
    const c = converterService.fromHex(text);
    const m1 = nacl.secret_box.open(c, n, k);

    return converterService.decodeUtf8(m1);
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
function runCryptoWorkAsync(job, kwargs, transfers) {
    return new Promise((resolve, reject) => {
        const cryptoWorker = new Worker("js/crypto-worker.js");

        function handle_message_from_worker(msg) {
            cryptoWorker.terminate();
            resolve(msg.data.kwargs);
        }

        cryptoWorker.addEventListener("message", handle_message_from_worker);
        cryptoWorker.postMessage(
            {
                job: job,
                kwargs: kwargs,
            },
            transfers
        );
    });
}

/**
 * Encrypts a file (in Uint8 representation)
 *
 * @param {Uint8Array} data The data of the file in Uint8Array encoding
 * @param {string} secretKey The secret key you want to use to encrypt the data
 *
 * @returns {Promise} A promise that will return the encrypted file with the nonce as Uint8Array
 */
function encryptFile(data, secretKey) {
    const k = converterService.fromHex(secretKey).buffer;
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
}

/**
 * Decrypts a file (in Uint8 representation) with prepended nonce
 *
 * @param {Uint8Array} text The encrypted data of the file in Uint8Array encoding with prepended nonce
 * @param {string} secretKey The secret key used in the past to encrypt the text
 *
 * @returns {Promise} A promise that will return the decrypted data as Uint8Array
 */
function decryptFile(text, secretKey) {
    const k = converterService.fromHex(secretKey).buffer;
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
}

/**
 * Takes the data and the secretKey as hex and encrypts the data.
 * Returns the nonce and the cipher text as hex.
 *
 * @param {string} data The data you want to encrypt
 * @param {string} secretKey The secret key you want to use to encrypt the data
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
function encryptData(data, secretKey) {
    const k = converterService.fromHex(secretKey);
    const m = converterService.encodeUtf8(data);
    const n = randomBytes(24);
    const c = nacl.secret_box.pack(m, n, k);

    return {
        nonce: converterService.toHex(n),
        text: converterService.toHex(c),
    };
}

/**
 * Takes the cipher text and decrypts that with the nonce and the secretKey.
 * Returns the initial data.
 *
 * @param {string} text The encrypted text
 * @param {string} nonce The nonce of the encrypted text
 * @param {string} secretKey The secret key used in the past to encrypt the text
 *
 * @returns {string} The decrypted data
 */
function decryptData(text, nonce, secretKey) {
    const k = converterService.fromHex(secretKey);
    const n = converterService.fromHex(nonce);
    const c = converterService.fromHex(text);
    const m1 = nacl.secret_box.open(c, n, k);

    return converterService.decodeUtf8(m1);
}

/**
 * Takes the data and encrypts that with a random nonce, the receivers public key and users private key.
 * Returns the nonce and the cipher text as hex.
 *
 * @param {string} data The data you want to encrypt
 * @param {string} publicKey The public key you want to use for the encryption
 * @param {string} privateKey The private key you want to use for the encryption
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
function encryptDataPublicKey(data, publicKey, privateKey) {
    const p = converterService.fromHex(publicKey);
    const s = converterService.fromHex(privateKey);
    const m = converterService.encodeUtf8(data);
    const n = randomBytes(24);
    const c = nacl.box.pack(m, n, p, s);

    return {
        nonce: converterService.toHex(n),
        text: converterService.toHex(c),
    };
}

/**
 * Takes the cipher text and decrypts that with the nonce, the senders public key and users private key.
 * Returns the initial data.
 *
 * @param {string} text The encrypted text
 * @param {string} nonce The nonce that belongs to the encrypted text
 * @param {string} publicKey The pulic key you want to use to decrypt the text
 * @param {string} privateKey The private key you want to use to encrypt the text
 *
 * @returns {string} The decrypted data
 */
function decryptDataPublicKey(text, nonce, publicKey, privateKey) {
    const p = converterService.fromHex(publicKey);
    const s = converterService.fromHex(privateKey);
    const n = converterService.fromHex(nonce);
    const c = converterService.fromHex(text);
    const m1 = nacl.box.open(c, n, p, s);

    return converterService.decodeUtf8(m1);
}

/**
 * returns a 32 bytes long random hex value to be used as the user special sauce
 *
 * @returns {string} Returns a random user sauce (32 bytes, hex encoded)
 */
function generateUserSauce() {
    return converterService.toHex(randomBytes(32)); // 32 Bytes = 256 Bits
}

/**
 * generates a n-long base58 checksum
 *
 * @param {string} str The string of which ones to have a checksum
 * @param {int} n The length of the checksum one wants to have
 *
 * @returns {string} Returns n base58 encoded chars as checksum
 */
function getChecksum(str, n) {
    return converterService.hexToBase58(sha512(str)).substring(0, n);
}

/**
 * returns a 16 bytes long random base58 value to be used as recovery password including four base58 letters as checksum
 *
 * @returns {object} Returns a random user sauce (16 bytes, hex encoded)
 */
function generateRecoveryCode() {
    const password_bytes = randomBytes(16); // 16 Bytes = 128 Bits
    const password_hex = converterService.toHex(password_bytes);
    const password_words = converterService.hexToWords(password_hex);
    const password_base58 = converterService.toBase58(password_bytes);

    // Then we split up everything in 11 digits long chunks
    const recovery_code_chunks = helperService.splitStringInChunks(password_base58, 11);
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
}

/**
 * Removes the checksums from a base58 encoded recovery code with checksums.
 * e.g. 'UaKSKNNixJY2ARqGDKXduo4c2N' becomes 'UaKSKNNixJYRqGDKXduo4c'
 *
 * @param {string} recoveryCodeWithChecksums The recovery code with checksums
 *
 * @returns {string} Returns recovery code without checksums
 */
function recoveryCodeStripChecksums(recoveryCodeWithChecksums) {
    const recovery_code_chunks = helperService.splitStringInChunks(recoveryCodeWithChecksums, 13);

    for (let i = 0; i < recovery_code_chunks.length; i++) {
        if (recovery_code_chunks[i].length < 2) {
            throw new InvalidRecoveryCodeException("Recovery code chunks with a size < 2 are impossible");
        }
        recovery_code_chunks[i] = recovery_code_chunks[i].slice(0, -2);
    }
    return recovery_code_chunks.join("");
}

/**
 * Tests if a given recovery password chunk can be valid according to the checksum
 * e.g. UaKSKNNixJY2A would return true and UaKSKNNixJY2B would return false
 *
 * @returns {boolean} Returns weather the password chunk is valid
 */
function recoveryPasswordChunkPassChecksum(chunkWithChecksum) {
    if (chunkWithChecksum.length < 2) return false;
    const password = chunkWithChecksum.substring(0, chunkWithChecksum.length - 2);
    const checksum = chunkWithChecksum.substring(chunkWithChecksum.length - 2);
    return getChecksum(password, 2) === checksum;
}

/**
 * Generates a uuid
 *
 * @returns {uuid} Returns a random uuid
 */
function generateUuid() {
    const uuidv4 = uuid.create();
    return uuidv4.toString();
}

/**
 * Returns whether the provided message and verifyKey produce the correct signature or not
 *
 * @param {string} message The raw message to verify
 * @param {string} signature The hex representation of the signature
 * @param {string} verifyKey The hex representation of the verification key
 *
 * @returns {boolean} Returns whether the signature is correct or not
 */
function validateSignature(message, signature, verifyKey) {
    return nacl.signing.verify(
        converterService.fromHex(signature),
        converterService.encodeUtf8(message),
        converterService.fromHex(verifyKey)
    );
}

/**
 * Returns the verify key for a given seed
 *
 * @param {string} seed The seed
 *
 * @returns {string} Returns the verify key for a given seed
 */
function getVerifyKey(seed) {
    const pair = nacl.signing.generate_keypair(converterService.fromHex(seed));

    return converterService.toHex(pair.pkey);
}

/**
 * Returns the supported TOTP algorithm
 * Needs to be in sync with all other official clients, e.g. our App
 *
 * @returns {array} Returns an array with all the supported algorithms
 */
function getSupportedTotpAlgorithm() {
    return [
        { title: "SHA1", value: "SHA1" },
        //{'title': 'SHA224', value: 'SHA224'}, // not supported by the app
        { title: "SHA256", value: "SHA256" },
        //{'title': 'SHA384', value: 'SHA384'}, // not supported by the app
        { title: "SHA512", value: "SHA512" },
        //{'title': 'SHA3-256', value: 'SHA3-256'}, // not supported by the app
        //{'title': 'SHA3-384', value: 'SHA3-384'}, // not supported by the app
        //{'title': 'SHA3-512', value: 'SHA3-512'}, // not supported by the app
    ];
}

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
function getTotpToken(key, period, algorithm, digits) {
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
}

/**
 * encrypts some data with user's public-private-key-crypto
 *
 * @param {string} data The data you want to encrypt
 * @param {string} publicKey The public key you want to use for the encryption
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
function encryptPrivateKey(data, publicKey) {
    return encryptDataPublicKey(data, publicKey, store.getState().user.userPrivateKey);
}

/**
 * decrypts some data with user's public-private-key-crypto
 *
 * @param {string} text The encrypted text
 * @param {string} nonce The nonce that belongs to the encrypted text
 * @param {string} publicKey The pulic key you want to use to decrypt the text
 *
 * @returns {string} The decrypted data
 */
function decryptPrivateKey(text, nonce, publicKey) {
    return decryptDataPublicKey(text, nonce, publicKey, store.getState().user.userPrivateKey);
}

/**
 * encrypts some data with user's secret-key-crypto
 *
 * @param {string} data The data you want to encrypt
 *
 * @returns {EncryptedValue} The encrypted text and the nonce
 */
function encryptSecretKey(data) {
    return encryptData(data, store.getState().user.userSecretKey);
}

/**
 * decrypts some data with user's secret-key-crypto
 *
 * @param {string} text The encrypted text
 * @param {string} nonce The nonce of the encrypted text
 *
 * @returns {string} The decrypted data
 */
function decryptSecretKey(text, nonce) {
    return decryptData(text, nonce, store.getState().user.userSecretKey);
}


/**
 * Calculates the password strength in bits
 *
 * @param {string} password The password to test
 *
 * @returns {int} The strength of the provided password in bits
 */
function calculatePasswordStrengthInBits(password) {
    var specials = '-_#+*!§$%&=?@,.;:\'~"/(){}[]\\';
    var numbers = '0123456789';
    var uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';

    function hasNumber(myString) {
        return /\d/.test(myString);
    }

    function hasUppercase(myString) {
        return /[A-Z]/.test(myString);
    }

    function hasLowercase(myString) {
        return /[a-z]/.test(myString);
    }

    function hasSpecial(myString) {
        return /[ !@#$%^&*§()_+\-=[\]{};':"\\|,.<>/?]/.test(myString);
    }

    const calculateShannonEntropy = (password) => {
        // Source: https://gist.github.com/jabney/5018b4adc9b2bf488696
        const len = password.length;

        const frequencies = Array.from(password).reduce(
            (freq, c) => (freq[c] = (freq[c] || 0) + 1) && freq,
            {}
        );

        return Object.values(frequencies).reduce(
            (sum, frequency) => sum - (frequency / len) * Math.log2(frequency / len),
            0
        );
    };

    if (!password) {
        return 0;
    }

    const passwordLength = password.length;
    const containsNumbers = hasNumber(password);
    const containsUppercase = hasUppercase(password);
    const containsLowercase = hasLowercase(password);
    const containsSpecial = hasSpecial(password);

    let characters = '';
    if (containsNumbers) {
        characters = characters + numbers;
    }
    if (containsUppercase) {
        characters = characters + uppercaseChars;
    }
    if (containsLowercase) {
        characters = characters + lowercaseChars;
    }
    if (containsSpecial) {
        characters = characters + specials;
    }
    const entropy = calculateShannonEntropy(characters);

    return entropy * passwordLength
}


/**
 * Calculates the password strength in percent.
 * 128+ bits very strong (=100%)
 * 75+ bits strong
 * 56+ bits medium
 * 37 and below weak (=0%)
 *
 * @param {string} password The password to test
 *
 * @returns {int} The strength of the provided password in percent from 0 to 100
 */
function calculatePasswordStrengthInPercent(password) {
    const minimum = 37; // 0%
    const maximum = 128; // 100%
    const bits = calculatePasswordStrengthInBits(password);

    if (bits <= minimum) {
        return 0;
    }
    if (bits >= maximum) {
        return 100;
    }

    // exponential scale...
    // return Math.pow(2, bits-maximum) * 100

    // linear scale....
    return (bits - minimum) / (maximum - minimum) * 100

}

const cryptoLibraryService = {
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
    getSupportedTotpAlgorithm: getSupportedTotpAlgorithm,
    getTotpToken: getTotpToken,
    encryptPrivateKey: encryptPrivateKey,
    decryptPrivateKey: decryptPrivateKey,
    encryptSecretKey: encryptSecretKey,
    decryptSecretKey: decryptSecretKey,
    calculatePasswordStrengthInPercent: calculatePasswordStrengthInPercent,
};

export default cryptoLibraryService;
