import React, { useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import datastoreUser from "../services/datastore-user";
import datastorePassword from "../services/datastore-password";
import { ClipLoader } from "react-spinners";
import DatastoreTree from "../components/datastore-tree";
import widget from "../services/widget";
import DialogNewFolder from "../components/dialogs/new-folder";

const useStyles = makeStyles((theme) => ({
    loader: {
        marginTop: "30px",
        marginBottom: "30px",
        margin: "auto",
    },
}));

const UserDatastore = (props) => {
    const classes = useStyles();
    const { search } = props;
    let isSubscribed = true;
    const [datastore, setDatastore] = useState(null);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderData, setNewFolderData] = useState({});

    React.useEffect(() => {
        datastoreUser.getUserDatastore().then(onNewDatastoreLoaded);
        return () => (isSubscribed = false);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);
    };

    const onNewFolderCreate = (name) => {
        // called once someone clicked the CREATE button in the dialog closes with the new name
        setNewFolderOpen(false);
        widget.openNewFolder(newFolderData["parent"], newFolderData["path"], datastore, datastorePassword, name);
    };
    const onNewFolder = (parent, path) => {
        // called whenever someone clicks on a new folder Icon
        setNewFolderOpen(true);
        setNewFolderData({
            parent: parent,
            path: path,
        });
    };

    datastorePassword.modifyTreeForSearch(search, datastore);

    return (
        <>
            {!datastore && (
                <div className={classes.loader}>
                    <ClipLoader />
                </div>
            )}
            {datastore && <DatastoreTree datastore={datastore} search={search} onNewFolder={onNewFolder} />}
            {newFolderOpen && <DialogNewFolder open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={onNewFolderCreate} />}
        </>
    );
};

UserDatastore.propTypes = {
    search: PropTypes.string.isRequired,
};

export default UserDatastore;
