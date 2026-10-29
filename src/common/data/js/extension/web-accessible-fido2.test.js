describe("web-accessible FIDO2 bridge", () => {
	it.each([
		false,
		true,
	])("preserves native platform availability (%s), including after reinjection", async (available) => {
		class PublicKeyCredential {}
		const native = jest.fn(function () {
			expect(this).toBe(PublicKeyCredential);
			return Promise.resolve(available);
		});
		PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = native;
		Object.defineProperty(window, "PublicKeyCredential", {
			configurable: true,
			value: PublicKeyCredential,
		});
		jest.isolateModules(() => require("./web-accessible-fido2"));
		const original =
			PublicKeyCredential.psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable;
		await expect(
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
		).resolves.toBe(true);
		await expect(original()).resolves.toBe(available);
		jest.isolateModules(() => require("./web-accessible-fido2"));
		expect(
			PublicKeyCredential.psonoOriginalIsUserVerifyingPlatformAuthenticatorAvailable,
		).toBe(original);
		await expect(original()).resolves.toBe(available);
	});

	it.each([
		"create",
		"get",
	])("delegates PRF %s requests directly to the native authenticator", async (method) => {
		const credential = { native: true };
		const native = jest.fn(async () => credential);
		Object.defineProperty(window, "PublicKeyCredential", {
			configurable: true,
			value: class PublicKeyCredential {},
		});
		Object.defineProperty(navigator, "credentials", {
			configurable: true,
			value: { create: native, get: native },
		});
		window.postMessage = jest.fn();
		jest.isolateModules(() => require("./web-accessible-fido2"));
		const options = {
			publicKey: {
				challenge: new Uint8Array([1]),
				userVerification: "required",
				extensions: { prf: { eval: { first: new Uint8Array(32) } } },
			},
		};
		await expect(navigator.credentials[method](options)).resolves.toBe(
			credential,
		);
		expect(native).toHaveBeenCalledWith(options);
		expect(window.postMessage).not.toHaveBeenCalled();
	});

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
