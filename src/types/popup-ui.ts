import type { GpgWriteData } from "./browser";
import type { Datastore, GpgUser } from "./datastore";

/** Cache entries omit the tree node ID and retain only the popup projection. */
export interface PopupEntry {
	content: Datastore;
	path: string;
}

export type PopupMode = "default" | "generate_password";

export type GpgRecipientRow = [
	id: string,
	email: string,
	fingerprint: string,
	publicKey: string,
];

export interface GpgRecipientSelection {
	user: GpgUser;
	public_key?: string;
}

export type PopupGpgKey = NonNullable<GpgWriteData["private_key"]> & {
	id: string;
	label?: string;
};
