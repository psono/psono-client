import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import { makeStyles } from "@material-ui/core/styles";
import DatastoreTreeFolder from "./datastore-tree-folder";
import DatastoreTreeItem from "./datastore-tree-item";

const useStyles = makeStyles((theme) => ({
    virtualizedElement: {
        display: 'flex',
        flexDirection: 'row',
    },
    nestingDecorator: {
        position: 'relative',
        paddingLeft: 22,

        '&:before': {
            display: 'inline-block',
            content: '""',
            position: 'absolute',
            top: -23,
            bottom: 24,
            left: 9,
            border: 'dotted #151f2b',
            borderWidth: '0 0 0 1px',
            zIndex: 1,
        }
    },
    nestingDecoratorFirst: {
        '&:before': {
            top: -10,
        }
    },
}));

const DatastoreTreeVirtualElement = ({ index, style, data }) => {
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

    const isFirstInFolder = items[index - 1]?.path?.length < content.path.length;

    function getNodePathById(id, path, datastore, nodePath, index = -1) {
        if (path[index] && (path[index] === datastore.id)) {
            nodePath.push(datastore);
        }

        if (datastore.folders) {
            datastore.folders.forEach(item => getNodePathById(id, path, item, nodePath, index + 1))
        }

        if (datastore.items) {
            datastore.items.forEach(item => getNodePathById(id, path, item, nodePath, index + 1))
        }

        return nodePath;
    }

    const nodePath = getNodePathById(content.id, content.path, datastore, [], -1);

    return (
        <div className={classes.virtualizedElement} style={style}>
            {content.path.map((item, index, items) => (
                <div
                    key={item}
                    className={cx({
                        [classes.nestingDecorator]: true,
                        [classes.nestingDecoratorFirst]: (
                            isFirstInFolder && ((index + 1) === items.length)
                        ),
                    })}
                />
            ))}
            <div style={{ flex: 1 }}>
                {(content.is_folder)
                    ? (
                        <DatastoreTreeFolder
                            isSelectable={props.isSelectable}
                            hideItems={props.hideItems}
                            onSelectItem={props.onSelectItem}
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
                            onNewShare={props.onNewShare}
                            onLinkShare={props.onLinkShare}
                            onRightsOverview={props.onRightsOverview}
                            onUpdateExpandFolderProperty={onUpdateExpandFolderProperty}
                            key={content.id}
                            nodePath={nodePath}
                            content={content}
                            offline={offline}
                            isExpandedDefault={Boolean(isExpanded)}
                            deleteFolderLabel={props.deleteFolderLabel}
                            deleteItemLabel={props.deleteItemLabel}
                        />
                    )
                    : (
                        <DatastoreTreeItem
                            isSelectable={props.isSelectable}
                            onSelectItem={props.onSelectItem}
                            onEditEntry={props.onEditEntry}
                            onCloneEntry={props.onCloneEntry}
                            onDeleteEntry={props.onDeleteEntry}
                            onMoveEntry={props.onMoveEntry}
                            onLinkItem={props.onLinkItem}
                            onNewShare={props.onNewShare}
                            onLinkShare={props.onLinkShare}
                            onRightsOverview={props.onRightsOverview}
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

DatastoreTreeVirtualElement.propTypes = {
    index: PropTypes.number.isRequired,
    style: PropTypes.object.isRequired,
    data: PropTypes.shape({
        items: PropTypes.array.isRequired,
        props: PropTypes.object.isRequired,
        offline: PropTypes.bool.isRequired,
        datastore: PropTypes.object.isRequired,
        onUpdateExpandFolderProperty: PropTypes.func.isRequired,
        getIsExpandedFolder: PropTypes.func.isRequired,
    }).isRequired,
};

export default DatastoreTreeVirtualElement;
