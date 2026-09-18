import type { UserSearchResult } from "../js/services/datastore-user";
import type { ShareRight, ShareRightsDetail } from "../js/services/share";
import type { AuthErrorData } from "./auth";
import type { TrustedUserSelection } from "./components";
import type {
	DataResponse,
	Datastore,
	DatastoreItem,
	DatastorePath,
	ShareRights,
	UserDatastoreItem,
} from "./datastore";
import type { Group, GroupShare } from "./vault";

/** Identity fields retained by the trusted-user dialogs and share callbacks. */
export type SharingUserData = TrustedUserSelection["data"];

export interface SharingUser extends UserDatastoreItem {
	name: string;
	data: SharingUserData;
}

export type VerifiedSharingUser = TrustedUserSelection;

export type UserSearchRow = [
	id: UserSearchResult["id"],
	username: UserSearchResult["username"],
	publicKey: UserSearchResult["public_key"],
	avatarId: UserSearchResult["avatar_id"],
];

export type GroupIndex = Record<string, Group>;
export type OutstandingGroupShareIndex = Record<
	string,
	Record<string, GroupShare>
>;

/** A member row can also represent a trusted user who has not been invited. */
export interface SharingGroupUser {
	id: string;
	name: string;
	public_key: string;
	membership_id?: string;
	group_admin?: boolean;
	share_admin?: boolean;
	accepted?: boolean | null;
	membership_create_date?: string;
	is_current_user?: boolean;
}

export interface SharingGroupShareRight
	extends ShareRights,
		Partial<GroupShare> {
	id: string;
	group_id: string;
	share_id: string;
	user_id?: string;
	key: string;
	key_nonce: string;
	title: string;
	title_nonce: string;
	type?: string;
	type_nonce?: string;
	create_date: string;
	expiration_date?: string | null;
}

/** The group detail endpoint includes these records in addition to key material. */
export interface SharingGroupDetail extends Group {
	share_admin: boolean;
	members: SharingGroupUser[];
	group_share_rights: SharingGroupShareRight[];
}

export interface SharingMembershipCreated {
	membership_id: string;
}

export interface SharingRight extends ShareRight {
	id: string;
	username?: string;
	group_name?: string;
	accepted?: boolean | null;
	create_date?: string | null;
	expiration_date?: string | null;
}

export interface UserSharingRight extends SharingRight {
	user_id: string;
	username: string;
}

export interface GroupSharingRight extends SharingRight {
	group_id: string;
	group_name: string;
}

export interface SharingRightsDetail extends ShareRightsDetail {
	user_share_rights: UserSharingRight[];
	group_share_rights: GroupSharingRight[];
	own_share_rights: ShareRights;
}

export interface PendingSharingInvitation {
	share_right_id: string;
	share_right_key: string;
	share_right_key_nonce: string;
	share_right_title: string;
	share_right_grant: boolean;
	share_right_create_user_id: string;
	share_right_create_user_username: string;
}

export type SharingNode = DatastoreItem;

export type SharingPermission = "read" | "write" | "grant";

export type CreateSharingRights<Recipient> = (
	recipients: Recipient[],
	read: boolean,
	write: boolean,
	grant: boolean,
	expirationDate: string | null,
) => void;

export interface SharingDialogError {
	title: string;
	description: string;
}

export type SharingErrorResponse = DataResponse<Pick<
	AuthErrorData,
	"non_field_errors"
> | null>;

export interface SharingFolderTarget {
	parent: Datastore | undefined;
	path: DatastorePath;
}

export type SharingRightRow = [
	id: string,
	name: string,
	read: boolean,
	write: boolean,
	grant: boolean,
	accepted: boolean | null | undefined,
	expirationDate: string,
	createDate: string,
];

export type SharingGroupUserRow = [
	id: SharingGroupUser["id"],
	name: SharingGroupUser["name"],
	isMember: boolean,
	groupAdmin: SharingGroupUser["group_admin"],
	shareAdmin: SharingGroupUser["share_admin"],
	accepted: SharingGroupUser["accepted"],
	createDate: string,
	isCurrentUser: SharingGroupUser["is_current_user"],
];

export type SharingGroupShareRightRow = [
	id: string,
	title: string,
	read: boolean,
	write: boolean,
	grant: boolean,
	expirationDate: string,
	createDate: string,
];
