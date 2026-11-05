export type CacheMode = "network-first" | "cache-only" | "refresh";

export class CacheMissError extends Error {
	constructor() {
		super("OFFLINE_CACHE_MISS");
		this.name = "CacheMissError";
	}
}

export function isOfflineError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const value = error as { errors?: string[]; status?: number };
	return (
		value.errors?.includes("SERVER_OFFLINE") === true ||
		(typeof value.status === "number" && value.status >= 500)
	);
}
