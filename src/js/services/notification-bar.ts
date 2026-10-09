import browserClient from "./browser-client";
import cryptoLibraryService from "./crypto-library";
import type {
	NotificationBarButton,
	NotificationBarClickRequest,
	NotificationBarConfig,
	NotificationBarData,
	NotificationBarSender,
} from "../../types/utilities";

const _notifications: Record<number, NotificationBarConfig | undefined> = {};

/**
 * shows the notification bar for a speicfic tab specified by its id
 *
 * @param tabId
 */
function showNotificationBarInTab(tabId: number): void {
	if (!Object.hasOwn(_notifications, tabId)) {
		return;
	}

	browserClient.emitTab(tabId, "show-notification-bar", {
		notificationBarUrl: browserClient.getURL("data/notification-bar.html"),
	});
}

/**
 * Removes a notification bar
 *
 * @param tabId The id of the tab
 */
function removeNotificationBar(tabId: number): void {
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
async function create(
	title?: string | null,
	description?: string | null,
	buttons?: NotificationBarButton[] | null,
	autoClose?: number,
	onAutoClose?: () => void,
): Promise<void> {
	const id = cryptoLibraryService.generateUuid();
	const activeTab = await browserClient.getActiveTab();
	if (!activeTab || activeTab.id === undefined) {
		return;
	}
	const tabId = activeTab.id;

	if (Object.hasOwn(_notifications, tabId)) {
		removeNotificationBar(tabId);
	}
	_notifications[tabId] = {
		id: id,
		title: title || "",
		description: description || "",
		buttons: buttons || [],
	};

	showNotificationBarInTab(tabId);
	if (autoClose) {
		setTimeout(() => {
			if (!Object.hasOwn(_notifications, tabId)) {
				return;
			}
			delete _notifications[tabId];

			removeNotificationBar(tabId);
			if (typeof onAutoClose === "function") {
				onAutoClose();
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
function onNotificationBarReady(
	request: unknown,
	sender: NotificationBarSender,
	sendResponse: (response?: unknown) => void,
): void {
	if (sender.tab?.id === undefined) {
		return;
	}
	if (!Object.hasOwn(_notifications, sender.tab.id)) {
		removeNotificationBar(sender.tab.id);
	}
	showNotificationBarInTab(sender.tab.id);
}

/**
 * Called by notication bar whenever its ready to receive date
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNotificationBarLoaded(
	request: unknown,
	sender: NotificationBarSender,
	sendResponse: (response: NotificationBarData) => void,
): void {
	if (sender.tab?.id === undefined) {
		return;
	}
	if (!Object.hasOwn(_notifications, sender.tab.id)) {
		return;
	}
	const notification = _notifications[sender.tab.id];
	if (!notification) {
		return;
	}

	sendResponse({
		id: notification.id,
		title: notification.title,
		description: notification.description,
		buttons: notification.buttons.map((button) => {
			return {
				title: button.title,
				color: button.color,
			};
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
function onNotificationBarButtonClick(
	request: NotificationBarClickRequest,
	sender: NotificationBarSender,
	sendResponse: (response?: unknown) => void,
): void {
	if (sender.tab?.id === undefined) {
		return;
	}
	if (!Object.hasOwn(_notifications, sender.tab.id)) {
		return;
	}

	const notificationConfig = _notifications[sender.tab.id];
	if (!notificationConfig) {
		return;
	}
	delete _notifications[sender.tab.id];

	removeNotificationBar(sender.tab.id);

	if (notificationConfig["id"] != request.data["id"]) {
		return;
	}
	if (notificationConfig["buttons"].length <= request.data["index"]) {
		return;
	}
	notificationConfig["buttons"][request.data["index"]]["onClick"]();
}

/**
 * Called by the navigation bar itself whenever someone clicks on the close button
 *
 * @param {object} request The message sent by the calling script.
 * @param {object} sender The sender of the message
 * @param {function} sendResponse Function to call (at most once) when you have a response.
 */
function onNotificationBarClose(
	request: unknown,
	sender: NotificationBarSender,
	sendResponse: (response?: unknown) => void,
): void {
	if (sender.tab?.id === undefined) {
		return;
	}
	removeNotificationBar(sender.tab.id);
	if (!Object.hasOwn(_notifications, sender.tab.id)) {
		return;
	}
	// Preserve the legacy deletion target (the method object) during migration.
	Reflect.deleteProperty(_notifications.hasOwnProperty, sender.tab.id);
}

const notificationBarService = {
	create,
	onNotificationBarReady,
	onNotificationBarClose,
	onNotificationBarLoaded,
	onNotificationBarButtonClick,
};

export default notificationBarService;
