import React, { useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import datastoreUser from "../services/datastore-user";
import datastorePassword from "../services/datastore-password";
import { ClipLoader } from "react-spinners";
import DatastoreTree from "../components/datastore-tree";

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

    datastorePassword.modifyTreeForSearch(search, datastore);

    return (
        <>
            {!datastore && (
                <div className={classes.loader}>
                    <ClipLoader />
                </div>
            )}
            {datastore && <DatastoreTree datastore={datastore} search={search} />}
        </>
    );
};

UserDatastore.propTypes = {
    search: PropTypes.string.isRequired,
};

export default UserDatastore;
