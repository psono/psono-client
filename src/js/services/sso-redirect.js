import converter from "./converter";
import storage from "./storage";

const PENDING_SSO_REDIRECT_KEY_PREFIX = "pending-sso-redirect-";
const PENDING_SSO_REDIRECT_LIFETIME = 60 * 60 * 1000;
const SSO_REDIRECT_PATTERN =
	/^#!\/(saml|oidc)\/token\/([0-9a-f]{32})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const consumingStates = new Set();

function getPendingKey(state) {
	return PENDING_SSO_REDIRECT_KEY_PREFIX + state;
}

async function removeExpired(database) {
	const keys = await database.keys();
	await Promise.all(
		keys
			.filter(
				(key) =>
					typeof key === "string" &&
					key.startsWith(PENDING_SSO_REDIRECT_KEY_PREFIX),
			)
			.map(async (key) => {
				const pending = await database.getItem(key);
				if (!pending || pending.expiresAt <= Date.now()) {
					await database.removeItem(key);
				}
			}),
	);
}

async function createPending(type) {
	const randomBytes = new Uint8Array(16);
	globalThis.crypto.getRandomValues(randomBytes);
	const state = converter.toHex(randomBytes);
	const pending = {
		state,
		type,
		expiresAt: Date.now() + PENDING_SSO_REDIRECT_LIFETIME,
	};
	const database = storage.get("various");

	await removeExpired(database);
	await database.setItem(getPendingKey(state), pending);
	return state;
}

function parse(url) {
	let parsedUrl;
	try {
		parsedUrl = new URL(url);
	} catch {
		return null;
	}

	if (
		parsedUrl.origin !== "https://psono.com" ||
		parsedUrl.pathname !== "/redirect" ||
		parsedUrl.search !== ""
	) {
		return null;
	}

	const match = parsedUrl.hash.match(SSO_REDIRECT_PATTERN);
	if (!match) {
		return null;
	}

	return {
		type: match[1],
		state: match[2],
		tokenId: match[3],
	};
}

async function consume(url) {
	const redirect = parse(url);
	if (!redirect || consumingStates.has(redirect.state)) {
		return null;
	}

	consumingStates.add(redirect.state);
	try {
		const pendingKey = getPendingKey(redirect.state);
		const pending = await storage.get("various").getItem(pendingKey);
		if (!pending) {
			return null;
		}

		if (pending.expiresAt <= Date.now()) {
			await storage.get("various").removeItem(pendingKey);
			return null;
		}

		if (pending.type !== redirect.type || pending.state !== redirect.state) {
			return null;
		}

		await storage.get("various").removeItem(pendingKey);
		return redirect;
	} finally {
		consumingStates.delete(redirect.state);
	}
}

const ssoRedirectService = {
	createPending,
	parse,
	consume,
};

export default ssoRedirectService;
