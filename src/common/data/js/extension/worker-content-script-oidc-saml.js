/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptOIDCSAML = function (base, browser, jQuery, setTimeout) {
    "use strict";

    jQuery(function () {
        activate();
    });

    function activate() {
        base.register_observer(observer);
    }

    /**
     * Analyse a document and adds a listener
     *
     * @param document
     */
    function observer(document) {
        if (document.defaultView.location.href.startsWith('https://psono.com/redirect')) {
            base.emit("oidc-saml-redirect-detected", {
                url: document.defaultView.location.href
            });
        }
    }

};
