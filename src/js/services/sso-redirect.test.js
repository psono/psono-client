import ssoRedirect from "./sso-redirect";
import storage from "./storage";

describe("Service: SSO redirect test suite", () => {
	const state = "000102030405060708090a0b0c0d0e0f";
	const tokenId = "123e4567-e89b-42d3-a456-426614174000";
	let pending;
	let database;

	beforeEach(() => {
		pending = new Map();
		database = {
			keys: jest.fn(() => Promise.resolve([...pending.keys()])),
			setItem: jest.fn((key, value) => {
				pending.set(key, value);
				return Promise.resolve(value);
			}),
			getItem: jest.fn((key) => Promise.resolve(pending.get(key))),
			removeItem: jest.fn((key) => {
				pending.delete(key);
				return Promise.resolve();
			}),
		};
		jest.spyOn(storage, "get").mockReturnValue(database);
		jest
			.spyOn(globalThis.crypto, "getRandomValues")
			.mockImplementation((bytes) => bytes.set([...Array(16).keys()]));
		jest.spyOn(Date, "now").mockReturnValue(1000);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("creates and persists an unpredictable pending redirect", async () => {
		await expect(ssoRedirect.createPending("saml")).resolves.toBe(state);
		expect(database.setItem).toHaveBeenCalledWith(
			`pending-sso-redirect-${state}`,
			{
				state,
				type: "saml",
				expiresAt: 3601000,
			},
		);
	});

	it("only parses exact Psono SSO callback URLs", () => {
		expect(
			ssoRedirect.parse(
				`https://psono.com/redirect#!/oidc/token/${state}/${tokenId}`,
			),
		).toEqual({ type: "oidc", state, tokenId });
		expect(
			ssoRedirect.parse(
				`https://attacker.example/redirect#!/oidc/token/${state}/${tokenId}`,
			),
		).toBeNull();
		expect(
			ssoRedirect.parse(`https://psono.com/redirect#!/oidc/token/${tokenId}`),
		).toBeNull();
	});

	it.each([
		"https://vault.example",
		"https://vault.example:8443",
		"http://localhost:9000",
	])("accepts the expected web-client callback at %s", async (origin) => {
		const returnToUrl = `${origin}/psono/index.html#!/saml/token/`;
		const url = `${returnToUrl}${state}/${tokenId}`;
		await ssoRedirect.createPending("saml");

		expect(ssoRedirect.parse(url)).toBeNull();
		await expect(ssoRedirect.consume(url, returnToUrl)).resolves.toEqual({
			type: "saml",
			state,
			tokenId,
		});
		await expect(ssoRedirect.consume(url, returnToUrl)).resolves.toBeNull();
	});

	it("rejects web callbacks outside the expected origin, path and protocol", async () => {
		const returnToUrl = "https://vault.example/psono/index.html#!/saml/token/";
		const fragment = `#!/saml/token/${state}/${tokenId}`;
		await ssoRedirect.createPending("saml");

		for (const url of [
			`https://attacker.example/psono/index.html${fragment}`,
			`https://vault.example.attacker.example/psono/index.html${fragment}`,
			`http://vault.example/psono/index.html${fragment}`,
			`https://vault.example:8443/psono/index.html${fragment}`,
			`https://user@vault.example/psono/index.html${fragment}`,
			`https://vault.example/index.html${fragment}`,
			`https://vault.example/psono/index.html-attacker${fragment}`,
			`https://vault.example/psono/index.html?next=attacker${fragment}`,
			`https://vault.example/psono/index.html#!/oidc/token/${state}/${tokenId}`,
			`https://vault.example/psono/index.html#!/saml/token/${tokenId}`,
			`${returnToUrl}${state}/${tokenId}/extra`,
		]) {
			await expect(ssoRedirect.consume(url, returnToUrl)).resolves.toBeNull();
		}
		expect(database.removeItem).not.toHaveBeenCalled();
	});

	it("consumes a matching redirect only once", async () => {
		await ssoRedirect.createPending("oidc");
		const url = `https://psono.com/redirect#!/oidc/token/${state}/${tokenId}`;

		await expect(ssoRedirect.consume(url)).resolves.toEqual({
			type: "oidc",
			state,
			tokenId,
		});
		await expect(ssoRedirect.consume(url)).resolves.toBeNull();
		expect(database.removeItem).toHaveBeenCalledTimes(1);
	});

	it("allows overlapping login attempts with different state", async () => {
		await ssoRedirect.createPending("saml");
		globalThis.crypto.getRandomValues.mockImplementation((bytes) =>
			bytes.fill(255),
		);
		const secondState = await ssoRedirect.createPending("oidc");

		await expect(
			ssoRedirect.consume(
				`https://psono.com/redirect#!/saml/token/${state}/${tokenId}`,
			),
		).resolves.toEqual({ type: "saml", state, tokenId });
		await expect(
			ssoRedirect.consume(
				`https://psono.com/redirect#!/oidc/token/${secondState}/${tokenId}`,
			),
		).resolves.toEqual({ type: "oidc", state: secondState, tokenId });
	});

	it("removes expired pending redirects when starting a new flow", async () => {
		pending.set("pending-sso-redirect-expired", {
			expiresAt: 1000,
			state: "expired",
			type: "saml",
		});
		pending.set("unrelated", { expiresAt: 1000 });

		await ssoRedirect.createPending("oidc");

		expect(pending.has("pending-sso-redirect-expired")).toBe(false);
		expect(pending.has("unrelated")).toBe(true);
	});

	it("serializes simultaneous attempts to consume the same state", async () => {
		await ssoRedirect.createPending("saml");
		const url = `https://psono.com/redirect#!/saml/token/${state}/${tokenId}`;

		const results = await Promise.all([
			ssoRedirect.consume(url),
			ssoRedirect.consume(url),
		]);

		expect(results.filter(Boolean)).toHaveLength(1);
	});

	it("does not consume the pending redirect when state or type differs", async () => {
		await ssoRedirect.createPending("saml");

		await expect(
			ssoRedirect.consume(
				`https://psono.com/redirect#!/oidc/token/${state}/${tokenId}`,
			),
		).resolves.toBeNull();
		await expect(
			ssoRedirect.consume(
				`https://psono.com/redirect#!/saml/token/ffffffffffffffffffffffffffffffff/${tokenId}`,
			),
		).resolves.toBeNull();
		expect(database.removeItem).not.toHaveBeenCalled();
	});

	it("rejects and removes expired pending redirects", async () => {
		await ssoRedirect.createPending("saml");
		Date.now.mockReturnValue(3601001);

		await expect(
			ssoRedirect.consume(
				`https://psono.com/redirect#!/saml/token/${state}/${tokenId}`,
			),
		).resolves.toBeNull();
		expect(database.removeItem).toHaveBeenCalledWith(
			`pending-sso-redirect-${state}`,
		);
	});
});
