import type { RouteComponentProps } from "react-router-dom";
import type { EmergencyCode, IvaltFactor, SecondFactor } from "./auth";
import type { Datastore, DatastorePath } from "./datastore";
import type { EditableFolder } from "./dialogs";
import type { PendingSharingInvitation, SharingUser } from "./sharing-ui";
import type { Group, LinkShare } from "./vault";
import type emergencyCode from "../js/services/emmergency-code";
import type passwordRecoveryCode from "../js/services/password-recovery-code";
import type shareService from "../js/services/share";

export type AccountViewProps = Partial<RouteComponentProps>;

export interface AccountDialogProps {
	open: boolean;
	onClose: () => void;
}

export type FactorRow = [
	id: SecondFactor["id"],
	title: SecondFactor["title"],
	active: SecondFactor["active"],
];

export type IvaltRow = [
	id: IvaltFactor["id"],
	mobile: IvaltFactor["mobile"],
	active: IvaltFactor["active"],
];

export type EmergencyCodeRow = [
	id: EmergencyCode["id"],
	description: EmergencyCode["description"],
	leadTimeHours: number,
	activationDate: string,
];

export type GeneratedEmergencyCode = Awaited<
	ReturnType<typeof emergencyCode.createEmergencyCode>
> & { url: string };

export type GeneratedRecoveryCode = Awaited<
	ReturnType<typeof passwordRecoveryCode.recoveryGenerateInformation>
>;

export type GroupRow = [
	id: Group["group_id"],
	name: Group["name"],
	createdOn: string,
	accepted: Group["accepted"] | null,
	groupAdmin: Group["group_admin"],
	membershipId: Group["membership_id"],
	privateKey: Group["private_key"],
	privateKeyNonce: Group["private_key_nonce"],
	privateKeyType: Group["private_key_type"],
	publicKey: Group["public_key"],
	secretKey: Group["secret_key"],
	secretKeyNonce: Group["secret_key_nonce"],
	secretKeyType: Group["secret_key_type"],
	shareAdmin: Group["share_admin"],
	forcedMembership: boolean,
];

export type ShareOverview = NonNullable<
	Awaited<ReturnType<typeof shareService.readShares>>
>;

/** Fields consumed by the pending-share UI in addition to the service projection. */
export type PendingShare = ShareOverview["shares"][number] &
	PendingSharingInvitation & {
		id: string;
		share_right_accepted: boolean | null;
		share_right_create_user_username: string;
		share_right_create_date?: string | null;
		share_right_read: boolean;
		share_right_write: boolean;
		share_right_grant: boolean;
		share_right_id: string;
	};

export type PendingShareRow = [
	id: string,
	username: string,
	title: string,
	createdOn: string | null,
	read: boolean,
	write: boolean,
	grant: boolean,
	shareRightId: string,
];

export type ActiveLinkShareRow = [
	id: LinkShare["id"],
	publicTitle: LinkShare["public_title"],
	validTill: string,
	allowedReads: LinkShare["allowed_reads"],
];

export interface NewTrustedNodeData {
	parent: Datastore | undefined;
	path: DatastorePath;
}

export interface EditTrustedFolderData {
	node: Datastore & EditableFolder;
	path: DatastorePath;
}

export interface EditTrustedEntryData {
	item: SharingUser;
	path: DatastorePath;
}

export interface ContextMenuPosition {
	mouseX: number | null;
	mouseY: number | null;
}
