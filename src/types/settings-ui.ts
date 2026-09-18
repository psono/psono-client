import type { RouteComponentProps } from "react-router-dom";
import type { ItemEntryType, OptionEntryType } from "./blueprint";

export type SettingsViewProps = Partial<RouteComponentProps>;

/** Text inputs preserve their string value until the existing save logic runs. */
export type NumericInputValue = number | string;

export interface ToggleSetting<Value extends boolean | undefined = boolean> {
	value: Value;
	setter: (value: boolean) => void;
}

export type EntryTypeSettings = {
	[Key in ItemEntryType]: ToggleSetting;
};

export type GeneralSettings = {
	[Key in OptionEntryType]: ToggleSetting<
		Key extends "markdown_notes" ? boolean : boolean | undefined
	>;
};
