(function (browser, setTimeout) {
    "use strict";

    var base = ClassWorkerContentScriptBase(browser, setTimeout);
    ClassWorkerContentScript(base, browser, setTimeout);
    ClassWorkerContentScriptOIDCSAML(base, browser, setTimeout);
    ClassWorkerContentScriptPGP(base, browser, setTimeout);
})(browser, setTimeout);
