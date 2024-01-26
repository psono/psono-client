(function (browser, setTimeout) {
    "use strict";

    var base = ClassWorkerContentScriptBase(browser, setTimeout);
    ClassWorkerContentScript(base, browser, setTimeout);
    ClassWorkerContentScriptOIDCSAML(base, browser, setTimeout);
    ClassWorkerContentScriptElster(base, browser, setTimeout);
    ClassWorkerContentScriptPGP(base, browser, setTimeout);
})(chrome, setTimeout);
