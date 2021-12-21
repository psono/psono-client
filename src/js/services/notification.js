import action from "../actions/bound-action-creators";
import browserClient from "./browser-client";
import store from "./store";

/**
 * Sends an info message
 *
 * @param {array} message The message to send
 */
function infoSend(message) {
    action.sendNotification(message, "info");
}

/**
 * Sends an info message
 *
 * @param {array} message The message to send
 */
function errorSend(message) {
    action.sendNotification(message, "danger");
}

/**
 * Resets messages
 */
function reset() {
    action.setNotifications([]);
}

/**
 * Resets messages
 *
 * @param {array} messages The message to set
 */
function set(messages) {
    action.setNotifications(messages);
}

/**
 * Display a notification for notification type
 *
 * @param {string} notificationContent The content of the notification
 * @param {string} notificationType The suffix key to manage this type of notification in settings
 */
function push(notificationType, notificationContent) {
    switch (notificationType) {
        case "password_copy":
            if (store.getState().client.notificationOnCopy) {
                browserClient.notify(notificationContent);
            }
            return;
        case "username_copy":
            if (store.getState().client.notificationOnCopy) {
                browserClient.notify(notificationContent);
            }
            return;
        case "totp_token_copy":
            if (store.getState().client.notificationOnCopy) {
                browserClient.notify(notificationContent);
            }
            return;
        default:
            console.error("This notification type: '" + notificationType + "' doesn't exist");
    }
}

const notificationService = {
    infoSend,
    errorSend,
    reset,
    set,
    push,
};

export default notificationService;
