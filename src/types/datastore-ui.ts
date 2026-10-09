import type {
	Datastore,
	DatastoreFolder,
	DatastoreItem,
	DatastorePath,
} from "./datastore";

/** The tree adds these fields to visible nodes before handing them to react-window. */
export type DatastoreTreeFolderNode = DatastoreFolder & {
	path: DatastorePath;
	is_folder: true;
	color?: string | null;
};

export type DatastoreTreeItemNode = DatastoreItem & {
	path: DatastorePath;
	is_folder: false;
};

export type DatastoreTreeNode = DatastoreTreeFolderNode | DatastoreTreeItemNode;
export type DatastoreNodePath = DatastoreItem[];
export type DatastoreFilters = Record<string, boolean>;

export interface ContextMenuPosition {
	mouseX: number | null;
	mouseY: number | null;
}

export type DatastoreNodeAction<T extends Datastore = DatastoreItem> = (
	node: T,
	path: DatastorePath,
	nodePath?: DatastoreNodePath,
) => void;

export interface DatastoreTreeActions {
	onNewFolder?: DatastoreNodeAction<Datastore>;
	onNewUser?: DatastoreNodeAction<Datastore>;
	onNewEntry?: DatastoreNodeAction<Datastore>;
	onShare?: DatastoreNodeAction;
	onLinkShare?: DatastoreNodeAction;
	onEditEntry?: DatastoreNodeAction;
	onCloneEntry?: DatastoreNodeAction;
	onDeleteEntry?: DatastoreNodeAction;
	onMoveEntry?: DatastoreNodeAction;
	onEditFolder?: DatastoreNodeAction<DatastoreFolder>;
	onDeleteFolder?: DatastoreNodeAction<DatastoreFolder>;
	onMoveFolder?: DatastoreNodeAction<DatastoreFolder>;
	onLinkItem?: DatastoreNodeAction;
	onSelectItem?: DatastoreNodeAction<DatastoreTreeNode>;
	onSelectNode?: (
		node: DatastoreTreeFolderNode,
		path: DatastorePath,
		nodePath: DatastoreNodePath,
	) => void;
	isSelected?: (node: DatastoreTreeNode) => boolean;
	isSelectable?: (node: DatastoreTreeNode) => boolean;
	allowMultiselect?: boolean;
	hideItems?: boolean;
	deleteFolderLabel?: string;
	deleteItemLabel?: string;
}

export interface DatastoreTreeProps extends DatastoreTreeActions {
	datastore: Datastore;
	setDatastore: (datastore: Datastore) => void;
	search?: string;
	selectedFilters?: DatastoreFilters;
	showImportAction?: boolean;
	datastoreContext?: "default" | "trusted-users" | "share";
}

export interface DatastoreTreeListData {
	props: DatastoreTreeProps;
	offline: boolean;
	datastore: Datastore;
	items: DatastoreTreeNode[];
	getIsExpandedFolder: (folder: Datastore) => boolean;
	onUpdateExpandFolderProperty: (id: string, isExpanded: boolean) => void;
}

export interface DatastoreSelection<T extends DatastoreItem = DatastoreItem> {
	item: T;
	path: DatastorePath;
}

export interface FolderSelection {
	id_breadcrumbs: DatastorePath;
	path: DatastoreNodePath;
}
