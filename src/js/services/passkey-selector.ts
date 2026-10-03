import browserClient from "./browser-client";
import cryptoLibrary from "./crypto-library";

type Sender = {
	tab?: { id?: number; url?: string };
	frameId?: number;
	url?: string;
};

interface PendingSelection {
	id: string;
	tabOrigin: string;
	count: number;
	resolve: (index: number) => void;
	reject: () => void;
	timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<number, PendingSelection>();

function finish(tabId: number, selection: PendingSelection): void {
	if (pending.get(tabId) !== selection) return;
	pending.delete(tabId);
	clearTimeout(selection.timer);
	browserClient.emitFrame(tabId, 0, "hide-passkey-selector", {
		id: selection.id,
	});
}

function select(
	tabId: number,
	tabOrigin: string,
	origin: string,
	labels: string[],
	timeout: number,
): Promise<number> {
	const previous = pending.get(tabId);
	if (previous) {
		finish(tabId, previous);
		previous.reject();
	}
	return new Promise((resolve, reject) => {
		// The session identifier is never put into the page DOM. Only the top-frame
		// content script receives it, and the background validates it on response.
		const id = Array.from(cryptoLibrary.randomBytes(16), (byte) =>
			byte.toString(16).padStart(2, "0"),
		).join("");
		const selection: PendingSelection = {
			id,
			tabOrigin,
			count: labels.length,
			resolve,
			reject: () => reject(new Error("Passkey selection cancelled")),
			timer: setTimeout(() => {
				finish(tabId, selection);
				selection.reject();
			}, timeout),
		};
		pending.set(tabId, selection);
		browserClient.emitFrame(tabId, 0, "show-passkey-selector", {
			id,
			tabOrigin,
			origin,
			labels,
		});
	});
}

function validSender(sender: Sender, selection: PendingSelection): boolean {
	if (sender.frameId !== 0 || sender.tab?.id === undefined) return false;
	try {
		return (
			new URL(sender.url || "").origin === selection.tabOrigin &&
			new URL(sender.tab.url || "").origin === selection.tabOrigin
		);
	} catch {
		return false;
	}
}

function onSelect(
	request: { data: { id: string; index: number } },
	sender: Sender,
): void {
	if (sender.tab?.id === undefined) return;
	const selection = pending.get(sender.tab.id);
	if (
		!selection ||
		!validSender(sender, selection) ||
		selection.id !== request.data?.id
	)
		return;
	if (
		!Number.isInteger(request.data.index) ||
		request.data.index < 0 ||
		request.data.index >= selection.count
	)
		return;
	finish(sender.tab.id, selection);
	selection.resolve(request.data.index);
}

function onCancel(request: { data: { id: string } }, sender: Sender): void {
	if (sender.tab?.id === undefined || sender.frameId !== 0) return;
	const selection = pending.get(sender.tab.id);
	if (!selection || selection.id !== request.data?.id) return;
	finish(sender.tab.id, selection);
	selection.reject();
}

const passkeySelectorService = { select, onSelect, onCancel };
export default passkeySelectorService;
