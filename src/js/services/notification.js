import action from "../actions/bound-action-creators";
import browserClient from "./browser-client";
import { getStore } from "./store";

/**
 * Sends an info message
 *
 * @param {array} message The message to send
 */
function infoSend(message) {
    action().sendNotification(message, "info");
}

/**
 * Sends an info message
 *
 * @param {array} message The message to send
 */
function errorSend(message) {
    action().sendNotification(message, "danger");
}

/**
 * Resets messages
 */
function reset() {
    action().setNotifications([]);
}

/**
 * Resets messages
 *
 * @param {array} messages The message to set
 */
function set(messages) {
    action().setNotifications(messages);
}

/**
 * Display a notification for notification type
 *
 * @param {string} notificationContent The content of the notification
 * @param {string} notificationType The suffix key to manage this type of notification in settings
 */
function push(notificationType, notificationContent) {
    const knownNotificationTypes = [
        "content_copy",
        "pin_copy",
        "value_copy",
        "password_copy",
        "username_copy",
        "totp_token_copy",
        "note_content_copy",
        "credit_card_number_copy",
        "credit_card_name_copy",
        "credit_card_expiry_date_copy",
        "credit_card_cvc_copy",
        "credit_card_pin_copy"
    ];

    if (!knownNotificationTypes.includes(notificationType)) {
        console.error("This notification type: '" + notificationType + "' doesn't exist");
        return;
    }

    if (getStore().getState().client.notificationOnCopy) {
        browserClient.notify(notificationContent);
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
