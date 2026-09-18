import type { FirefoxBrowser } from "./browser";

declare global {
	var browser: FirefoxBrowser;

	// Only this service-worker API is used by the offscreen document service.
	const clients: {
		matchAll(): Promise<Array<{ url: string }>>;
	};

	interface Window {
		__localeId__?: string;
		opera?: string;
		psono_offline_cache_encryption_key?: string | null;
		RunCallbackFunction?: (popup: chrome.windows.Window | undefined) => void;
		electronAPI: {
			getConfigJson(): Promise<string | null | undefined>;
		};
	}
}
