(function (jQuery, browser, setTimeout) {
    "use strict";

    var base = ClassWorkerContentScriptBase(browser, jQuery, setTimeout);
    ClassWorkerContentScript(base, browser, jQuery, setTimeout);
    ClassWorkerContentScriptOIDCSAML(base, browser, jQuery, setTimeout);
    ClassWorkerContentScriptPGP(base, browser, jQuery, setTimeout);
})(jQuery, browser, setTimeout);
