import passkeyService from './passkey';
import converterService from "./converter";
import datastorePasswordService from "./datastore-password";
import notificationBarService from "./notification-bar";
import user from "./user";
import {initStore} from "./store";

function mockFetch() {
    return jest.fn().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: function() {
                return {
                    "icann": {
                        "com": 1,
                        "de": 1,
                        "app": 1,
                        "uk": 1,
                        "gov.uk": 2,
                    },
                    "private": {
                        "netlify.app": 2,
                        "compute.amazonaws.com": 4,
                    }
                }
            },
        }),
    );
}

describe('Service: passkey test suite', function() {
    it('passkey exists', function() {
        expect(passkeyService).toBeDefined();
    });

    it('isRegistrableDomainSuffix 0.0.0.0 <-> 0.0.0.0 = True', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('0.0.0.0', '0.0.0.0')
        ).toBeTruthy();
    });

    it('isRegistrableDomainSuffix example.com <-> example.com = True', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('example.com', 'example.com')
        ).toBeTruthy();
    });

    it('isRegistrableDomainSuffix example.com <-> example.com. = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('example.com', 'example.com.')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix example.com. <-> example.com = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('example.com.', 'example.com')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix .example.com <-> example.com = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('.example.com', 'example.com')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix example.com <-> www.example.com = True', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('example.com', 'www.example.com')
        ).toBeTruthy();
    });

    it('isRegistrableDomainSuffix com <-> example.com = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('com', 'example.com')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix com <-> example.com = True', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('example', 'example')
        ).toBeTruthy();
    });

    it('isRegistrableDomainSuffix compute.amazonaws.com <-> example.compute.amazonaws.com = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('compute.amazonaws.com', 'example.compute.amazonaws.com')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix compute.amazonaws.com <-> www.example.compute.amazonaws.com = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('example.compute.amazonaws.com', 'www.example.compute.amazonaws.com')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix amazonaws.com <-> www.example.compute.amazonaws.com = False', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('amazonaws.com', 'www.example.compute.amazonaws.com')
        ).toBeFalsy();
    });

    it('isRegistrableDomainSuffix amazonaws.com <-> test.amazonaws.com = True', async function () {
        window.fetch = mockFetch();
        expect(
            await passkeyService.isRegistrableDomainSuffix('amazonaws.com', 'test.amazonaws.com')
        ).toBeTruthy();
    });

    it('onNavigatorCredentialsCreate', async () => {
        datastorePasswordService.savePasskey = jest.fn();
        user.isLoggedIn = jest.fn();
        user.isLoggedIn.mockImplementation(() => true);
        notificationBarService.create = jest.fn();
        notificationBarService.create.mockImplementation((title, description, buttons, autoClose, onAutoClose) => buttons[0].onClick());
        await initStore();
        const navigatorCredentials = await passkeyService.navigatorCredentialsCreate({
                "publicKey": {
                    "rp": {
                        "name": "webauthn.io",
                        "id": "webauthn.io"
                    },
                    "user": {
                        "id": "YXNkYXNk",
                        "name": "dfg",
                        "displayName": "dfg"
                    },
                    "challenge": {},
                    "pubKeyCredParams": [
                        {
                            "type": "public-key",
                            "alg": -7
                        },
                        {
                            "type": "public-key",
                            "alg": -257
                        }
                    ],
                    "timeout": 60000,
                    "excludeCredentials": [
                        {
                            "id": {},
                            "type": "public-key",
                            "transports": [
                                "nfc",
                                "usb"
                            ]
                        }
                    ],
                    "authenticatorSelection": {
                        "residentKey": "preferred",
                        "requireResidentKey": false,
                        "userVerification": "preferred"
                    },
                    "attestation": "none",
                    "hints": [],
                    "extensions": {
                        "credProps": true
                    }
                }
            },
            'https://webauthn.io');

        expect(
            navigatorCredentials.authenticatorAttachment
        ).toBe("cross-platform")

        expect(
            navigatorCredentials.type
        ).toBe("public-key")

        expect(
            typeof(navigatorCredentials.id)
        ).toBe("string")

        expect(
            typeof(navigatorCredentials.rawId)
        ).toBe("string")

        expect(
            navigatorCredentials.response.publicKeyAlgorithm
        ).toBe(-7)

        expect(
            navigatorCredentials.response.transports[0]
        ).toBe("internal")

        const publicKey = converterService.base64UrlToArrayBuffer(navigatorCredentials.response.publicKey);
        expect(
            publicKey.byteLength
        ).toBe(91)

        expect(datastorePasswordService.savePasskey.mock.calls.length).toEqual(1) // called once
        expect(converterService.arrayBufferToBase64Url(converterService.fromHex(datastorePasswordService.savePasskey.mock.calls[0][0]))).toEqual(navigatorCredentials.id) // first argument the id
        expect(datastorePasswordService.savePasskey.mock.calls[0][1]).toEqual("webauthn.io") // first argument the rp id
        // expect(datastorePasswordService.savePasskey.mock.calls[0][2]).toEqual(/**/) // the public key
        // expect(datastorePasswordService.savePasskey.mock.calls[0][3]).toEqual(/**/) // the private key
        expect(datastorePasswordService.savePasskey.mock.calls[0][4]).toEqual("YXNkYXNk") // user handle
        expect(datastorePasswordService.savePasskey.mock.calls[0][5]).toEqual("dfg") // user handle
        expect(datastorePasswordService.savePasskey.mock.calls[0][6]).toEqual({ name: 'ECDSA', namedCurve: 'P-256' }) // algorithm

    });

});
