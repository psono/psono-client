/**
 * Service that allows the mocking of browser
 */
var browserService = function () {
    if (typeof browser === "undefined" && typeof chrome !== "undefined") {
        var browser = chrome;
    }

    return browser;
};

export default browserService();
