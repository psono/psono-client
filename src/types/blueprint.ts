export type ItemEntryType =
	| "website_password"
	| "application_password"
	| "totp"
	| "passkey"
	| "note"
	| "environment_variables"
	| "ssh_own_key"
	| "mail_gpg_own_key"
	| "ssh_connection"
	| "rdp_connection"
	| "vnc_connection"
	| "credit_card"
	| "bookmark"
	| "identity"
	| "elster_certificate"
	| "file";

export type OptionEntryType =
	| "nosave"
	| "nosavetoggle"
	| "confirm_unsaved"
	| "markdown_notes";

export interface EntryBlueprint<Value extends string> {
	value: Value;
	title: string;
	edit_title: string;
	show_title: string;
}

/** Sparse settings/server responses may leave a condition undefined. */
export type BlueprintCondition = () => boolean | undefined;

export interface EntryBlueprintDefinition<Value extends string>
	extends EntryBlueprint<Value> {
	hideOnNewEntry: boolean;
	show: BlueprintCondition;
}

export interface ItemBlueprintDefinition
	extends EntryBlueprintDefinition<Exclude<ItemEntryType, "file">> {
	disabled: BlueprintCondition;
}

/** JSON-cloned selector results omit undefined disabled values; files also omit show_title. */
export type ItemBlueprint =
	| (EntryBlueprint<Exclude<ItemEntryType, "file">> & {
			disabled?: boolean;
			hideOnNewEntry?: never;
	  })
	| {
			value: "file";
			title: string;
			edit_title: string;
			hideOnNewEntry: false;
			show_title?: never;
			disabled?: never;
	  };

export type OptionBlueprint = EntryBlueprint<OptionEntryType>;
