/*
 * The content script worker loaded in every page
 */

var ClassWorkerContentScriptNotificationBar = function (base, browser, setTimeout) {
    "use strict";

    const psonoIframeId = "psono-notification-bar-iframe";
    const psonoIframeWrapperId = "psono-notification-iframe-wrapper";

    base.ready(function() {
        if (base.inIframe()) {
            return;
        }
        activate();
    });

    function activate() {
        base.on("show-notification-bar", onShowNotificationBar);
        base.on("remove-notification-bar", onRemoveNotificationBar);
        base.emit("notification-bar-ready", document.location.toString());
    }

    /**
     * Handler for a removeNotificationBar
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onRemoveNotificationBar(data, sender, sendResponse) {
        const element = document.getElementById(psonoIframeWrapperId);
        if (!element) {
            return;
        }
        element.remove();
    }

    /**
     * Handler for a showNotificationBar
     *
     * @param data
     * @param sender
     * @param sendResponse
     */
    function onShowNotificationBar(data, sender, sendResponse) {
        if (base.inIframe()) {
            return;
        }
        const element = document.getElementById(psonoIframeWrapperId);
        if (element) {
            return;
        }

        const iframe = document.createElement("iframe");
        iframe.style.cssText = "width: 100%; height: 48px; border: 0; margin: 0; padding: 0; min-height: auto;";
        iframe.id = psonoIframeId;
        iframe.src = data['notificationBarUrl'];

        const wrapperDiv = document.createElement("div");
        wrapperDiv.id = psonoIframeWrapperId;
        wrapperDiv.style.cssText = "width: 100%; height: 48px; position: fixed; top: 0; left: 0; border: 0; margin: 0; padding: 0; visibility: visible; display: block; z-index: 2147483647;";
        wrapperDiv.appendChild(iframe);
        document.body.appendChild(wrapperDiv);
    }
};
