/** The URL parser returns null fields for empty or invalid input. */
export interface ParsedUrl {
	scheme: string | null;
	authority: string | null;
	authority_without_www: string | null;
	base_url: string | null;
	full_domain: string | null;
	full_domain_without_www: string | null;
	port: string | null;
	path: string | null;
	query: string | null;
	fragment: string | null;
}

/** Structural tree contract shared by datastore traversal helpers. */
export interface ItemTree<T> {
	items?: readonly T[];
	folders?: readonly ItemTree<T>[];
}

export type EqualityComparator<T, Search = T> = (
	item: T,
	search: Search,
) => boolean;

/** Only the fields inspected by the password search predicate. */
export interface SearchableEntry {
	name?: string | null;
	description?: string | null;
	deleted?: boolean;
	tags?: readonly string[] | null;
	urlfilter?: string | null;
	id?: string;
	secret_id?: string;
	file_id?: string;
	share_id?: string;
}

export type PasswordFilter = (
	entry: SearchableEntry,
	additionalInfo?: string | null,
) => boolean;

export type DomainSynonymGroup = string[];
export type DomainSynonymGroups = DomainSynonymGroup[];
/** Domains and wildcard patterns are runtime keys; missing groups are expected. */
export type DomainSynonymMap = Record<string, DomainSynonymGroup | undefined>;

/** Numeric byte sequences include typed arrays and ordinary arrays. */
export type ByteArray = ArrayLike<number>;
export type ConversionBuffer = ArrayBufferLike | ByteArray;

/** CBOR tags and simple values may be decoded into application-specific values. */
export type CborTagger = (value: unknown, tag: number) => unknown;
export type CborSimpleValue = (value: number) => unknown;

export type NotificationText = string | string[];
export interface NotificationMessage {
	text: NotificationText;
	type: "info" | "error";
}

export interface NotificationBarButtonView {
	title: string;
	color?:
		| "inherit"
		| "primary"
		| "secondary"
		| "success"
		| "error"
		| "info"
		| "warning";
}

export interface NotificationBarButton extends NotificationBarButtonView {
	onClick: () => void;
}

export interface NotificationBarData {
	id: string;
	title: string;
	description: string;
	buttons: NotificationBarButtonView[];
}

export interface NotificationBarConfig extends NotificationBarData {
	buttons: NotificationBarButton[];
}

/** Structural subset of a browser runtime message sender. */
export interface NotificationBarSender {
	tab?: { id?: number };
}

export interface NotificationBarClickRequest {
	data: { id: string; index: number };
}

export type SsoType = "saml" | "oidc";

export interface PendingSsoRedirect {
	state: string;
	type: SsoType;
	expiresAt: number;
}

export interface ParsedSsoRedirect {
	/** The case-insensitive URL pattern preserves the original matched casing. */
	type: string;
	state: string;
	tokenId: string;
}
