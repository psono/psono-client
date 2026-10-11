import offscreenDocument from "./offscreen-document";

const testGlobals = globalThis as unknown as {
	TARGET: typeof TARGET;
	chrome: typeof chrome;
};

describe("Safari offline cache key lifecycle", () => {
	const originalTarget = testGlobals.TARGET;
	const originalChrome = testGlobals.chrome;

	afterEach(() => {
		testGlobals.TARGET = originalTarget;
		testGlobals.chrome = originalChrome;
	});

	it.each([
		"unlocked-in-memory-key",
		null,
		undefined,
	])("reads the background page key (%s) without an offscreen document", async (key) => {
		testGlobals.TARGET = "safari";
		testGlobals.chrome = {
			runtime: {
				getBackgroundPage: (
					callback: (bg: {
						psono_offline_cache_encryption_key?: string | null;
					}) => void,
				) => callback({ psono_offline_cache_encryption_key: key }),
			},
		} as unknown as typeof chrome;
		const callback = jest.fn();
		await offscreenDocument.getOfflineCacheEncryptionKey(callback);
		expect(callback).toHaveBeenCalledWith(key);
	});
});
