import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type { EntryItem, EntrySecretData } from "../../../types/entry-ui";
import secretService, { SecretChangedError } from "../../services/secret";
import offlineCache, {
	CACHE_REFRESH_DELAY,
} from "../../services/offline-cache";
import DialogEditEntry from "./edit-entry";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../i18n", () => ({ t: (key: string) => key }));
jest.mock("../../services/store", () => ({
	getStore: () => ({
		getState: () => ({
			user: {},
			server: { disableCallbacks: true, version: "5.4.0" },
			settingsDatastore: {},
		}),
	}),
}));
jest.mock("../../services/secret", () => {
	const actual = jest.requireActual("../../services/secret");
	Object.assign(actual.default, {
		readSecret: jest.fn(),
		writeSecret: jest.fn(),
	});
	return actual;
});
jest.mock("../../services/offline-cache", () => {
	const actual = jest.requireActual("../../services/offline-cache");
	Object.assign(actual.default, {
		isActive: jest.fn(() => false),
		canUse: jest.fn(() => false),
		markOnline: jest.fn(),
		markOffline: jest.fn(),
		releaseCacheDisplay: jest.fn(),
	});
	return actual;
});
jest.mock("../../services/file-transfer", () => ({
	...jest.requireActual("../../services/file-transfer").default,
	readShards: jest.fn().mockResolvedValue([]),
}));
jest.mock("../../services/file-repository", () => ({
	...jest.requireActual("../../services/file-repository").default,
	readFileRepositories: jest.fn().mockResolvedValue([]),
}));
jest.mock("../markdown-notes-field", () => () => null);
jest.mock("../totp-circle", () => () => null);
jest.mock("../gateway-launch-button", () => () => null);
jest.mock("./history", () => () => null);
jest.mock("./decrypt-gpg-message", () => () => null);
jest.mock("./encrypt-gpg-message", () => () => null);
jest.mock("./generate-new-gpg-key", () => () => null);
jest.mock("./generate-new-ssh-key", () => () => null);
jest.mock("./import-gpg-key-as-text", () => () => null);

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
	const element = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
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

async function saveAndClose() {
	act(() => {
		document
			.querySelector<HTMLButtonElement>('button[aria-label="SAVE_AND_CLOSE"]')!
			.click();
	});
	await act(async () => {
		Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
			.find((item) => item.textContent === "SAVE_AND_CLOSE")!
			.click();
	});
}

describe("DialogEditEntry", () => {
	let container: HTMLDivElement;
	const onEdit = jest.fn();
	const setDirty = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(offlineCache.isActive).mockReturnValue(false);
		jest.mocked(offlineCache.canUse).mockReturnValue(false);
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
		jest.useRealTimers();
	});

	async function renderEdit(
		data: EntrySecretData,
		metadata: Partial<EntryItem> = {},
		refresh?: Promise<EntrySecretData>,
		showSecondaryActions = false,
		inline = true,
	) {
		const item: EntryItem = {
			id: "entry-id",
			type: "totp",
			secret_id: "secret-id",
			secret_key: "secret-key",
			share_rights: { read: true, write: true, grant: false, delete: false },
			...metadata,
		};
		jest
			.mocked(secretService.readSecret)
			.mockImplementation(async (_id, _key, mode) =>
				mode === "refresh" && refresh ? await refresh : data,
			);
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogEditEntry
						open
						inline={inline}
						item={item}
						onClose={() => {}}
						onEdit={onEdit}
						onDeleteItem={showSecondaryActions ? jest.fn() : undefined}
						setDirty={setDirty}
						hideMoreMenu={!showSecondaryActions}
						hideLinkToEntry
						hideShowHistory={!showSecondaryActions}
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

	it("hides the URI and TOTP parameters when editing an existing TOTP", async () => {
		await renderEdit(secret);
		for (const name of [
			"totpUri",
			"totpCode",
			"totpPeriod",
			"totpDigits",
			"totpAlgorithm",
		]) {
			expect(document.querySelector(`[name="${name}"]`)).toBeNull();
		}
		change("totpTitle", "Renamed authenticator");
		expect(await save()).toMatchObject({
			...secret,
			totp_title: "Renamed authenticator",
		});
	});

	it.each([
		true,
		false,
	])("saves without closing, then saves and closes via the menu (inline: %p)", async (inline) => {
		await renderEdit(secret, {}, undefined, false, inline);
		change("totpTitle", "Saved title");
		const saved = { ...secret, totp_title: "Saved title", write_date: "new" };
		jest.mocked(secretService.readSecret).mockResolvedValue(saved);
		await save();
		expect(onEdit).toHaveBeenLastCalledWith(
			expect.objectContaining({ name: "Saved title" }),
			false,
		);
		expect(setDirty).toHaveBeenLastCalledWith(false);
		expect(input("totpTitle").value).toBe("Saved title");
		change("totpTitle", "Saved again");
		await saveAndClose();
		expect(secretService.writeSecret).toHaveBeenCalledTimes(2);
		expect(onEdit).toHaveBeenLastCalledWith(
			expect.objectContaining({ name: "Saved again" }),
			true,
		);
	});

	it("keeps History and the entry menu in place while a cached entry is verified", async () => {
		jest.useFakeTimers();
		jest.mocked(offlineCache.canUse).mockReturnValue(true);
		let finish!: (data: EntrySecretData) => void;
		const cached = { ...secret, write_date: "2026-01-01T00:00:00Z" };
		await renderEdit(
			cached,
			{},
			new Promise((resolve) => {
				finish = resolve;
			}),
			true,
		);
		const history = button("SHOW_HISTORY");
		const more = container.querySelector<HTMLButtonElement>(
			'button[aria-label="SAVE_AND_CLOSE"]',
		)!;
		expect(history.disabled).toBe(true);
		expect(more.disabled).toBe(true);
		await act(async () => {
			jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		});
		await act(async () => {
			finish({ ...cached });
		});
		expect(button("SHOW_HISTORY")).toBe(history);
		expect(container.querySelector('button[aria-label="SAVE_AND_CLOSE"]')).toBe(
			more,
		);
		expect(history.disabled).toBe(false);
		expect(more.disabled).toBe(false);
		act(() => more.click());
		expect(
			Array.from(
				document.querySelectorAll('#entry-save-menu [role="menuitem"]'),
			).map((item) => item.textContent),
		).toEqual(["SAVE_AND_CLOSE", "LINK_SHARE", "MOVE_TO_TRASH"]);
	});

	it("keeps History and the entry menu visible but disabled when offline", async () => {
		jest.mocked(offlineCache.isActive).mockReturnValue(true);
		await renderEdit(secret, {}, undefined, true);
		expect(button("SHOW_HISTORY").disabled).toBe(true);
		expect(
			container.querySelector<HTMLButtonElement>(
				'button[aria-label="SAVE_AND_CLOSE"]',
			)!.disabled,
		).toBe(true);
	});

	it("renders cached fields immediately, prevents saving during verification, and preserves drafts when the server changed", async () => {
		jest.useFakeTimers();
		jest.mocked(offlineCache.canUse).mockReturnValue(true);
		let finish!: (data: EntrySecretData) => void;
		const fresh = new Promise<EntrySecretData>((resolve) => {
			finish = resolve;
		});
		await renderEdit(
			{ ...secret, write_date: "2026-01-01T00:00:00Z" },
			{},
			fresh,
		);
		expect(input("totpTitle").value).toBe("Example account");
		expect(button("SAVE").disabled).toBe(true);
		change("totpTitle", "My unsaved title");
		await act(async () => {
			jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		});
		await act(async () => {
			finish({
				...secret,
				totp_title: "Remote title",
				write_date: "2026-02-01T00:00:00Z",
			});
		});
		expect(input("totpTitle").value).toBe("My unsaved title");
		expect(container.textContent).toContain("ENTRY_CHANGED_ON_SERVER");
		expect(button("SAVE").disabled).toBe(true);
		act(() => button("RELOAD").click());
		expect(input("totpTitle").value).toBe("Remote title");
		expect(button("SAVE").disabled).toBe(false);
	});

	it("keeps unsaved edits when the live response confirms the cached revision", async () => {
		jest.useFakeTimers();
		jest.mocked(offlineCache.canUse).mockReturnValue(true);
		let finish!: (data: EntrySecretData) => void;
		const cached = { ...secret, write_date: "2026-01-01T00:00:00Z" };
		await renderEdit(
			cached,
			{},
			new Promise((resolve) => {
				finish = resolve;
			}),
		);
		change("totpTitle", "My unsaved title");
		await act(async () => {
			jest.advanceTimersByTime(CACHE_REFRESH_DELAY);
		});
		await act(async () => {
			finish({ ...cached });
		});
		expect(input("totpTitle").value).toBe("My unsaved title");
		expect(button("SAVE").disabled).toBe(false);
		expect(container.textContent).not.toContain("ENTRY_CHANGED_ON_SERVER");
	});

	it("does not change the browsing label when the save preflight detects a newer version", async () => {
		const item = await renderEdit(secret, { name: "Original label" });
		change("totpTitle", "Unsaved label");
		jest
			.mocked(secretService.writeSecret)
			.mockRejectedValue(
				new SecretChangedError({ ...secret, totp_title: "Remote label" }),
			);
		await act(async () => button("SAVE").click());
		expect(item.name).toBe("Original label");
		expect(input("totpTitle").value).toBe("Unsaved label");
		expect(onEdit).not.toHaveBeenCalled();
		expect(container.textContent).toContain("ENTRY_CHANGED_ON_SERVER");
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
		expect(input("totpUrlFilter").readOnly).toBe(true);
		expect(secretService.writeSecret).not.toHaveBeenCalled();
	});
});
