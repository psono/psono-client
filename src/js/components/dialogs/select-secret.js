import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";

import { Grid } from "@material-ui/core";

import DatastoreTree from "../datastore-tree";
import datastorePassword from "../../services/datastore-password";
import Search from "../search";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
    },
    checked: {
        color: "#9c27b0",
    },
    checkedIcon: {
        width: "20px",
        height: "20px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    uncheckedIcon: {
        width: "0px",
        height: "0px",
        padding: "9px",
        border: "1px solid #666",
        borderRadius: "3px",
    },
    tree: {
        marginTop: "8px",
        marginBottom: "8px",
    },
    search: {
        backgroundColor: theme.palette.common.white,
        position: "absolute",
        right: "28px",
        top: theme.spacing(2),
    },
}));

const DialogSelectSecret = (props) => {
    const { open, onClose, onSelectItems, isSelectable } = props;
    const { t } = useTranslation();
    const classes = useStyles();

    const [selected, setSelected] = useState({});
    const [search, setSearch] = useState("");
    const [datastore, setDatastore] = useState(null);

    let isSubscribed = true;
    React.useEffect(() => {
        datastorePassword.getPasswordDatastore().then(onNewDatastoreLoaded);
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const onNewDatastoreLoaded = (data) => {
        if (!isSubscribed) {
            return;
        }
        setDatastore(data);
    };

    const isSelected = (item) => {
        return selected.hasOwnProperty(item.id);
    }

    const onSelectItem = (item) => {
        const newSelected = {...selected };
        if (isSelected(item)) {
            delete newSelected[item.id];
        } else {
            newSelected[item.id] = item
        }
        setSelected(newSelected);
    }

    return (
        <Dialog
            fullWidth
            maxWidth={"sm"}
            open={open}
            onClose={() => {
                onClose();
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {t("ADD_SECRET_TO_API_KEY")}
                <div className={classes.search}>
                    <Search
                        value={search}
                        onChange={(newValue) => {
                            setSearch(newValue)
                        }}
                    />
                </div>
            </DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item xs={12} sm={12} md={12} className={classes.tree}>
                        {datastore && (
                            <DatastoreTree
                                datastore={datastore}
                                setDatastore={setDatastore}
                                onSelectItem={onSelectItem}
                                isSelected={isSelected}
                                allowMultiselect={true}
                                isSelectable={isSelectable}
                                search={search}
                                deleteFolderLabel={t('DELETE')}
                                deleteItemLabel={t('DELETE')}
                            />
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onClose();
                    }}
                >
                    {t("CLOSE")}
                </Button>
                <Button onClick={() => {onSelectItems(Object.values(selected))}} variant="contained" color="primary">
                    {t("CONFIRM")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DialogSelectSecret.propTypes = {
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    onSelectItems: PropTypes.func.isRequired,
    isSelectable: PropTypes.func,
};

export default DialogSelectSecret;
