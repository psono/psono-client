describe("web-accessible FIDO2 bridge", () => {
	it("serializes an emulated registration credential without native brand checks", async () => {
		class PublicKeyCredential {
			toJSON() {
				throw new TypeError("Illegal invocation");
			}
		}

		Object.defineProperty(window, "PublicKeyCredential", {
			configurable: true,
			value: PublicKeyCredential,
		});
		Object.defineProperty(window, "AuthenticatorAttestationResponse", {
			configurable: true,
			value: class AuthenticatorAttestationResponse {},
		});
		Object.defineProperty(navigator, "credentials", {
			configurable: true,
			value: {
				create: jest.fn(),
				get: jest.fn(),
			},
		});
		window.postMessage = jest.fn();

		require("./web-accessible-fido2");

		const credentialPromise = navigator.credentials.create({
			publicKey: {
				challenge: new Uint8Array([1]).buffer,
				user: { id: new Uint8Array([2]).buffer },
			},
		});
		const eventId = window.postMessage.mock.calls[0][0].data.eventId;
		const serializedCredential = {
			id: "AQI",
			rawId: "AQI",
			response: {
				attestationObject: "AwQ",
				clientDataJSON: "BQY",
				transports: ["internal"],
				publicKeyAlgorithm: -7,
				publicKey: "Bwg",
				authenticatorData: "CQo",
			},
			type: "public-key",
			clientExtensionResults: { credProps: { rk: true } },
			authenticatorAttachment: "platform",
		};

		window.dispatchEvent(
			new MessageEvent("message", {
				origin: window.location.origin,
				data: {
					event: "navigator-credentials-create-response",
					data: { eventId, credential: serializedCredential },
				},
			}),
		);

		const credential = await credentialPromise;
		expect(credential).toBeInstanceOf(PublicKeyCredential);
		expect(credential.getClientExtensionResults()).toEqual({
			credProps: { rk: true },
		});
		expect(JSON.parse(JSON.stringify(credential))).toEqual(
			serializedCredential,
		);
	});
});
