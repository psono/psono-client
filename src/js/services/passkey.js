import helperService from "./helper";
import converterService from "./converter";
import cryptoLibrary from "./crypto-library";
import datastorePasswordService from "./datastore-password";
import i18n from "../i18n";
import storage from "./storage";
import helper from "./helper";
import secretService from "./secret";
import notificationBarService from "./notification-bar";
import user from "./user";
import store from "./store";

let publicSuffixList;

class PasskeyException extends Error {
    constructor(errorType, message, metadata) {
        super(message);
        this.name = this.constructor.name;
        this.errorType = errorType;
        this.metadata = metadata;
    }
}


/**
 * Loads the public suffix list and returns it
 *
 * @returns {Promise} promise
 */
async function loadPublicSuffixList() {
    const response = await fetch("public-suffix-list.json");
    return response.json()
}

/**
 * Returns the public suffix list eather from cache or triggers the load
 *
 * @returns {Promise} promise
 */
async function getPublicSuffixList() {
    if (publicSuffixList) {
        return publicSuffixList;
    }
    publicSuffixList = await loadPublicSuffixList()
    return publicSuffixList;
}


/**
 * Returns public suffix for a given domain e.g. "com" for example.com or "gov.uk" for test.gov.uk or "uk" for "test.uk"
 *
 * @returns {Promise} Returns the public suffix
 */
async function getPublicSuffix(domain, privateOnly) {

    const publicSuffixList = await getPublicSuffixList()
    const searchList = privateOnly ? publicSuffixList.private : {...publicSuffixList.private, ...publicSuffixList.icann};

    // Split the domain into parts (e.g., ['uk', 'gov', 'test'] for 'test.gov.uk')
    const domainParts = domain.split('.').reverse();

    let longestPublicSuffix = '';

    // Function to search for the longest matching suffix in the provided list
    const searchForLongestSuffix = (parts) => {
        let testSuffix = '';
        for (let i = 0; i < parts.length; i++) {
            testSuffix = parts[i] + (testSuffix ? '.' + testSuffix : '');
            if (searchList[testSuffix] && testSuffix.length > longestPublicSuffix.length) {
                longestPublicSuffix = testSuffix; // Update if longer match found
            }
        }
    };

    // Search lists
    searchForLongestSuffix(domainParts);

    return longestPublicSuffix || null; // Return the longestPublicSuffix without reversing
}

/**
 * Checks whether a provided hostSuffixString is an allowed host suffix string for the originalHost
 *
 * @param {string} hostSuffixString
 * @param {string} originalHost
 *
 * @returns {Promise} The provided hostSuffixString is an allowed host suffix string for the originalHost
 */
async function isRegistrableDomainSuffix(hostSuffixString, originalHost) {
    // If hostSuffixString is the empty string, then return false.
    if (!hostSuffixString) {
        return false;
    }

    const parsedHostSuffixString = new URL('http://' + hostSuffixString);
    if (parsedHostSuffixString.hostname !== hostSuffixString) {
        return false;
    }

    const parsedOriginalHost = new URL('http://' + originalHost);
    if (parsedOriginalHost.hostname !== originalHost) {
        return false;
    }

    if (hostSuffixString === originalHost) {
        return true;
    }
    if (!originalHost.endsWith('.' + hostSuffixString)) {
        return false
    }

    const publicSuffixList = await getPublicSuffixList();

    if (publicSuffixList.icann.hasOwnProperty(hostSuffixString)) {
        return false
    }

    if (publicSuffixList.icann.hasOwnProperty(hostSuffixString)) {
        return false
    }

    if (publicSuffixList.private.hasOwnProperty(hostSuffixString)) {
        return false
    }

    const originalHostPublicSuffix = await getPublicSuffix(originalHost, true);
    if (originalHostPublicSuffix && originalHostPublicSuffix.endsWith('.' + hostSuffixString)) {
        // hostSuffixString for amazonaws.com on an origin of www.example.compute.amazonaws.com should not be possible,
        // because the compute.amazonaws.com is a public suffix
        return false;
    }
    if (originalHostPublicSuffix && hostSuffixString.endsWith('.' + originalHostPublicSuffix)) {
        // hostSuffixString for compute.amazonaws.com on an origin of www.example.compute.amazonaws.com should not be possible,
        // because the compute.amazonaws.com is a public suffix
        return false;
    }

    return true;
}

/**
 * Returns all passkeys for a given rpId and an optiona filter array of allwoed ids
 *
 * @param {string} rpId The rpId
 * @param {string} [allowedIds] The optional filter array of allowed ids in Hex Format
 *
 * @returns {Promise} The filtered database objects
 */
function searchPasskeys(rpId, allowedIds) {
    const filter = function (leaf) {
        if (leaf.type !== "passkey") {
            return false;
        }

        if (typeof leaf.urlfilter === "undefined") {
            return false;
        }

        if (!allowedIds || allowedIds.length === 0) {
            return leaf.urlfilter.startsWith(rpId + '#');
        }

        for (var i = 0; i < allowedIds.length; i++) {
            if (leaf.urlfilter === rpId + '#' + allowedIds[i]) {
                return true;
            }
        }

        return false;
    };

    return storage.where("datastore-password-leafs", filter);
}

/**
 * Converts a p1363Signature to DER
 *
 * @param {Uint8Array} p1363Signature
 * @returns {Uint8Array} DER encoded signature
 */
function p1363ToDer(p1363Signature) {
    // Helper function to find the index of the first non-zero byte
    function findFirstNonZeroIndex(arr) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== 0) {
                return i;
            }
        }
        return -1;
    }

    // Helper function to encode an integer in DER format
    function encodeInteger(value) {
        // If the first bit is set, prepend a zero byte (to signify a positive number in two's complement)
        if (value[0] & 0x80) {
            value = Uint8Array.from([0x00, ...value]);
        }
        // DER Integer tag
        const tag = 0x02;
        // Length of the integer
        const length = value.length;
        return Uint8Array.from([tag, length, ...value]);
    }

    // Split the P-1363 signature into r and s components (assuming they are of equal length)
    const elementLength = p1363Signature.length / 2;
    const r = p1363Signature.slice(0, elementLength);
    const s = p1363Signature.slice(elementLength);

    // Remove leading zeros
    const rIndex = findFirstNonZeroIndex(r);
    const sIndex = findFirstNonZeroIndex(s);
    const rValue = (rIndex !== -1) ? r.slice(rIndex) : new Uint8Array([0]);
    const sValue = (sIndex !== -1) ? s.slice(sIndex) : new Uint8Array([0]);

    // Encode r and s as DER integers
    const rEncoded = encodeInteger(rValue);
    const sEncoded = encodeInteger(sValue);

    // Construct the overall sequence
    const sequenceLength = rEncoded.length + sEncoded.length;
    const sequence = Uint8Array.from([0x30, sequenceLength, ...rEncoded, ...sEncoded]);
    return sequence;
}

/**
 * Fake navigatorCredentialsGet which takes options and returns async
 *
 * @param options
 * @param origin
 * @returns {Promise<{authenticatorAttachment: string, response: {clientDataJSON: string, transports: string[], publicKeyAlgorithm: number, publicKey: string, attestationObject: string, authenticatorData: string}, rawId: Uint8Array, id: string, type: string, clientExtensionResults: {credProps: {rk: boolean}}}>}
 */
async function navigatorCredentialsGet(options, origin) {
    /**
     * Receives something like:
     *
     * {
     *   "challenge": "bHxPtC7pGM64ltwPZR8S067Ug3VxjKJr8b1wbZ5EhUZsP1I6OcM1eDQduWKeOGL-UHzZObnfbCHME1hInKRv-Q",
     *   "timeout": 60000,
     *   "rpId": "webauthn.io",
     *   "allowCredentials": [
     *     {
     *       "id": "5QciHCwUFwyQhUESR1jT6vL9bJkc558ZtTNuhMc3GwvNlKZJGY7GTYPJvxrMjjwm",
     *       "type": "public-key",
     *       "transports": [
     *         "usb"
     *       ]
     *     }
     *   ],
     *   "userVerification": "preferred"
     * }
     *
     * And is supposed to return something like:
     *
     * {
     *   "id": "5QciHCwUFwyQhUESR1jT6vL9bJkc558ZtTNuhMc3GwvNlKZJGY7GTYPJvxrMjjwm",
     *   "rawId": "5QciHCwUFwyQhUESR1jT6vL9bJkc558ZtTNuhMc3GwvNlKZJGY7GTYPJvxrMjjwm",
     *   "response": {
     *     "authenticatorData": "dKbqkhPJnC90siSSsyDPQCYqlMGpUKA5fyklC2CEHvAFAAAABA",
     *     "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiYkh4UHRDN3BHTTY0bHR3UFpSOFMwNjdVZzNWeGpLSnI4YjF3Ylo1RWhVWnNQMUk2T2NNMWVEUWR1V0tlT0dMLVVIelpPYm5mYkNITUUxaEluS1J2LVEiLCJvcmlnaW4iOiJodHRwczovL3dlYmF1dGhuLmlvIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ",
     *     "signature": "MEUCIED7P-w7UYLAjZSoJc8hXXwS9U-QANI-jn_FwVXe8xMIAiEA49d4nrTVtj2Q8weAK99MeLog-e6KBg_kVdQLNvKnvzM",
     *     "userHandle": "cGhqb250ZThh"
     *   },
     *   "type": "public-key",
     *   "clientExtensionResults": {},
     *   "authenticatorAttachment": "cross-platform"
     * }
     *
     */

    if (!origin.startsWith('https://')) {
        throw new PasskeyException('ORIGIN_NOT_SUPPORTED', i18n.t('ORIGIN_NOT_SUPPORTED'));
    }

    const parsedOrigin = helperService.parseUrl(origin);

    let rpId = options.publicKey.rpId;
    if (!rpId) {
        // https://www.w3.org/TR/webauthn-2/#relying-party-identifier
        // By default, the RP ID for a WebAuthn operation is set to the caller’s origin's effective domain. This default
        // MAY be overridden by the caller, as long as the caller-specified RP ID value is a registrable domain suffix
        // of or is equal to the caller’s origin's effective domain.
        //
        // Note: An RP ID is based on a host's domain name. It does not itself include a scheme or port, as an origin does.
        rpId = parsedOrigin.full_domain;
    }

    if (!await isRegistrableDomainSuffix(rpId, parsedOrigin.full_domain)) {
        throw new PasskeyException('RP_ID_NOT_ALLOWED', i18n.t('RP_ID_NOT_ALLOWED'));
    }

    const allowCredentials = options.publicKey.allowCredentials || [];
    const allowCredentialIds = allowCredentials.map(cred => converterService.toHex(new Uint8Array(converterService.base64UrlToArrayBuffer(cred.id))));
    const discoverableCredentialsOnly = allowCredentials.length === 0 || (options.mediation && options.mediation === "conditional")
    const isConditional = options.mediation && options.mediation === "conditional";
    const isLoggedIn = user.isLoggedIn();

    if (!isLoggedIn && !isConditional) {
        // we only show a notification when the user did click on a sign in and expects a sign in to happen
        // and not when the site just wants to autologin the user
        notificationBarService.create(
            i18n.t("SIGN_IN_REQUIRED"),
            i18n.t("NOT_LOGGED_IN_PLEASE_SIGN_IN_TO_USE_FUNCTION"),
            [],
            10*1000,
        )
    }
    if (!isLoggedIn) {
        throw new PasskeyException('BYPASS_PSONO', i18n.t('BYPASS_PSONO'));
    }

    let credentials = await searchPasskeys(rpId, allowCredentialIds);
    if (discoverableCredentialsOnly) {
        credentials = credentials.filter((cred) => cred.autosubmit);

    }
    if (credentials.length === 0) {
        if (!isConditional) {
            notificationBarService.create(
                i18n.t("AUTHENTICATION"),
                i18n.t("NO_PASSKEY_FOUND_FOR_THIS_WEBSITE"),
                [],
                10*1000,
            )
        }
        throw new PasskeyException('BYPASS_PSONO', i18n.t('BYPASS_PSONO'))
    }

    await createNotificationAsync(
        i18n.t("AUTHENTICATION"),
        i18n.t("WEBSITE_WANTS_TO_AUTHENTICATE_WITH_PASSKEY_ALLOW_OR_DENY"),
        options.publicKey.timeout || 30*1000,
    )

    const decryptedSecret = await secretService.readSecret(
        credentials[0]["secret_id"],
        credentials[0]["secret_key"],
    );
    if (!decryptedSecret.hasOwnProperty('read_count')) {
        console.log("Server incompatible, update Server")
        throw new PasskeyException('SERVER_INCOMPATIBLE', i18n.t('SERVER_INCOMPATIBLE'));
    }

    const rawId = converterService.fromHex(decryptedSecret.passkey_id);
    decryptedSecret.passkey_public_key.key_ops = ["verify"]
    const publicKey = await crypto.subtle.importKey(
        "jwk", // the format
        decryptedSecret.passkey_public_key,
        decryptedSecret.passkey_algorithm,
        true,
        ["verify"]
    );
    decryptedSecret.passkey_private_key.key_ops = ["sign"]
    const privateKey = await crypto.subtle.importKey(
        "jwk",
        decryptedSecret.passkey_private_key,
        decryptedSecret.passkey_algorithm,
        false,
        ["sign"]
    );

    const clientDataJSON = JSON.stringify({
        type: 'webauthn.get',
        challenge: options.publicKey.challenge,
        origin: origin,
        crossOrigin: false
    });
    const clientDataJSONUint8Array = converterService.encodeUtf8(clientDataJSON);
    const clientDataJSONHash = converterService.fromHex(cryptoLibrary.sha256(clientDataJSONUint8Array));

    const authenticatorData = await createAuthData(rpId, rawId, publicKey, decryptedSecret.read_count, true)
    // calculate signature
    const encoded = new Uint8Array(authenticatorData.byteLength + clientDataJSONHash.byteLength);
    encoded.set(authenticatorData, 0);
    encoded.set(clientDataJSONHash, 0 + authenticatorData.byteLength);
    let signature = await crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        privateKey,
        encoded,
    );
    const signatureDerEncoded = p1363ToDer(new Uint8Array(signature));

    const credential = {
        "id": converterService.arrayBufferToBase64Url(rawId),
        "rawId": converterService.arrayBufferToBase64Url(rawId),
        "response": {
            "authenticatorData": converterService.arrayBufferToBase64Url(authenticatorData),
            "clientDataJSON": converterService.arrayBufferToBase64Url(clientDataJSONUint8Array),
            "signature": converterService.arrayBufferToBase64Url(signatureDerEncoded),
            "userHandle": decryptedSecret.passkey_user_handle,
        },
        "type": "public-key",
        "clientExtensionResults": {
            // "credProps": {
            //     "rk": true
            // }
        },
        "authenticatorAttachment": "cross-platform"
    }

    return credential;
}

/**
 * Triggers on a navigator-credentials-create event, whenever someone called navigator.credentials.create
 * We will check whether Psono is responsible to deal with Webauthn / Passkeys
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNavigatorCredentialsGet(request, sender, sendResponse) {

    async function asyncResponse() {
        let credential;
        try {
            credential = await navigatorCredentialsGet(request.data.options, request.data.origin);
        } catch (e) {
            if (e instanceof PasskeyException) {
                sendResponse({
                    'event': 'navigator-credentials-get-response',
                    'data': {
                        'error': {
                            'errorType': e.errorType,
                            'message': e.message,
                            'metadata': e.metadata,
                        },
                        'eventId': request.data.eventId,
                    },
                });
                return;
            } else {
                throw e; // let others bubble up
            }
        }
        sendResponse({
            'event': 'navigator-credentials-get-response',
            'data': {
                'credential': credential,
                'eventId': request.data.eventId,
            },
        });
    }

    asyncResponse();

    return true
}



/**
 * Converts a given public key to the COSE_Key format with the "CTAP2 canonical CBOR encoding form"
 * Attention the parameters are hardcoded for EC2 and ES256 signature algorithm and a P-256 curve
 *
 * @param {CryptoKey} publicKey
 * @returns {Promise<Uint8Array>}
 */
async function convertPublicKeyToCose(publicKey) {

    // https://www.w3.org/TR/webauthn/#sctn-attested-credential-data
    // example 6 / 7 for the CTAP2 canonical CBOR encoding form
    // {
    //   1:   2,  ; kty: EC2 key type
    //   3:  -7,  ; alg: ES256 signature algorithm
    //  -1:   1,  ; crv: P-256 curve
    //  -2:   x,  ; x-coordinate as byte string 32 bytes in length
    //            ; e.g., in hex: 65eda5a12577c2bae829437fe338701a10aaa375e1bb5b5de108de439c08551d
    //  -3:   y   ; y-coordinate as byte string 32 bytes in length
    //            ; e.g., in hex: 1e52ed75701163f7f9e40ddf9f341b3dc9ba860af7e0ca7ca7e9eecd0084d19c
    // }
    //
    // And that should output the following:
    // A5
    //    01  02
    //
    //    03  26
    //
    //    20  01
    //
    //    21  58 20   65eda5a12577c2bae829437fe338701a10aaa375e1bb5b5de108de439c08551d
    //
    //    22  58 20   1e52ed75701163f7f9e40ddf9f341b3dc9ba860af7e0ca7ca7e9eecd0084d19c

    const publicKeyJwkFormat = await crypto.subtle.exportKey("jwk", publicKey);

    const start = new Uint8Array([0xa5])
    const kty = new Uint8Array([0x01, 0x02])
    const alg = new Uint8Array([0x03, 0x26])
    const crv = new Uint8Array([0x20, 0x01])
    const xCoordinateStart = new Uint8Array([0x21, 0x58, 0x20])
    const xCoordinate = new Uint8Array(converterService.base64UrlToArrayBuffer(publicKeyJwkFormat.x));
    const yCoordinateStart = new Uint8Array([0x22, 0x58, 0x20])
    const yCoordinate = new Uint8Array(converterService.base64UrlToArrayBuffer(publicKeyJwkFormat.y));

    const coseBytes = new Uint8Array(start.byteLength + kty.byteLength + alg.byteLength + crv.byteLength + xCoordinateStart.byteLength + xCoordinate.byteLength + yCoordinateStart.byteLength + yCoordinate.byteLength);

    coseBytes.set(start, 0);
    coseBytes.set(kty, 0 + start.byteLength);
    coseBytes.set(alg, 0 + start.byteLength + kty.byteLength);
    coseBytes.set(crv, 0 + start.byteLength + kty.byteLength + alg.byteLength);
    coseBytes.set(xCoordinateStart, 0 + start.byteLength + kty.byteLength + alg.byteLength + crv.byteLength);
    coseBytes.set(xCoordinate, 0 + start.byteLength + kty.byteLength + alg.byteLength + crv.byteLength + xCoordinateStart.byteLength);
    coseBytes.set(yCoordinateStart, 0 + start.byteLength + kty.byteLength + alg.byteLength + crv.byteLength + xCoordinateStart.byteLength + xCoordinate.byteLength);
    coseBytes.set(yCoordinate, 0 + start.byteLength + kty.byteLength + alg.byteLength + crv.byteLength + xCoordinateStart.byteLength + xCoordinate.byteLength + yCoordinateStart.byteLength);

    return coseBytes;
}


/**
 * Creates the authenticator data structure (the first 37 bytes)
 * https://www.w3.org/TR/webauthn/#sctn-authenticator-data
 *
 * ... and for the attested credential data (the variable rest)
 * https://www.w3.org/TR/webauthn/#sctn-attested-credential-data
 *
 * @param {str} rpId
 * @param {Uint8Array} rawId
 * @param {CryptoKey} publicKey
 * @param {int} signCountInt
 * @param {bool} userPresent
 *
 * @returns {Uint8Array}
 */
async function createAuthData(rpId, rawId, publicKey, signCountInt, userPresent) {
    // RP ID Hash
    const rpIdHash = converterService.fromHex(cryptoLibrary.sha256(rpId));

    // Flags
    const flags = new Uint8Array([0x0]);
    if (userPresent) {
        flags[0] = flags[0] ^ Math.pow(2,0) // Math.pow(2,0) = 1 = 0000001 - bit 0, user present
    }
    flags[0] = flags[0] ^ Math.pow(2,2) // Math.pow(2,2) = 4 = 0000100 - bit 2, user verified
    flags[0] = flags[0] ^ Math.pow(2,6) // Math.pow(2,6) = 64 = 1000000 - bit 6, attested credential data included

    // Sign Count (4 bytes, big-endian)
    const signCount = new Uint8Array([
        (signCountInt & 0xff000000) >> 24,
        (signCountInt & 0x00ff0000) >> 16,
        (signCountInt & 0x0000ff00) >> 8,
        (signCountInt & 0x000000ff)
    ]);

    // Attested Credential Data
    const aaguid = new Uint8Array(16); // 16-byte AAGUID
    aaguid.set(new Uint8Array([0x50, 0x73, 0x6f, 0x6e, 0x6f]));

    // The byte length of the credential ID encoded as 2 bytes, big endian.
    const credentialIdLengthView = new Uint8Array(2)
    credentialIdLengthView[0] = (rawId.length >> 8) & 0xFF; // High byte
    credentialIdLengthView[1] = rawId.length & 0xFF;        // Low byte

    const publicKeyCose = await convertPublicKeyToCose(publicKey);

    // Concatenate to form authData
    const authData = new Uint8Array(rpIdHash.byteLength + flags.byteLength + signCount.byteLength + aaguid.byteLength + credentialIdLengthView.byteLength + rawId.byteLength + publicKeyCose.byteLength);
    authData.set(rpIdHash, 0);
    authData.set(flags, rpIdHash.byteLength);
    authData.set(signCount, rpIdHash.byteLength + flags.byteLength);
    authData.set(aaguid, rpIdHash.byteLength + flags.byteLength + signCount.byteLength);
    authData.set(credentialIdLengthView, rpIdHash.byteLength + flags.byteLength + signCount.byteLength + aaguid.byteLength);
    authData.set(rawId, rpIdHash.byteLength + flags.byteLength + signCount.byteLength + aaguid.byteLength + credentialIdLengthView.byteLength);
    authData.set(publicKeyCose, rpIdHash.byteLength + flags.byteLength + signCount.byteLength + aaguid.byteLength + credentialIdLengthView.byteLength + rawId.byteLength);

    return authData;
}

/**
 * Tells the user that the website wants to create a new passkey and asks him whether he wants to allow or deny the request
 * Will return a promise reflecting the user's decision.
 *
 * @param {int} timeout A time in milliseconds when the notification bar should disappear again.
 *
 * @returns {Promise}
 */
function createNotificationAsync(title, description, timeout) {
    return new Promise(function (resolve, reject) {
        notificationBarService.create(
            title,
            description,
            [
                {
                    title: i18n.t("ALLOW"),
                    onClick: resolve,
                    color: "primary",
                },
                {
                    title: i18n.t("NO"),
                    onClick: () => reject(new PasskeyException('USER_DENIED_REQUEST', i18n.t('USER_DENIED_REQUEST'))),
                },
                {
                    title: i18n.t("BYPASS_PSONO"),
                    onClick: () => reject(new PasskeyException('BYPASS_PSONO', i18n.t('BYPASS_PSONO'))),
                },
            ],
            timeout,
            reject,
        )
    });
}

/**
 * Fake navigatorCredentialsCreate which takes options and returns async
 *
 * @param options
 * @param origin
 * @returns {Promise<{authenticatorAttachment: string, response: {clientDataJSON: string, transports: string[], publicKeyAlgorithm: number, publicKey: string, attestationObject: string, authenticatorData: string}, rawId: Uint8Array, id: string, type: string, clientExtensionResults: {credProps: {rk: boolean}}}>}
 */
async function navigatorCredentialsCreate(options, origin) {
    /**
     * Receives something like:
     *
     * {
     *   "rp": {
     *     "name": "webauthn.io",
     *     "id": "webauthn.io"
     *   },
     *   "user": {
     *     "id": "YXNk",
     *     "name": "asd",
     *     "displayName": "asd"
     *   },
     *   "challenge": "jYT1WS2a40nQvyBoHhIXxYhUBfaJC3asJLWy2NUEPy6TQT3qXC_Vio7GJ1hJ3IgT84fGH9l99BZKRYe1-lv3JQ",
     *   "pubKeyCredParams": [
     *     {
     *       "type": "public-key",
     *       "alg": -7
     *     },
     *     {
     *       "type": "public-key",
     *       "alg": -257
     *     }
     *   ],
     *   "timeout": 60000,
     *   "excludeCredentials": [],
     *   "authenticatorSelection": {
     *     "residentKey": "preferred",
     *     "requireResidentKey": false,
     *     "userVerification": "preferred"
     *   },
     *   "attestation": "none",
     *   "hints": [],
     *   "extensions": {
     *     "credProps": true
     *   }
     * }
     *
     *
     * And is supposed to return something like:
     *
     * {
     *   "id": "DdHkix-t8qQ5x47Pny7zgDvZjCmqxG8eKMuiJg7B4b0QpCMvIVwIJQ5qPI2e2qyR",
     *   "rawId": "DdHkix-t8qQ5x47Pny7zgDvZjCmqxG8eKMuiJg7B4b0QpCMvIVwIJQ5qPI2e2qyR",
     *   "response": {
     *     "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YVjCdKbqkhPJnC90siSSsyDPQCYqlMGpUKA5fyklC2CEHvDFAAAAAgAAAAAAAAAAAAAAAAAAAAAAMA3R5IsfrfKkOceOz58u84A72YwpqsRvHijLoiYOweG9EKQjLyFcCCUOajyNntqskaUBAgMmIAEhWCAN0eSLH63ypDnHjs-fhIQhla9vBjn9mmqgo4SOPhTQ7iJYIAW1DN4LgU9FLTHsBsMOf_65gLPkDe82LVu3lAEpMcjSoWtjcmVkUHJvdGVjdAI",
     *     "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiallUMVdTMmE0MG5RdnlCb0hoSVh4WWhVQmZhSkMzYXNKTFd5Mk5VRVB5NlRRVDNxWENfVmlvN0dKMWhKM0lnVDg0ZkdIOWw5OUJaS1JZZTEtbHYzSlEiLCJvcmlnaW4iOiJodHRwczovL3dlYmF1dGhuLmlvIiwiY3Jvc3NPcmlnaW4iOmZhbHNlLCJvdGhlcl9rZXlzX2Nhbl9iZV9hZGRlZF9oZXJlIjoiZG8gbm90IGNvbXBhcmUgY2xpZW50RGF0YUpTT04gYWdhaW5zdCBhIHRlbXBsYXRlLiBTZWUgaHR0cHM6Ly9nb28uZ2wveWFiUGV4In0",
     *     "transports": [
     *       "usb"
     *     ],
     *     "publicKeyAlgorithm": -7,
     *     "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDdHkix-t8qQ5x47Pn4SEIZWvbwY5_ZpqoKOEjj4U0O4FtQzeC4FPRS0x7AbDDn_-uYCz5A3vNi1bt5QBKTHI0g",
     *     "authenticatorData": "dKbqkhPJnC90siSSsyDPQCYqlMGpUKA5fyklC2CEHvDFAAAAAgAAAAAAAAAAAAAAAAAAAAAAMA3R5IsfrfKkOceOz58u84A72YwpqsRvHijLoiYOweG9EKQjLyFcCCUOajyNntqskaUBAgMmIAEhWCAN0eSLH63ypDnHjs-fhIQhla9vBjn9mmqgo4SOPhTQ7iJYIAW1DN4LgU9FLTHsBsMOf_65gLPkDe82LVu3lAEpMcjSoWtjcmVkUHJvdGVjdAI"
     *   },
     *   "type": "public-key",
     *   "clientExtensionResults": {
     *     "credProps": {
     *       "rk": true
     *     }
     *   },
     *   "authenticatorAttachment": "cross-platform"
     * }
     */

    if (!origin.startsWith('https://')) {
        throw new PasskeyException('ORIGIN_NOT_SUPPORTED', i18n.t('ORIGIN_NOT_SUPPORTED'));
    }

    const isLoggedIn = user.isLoggedIn();

    if (isLoggedIn && !store.getState().settingsDatastore.showPasskey) {
        throw new PasskeyException('PASSKEY_DISABLED', i18n.t('PASSKEY_DISABLED'));
    }

    if (!isLoggedIn) {
        notificationBarService.create(
            i18n.t("SIGN_IN_REQUIRED"),
            i18n.t("NOT_LOGGED_IN_PLEASE_SIGN_IN_TO_USE_FUNCTION"),
            [],
            10*1000,
        )
        throw new PasskeyException('USER_NOT_LOGGED_IN', i18n.t('USER_NOT_LOGGED_IN'));
    }

    const parsedOrigin = helperService.parseUrl(origin);

    await createNotificationAsync(
        i18n.t("NEW_PASSKEY"),
        i18n.t("WEBSITE_WANTS_TO_CREATE_NEW_PASSKEY_ALLOW_OR_DENY"),
        options.publicKey.timeout || 30*1000,
    )

    // https://w3c.github.io/webauthn/#dom-publickeycredentialcreationoptions-pubkeycredparams
    let foundSupportedPublicKeyParams = false;
    for (let i = 0; i < options.publicKey.pubKeyCredParams.length; i++) {
        let hasType = options.publicKey.pubKeyCredParams[0]["type"] === "public-key";
        let hasAlg = options.publicKey.pubKeyCredParams[0]["alg"] === -7;

        if (hasType && hasAlg) {
            foundSupportedPublicKeyParams = true;
            break
        }
    }
    if (!foundSupportedPublicKeyParams) {
        throw new PasskeyException('PUBLIC_KEY_PARAMS_NOT_SUPPORTED', i18n.t('PUBLIC_KEY_PARAMS_NOT_SUPPORTED'));
    }

    let rpId = options.publicKey.rp.id;
    if (!rpId) {
        // https://www.w3.org/TR/webauthn-2/#relying-party-identifier
        // By default, the RP ID for a WebAuthn operation is set to the caller’s origin's effective domain. This default
        // MAY be overridden by the caller, as long as the caller-specified RP ID value is a registrable domain suffix
        // of or is equal to the caller’s origin's effective domain.
        //
        // Note: An RP ID is based on a host's domain name. It does not itself include a scheme or port, as an origin does.
        rpId = parsedOrigin.full_domain;
    }

    if (!await isRegistrableDomainSuffix(rpId, parsedOrigin.full_domain)) {
        throw new PasskeyException('RP_ID_NOT_ALLOWED', i18n.t('RP_ID_NOT_ALLOWED'));
    }

    const keyPair = await crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["sign"],
    );
    const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);

    const rawId = cryptoLibrary.randomBytes(16); // 16 bytes or 128 bits long random credential id

    const authData = await createAuthData(rpId, rawId, keyPair.publicKey, 0, true)

    const attestationObject = {
        fmt: 'none',
        authData: authData,
        attStmt: {} // Empty for 'none' attestation format
    };

    const attestationObjectCBOREncoded = converterService.cborEncode(attestationObject);

    const clientDataJSON = JSON.stringify({
        type: 'webauthn.create',
        challenge: options.publicKey.challenge,
        origin: origin,
        crossOrigin: false
    });
    const clientDataJSONUint8Array = converterService.encodeUtf8(clientDataJSON);

    const publicKeyJwkFormat = await crypto.subtle.exportKey("jwk",keyPair.publicKey);
    const privateKeyJwkFormat = await crypto.subtle.exportKey("jwk",keyPair.privateKey);

    await datastorePasswordService.savePasskey(
        converterService.toHex(rawId),
        rpId,
        publicKeyJwkFormat,
        privateKeyJwkFormat,
        options.publicKey.user.id,
        options.publicKey.user.display_name || options.publicKey.user.name || options.publicKey.user.id,
        {
            'name': "ECDSA",
            'namedCurve': "P-256",
        },
    )


    const credential = {
        "id": converterService.arrayBufferToBase64Url(rawId),
        "rawId": converterService.arrayBufferToBase64Url(rawId),
        "response": {
            "attestationObject": converterService.arrayBufferToBase64Url(attestationObjectCBOREncoded),
            "clientDataJSON": converterService.arrayBufferToBase64Url(clientDataJSONUint8Array),
            "transports": [
                "internal" // https://www.w3.org/TR/webauthn-2/#enum-transport
            ],
            "publicKeyAlgorithm": -7,
            "publicKey": converterService.arrayBufferToBase64Url(publicKey),
            "authenticatorData": converterService.arrayBufferToBase64Url(authData),
        },
        "type": "public-key",
        "clientExtensionResults": {
            // "credProps": {
            //     "rk": true
            // }
        },
        "authenticatorAttachment": "cross-platform"
    }

    return credential;
}


/**
 * Triggers on a navigator-credentials-get event, whenever someone called navigator.credentials.get
 * We will check whether Psono is responsible to deal with Webauthn / Passkeys
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNavigatorCredentialsCreate(request, sender, sendResponse) {

    async function asyncResponse() {

        let credential;
        try {
            credential = await navigatorCredentialsCreate(request.data.options, request.data.origin);
        } catch (e) {
            if (e instanceof PasskeyException) {
                sendResponse({
                    'event': 'navigator-credentials-create-response',
                    'data': {
                        'error': {
                            'errorType': e.errorType,
                            'message': e.message,
                            'metadata': e.metadata,
                        },
                        'eventId': request.data.eventId,
                    },
                });
                return;
            } else {
                throw e; // let others bubble up
            }
        }

        sendResponse({
            'event': 'navigator-credentials-create-response',
            'data': {
                'credential': credential,
                'eventId': request.data.eventId,
            },
        });
    }

    asyncResponse();

    return true
}



const passkeyService = {
    getPublicSuffix,
    isRegistrableDomainSuffix,
    onNavigatorCredentialsGet,
    onNavigatorCredentialsCreate,
    //for easier unit testing
    navigatorCredentialsCreate,
};

export default passkeyService;
