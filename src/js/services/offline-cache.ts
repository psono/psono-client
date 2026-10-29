/** Account-scoped, encrypted, read-only network-fallback cache. */
import action from "../actions/bound-action-creators";
import apiClient from "./api-client";
import storage from "./storage";
import { getStore } from "./store";
import vaultLock from "./vault-lock";
import type { CacheMode } from "../../types/cache";
import { isOfflineError } from "../../types/cache";

export type CacheResourceKind = "datastore" | "entry" | "cache";
interface ResourceStatus {
	kind: CacheResourceKind;
	refreshing: boolean;
	cached: boolean;
	offline: boolean;
	retry?: () => void;
}
const resources = new Map<symbol, ResourceStatus>();
const statusListeners = new Set<() => void>();
function notifyStatus() {
	for (const listener of statusListeners) listener();
}

export const cacheStatus = {
	register(kind: CacheResourceKind, retry?: () => void) {
		const id = Symbol(kind);
		resources.set(id, {
			kind,
			retry,
			refreshing: false,
			cached: false,
			offline: false,
		});
		return {
			update(state: Pick<ResourceStatus, "refreshing" | "cached" | "offline">) {
				const resource = resources.get(id);
				if (resource) {
					Object.assign(resource, state);
					notifyStatus();
				}
			},
			dispose() {
				if (resources.delete(id)) notifyStatus();
			},
		};
	},
	getSnapshot() {
		const values = Array.from(resources.values());
		return {
			refreshing: values.some((resource) => resource.refreshing),
			entryRefreshing: values.some(
				(resource) => resource.kind === "entry" && resource.refreshing,
			),
			datastoreRefreshing: values.some(
				(resource) => resource.kind === "datastore" && resource.refreshing,
			),
			offline: values.some((resource) => resource.offline),
			usingCache: values.some((resource) => resource.cached),
		};
	},
	retryAll() {
		for (const resource of Array.from(resources.values()))
			if (!resource.refreshing) resource.retry?.();
	},
	retryOffline() {
		for (const resource of Array.from(resources.values()))
			if (resource.offline && !resource.refreshing) resource.retry?.();
	},
	subscribe(listener: () => void) {
		statusListeners.add(listener);
		return () => {
			statusListeners.delete(listener);
		};
	},
	publishConnectionChange: notifyStatus,
};

export const CACHE_REFRESH_DELAY = 300;
export interface CachedResourceState {
	refreshing: boolean;
	cached: boolean;
	hasData: boolean;
	error: unknown;
}
interface DisplayOptions<T> {
	kind: CacheResourceKind;
	read: (mode: CacheMode) => Promise<T>;
	canReadCache: () => boolean;
	scope: () => string;
	setCacheActive: (active: boolean, confirmedOffline?: boolean) => void;
	onDispose?: () => void;
	onData: (data: T, source: "cache" | "server") => void;
	onError?: (error: unknown, retainedCache: boolean) => void;
	onState?: (state: CachedResourceState) => void;
	delay?: number;
}

/** Browsing keeps its cached snapshot separate from live verification. */
export class CachedResource<T> {
	data: T | undefined;
	refreshComplete: Promise<void> = Promise.resolve();
	private generation = 0;
	private disposed = false;
	private refreshing = false;
	private ready: Promise<void> = Promise.resolve();
	private resolveReady: (() => void) | undefined;
	private cancelDelay: (() => void) | undefined;
	private status: ReturnType<typeof cacheStatus.register>;
	constructor(private options: DisplayOptions<T>) {
		this.status = cacheStatus.register(options.kind, () => {
			void this.load();
		});
	}
	load(): Promise<void> {
		if (this.disposed) return Promise.resolve();
		if (this.refreshing) return this.ready;
		const generation = ++this.generation;
		const scope = this.options.scope();
		this.ready = new Promise((resolve) => {
			this.resolveReady = resolve;
		});
		this.refreshComplete = this.run(generation, scope);
		return this.ready;
	}
	private current(generation: number, scope: string) {
		return (
			!this.disposed &&
			generation === this.generation &&
			scope === this.options.scope()
		);
	}
	private update(
		refreshing: boolean,
		cached: boolean,
		offline: boolean,
		error: unknown = null,
	) {
		if (this.disposed) return;
		this.refreshing = refreshing;
		this.status.update({ refreshing, cached, offline });
		this.options.onState?.({
			refreshing,
			cached,
			hasData: this.data !== undefined,
			error,
		});
	}
	private async run(generation: number, scope: string) {
		if (!this.options.canReadCache()) this.data = undefined;
		this.update(true, this.data !== undefined, false);
		if (this.data !== undefined) this.options.setCacheActive(true, false);
		try {
			let foundCache = false;
			if (this.options.canReadCache()) {
				try {
					const cached = await this.options.read("cache-only");
					if (!this.current(generation, scope)) return;
					if (this.options.canReadCache()) {
						this.data = cached;
						foundCache = true;
						this.update(true, true, false);
						this.options.setCacheActive(true, false);
						this.options.onData(cached, "cache");
					}
				} catch {
					/* Missing/corrupt cache must not block the server read. */
				}
			}
			if (!this.current(generation, scope)) return;
			if (this.data !== undefined) this.resolveReady?.();
			if (foundCache)
				await new Promise<void>((resolve) => {
					const timer = setTimeout(
						resolve,
						this.options.delay ?? CACHE_REFRESH_DELAY,
					);
					this.cancelDelay = () => {
						clearTimeout(timer);
						resolve();
					};
				});
			this.cancelDelay = undefined;
			if (!this.current(generation, scope)) return;
			const fresh = await this.options.read("refresh");
			if (!this.current(generation, scope)) return;
			this.data = fresh;
			this.update(false, false, false);
			this.options.setCacheActive(false);
			this.options.onData(fresh, "server");
		} catch (error) {
			if (!this.current(generation, scope)) return;
			let retain =
				this.data !== undefined &&
				this.options.canReadCache() &&
				isOfflineError(error);
			// Recheck expiry and completeness after the request timeout.
			if (retain) {
				try {
					await this.options.read("cache-only");
				} catch {
					retain = false;
				}
			}
			if (!this.current(generation, scope)) return;
			if (!retain) this.data = undefined;
			this.update(false, retain, isOfflineError(error), error);
			if (isOfflineError(error)) this.options.setCacheActive(true, true);
			else this.options.setCacheActive(false);
			this.options.onError?.(error, retain);
		} finally {
			if (!this.current(generation, scope) && !this.disposed) {
				this.data = undefined;
				this.update(false, false, false);
			}
			this.resolveReady?.();
		}
	}
	dispose() {
		this.disposed = true;
		this.generation++;
		this.data = undefined;
		this.cancelDelay?.();
		this.resolveReady?.();
		this.status.dispose();
		this.options.onDispose?.();
	}
}

export function getDisplayScope() {
	const state = getStore().getState();
	return `${vaultLock.getAccountId()}:${vaultLock.getRevision()}:${state.server.url}:${state.user.token}`;
}
export function createDisplayResource<T>(options: {
	kind: CacheResourceKind;
	read: (mode: CacheMode) => Promise<T>;
	onData: (data: T, source: "cache" | "server") => void;
	onError?: (error: unknown, retained: boolean) => void;
	onState?: (state: CachedResourceState) => void;
	scope?: () => string;
}) {
	return new CachedResource<T>({
		...options,
		scope: options.scope ?? getDisplayScope,
		canReadCache: () => offlineCache.canUse(),
		setCacheActive: (active, confirmed = false) => {
			if (active) offlineCache.markOffline(confirmed);
			else offlineCache.markOnline();
		},
		onDispose: () => offlineCache.releaseCacheDisplay(),
	});
}

interface CachedResponse {
	key: string;
	value: unknown;
	validatedAt: number;
}

export interface OfflineWriteError {
	data: { error: string[] };
}
export interface CacheMetadata {
	id?: string;
	write_date?: string;
	shares?: CacheMetadata[];
	secrets?: CacheMetadata[];
}

function isActive() {
	return (
		getStore().getState().client.offlineMode === true ||
		cacheStatus.getSnapshot().usingCache
	);
}
function canUse() {
	return (
		vaultLock.getConfiguration()?.enabled === true &&
		!!vaultLock.getKey() &&
		!vaultLock.isBlocked() &&
		getStore().getState().user.isLoggedIn &&
		getStore().getState().server.complianceDisableOfflineMode !== true
	);
}
function cacheable(url: string, method: string) {
	if (method !== "GET") return false;
	const base = getStore().getState().server.url;
	return (
		url.startsWith(base) &&
		/^\/(datastore|secret|share)\//.test(url.slice(base.length))
	);
}

async function set(url: string, method: string, data: unknown) {
	if (!canUse() || !cacheable(url, method)) return;
	const id = vaultLock.getAccountId();
	const generation = vaultLock.getRevision();
	if (url.endsWith("/share/right/")) {
		const previous = await storage.findKey<CachedResponse>(
			"offline-cache",
			url.toLowerCase(),
		);
		if (previous && JSON.stringify(previous.value) !== JSON.stringify(data))
			await clear();
	}
	if (
		!canUse() ||
		id !== vaultLock.getAccountId() ||
		generation !== vaultLock.getRevision()
	)
		return;
	await storage.upsert("offline-cache", {
		key: url.toLowerCase(),
		value: data,
		validatedAt: Date.now(),
	});
}

async function get<T = Record<string, unknown>>(
	url: string,
	method: string,
): Promise<T | null> {
	if (!canUse() || !cacheable(url, method)) return null;
	const entry = await storage.findKey<CachedResponse>(
		"offline-cache",
		url.toLowerCase(),
	);
	const maximumAge =
		getStore().getState().server.complianceMaxOfflineCacheTimeValid;
	if (
		!entry ||
		!Number.isFinite(entry.validatedAt) ||
		!Number.isFinite(maximumAge) ||
		maximumAge <= 0 ||
		Date.now() - entry.validatedAt > maximumAge * 1000 ||
		!canUse()
	)
		return null;
	return entry.value as T;
}

let confirmedOffline: boolean | undefined;
function isConnectionOffline() {
	return confirmedOffline === true;
}
function markOffline(confirmed = true) {
	if (confirmed) confirmedOffline = true;
	else if (confirmedOffline === undefined)
		confirmedOffline = getStore().getState().client.offlineMode === true;
	if (
		confirmed &&
		canUse() &&
		getStore().getState().client.offlineMode !== true
	) {
		action().enableOfflineMode();
		cacheStatus.publishConnectionChange();
	}
}
function markOnline() {
	confirmedOffline = false;
	cacheStatus.retryOffline();
	if (cacheStatus.getSnapshot().usingCache) {
		return;
	}
	if (getStore().getState().client.offlineMode === true) {
		action().disableOfflineMode();
		cacheStatus.publishConnectionChange();
	}
}
function releaseCacheDisplay() {
	if (
		confirmedOffline === false &&
		!cacheStatus.getSnapshot().usingCache &&
		getStore().getState().client.offlineMode === true
	) {
		action().disableOfflineMode();
		cacheStatus.publishConnectionChange();
	}
}
async function clear() {
	cacheGeneration++;
	lastUpdate = 0;
	try {
		await storage.removeAll("offline-cache");
	} finally {
		cacheGeneration++;
		lastUpdate = 0;
	}
}
async function remove(url: string) {
	await storage.remove("offline-cache", url.toLowerCase());
}

/** Only enumerate endpoint names; the settings page never needs secret data. */
async function listEndpoints(): Promise<string[]> {
	if (!canUse()) return [];
	const id = vaultLock.getAccountId();
	const revision = vaultLock.getRevision();
	const base = getStore().getState().server.url;
	const keys = await storage.keys("offline-cache");
	if (
		!canUse() ||
		id !== vaultLock.getAccountId() ||
		revision !== vaultLock.getRevision()
	)
		return [];
	return keys
		.filter((key) => cacheable(key, "GET"))
		.map((key) => key.slice(base.length))
		.sort();
}

async function refreshEndpoint(endpoint: string): Promise<void> {
	if (!canUse()) throw new Error("OFFLINE_CACHE_UNAVAILABLE");
	const id = vaultLock.getAccountId();
	const revision = vaultLock.getRevision();
	const endpoints = await listEndpoints();
	if (
		!canUse() ||
		id !== vaultLock.getAccountId() ||
		revision !== vaultLock.getRevision() ||
		!endpoints.includes(endpoint)
	) {
		throw new Error("OFFLINE_CACHE_ENTRY_UNAVAILABLE");
	}
	const { token, sessionSecretKey } = getStore().getState().user;
	await apiClient.refreshOfflineCacheEntry(token, sessionSecretKey, endpoint);
}

let updating: Promise<void> | undefined;
let updatingAccount: string | undefined;
let lastUpdate = 0;
let lastUpdateAccount: string | undefined;
let cacheGeneration = 0;
let deferredSync = false;
let deferredTimer: ReturnType<typeof setTimeout> | undefined;

// Rendering/verification gets priority over the complete offline download.
// Start the postponed sync after the visible datastore/entry has settled.
cacheStatus.subscribe(() => {
	const status = cacheStatus.getSnapshot();
	if (
		!deferredSync ||
		status.datastoreRefreshing ||
		status.entryRefreshing ||
		status.offline ||
		deferredTimer
	)
		return;
	deferredTimer = setTimeout(() => {
		deferredTimer = undefined;
		deferredSync = false;
		void incrementalUpdate().catch(() => {});
	}, 300);
});

/** Metadata endpoints match psono-app. Revalidate unchanged entries, fetch only
 * changed resources, and prune entries that disappeared or lost their grants. */
function incrementalUpdate(force = false): Promise<void> {
	if (!canUse()) return Promise.resolve();
	const foreground = cacheStatus.getSnapshot();
	if (
		!force &&
		(foreground.datastoreRefreshing || foreground.entryRefreshing)
	) {
		deferredSync = true;
		return Promise.resolve();
	}
	const id = vaultLock.getAccountId();
	if (updating && updatingAccount === id) return updating;
	if (
		!force &&
		lastUpdateAccount === id &&
		Date.now() - lastUpdate < 60 * 60 * 1000
	)
		return Promise.resolve();
	updatingAccount = id;
	const status = cacheStatus.register("cache");
	status.update({ refreshing: true, cached: false, offline: false });
	const generation = vaultLock.getRevision();
	let cacheSnapshot = cacheGeneration;
	const state = getStore().getState();
	const { token, sessionSecretKey } = state.user;
	const base = state.server.url;
	const current = () =>
		canUse() &&
		id === vaultLock.getAccountId() &&
		generation === vaultLock.getRevision() &&
		cacheSnapshot === cacheGeneration;
	updating = (async () => {
		const keep = new Set<string>([
			`${base}/datastore/`.toLowerCase(),
			`${base}/share/right/`.toLowerCase(),
		]);
		const shares = new Set<string>();
		const refresh = async (
			kind: "datastore" | "share" | "secret",
			resourceId: string,
			metadata: CacheMetadata,
		) => {
			if (!current()) throw new Error("VAULT_SESSION_CHANGED");
			const url = `${base}/${kind}/${resourceId}/`.toLowerCase();
			keep.add(url);
			const cached = await get<{ data: { write_date?: string } }>(url, "GET");
			if (!current()) throw new Error("VAULT_SESSION_CHANGED");
			const cachedDate = Date.parse(cached?.data?.write_date ?? "");
			const liveDate = Date.parse(metadata.write_date ?? "");
			if (
				cached &&
				Number.isFinite(cachedDate) &&
				Number.isFinite(liveDate) &&
				cached.data.write_date === metadata.write_date
			) {
				await set(url, "GET", cached);
			} else if (kind === "datastore")
				await apiClient.readDatastore(token, sessionSecretKey, resourceId);
			else if (kind === "share")
				await apiClient.readShare(token, sessionSecretKey, resourceId);
			else await apiClient.readSecret(token, sessionSecretKey, resourceId);
			if (isConnectionOffline())
				throw new Error("OFFLINE_CACHE_REQUIRES_CONNECTION");
		};
		const visit = async (metadata: CacheMetadata) => {
			for (const share of metadata.shares ?? []) {
				if (!share.id || shares.has(share.id)) continue;
				shares.add(share.id);
				const nested = await apiClient.readCacheMetadata(
					"share",
					token,
					sessionSecretKey,
					share.id,
				);
				await refresh("share", share.id, nested.data);
				await visit(nested.data);
			}
			for (const secret of metadata.secrets ?? []) {
				if (secret.id) await refresh("secret", secret.id, secret);
			}
		};
		await apiClient.readShareRightsOverview(token, sessionSecretKey);
		if (isConnectionOffline())
			throw new Error("OFFLINE_CACHE_REQUIRES_CONNECTION");
		// Rights revalidation can itself invalidate old cached descendants. The
		// traversal starts after that boundary; later mutations cancel it.
		cacheSnapshot = cacheGeneration;
		const overview = await apiClient.readDatastore(token, sessionSecretKey);
		if (isConnectionOffline())
			throw new Error("OFFLINE_CACHE_REQUIRES_CONNECTION");
		for (const datastore of overview.data.datastores) {
			if (!current()) return;
			const metadata = await apiClient.readCacheMetadata(
				"datastore",
				token,
				sessionSecretKey,
				datastore.id,
			);
			await refresh("datastore", datastore.id, metadata.data);
			await visit(metadata.data);
		}
		if (!current()) return;
		for (const key of await storage.keys("offline-cache")) {
			if (!current()) return;
			if (!keep.has(key)) await remove(key);
		}
		if (!current()) return;
		lastUpdate = Date.now();
		lastUpdateAccount = id;
	})().finally(() => {
		status.dispose();
		if (updatingAccount === id) {
			updating = undefined;
			updatingAccount = undefined;
		}
	});
	return updating;
}

vaultLock.subscribe(() => {
	if (vaultLock.isBlocked()) {
		deferredSync = false;
		if (deferredTimer) clearTimeout(deferredTimer);
		deferredTimer = undefined;
		confirmedOffline = undefined;
		lastUpdate = 0;
		updating = undefined;
	}
});

const offlineCache = {
	canUse,
	isActive,
	get,
	set,
	clear,
	remove,
	markOffline,
	markOnline,
	releaseCacheDisplay,
	incrementalUpdate,
	listEndpoints,
	refreshEndpoint,
	getGeneration: () => cacheGeneration,
	isLocked: vaultLock.isLocked,
	getEncryptionKey: vaultLock.getKey,
	unlock: vaultLock.unlock,
	disable: markOnline,
};
export default offlineCache;
