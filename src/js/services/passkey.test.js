import converterService from "./converter";
import datastorePasswordService from "./datastore-password";
import notificationBarService from "./notification-bar";
import passkeyService from "./passkey";
import secretService from "./secret";
import storage from "./storage";
import { initStore } from "./store";
import user from "./user";

function containsBytes(haystack, needle) {
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		if (needle.every((byte, index) => haystack[i + index] === byte)) {
			return true;
		}
	}
	return false;
}

function cosePublicKeyFromJwk(publicKey) {
	return new Uint8Array([
		0xa5,
		0x01,
		0x02,
		0x03,
		0x26,
		0x20,
		0x01,
		0x21,
		0x58,
		0x20,
		...new Uint8Array(converterService.base64UrlToArrayBuffer(publicKey.x)),
		0x22,
		0x58,
		0x20,
		...new Uint8Array(converterService.base64UrlToArrayBuffer(publicKey.y)),
	]);
}

function parseAssertionAuthenticatorData(authenticatorData) {
	if (authenticatorData.length !== 37) {
		throw new Error(
			"Assertion authenticator data has unexpected trailing data",
		);
	}

	const flags = authenticatorData[32];
	return {
		rpIdHash: authenticatorData.slice(0, 32),
		flags,
		signCount: new DataView(
			authenticatorData.buffer,
			authenticatorData.byteOffset + 33,
			4,
		).getUint32(0, false),
		attestedCredentialData: flags & 0x40 ? authenticatorData.slice(37) : null,
	};
}

function mockFetch() {
	return jest.fn().mockImplementation(() =>
		Promise.resolve({
			ok: true,
			json: () => ({
				icann: {
					com: 1,
					de: 1,
					app: 1,
					uk: 1,
					"gov.uk": 2,
				},
				private: {
					"netlify.app": 2,
					"compute.amazonaws.com": 4,
				},
			}),
		}),
	);
}

describe("Service: passkey test suite", () => {
	it("passkey exists", () => {
		expect(passkeyService).toBeDefined();
	});

	it("isRegistrableDomainSuffix 0.0.0.0 <-> 0.0.0.0 = True", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix("0.0.0.0", "0.0.0.0"),
		).toBeTruthy();
	});

	it("isRegistrableDomainSuffix example.com <-> example.com = True", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"example.com",
				"example.com",
			),
		).toBeTruthy();
	});

	it("isRegistrableDomainSuffix example.com <-> example.com. = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"example.com",
				"example.com.",
			),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix example.com. <-> example.com = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"example.com.",
				"example.com",
			),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix .example.com <-> example.com = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				".example.com",
				"example.com",
			),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix example.com <-> www.example.com = True", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"example.com",
				"www.example.com",
			),
		).toBeTruthy();
	});

	it("isRegistrableDomainSuffix com <-> example.com = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix("com", "example.com"),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix com <-> example.com = True", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix("example", "example"),
		).toBeTruthy();
	});

	it("isRegistrableDomainSuffix compute.amazonaws.com <-> example.compute.amazonaws.com = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"compute.amazonaws.com",
				"example.compute.amazonaws.com",
			),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix compute.amazonaws.com <-> www.example.compute.amazonaws.com = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"example.compute.amazonaws.com",
				"www.example.compute.amazonaws.com",
			),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix amazonaws.com <-> www.example.compute.amazonaws.com = False", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"amazonaws.com",
				"www.example.compute.amazonaws.com",
			),
		).toBeFalsy();
	});

	it("isRegistrableDomainSuffix amazonaws.com <-> test.amazonaws.com = True", async () => {
		window.fetch = mockFetch();
		expect(
			await passkeyService.isRegistrableDomainSuffix(
				"amazonaws.com",
				"test.amazonaws.com",
			),
		).toBeTruthy();
	});

	it("onNavigatorCredentialsCreate", async () => {
		datastorePasswordService.savePasskey = jest.fn();
		user.isLoggedIn = jest.fn();
		user.isLoggedIn.mockImplementation(() => true);
		notificationBarService.create = jest.fn();
		notificationBarService.create.mockImplementation(
			(_title, _description, buttons, _autoClose, _onAutoClose) =>
				buttons[0].onClick(),
		);
		await initStore();
		const navigatorCredentials =
			await passkeyService.navigatorCredentialsCreate(
				{
					publicKey: {
						rp: {
							name: "webauthn.io",
							id: "webauthn.io",
						},
						user: {
							id: "YXNkYXNk",
							name: "dfg",
							displayName: "Display Name",
						},
						challenge: {},
						pubKeyCredParams: [
							{
								type: "public-key",
								alg: -7,
							},
							{
								type: "public-key",
								alg: -257,
							},
						],
						timeout: 60000,
						excludeCredentials: [
							{
								id: {},
								type: "public-key",
								transports: ["nfc", "usb"],
							},
						],
						authenticatorSelection: {
							residentKey: "preferred",
							requireResidentKey: false,
							userVerification: "preferred",
						},
						attestation: "none",
						hints: [],
						extensions: {
							credProps: true,
						},
					},
				},
				"https://webauthn.io",
			);

		expect(navigatorCredentials.authenticatorAttachment).toBe("platform");

		expect(navigatorCredentials.type).toBe("public-key");

		expect(typeof navigatorCredentials.id).toBe("string");

		expect(typeof navigatorCredentials.rawId).toBe("string");

		expect(navigatorCredentials.response.publicKeyAlgorithm).toBe(-7);

		expect(navigatorCredentials.response.transports[0]).toBe("internal");
		expect(navigatorCredentials.clientExtensionResults).toEqual({
			credProps: { rk: true },
		});

		const authenticatorData = new Uint8Array(
			converterService.base64UrlToArrayBuffer(
				navigatorCredentials.response.authenticatorData,
			),
		);
		expect(authenticatorData[32] & 0x40).toBe(0x40);
		expect(Array.from(authenticatorData.slice(37, 53))).toEqual([
			0x50, 0x73, 0x6f, 0x6e, 0x6f, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		]);

		const credentialId = new Uint8Array(
			converterService.base64UrlToArrayBuffer(navigatorCredentials.rawId),
		);
		const credentialIdLength = new DataView(
			authenticatorData.buffer,
			authenticatorData.byteOffset + 53,
			2,
		).getUint16(0, false);
		expect(credentialIdLength).toBe(credentialId.length);
		expect(
			Array.from(authenticatorData.slice(55, 55 + credentialIdLength)),
		).toEqual(Array.from(credentialId));

		const cosePublicKey = authenticatorData.slice(55 + credentialIdLength);
		const decodedCosePublicKey = converterService.cborDecode(
			cosePublicKey.buffer,
		);
		expect(decodedCosePublicKey[1]).toBe(2);
		expect(decodedCosePublicKey[3]).toBe(-7);
		expect(decodedCosePublicKey[-1]).toBe(1);
		expect(decodedCosePublicKey[-2]).toHaveLength(32);
		expect(decodedCosePublicKey[-3]).toHaveLength(32);

		const attestationObject = converterService.cborDecode(
			converterService.base64UrlToArrayBuffer(
				navigatorCredentials.response.attestationObject,
			),
		);
		expect(attestationObject.fmt).toBe("none");
		expect(attestationObject.attStmt).toEqual({});
		expect(Array.from(attestationObject.authData)).toEqual(
			Array.from(authenticatorData),
		);

		const publicKey = converterService.base64UrlToArrayBuffer(
			navigatorCredentials.response.publicKey,
		);
		expect(publicKey.byteLength).toBe(91);

		expect(datastorePasswordService.savePasskey.mock.calls.length).toEqual(1); // called once
		expect(
			converterService.arrayBufferToBase64Url(
				converterService.fromHex(
					datastorePasswordService.savePasskey.mock.calls[0][0],
				),
			),
		).toEqual(navigatorCredentials.id); // first argument the id
		expect(datastorePasswordService.savePasskey.mock.calls[0][1]).toEqual(
			"webauthn.io",
		); // first argument the rp id
		// expect(datastorePasswordService.savePasskey.mock.calls[0][2]).toEqual(/**/) // the public key
		// expect(datastorePasswordService.savePasskey.mock.calls[0][3]).toEqual(/**/) // the private key
		expect(datastorePasswordService.savePasskey.mock.calls[0][4]).toEqual(
			"YXNkYXNk",
		); // user handle
		expect(datastorePasswordService.savePasskey.mock.calls[0][5]).toEqual(
			"Display Name",
		); // user handle
		expect(datastorePasswordService.savePasskey.mock.calls[0][6]).toEqual({
			name: "ECDSA",
			namedCurve: "P-256",
		}); // algorithm
	});

	it("creates assertion-form authenticator data for navigator.credentials.get", async () => {
		window.fetch = mockFetch();
		user.isLoggedIn = jest.fn(() => true);
		notificationBarService.create = jest.fn((_title, _description, buttons) =>
			buttons[0].onClick(),
		);

		const rawId = new Uint8Array([
			0xde, 0xad, 0xbe, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
			0x10, 0x32, 0x54, 0x76,
		]);
		const keyPair = await crypto.subtle.generateKey(
			{
				name: "ECDSA",
				namedCurve: "P-256",
			},
			true,
			["sign", "verify"],
		);
		const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
		const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
		storage.where = jest.fn().mockResolvedValue([
			{
				type: "passkey",
				urlfilter: `webauthn.io#${converterService.toHex(rawId)}`,
				autosubmit: true,
				secret_id: "secret-id",
				secret_key: "secret-key",
			},
		]);
		secretService.readSecret = jest.fn().mockResolvedValue({
			passkey_id: converterService.toHex(rawId),
			passkey_public_key: publicKey,
			passkey_private_key: privateKey,
			passkey_algorithm: {
				name: "ECDSA",
				namedCurve: "P-256",
			},
			passkey_user_handle: "dXNlci1oYW5kbGU",
			read_count: 0x89abcdef,
		});

		let signedData;
		const originalSign = crypto.subtle.sign.bind(crypto.subtle);
		const signSpy = jest
			.spyOn(crypto.subtle, "sign")
			.mockImplementation((algorithm, key, data) => {
				signedData = new Uint8Array(data);
				return originalSign(algorithm, key, data);
			});

		const response = await new Promise((resolve) => {
			expect(
				passkeyService.onNavigatorCredentialsGet(
					{
						data: {
							options: {
								publicKey: {
									rpId: "webauthn.io",
									challenge: "dGVzdC1jaGFsbGVuZ2U",
									allowCredentials: [
										{
											id: converterService.arrayBufferToBase64Url(rawId),
											type: "public-key",
										},
									],
									userVerification: "preferred",
								},
							},
							origin: "https://webauthn.io",
							eventId: "event-id",
						},
					},
					null,
					resolve,
				),
			).toBe(true);
		});
		signSpy.mockRestore();
		expect(response.event).toBe("navigator-credentials-get-response");
		expect(response.data.eventId).toBe("event-id");
		const credential = response.data.credential;

		expect(credential.type).toBe("public-key");
		expect(credential.id).toBe(converterService.arrayBufferToBase64Url(rawId));
		expect(credential.rawId).toBe(credential.id);
		expect(credential.response).toEqual(
			expect.objectContaining({
				authenticatorData: expect.any(String),
				clientDataJSON: expect.any(String),
				signature: expect.any(String),
				userHandle: "dXNlci1oYW5kbGU",
			}),
		);

		const authenticatorData = new Uint8Array(
			converterService.base64UrlToArrayBuffer(
				credential.response.authenticatorData,
			),
		);
		const parsedAuthenticatorData =
			parseAssertionAuthenticatorData(authenticatorData);
		expect(authenticatorData).toHaveLength(37);
		expect(converterService.toHex(parsedAuthenticatorData.rpIdHash)).toBe(
			"74a6ea9213c99c2f74b22492b320cf40262a94c1a950a0397f29250b60841ef0",
		);
		expect(parsedAuthenticatorData.flags & 0x01).toBe(0x01);
		expect(parsedAuthenticatorData.flags & 0x04).toBe(0x04);
		expect(parsedAuthenticatorData.flags & 0x40).toBe(0);
		expect(parsedAuthenticatorData.signCount).toBe(0x89abcdef);
		expect(parsedAuthenticatorData.attestedCredentialData).toBeNull();

		const aaguid = new Uint8Array(16);
		aaguid.set([0x50, 0x73, 0x6f, 0x6e, 0x6f]);
		expect(containsBytes(authenticatorData, aaguid)).toBe(false);
		expect(containsBytes(authenticatorData, rawId)).toBe(false);
		expect(
			containsBytes(authenticatorData, cosePublicKeyFromJwk(publicKey)),
		).toBe(false);

		const clientDataJSON = new Uint8Array(
			converterService.base64UrlToArrayBuffer(
				credential.response.clientDataJSON,
			),
		);
		const clientDataJSONHash = new Uint8Array(
			await crypto.subtle.digest("SHA-256", clientDataJSON),
		);
		expect(Array.from(signedData)).toEqual([
			...authenticatorData,
			...clientDataJSONHash,
		]);
	});
});
