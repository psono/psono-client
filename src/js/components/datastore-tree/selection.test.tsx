import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import type {
	DatastoreTreeActions,
	DatastoreTreeFolderNode,
	DatastoreTreeItemNode,
} from "../../../types/datastore-ui";
import DatastoreTreeFolder from "./datastore-tree-folder";
import DatastoreTreeItem from "./datastore-tree-item";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../services/store", () => ({
	getStore: () => ({ getState: () => ({ server: {} }) }),
}));
jest.mock("../../services/secret", () => ({ __esModule: true, default: {} }));
jest.mock("../entry-icon", () => ({ __esModule: true, default: () => null }));
jest.mock("../gateway-launch-button", () => ({
	__esModule: true,
	default: () => null,
}));

const folder: DatastoreTreeFolderNode = {
	id: "folder",
	name: "Folder",
	path: ["folder"],
	is_folder: true,
};
const item: DatastoreTreeItemNode = {
	id: "item",
	name: "Secret",
	path: ["folder", "item"],
	is_folder: false,
	type: "note",
	secret_id: "secret",
};
const theme = createTheme({
	palette: {
		blueBackground: { main: "#eee" },
		lightBackground: { main: "#fff" },
		greyText: { main: "#888" },
	},
});

describe("Datastore tree navigation and checkbox selection", () => {
	let container: HTMLDivElement;
	const onSelectItem = jest.fn();
	const onSelectNode = jest.fn();
	const onEditEntry = jest.fn();
	const onExpand = jest.fn();
	const onParentClick = jest.fn();
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
	function renderFolder(actions: DatastoreTreeActions = {}, expanded = false) {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<div onClick={onParentClick}>
						<DatastoreTreeFolder
							content={folder}
							nodePath={[folder]}
							offline={false}
							isExpandedDefault={expanded}
							onUpdateExpandFolderProperty={onExpand}
							onSelectItem={onSelectItem}
							isSelected={() => false}
							{...actions}
						/>
					</div>
				</ThemeProvider>,
				container,
			);
		});
	}
	function renderItem(actions: DatastoreTreeActions = {}) {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<div onClick={onParentClick}>
						<DatastoreTreeItem
							content={item}
							nodePath={[folder, item]}
							offline={false}
							onSelectItem={onSelectItem}
							isSelected={() => false}
							{...actions}
						/>
					</div>
				</ThemeProvider>,
				container,
			);
		});
	}
	function button(name: string) {
		return container.querySelector<HTMLButtonElement>(
			`button[aria-label="${name}"]`,
		)!;
	}
	function checkbox() {
		return container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
	}
	function click(element: HTMLElement) {
		act(() => {
			element.click();
		});
	}

	it("expands and collapses the folder row while multiselect is enabled", () => {
		renderFolder({ allowMultiselect: true });
		click(button("Folder"));
		expect(onExpand).toHaveBeenLastCalledWith(folder.id, false);
		expect(button("Folder").getAttribute("aria-expanded")).toBe("false");
		renderFolder({ allowMultiselect: true }, true);
		click(button("Folder"));
		expect(onExpand).toHaveBeenLastCalledWith(folder.id, true);
		expect(button("Folder").getAttribute("aria-expanded")).toBe("true");
		expect(onSelectItem).not.toHaveBeenCalled();
		expect(onParentClick).not.toHaveBeenCalled();
	});
	it("toggles the folder checkbox independently of expansion or destination selection", () => {
		renderFolder({ allowMultiselect: true, onSelectNode });
		expect(checkbox().getAttribute("aria-label")).toBe("SELECT: Folder");
		click(checkbox());
		expect(onSelectItem).toHaveBeenCalledTimes(1);
		expect(onSelectItem).toHaveBeenCalledWith(folder, folder.path);
		expect(onExpand).not.toHaveBeenCalled();
		expect(onSelectNode).not.toHaveBeenCalled();
		expect(onParentClick).not.toHaveBeenCalled();
		renderFolder({ allowMultiselect: true, isSelected: () => true });
		expect(checkbox().checked).toBe(true);
		click(checkbox());
		expect(onSelectItem).toHaveBeenCalledTimes(2);
	});
	it("allows expanding folders that cannot be selected", () => {
		renderFolder({ allowMultiselect: true, isSelectable: () => false });
		expect(checkbox().disabled).toBe(true);
		click(checkbox());
		click(button("Folder"));
		expect(onExpand).toHaveBeenCalledWith(folder.id, false);
		expect(onSelectItem).not.toHaveBeenCalled();
	});
	it("preserves normal folder navigation and folder-destination selection", () => {
		renderFolder({ onSelectNode });
		expect(checkbox()).toBeNull();
		click(button("Folder"));
		expect(onExpand).toHaveBeenCalledWith(folder.id, false);
		expect(onSelectNode).toHaveBeenCalledWith(folder, folder.path, [folder]);
		expect(onSelectItem).not.toHaveBeenCalled();
	});
	it("shows and hides checkboxes when multiselect mode changes", () => {
		renderFolder();
		expect(checkbox()).toBeNull();
		renderFolder({ allowMultiselect: true });
		expect(checkbox()).not.toBeNull();
		renderFolder({ allowMultiselect: false });
		expect(checkbox()).toBeNull();
	});
	it("selects an entry through its checkbox without opening it", () => {
		renderItem({ allowMultiselect: true, onEditEntry });
		click(checkbox());
		expect(onSelectItem).toHaveBeenCalledTimes(1);
		expect(onSelectItem).toHaveBeenCalledWith(item, item.path, [folder, item]);
		expect(onEditEntry).not.toHaveBeenCalled();
		expect(onParentClick).not.toHaveBeenCalled();
		renderItem({ allowMultiselect: true, onEditEntry, isSelected: () => true });
		expect(checkbox().checked).toBe(true);
		click(checkbox());
		expect(onSelectItem).toHaveBeenCalledTimes(2);
	});
	it("opens an entry instead of selecting it when its row is clicked in multiselect mode", () => {
		renderItem({ allowMultiselect: true, onEditEntry });
		click(button("Secret"));
		expect(onEditEntry).toHaveBeenCalledWith(item, item.path, [folder, item]);
		expect(onSelectItem).not.toHaveBeenCalled();
		expect(onParentClick).not.toHaveBeenCalled();
	});
	it("uses only the checkbox for entry selection in an API-key-style picker", () => {
		renderItem({ allowMultiselect: true });
		expect(button("Secret").disabled).toBe(true);
		click(button("Secret"));
		expect(onSelectItem).not.toHaveBeenCalled();
		click(checkbox());
		expect(onSelectItem).toHaveBeenCalledTimes(1);
	});
	it("keeps unselectable entries disabled in a picker", () => {
		renderItem({ allowMultiselect: true, isSelectable: () => false });
		expect(checkbox().disabled).toBe(true);
		click(checkbox());
		click(button("Secret"));
		expect(onSelectItem).not.toHaveBeenCalled();
	});
	it("preserves the entry row action outside multiselect mode", () => {
		renderItem();
		expect(checkbox()).toBeNull();
		click(button("Secret"));
		expect(onSelectItem).toHaveBeenCalledWith(item, item.path, [folder, item]);
	});
});
