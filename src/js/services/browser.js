/**
 * Service that allows the mocking of browser
 */
var browserService = () => {
	if (typeof browser === "undefined" && typeof chrome !== "undefined") {
		var browser = chrome;
	}

	return browser;
};

export default browserService();
