import { makeStyles } from "@mui/styles";
import cx from "classnames";
import React from "react";
import type { ListChildComponentProps } from "react-window";
import type { Datastore } from "../../../types/datastore";
import type {
	DatastoreTreeListData,
	DatastoreNodePath,
} from "../../../types/datastore-ui";
import DatastoreTreeFolder from "./datastore-tree-folder";
import DatastoreTreeItem from "./datastore-tree-item";

const useStyles = makeStyles((theme) => ({
	virtualizedElement: {
		display: "flex",
		flexDirection: "row",
	},
	nestingDecorator: {
		position: "relative",
		paddingLeft: 22,

		"&:before": {
			display: "inline-block",
			content: '""',
			position: "absolute",
			top: -23,
			bottom: 24,
			left: 9,
			border: `dotted ${theme.palette.blueBackground.main}`,
			borderWidth: "0 0 0 1px",
			zIndex: 1,
		},
	},
	nestingDecoratorFirst: {
		"&:before": {
			top: -10,
		},
	},
}));

const DatastoreTreeVirtualElement = ({
	index,
	style,
	data,
}: ListChildComponentProps<DatastoreTreeListData>) => {
	const classes = useStyles();

	const {
		items,
		props,
		offline,
		datastore,
		getIsExpandedFolder,
		onUpdateExpandFolderProperty,
	} = data;
	const content = items[index];

	const isExpanded = getIsExpandedFolder(content);

	// Keep undefined < length false for the first row, as in the JS comparison.
	const isFirstInFolder = items[index - 1]?.path?.length! < content.path.length;

	// Descendant IDs are shared between folder aliases. Follow the complete
	// location path instead of collecting matching IDs from unrelated branches.
	const nodePath: DatastoreNodePath = [];
	let parent: Datastore = datastore;
	for (const id of content.path) {
		const node =
			parent.folders?.find((folder) => folder.id === id) ||
			parent.items?.find((item) => item.id === id);
		if (!node) break;
		nodePath.push(node);
		parent = node;
	}

	return (
		<div className={classes.virtualizedElement} style={style}>
			{content.path.map((item, index, items) => (
				<div
					key={item}
					className={cx({
						[classes.nestingDecorator]: true,
						[classes.nestingDecoratorFirst]:
							isFirstInFolder && index + 1 === items.length,
					})}
				/>
			))}
			<div style={{ flex: 1, minWidth: 0 }}>
				{content.is_folder ? (
					<DatastoreTreeFolder
						onLinkEntry={props.onLinkEntry}
						isSelectable={props.isSelectable}
						hideItems={props.hideItems}
						onSelectItem={props.onSelectItem}
						isSelected={props.isSelected}
						allowMultiselect={props.allowMultiselect}
						onSelectNode={props.onSelectNode}
						onEditFolder={props.onEditFolder}
						onEditEntry={props.onEditEntry}
						onCloneEntry={props.onCloneEntry}
						onDeleteEntry={props.onDeleteEntry}
						onMoveEntry={props.onMoveEntry}
						onDeleteFolder={props.onDeleteFolder}
						onMoveFolder={props.onMoveFolder}
						onLinkItem={props.onLinkItem}
						onNewFolder={props.onNewFolder}
						onNewUser={props.onNewUser}
						onNewEntry={props.onNewEntry}
						onShare={props.onShare}
						onLinkShare={props.onLinkShare}
						onUpdateExpandFolderProperty={onUpdateExpandFolderProperty}
						key={content.id}
						nodePath={nodePath}
						content={content}
						offline={offline}
						isExpandedDefault={Boolean(isExpanded)}
						deleteFolderLabel={props.deleteFolderLabel}
						deleteItemLabel={props.deleteItemLabel}
					/>
				) : (
					<DatastoreTreeItem
						onLinkEntry={props.onLinkEntry}
						isSelectable={props.isSelectable}
						onSelectItem={props.onSelectItem}
						isSelected={props.isSelected}
						allowMultiselect={props.allowMultiselect}
						onEditEntry={props.onEditEntry}
						onCloneEntry={props.onCloneEntry}
						onDeleteEntry={props.onDeleteEntry}
						onMoveEntry={props.onMoveEntry}
						onLinkItem={props.onLinkItem}
						onShare={props.onShare}
						onLinkShare={props.onLinkShare}
						key={content.id}
						nodePath={nodePath}
						content={content}
						offline={offline}
						deleteItemLabel={props.deleteItemLabel}
					/>
				)}
			</div>
		</div>
	);
};

export default DatastoreTreeVirtualElement;
