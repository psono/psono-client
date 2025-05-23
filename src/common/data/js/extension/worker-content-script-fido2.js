/*
 * The content script worker loaded in every page responsible for the whole webauthn / fido2 / passkey
 */

var ClassWorkerContentScriptFido2 = function (base, browser, setTimeout) {
    "use strict";

    activate();

    function activate() {

        const root = document.head || document.documentElement;
        if (root === null) {
            return;
        }

        window.addEventListener("message", (event) => {
            if (event.origin !== window.location.origin) {
                // SECURITY: Don't remove this check!
                return;
            }

            if (!event.data.hasOwnProperty('event')) {
                return;
            }
            switch (event.data.event) {
                case "navigator-credentials-get":
                case 'navigator-credentials-create':
                    base.emit(event.data.event, event.data.data, function (result){
                        if (!result.hasOwnProperty("event")) {
                            return;
                        }
                        if (!result.hasOwnProperty("data")) {
                            return;
                        }
                        window.postMessage({
                            event: result.event,
                            data: result.data,
                        }, window.location.origin);
                    })
                    break;
            }
        })

        // create script
        const script1 = document.createElement("script");
        script1.src = browser.runtime.getURL("data/js/web-accessible.js");
        root.appendChild(script1);
    }
};
