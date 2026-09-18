import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { EntryItem, EntrySecretData } from "../../../types/entry-ui";
import secretService from "../../services/secret";
import DialogEditEntry from "./edit-entry";
import DialogNewEntry from "./new-entry";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../i18n", () => ({ t: (key: string) => key }));
jest.mock("../../services/store", () => ({
	getStore: () => ({
		getState: () => ({
			user: {},
			server: { disableCallbacks: true },
			settingsDatastore: {},
		}),
	}),
}));
jest.mock("../../services/secret", () => ({
	readSecret: jest.fn(),
	createSecret: jest.fn(),
	writeSecret: jest.fn(),
}));
jest.mock("../../services/offline-cache", () => ({ isActive: () => false }));
jest.mock("../markdown-notes-field", () => () => null);
jest.mock("../totp-circle", () => () => null);
jest.mock("../gateway-launch-button", () => () => null);
jest.mock("./history", () => () => null);
jest.mock("./decrypt-gpg-message", () => () => null);
jest.mock("./encrypt-gpg-message", () => () => null);
jest.mock("./generate-new-gpg-key", () => () => null);
jest.mock("./generate-new-ssh-key", () => () => null);
jest.mock("./import-gpg-key-as-text", () => () => null);
jest.mock("../select-field/entry-type", () => {
	const React = jest.requireActual<typeof import("react")>("react");
	return (props: { value: string; onChange: (value: string) => void }) => (
		<select
			name="entryType"
			value={props.value}
			onChange={(event) => props.onChange(event.target.value)}
		>
			<option value="website_password">Website password</option>
			<option value="totp">Authenticator</option>
		</select>
	);
});

const theme = createTheme({
	palette: {
		checked: { main: "#008000" },
		greyText: { main: "#808080" },
		baseTitleBackground: { main: "#202020" },
	},
});
const filter = "example.com, login.example.org";
const secret: EntrySecretData = {
	totp_title: "Example account",
	totp_code: "JBSWY3DPEHPK3PXP",
	totp_period: 30,
	totp_digits: 6,
	totp_algorithm: "SHA1",
};

function input(name: string) {
	const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(
		`[name="${name}"]`,
	);
	if (!element) throw new Error(`Missing input: ${name}`);
	return element;
}

function change(name: string, value: string) {
	act(() => {
		const element = input(name);
		element.value = value;
		Simulate.change(element);
	});
}

function button(label: string) {
	const element = Array.from(document.querySelectorAll("button")).find(
		(candidate) => candidate.textContent === label,
	);
	if (!element) throw new Error(`Missing button: ${label}`);
	return element;
}

describe("standalone TOTP domain filters", () => {
	let container: HTMLDivElement;
	const onCreate = jest.fn();
	const onEdit = jest.fn();
	const setDirty = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(secretService.createSecret).mockResolvedValue({
			secret_id: "secret-id",
			secret_key: "secret-key",
		});
		jest
			.mocked(secretService.writeSecret)
			.mockResolvedValue({ secret_id: "secret-id" });
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	async function renderEdit(
		data: EntrySecretData,
		metadata: Partial<EntryItem> = {},
	) {
		const item: EntryItem = {
			id: "entry-id",
			type: "totp",
			secret_id: "secret-id",
			secret_key: "secret-key",
			share_rights: { read: true, write: true, grant: false, delete: false },
			...metadata,
		};
		jest.mocked(secretService.readSecret).mockResolvedValue(data);
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogEditEntry
						open
						inline
						item={item}
						onClose={() => {}}
						onEdit={onEdit}
						setDirty={setDirty}
						hideMoreMenu
						hideLinkToEntry
						hideShowHistory
					/>
				</ThemeProvider>,
				container,
			);
		});
		return item;
	}

	async function save() {
		await act(async () => button("SAVE").click());
		return jest.mocked(secretService.writeSecret).mock.calls[0][2];
	}

	it.each([
		"",
		filter,
	])("creates an authenticator with optional filter %p", async (urlFilter) => {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogNewEntry
						open
						onClose={() => {}}
						onCreate={onCreate}
						parentDatastoreId="datastore-id"
					/>
				</ThemeProvider>,
				container,
			);
		});
		change("entryType", "totp");
		change("totpTitle", secret.totp_title!);
		change("totpCode", secret.totp_code!);
		act(() => button("ADVANCED").click());
		change("totpUrlFilter", urlFilter);
		await act(async () => button("CREATE").click());
		expect(secretService.createSecret).toHaveBeenCalledTimes(1);
		expect(
			jest.mocked(secretService.createSecret).mock.calls[0][0],
		).toMatchObject(secret);
		const content = jest.mocked(secretService.createSecret).mock.calls[0][0];
		if (urlFilter) {
			expect(content).toHaveProperty("totp_url_filter", urlFilter);
		} else {
			expect(content).not.toHaveProperty("totp_url_filter");
		}
		expect(onCreate).toHaveBeenCalledTimes(1);
		expect(onCreate.mock.calls[0][0].urlfilter).toBe(urlFilter || undefined);
	});

	it("preserves an app-created filter when saving another field with Advanced closed", async () => {
		await renderEdit(
			{ ...secret, totp_url_filter: filter },
			{ urlfilter: "old.example.com" },
		);
		change("totpTitle", "Renamed account");
		const saved = await save();
		expect(saved).toMatchObject({
			...secret,
			totp_title: "Renamed account",
			totp_url_filter: filter,
		});
		expect(onEdit.mock.calls[0][0].urlfilter).toBe(filter);
	});

	it("restores a legacy datastore-only filter to the secret on save", async () => {
		await renderEdit(secret, { urlfilter: filter });
		act(() => button("ADVANCED").click());
		expect(input("totpUrlFilter").value).toBe(filter);
		expect(await save()).toMatchObject({ totp_url_filter: filter });
		expect(onEdit.mock.calls[0][0].urlfilter).toBe(filter);
	});

	it("updates the secret and datastore filter together and marks the form dirty", async () => {
		await renderEdit(
			{ ...secret, totp_url_filter: filter },
			{ urlfilter: filter },
		);
		act(() => button("ADVANCED").click());
		change("totpUrlFilter", "new.example.com");
		expect(setDirty).toHaveBeenCalledWith(true);
		expect(await save()).toMatchObject({ totp_url_filter: "new.example.com" });
		expect(onEdit.mock.calls[0][0].urlfilter).toBe("new.example.com");
	});

	it("clears the association in both the secret and datastore", async () => {
		await renderEdit(
			{ ...secret, totp_url_filter: filter },
			{ urlfilter: filter },
		);
		act(() => button("ADVANCED").click());
		change("totpUrlFilter", "");
		expect(await save()).not.toHaveProperty("totp_url_filter");
		expect(onEdit.mock.calls[0][0]).not.toHaveProperty("urlfilter");
	});

	it("does not restore stale metadata when the secret explicitly clears the filter", async () => {
		await renderEdit({ ...secret, totp_url_filter: "" }, { urlfilter: filter });
		act(() => button("ADVANCED").click());
		expect(input("totpUrlFilter").value).toBe("");
		expect(await save()).not.toHaveProperty("totp_url_filter");
		expect(onEdit.mock.calls[0][0]).not.toHaveProperty("urlfilter");
	});

	it("resets the domain filter when switching to an unassociated entry", async () => {
		await renderEdit({ ...secret, totp_url_filter: filter });
		act(() => button("ADVANCED").click());
		expect(input("totpUrlFilter").value).toBe(filter);
		await renderEdit(secret, {
			id: "another-entry",
			secret_id: "another-secret",
		});
		expect(input("totpUrlFilter").value).toBe("");
	});

	it("keeps filters read-only for read-only shared entries", async () => {
		await renderEdit(
			{ ...secret, totp_url_filter: filter },
			{
				share_rights: { read: true, write: false, grant: false, delete: false },
			},
		);
		act(() => button("ADVANCED").click());
		expect((input("totpUrlFilter") as HTMLInputElement).readOnly).toBe(true);
		expect(secretService.writeSecret).not.toHaveBeenCalled();
	});
});
