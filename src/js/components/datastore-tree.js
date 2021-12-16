import React from "react";
import PropTypes from "prop-types";
import offlineCache from "../services/offline-cache";
import DatastoreTreeItem from "./datastore-tree-item";
import DatastoreTreeFolder from "./datastore-tree-folder";

const DatastoreTree = (props) => {
    const { datastore, search, onNewFolder, onNewShare } = props;
    const offline = offlineCache.isActive();

    return (
        <div className={"tree"}>
            {datastore.folders &&
                datastore.folders
                    .filter((folder) => !folder["hidden"] && !folder["deleted"])
                    .map(function (content, i) {
                        return (
                            <DatastoreTreeFolder
                                onNewFolder={onNewFolder}
                                onNewShare={onNewShare}
                                search={search}
                                key={i}
                                content={content}
                                offline={offline}
                                isExpandedDefault={Boolean(content["is_expanded"])}
                            />
                        );
                    })}
            {datastore.items &&
                datastore.items
                    .filter((item) => !item["hidden"] && !item["deleted"])
                    .map(function (content, i) {
                        return <DatastoreTreeItem onNewShare={onNewShare} search={search} key={i} content={content} offline={offline} />;
                    })}
        </div>
    );
};

DatastoreTree.propTypes = {
    search: PropTypes.string.isRequired,
    datastore: PropTypes.object.isRequired,
    onNewFolder: PropTypes.func.isRequired,
    onNewShare: PropTypes.func,
};

export default DatastoreTree;
