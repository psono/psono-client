import browserClient from "./browser-client";
import cryptoLibraryService from "./crypto-library";

let _notifications = {};

/**
 * shows the notification bar for a speicfic tab specified by its id
 *
 * @param tabId
 */
function showNotificationBarInTab(tabId) {
    if (!_notifications.hasOwnProperty(tabId)) {
        return;
    }

    browserClient.emitTab(tabId, "show-notification-bar", {
            'notificationBarUrl': browserClient.getURL('data/notification-bar.html'),
        }
    )
}

/**
 * Removes a notification bar
 *
 * @param tabId The id of the tab
 */
function removeNotificationBar(tabId) {
    browserClient.emitTab(tabId, "remove-notification-bar", {});
}

/**
 * Creates a notification
 *
 * @param title The title
 * @param description The desciription
 * @param buttons potential buttons
 * @param [autoClose] Automatic close in seconds
 * @param [onAutoClose] A callback function that is triggered on auto close
 */
async function create(title, description, buttons, autoClose, onAutoClose) {

    const id = cryptoLibraryService.generateUuid();
    const activeTab = await browserClient.getActiveTab();

    if (_notifications.hasOwnProperty(activeTab.id)) {
        removeNotificationBar(activeTab.id)
    }
    _notifications[activeTab.id] = {
        'id': id,
        'title': title || "",
        'description': description || "",
        'buttons': buttons || []
    }

    showNotificationBarInTab(activeTab.id);
    if (autoClose) {
        setTimeout(function () {
            if (!_notifications.hasOwnProperty(activeTab.id)) {
                return;
            }
            delete _notifications[activeTab.id];

            removeNotificationBar(activeTab.id)
            if (typeof onAutoClose === "function") {
                onAutoClose()
            }
        }, autoClose);
    }
}

/**
 * Called by the content script whenever a tab says its ready, so we can decide whether we want to show a notification bar now or not there
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNotificationBarReady(request, sender, sendResponse) {
    if (!sender.tab) {
        return;
    }
    if (!_notifications.hasOwnProperty(sender.tab.id)) {
        removeNotificationBar(sender.tab.id)
    }
    showNotificationBarInTab(sender.tab.id)
}

/**
 * Called by notication bar whenever its ready to receive date
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNotificationBarLoaded(request, sender, sendResponse) {
    if (!sender.tab) {
        return;
    }
    if (!_notifications.hasOwnProperty(sender.tab.id)) {
        return;
    }

    sendResponse({
        'id': _notifications[sender.tab.id].id,
        'title': _notifications[sender.tab.id].title,
        'description': _notifications[sender.tab.id].description,
        'buttons': _notifications[sender.tab.id].buttons.map((button) => {
            return {
                'title': button.title,
                'color': button.color,
            }
        }),
    });
}

/**
 * Called by notication bar whenever someone clicked on a button
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNotificationBarButtonClick(request, sender, sendResponse) {
    if (!sender.tab) {
        return;
    }
    if (!_notifications.hasOwnProperty(sender.tab.id)) {
        return;
    }

    const notificationConfig = _notifications[sender.tab.id];
    delete _notifications[sender.tab.id];

    removeNotificationBar(sender.tab.id);

    if (notificationConfig['id'] != request.data['id']) {
        return;
    }
    if (notificationConfig['buttons'].length <= request.data['index']) {
        return;
    }
    notificationConfig['buttons'][request.data['index']]['onClick']();
}

/**
 * Called by the navigation bar itself whenever someone clicks on the close button
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNotificationBarClose(request, sender, sendResponse) {
    if (!sender.tab) {
        return;
    }
    removeNotificationBar(sender.tab.id)
    if (!_notifications.hasOwnProperty(sender.tab.id)) {
        return;
    }
    delete _notifications.hasOwnProperty[sender.tab.id];
}

const notificationBarService = {
    create,
    onNotificationBarReady,
    onNotificationBarClose,
    onNotificationBarLoaded,
    onNotificationBarButtonClick,
};

export default notificationBarService;
