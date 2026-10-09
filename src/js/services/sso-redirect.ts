import type localforage from "localforage";
import converter from "./converter";
import storage from "./storage";
import type {
	ParsedSsoRedirect,
	PendingSsoRedirect,
	SsoType,
} from "../../types/utilities";

const PENDING_SSO_REDIRECT_KEY_PREFIX = "pending-sso-redirect-";
const PENDING_SSO_REDIRECT_LIFETIME = 60 * 60 * 1000;
const SSO_REDIRECT_PATTERN =
	/^#!\/(saml|oidc)\/token\/([0-9a-f]{32})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const consumingStates = new Set<string>();

function getPendingKey(state: string): string {
	return PENDING_SSO_REDIRECT_KEY_PREFIX + state;
}

async function removeExpired(
	database: ReturnType<typeof localforage.createInstance>,
): Promise<void> {
	const keys = await database.keys();
	await Promise.all(
		keys
			.filter(
				(key) =>
					typeof key === "string" &&
					key.startsWith(PENDING_SSO_REDIRECT_KEY_PREFIX),
			)
			.map(async (key) => {
				const pending = await database.getItem<PendingSsoRedirect>(key);
				if (!pending || pending.expiresAt <= Date.now()) {
					await database.removeItem(key);
				}
			}),
	);
}

async function createPending(type: SsoType): Promise<string> {
	const randomBytes = new Uint8Array(16);
	globalThis.crypto.getRandomValues(randomBytes);
	const state = converter.toHex(randomBytes);
	const pending: PendingSsoRedirect = {
		state,
		type,
		expiresAt: Date.now() + PENDING_SSO_REDIRECT_LIFETIME,
	};
	const database = storage.get("various");

	await removeExpired(database);
	await database.setItem(getPendingKey(state), pending);
	return state;
}

function parse(
	url: string,
	returnToUrl = "https://psono.com/redirect",
): ParsedSsoRedirect | null {
	let parsedUrl;
	let expectedUrl;
	try {
		parsedUrl = new URL(url);
		expectedUrl = new URL(returnToUrl);
	} catch {
		return null;
	}

	if (
		!["http:", "https:"].includes(expectedUrl.protocol) ||
		parsedUrl.origin !== expectedUrl.origin ||
		parsedUrl.pathname !== expectedUrl.pathname ||
		parsedUrl.username !== "" ||
		parsedUrl.password !== "" ||
		parsedUrl.search !== "" ||
		!parsedUrl.hash.startsWith(expectedUrl.hash)
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

async function consume(
	url: string,
	returnToUrl?: string,
): Promise<ParsedSsoRedirect | null> {
	const redirect = parse(url, returnToUrl);
	if (!redirect || consumingStates.has(redirect.state)) {
		return null;
	}

	consumingStates.add(redirect.state);
	try {
		const pendingKey = getPendingKey(redirect.state);
		const pending = await storage
			.get("various")
			.getItem<PendingSsoRedirect>(pendingKey);
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
