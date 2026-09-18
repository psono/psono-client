/**
 * Service that allows the mocking of browser
 */
var browserService = (): typeof chrome => {
	if (typeof browser === "undefined" && typeof chrome !== "undefined") {
		var browser: typeof chrome | undefined = chrome;
	}

	return browser!;
};

export default browserService();
