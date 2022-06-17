/**
 * Service that allows the mocking of browser
 */
var browserService = function () {
    if (typeof browser === "undefined") {
        var browser = chrome;
    }

    return browser;
};

export default browserService();
