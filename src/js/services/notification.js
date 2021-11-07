import action from "../actions/bound-action-creators";

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
 */
function set(messages) {
    action.setNotifications(messages);
}

const service = {
    infoSend,
    errorSend,
    reset,
    set,
};

export default service;
