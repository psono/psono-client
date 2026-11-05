import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import type { Datastore, DatastoreItem } from "../../../types/datastore";
import datastorePassword from "../../services/datastore-password";
import DialogSelectSecret from "./select-secret";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../services/datastore-password", () => ({
	__esModule: true,
	default: { getPasswordDatastore: jest.fn() },
}));
jest.mock("../search", () => ({ __esModule: true, default: () => null }));
// A flat stand-in for the tree: one checkbox per folder and entry, wired like the real rows.
jest.mock("../datastore-tree", () => ({
	__esModule: true,
	default: (props: {
		datastore: Datastore;
		isSelected: (node: DatastoreItem) => boolean;
		onSelectItem: (node: DatastoreItem) => void;
	}) => {
		const rows: DatastoreItem[] = [];
		const walk = (node: Datastore) => {
			(node.folders || []).forEach((f) => {
				rows.push(f as DatastoreItem);
				walk(f);
			});
			(node.items || []).forEach((i) => rows.push(i as DatastoreItem));
		};
		walk(props.datastore);
		return (
			<div>
				{rows.map((row) => (
					<input
						key={row.id}
						type="checkbox"
						data-id={row.id}
						checked={props.isSelected(row)}
						onChange={() => props.onSelectItem(row)}
					/>
				))}
			</div>
		);
	},
}));

const theme = createTheme({
	palette: {
		checked: { main: "#0a0" },
		greyText: { main: "#888" },
		lightBackground: { main: "#fff" },
	},
});

const entry = (id: string, secretId = `secret-${id}`) =>
	({ id, name: id, secret_id: secretId, secret_key: "key" }) as DatastoreItem;

const tree = {
	folders: [
		{
			id: "root",
			name: "Root",
			items: [entry("a")],
			folders: [
				{
					id: "sub",
					name: "Sub",
					items: [entry("b"), entry("c"), { ...entry("gone"), deleted: true }],
				},
				{ id: "empty", name: "Empty" },
			],
		},
	],
	items: [],
} as unknown as Datastore;

describe("Component: DialogSelectSecret", () => {
	let container: HTMLDivElement;
	const onSelectItems = jest.fn();

	const mount = async (datastore: Datastore = tree) => {
		jest
			.mocked(datastorePassword.getPasswordDatastore)
			.mockResolvedValue(datastore);
		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<DialogSelectSecret
						open={true}
						onClose={jest.fn()}
						onSelectItems={onSelectItems}
					/>
				</ThemeProvider>,
				container,
			);
		});
	};

	beforeEach(() => {
		jest.clearAllMocks();
		container = document.createElement("div");
		document.body.appendChild(container);
	});
	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	const box = (id: string) =>
		document.body.querySelector<HTMLInputElement>(`input[data-id="${id}"]`)!;
	const toggle = (id: string) =>
		act(() => {
			box(id).click();
		});
	const confirm = () =>
		act(() => {
			[...document.body.querySelectorAll("button")]
				.find((b) => b.textContent === "CONFIRM")!
				.click();
		});
	const confirmed = () =>
		(onSelectItems.mock.calls[0][0] as DatastoreItem[])
			.map((i) => i.secret_id)
			.sort();

	it("checking a folder checks its entries, sub folders and their entries", async () => {
		await mount();
		toggle("root");

		["root", "sub", "a", "b", "c"].forEach((id) =>
			expect(box(id).checked).toBe(true),
		);
		confirm();
		expect(confirmed()).toEqual(["secret-a", "secret-b", "secret-c"]);
	});

	it("checking a sub folder leaves the folder above unchecked", async () => {
		await mount();
		toggle("sub");

		expect(box("sub").checked).toBe(true);
		expect(box("b").checked).toBe(true);
		expect(box("root").checked).toBe(false);
		expect(box("a").checked).toBe(false);
	});

	it("unchecking one entry unchecks the folders above it and keeps the others", async () => {
		await mount();
		toggle("root");
		toggle("b");

		expect(box("b").checked).toBe(false);
		expect(box("sub").checked).toBe(false);
		expect(box("root").checked).toBe(false);
		expect(box("a").checked).toBe(true);
		expect(box("c").checked).toBe(true);
		confirm();
		expect(confirmed()).toEqual(["secret-a", "secret-c"]);
	});

	it("unchecking a checked folder unchecks everything inside", async () => {
		await mount();
		toggle("root");
		toggle("root");

		["root", "sub", "a", "b", "c"].forEach((id) =>
			expect(box(id).checked).toBe(false),
		);
		confirm();
		expect(confirmed()).toEqual([]);
	});

	it("ignores deleted entries and has nothing to select in an empty folder", async () => {
		await mount();
		toggle("empty");
		expect(box("empty").checked).toBe(false);
		toggle("sub");
		confirm();
		expect(confirmed()).toEqual(["secret-b", "secret-c"]);
	});

	it("an entry that sits in several folders is one selection, checked everywhere", async () => {
		await mount({
			folders: [
				{ id: "f1", name: "F1", items: [entry("x", "same")] },
				{ id: "f2", name: "F2", items: [entry("y", "same")] },
			],
			items: [],
		} as unknown as Datastore);
		toggle("f1");

		["f1", "x", "f2", "y"].forEach((id) => expect(box(id).checked).toBe(true));
		confirm();
		expect(confirmed()).toEqual(["same"]);
	});
});
