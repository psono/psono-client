import type { TextFieldProps } from "@mui/material/TextField";
import type { NumberFormatProps } from "react-number-format";
import type { ConnectionAuthenticationReference } from "./auth";
import type { TrustedUserData } from "./datastore";
import type { FileRepository, Shard } from "./files";
export type { ConnectionType } from "./auth";

/** Text-field presentation options consumed by the autocomplete wrappers. */
export type SelectFieldPresentationProps = Pick<
	TextFieldProps,
	| "className"
	| "error"
	| "fullWidth"
	| "helperText"
	| "id"
	| "name"
	| "autoComplete"
	| "margin"
	| "required"
	| "size"
	| "variant"
>;

export type SelectFieldProps<
	Value,
	InputValue = Value,
> = SelectFieldPresentationProps & {
	value?: InputValue | null;
	onChange: (value: Value) => void;
};

export interface SelectOption<Value extends string = string> {
	title: string;
	value: Value;
}

export interface MobileNavigationProps {
	mobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
}

export interface FilterOption<Key extends string = string> {
	key: Key;
	label: string;
}

export interface FilterSection<Key extends string = string> {
	label: string;
	options: FilterOption<Key>[];
}

/** A source can be selected before its credential reference has been filled in. */
export type ConnectionCredential = ConnectionAuthenticationReference & {
	label?: string;
};

export interface ConnectionEntry {
	title?: string | null;
	host?: string | null;
	port?: string | number | null;
	domain?: string | null;
	resizeMethod?: string | null;
	serverLayout?: string | null;
	ignoreCertificate?: boolean;
	authenticationType?: string | null;
	username?: string | null;
	password?: string | null;
	privateKey?: string | null;
	notes?: string | null;
}

export type ConnectionEntryChange = (
	...change:
		| [
				field: Exclude<keyof ConnectionEntry, "ignoreCertificate">,
				value: string,
		  ]
		| [field: "ignoreCertificate", value: boolean]
) => void;

export interface GpgKeyOption {
	id: string;
	label?: string;
	secret_id?: string;
	secret_key?: string;
}

export type FileDestination =
	| (Shard & { name?: string; destination_type: "shard" })
	| (FileRepository & { name?: string; destination_type: "file_repository" });

export interface TrustedUserSelection {
	name: string;
	data: TrustedUserData & {
		user_id: string;
		user_username: string;
		user_public_key: string;
		user_name?: string;
	};
}

/** react-number-format emits this payload, not a DOM ChangeEvent. */
export interface FormattedInputChange {
	target: { name: string | undefined; value: string };
}

export type FormattedInputProps = Omit<NumberFormatProps, "onChange"> & {
	onChange: (event: FormattedInputChange) => void;
};

export type FormattedTextFieldProps = Omit<
	TextFieldProps,
	"onChange" | "value"
> & {
	value: string;
	onChange: (event: FormattedInputChange) => void;
};

export interface TotpOptions {
	period?: number | null;
	digits?: number | null;
	algorithm?: string | null;
	code?: string;
}
