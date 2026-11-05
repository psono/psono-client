import React from "react";
import { cacheStatus } from "../services/offline-cache";
import offlineCache from "../services/offline-cache";

/** Re-render local browsing controls when a cached snapshot starts/finishes
 * verification, independently of connectivity changes broadcast by other tabs. */
export function useOfflineMode() {
	const [, render] = React.useReducer((value) => value + 1, 0);
	React.useEffect(() => cacheStatus.subscribe(render), []);
	return cacheStatus.getSnapshot().usingCache || offlineCache.isActive();
}
