
const ClassWebAccessibleFido2 = function () {
    "use strict";

    const browserSupportsWebauthn = typeof(window.PublicKeyCredential) !== "undefined";

    let originalNavigatorCredentialsCreate = null;
    let originalNavigatorCredentialsGet = null;

    let eventNavigatorCredentialsCreateIndex = {};
    let eventNavigatorCredentialsGetIndex = {};

    setup();

    function setup() {
        if (navigator && navigator.credentials && navigator.credentials.create) {
            originalNavigatorCredentialsCreate = navigator.credentials.create.bind(navigator.credentials);
            navigator.credentials.create = mockedNavigatorCredentialsCreate;
            //Logger:
            //navigator.credentials.create = mockedNavigatorCredentialsCreateLogging;

        }
        if (navigator && navigator.credentials && navigator.credentials.get) {
            originalNavigatorCredentialsGet = navigator.credentials.get.bind(navigator.credentials);
            navigator.credentials.get = mockedNavigatorCredentialsGet;
            //Logger:
            //navigator.credentials.get = mockedNavigatorCredentialsGetLogging;
        }

        window.addEventListener("message", eventListener)
    }

    function eventListener (event) {
        if (event.origin !== window.location.origin) {
            // SECURITY: Don't remove this check!
            return;
        }

        if (!event.data.hasOwnProperty('event')) {
            return;
        }

        if (!event.data.hasOwnProperty('data')) {
            return;
        }

        switch (event.data.event) {
            case "navigator-credentials-get-response":
                onNavigatorCredentialsGetResponse(event.data.data);
                break;
            case 'navigator-credentials-create-response':
                onNavigatorCredentialsCreateResponse(event.data.data);
                break;
        }

    }

    /**
     * Uint8Array to hex converter from nacl_factory.js
     * https://github.com/tonyg/js-nacl
     *
     * @param {Uint8Array} val As Uint8Array encoded value
     *
     * @returns {string} Returns hex representation
     */
    function toHex(val) {
        const encoded = [];
        for (let i = 0; i < val.length; i++) {
            encoded.push("0123456789abcdef"[(val[i] >> 4) & 15]);
            encoded.push("0123456789abcdef"[val[i] & 15]);
        }
        return encoded.join("");
    }
    /**
     * Converts an arrayBuffer to Base64
     * https://www.rfc-editor.org/rfc/rfc4648#section-4
     *
     * @param buffer
     *
     * @returns {string} The Base64 representation of the buffer
     */
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array( buffer );
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }


    /**
     * Converts a Base64 encoded string to arrayBuffer
     * https://www.rfc-editor.org/rfc/rfc4648#section-4
     *
     * @param base64 the base64 encoded string
     *
     * @returns {ArrayBuffer} The buffer representation of the base64 encoded string
     */
    function base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Converts an arrayBuffer to Base64Url
     * https://www.rfc-editor.org/rfc/rfc4648#section-5
     *
     * @param buffer
     *
     * @returns {string} The Base64Url representation of the buffer
     */
    function arrayBufferToBase64Url(buffer) {
        return arrayBufferToBase64(buffer).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '')
    }

    /**
     * Converts an Base64Url encoded string to arrayBuffer
     * https://www.rfc-editor.org/rfc/rfc4648#section-5
     *
     * @param base64Url The base64Url encoded string
     *
     * @returns {ArrayBuffer} The buffer representation of the base64Url encoded string
     */
    function base64UrlToArrayBuffer(base64Url) {
        return base64ToArrayBuffer(base64Url.replace(/-/g, '+').replace(/_/g, '/'))
    }

    /**
     * Received once the content script handled the navigator.credentials.create event
     * @param response
     */
    function onNavigatorCredentialsCreateResponse (response) {
        if (!eventNavigatorCredentialsCreateIndex.hasOwnProperty(response.eventId)) {
            return;
        }
        if (response.error) {
            console.log(response.error);
            if (response.error.hasOwnProperty('errorType') &&  new Set(['BYPASS_PSONO', 'USER_INSTRUCTION_BYPASS_PSONO', 'PASSKEY_DISABLED']).has(response.error.errorType)) {
                const options = eventNavigatorCredentialsCreateIndex[response.eventId].options;
                return originalNavigatorCredentialsCreate(options);
            }
            eventNavigatorCredentialsCreateIndex[response.eventId].reject(
                new DOMException("The operation either timed out or was not allowed.", "AbortError")
            )
            return;
        }

        const credential = {
            ...response.credential,
            rawId: base64UrlToArrayBuffer(response.credential.rawId),
            response : {
                ...response.credential.response,
                clientDataJSON: base64UrlToArrayBuffer(response.credential.response.clientDataJSON),
                attestationObject: base64UrlToArrayBuffer(response.credential.response.attestationObject),
                getAuthenticatorData() {
                    return base64UrlToArrayBuffer(response.credential.response.authenticatorData);
                },
                getPublicKey() {
                    return base64UrlToArrayBuffer(response.credential.response.publicKey);
                },
                getPublicKeyAlgorithm() {
                    return response.credential.response.publicKeyAlgorithm;
                },
                getTransports() {
                    return response.credential.response.transports;
                },
            },
            getClientExtensionResults: function() { return {}}
        }

        // Fix instanceOf calls
        // https://stackoverflow.com/questions/49482459/why-does-setting-the-prototype-of-an-object-to-foo-not-make-it-instanceof-foo
        Object.setPrototypeOf(credential.response, AuthenticatorAttestationResponse.prototype);
        Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

        eventNavigatorCredentialsCreateIndex[response.eventId].resolve(credential)
    }

    /**
     * Received once the content script handled the navigator.credentials.get event
     * @param response
     */
    function onNavigatorCredentialsGetResponse (response) {
        if (!eventNavigatorCredentialsGetIndex.hasOwnProperty(response.eventId)) {
            return;
        }
        if (response.error) {
            console.log(response.error);
            if (response.error.hasOwnProperty('errorType') && new Set(['USER_INSTRUCTION_BYPASS_PSONO']).has(response.error.errorType)) {
                const options = eventNavigatorCredentialsGetIndex[response.eventId].options;
                return originalNavigatorCredentialsGet(options);
            }
            eventNavigatorCredentialsGetIndex[response.eventId].reject(
                new DOMException("The operation either timed out or was not allowed.", "AbortError")
            )
            return;
        }

        const credential = {
            ...response.credential,
            rawId: base64UrlToArrayBuffer(response.credential.rawId),
            response : {
                ...response.credential.response,
                clientDataJSON: base64UrlToArrayBuffer(response.credential.response.clientDataJSON),
                authenticatorData: base64UrlToArrayBuffer(response.credential.response.authenticatorData),
                signature: base64UrlToArrayBuffer(response.credential.response.signature),
                userHandle: base64UrlToArrayBuffer(response.credential.response.userHandle),
            },
            getClientExtensionResults: function() { return {}}
        }

        // Fix instanceOf calls
        // https://stackoverflow.com/questions/49482459/why-does-setting-the-prototype-of-an-object-to-foo-not-make-it-instanceof-foo
        Object.setPrototypeOf(credential.response, AuthenticatorAssertionResponse.prototype);
        Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

        eventNavigatorCredentialsGetIndex[response.eventId].resolve(credential)

    }

    // async function mockedNavigatorCredentialsCreateLogging(options) {
    //     console.log('Psono-NavigatorCredentialsCreate-Request', options);
    //     const result = await originalNavigatorCredentialsCreate(options);
    //     console.log('Psono-NavigatorCredentialsCreate-Response', result);
    //     return result;
    // }
    //
    // async function mockedNavigatorCredentialsGetLogging(options) {
    //     console.log('Psono-NavigatorCredentialsGet-Request', options);
    //     const result = await originalNavigatorCredentialsGet(options);
    //     console.log('Psono-NavigatorCredentialsGet-Response', result, options.signal);
    //     return result;
    // }

    /**
     * Intercepts navigator.credentials.create events and send them to our content script
     * @param options
     */
    function mockedNavigatorCredentialsCreate (options) {

        // platform: A non-removable authenticator, like TouchID or Windows Hello
        // cross-platform: A "roaming" authenticator, like a YubiKey
        let isPlatform = false; // e.g. requires a hardware backed security key
        if (options && options.publicKey && options.publicKey.authenticatorSelection && options.publicKey.authenticatorSelection.authenticatorAttachment && options.publicKey.authenticatorSelection.authenticatorAttachment === "platform") {
            isPlatform = true;
        }

        if (isPlatform && browserSupportsWebauthn) {
            // the service wants a hardware backed authenticator and the browser / OS supports it, so let's honor that.
            return originalNavigatorCredentialsCreate(options);
        }

        return new Promise(function(resolve, reject) {

            const eventId = toHex(window.crypto.getRandomValues(new Uint8Array(16)));

            eventNavigatorCredentialsCreateIndex[eventId] = {
                'options': options,
                'resolve': resolve,
                'reject': reject,
            }

            window.postMessage({
                event: "navigator-credentials-create",
                data: {
                    'options': {
                        'publicKey': {
                            ...options.publicKey,
                            challenge: arrayBufferToBase64Url(options.publicKey.challenge),
                            excludeCredentials: options.publicKey.excludeCredentials ? options.publicKey.excludeCredentials.map((cred) => ({
                                id: arrayBufferToBase64Url(cred.id),
                                transports: cred.transports,
                                type: cred.type,
                            })) : options.publicKey.excludeCredentials,
                            user: {
                                ...options.publicKey.user,
                                id: arrayBufferToBase64Url(options.publicKey.user.id),
                            }
                        },
                    },
                    'origin': window.location.origin,
                    'eventId': eventId,
                },
            }, window.location.origin);
        })
    }

    /**
     * Intercepts navigator.credentials.get events and send them to our content script
     * @param options
     */
    function mockedNavigatorCredentialsGet (options) {

        return new Promise(function(resolve, reject) {

            const eventId = toHex(window.crypto.getRandomValues(new Uint8Array(16)));

            eventNavigatorCredentialsGetIndex[eventId] = {
                'options': options,
                'resolve': resolve,
                'reject': reject,
            }

            window.postMessage({
                event: "navigator-credentials-get",
                data: {
                    'options': {
                        'mediation': options.hasOwnProperty('mediation') ? options.mediation : undefined, // "conditional"
                        'publicKey': {
                            ...options.publicKey,
                            challenge: arrayBufferToBase64Url(options.publicKey.challenge),
                            allowCredentials: options.publicKey.allowCredentials ? options.publicKey.allowCredentials.map((cred) => ({
                                ...cred,
                                'id': arrayBufferToBase64Url(cred.id)
                            })) : [],
                        },
                    },
                    'origin': window.location.origin,
                    'eventId': eventId,
                },
            }, window.location.origin);

        })
    }
}