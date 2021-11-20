import React, { useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import datastorePassword from "../services/datastore-password";
import { ClipLoader } from "react-spinners";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
    },
    loader: {
        marginTop: "30px",
        marginBottom: "30px",
        margin: "auto",
    },
}));

const PasswordDatastore = (props) => {
    const classes = useStyles();
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        console.log(data);
    };

    return (
        <div className={classes.root}>
            {loading && (
                <div className={classes.loader}>
                    <ClipLoader />
                </div>
            )}
        </div>
    );
};

PasswordDatastore.propTypes = {
    search: PropTypes.string.isRequired,
};

export default PasswordDatastore;
