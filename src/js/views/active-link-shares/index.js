import React from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import Table from "../../components/table";
import linkShareService from "../../services/link-share";
import format from "../../services/date";
import EditActiveLinksShareDialog from "./edit-active-links-share-dialog";

const useStyles = makeStyles((theme) => ({
    root: {
        padding: "15px",
    },
    toolbarRoot: {
        display: "flex",
    },
}));

const ActiveLinkShareView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    let isSubscribed = true;
    const [activeLinkShares, setActiveLinkShares] = React.useState([]);
    const [editOpen, setEditOpen] = React.useState(false);
    const [editLinkShare, setEditLinkShare] = React.useState({});
    const [linkShares, setLinkShares] = React.useState({});

    React.useEffect(() => {
        loadActiveLinkShares();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadActiveLinkShares = function () {
        const onSuccess = function (newActiveLinkShares) {
            if (!isSubscribed) {
                return;
            }
            const newLinkShares = {};
            setActiveLinkShares(
                newActiveLinkShares.link_shares.map((linkShare, index) => {
                    newLinkShares[linkShare.id] = linkShare;
                    return [linkShare.id, linkShare.public_title, linkShare.valid_till ? format(new Date(linkShare.valid_till)) : "", linkShare.allowed_reads];
                })
            );
            console.log(newLinkShares);
            setLinkShares(newLinkShares);
        };
        const onError = function (data) {
            //pass
            console.log(data);
        };
        return linkShareService.readLinkShares().then(onSuccess, onError);
    };

    const onEditLinkShare = (tableMeta) => {
        setEditLinkShare(linkShares[tableMeta.rowData[0]]);
        setEditOpen(true);
    };

    const onDeleteLinkShare = (tableMeta) => {
        const onSuccess = function () {
            return loadActiveLinkShares();
        };

        const onError = function (error) {
            console.log(error);
        };
        linkShareService.deleteLinkShare(tableMeta.rowData[0]).then(onSuccess, onError);
    };

    const onCloseEditModal = () => {
        const onSuccess = function () {
            setEditOpen(false);
        };

        const onError = function (error) {
            console.log(error);
        };

        return loadActiveLinkShares().then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("PUBLIC_TITLE") },
        { name: t("VALID_TILL") },
        { name: t("ALLOWED_USAGE") },
        {
            name: t("EDIT"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onEditLinkShare(tableMeta);
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    );
                },
            },
        },
        {
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDeleteLinkShare(tableMeta);
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
    };

    return (
        <Base {...props}>
            <BaseTitle>{t("ACTIVE_LINK_SHARES")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar className={classes.toolbarRoot}>{t("ACTIVE_LINK_SHARES")}</Toolbar>
                    </AppBar>
                    <div className={classes.root}>
                        <Table data={activeLinkShares} columns={columns} options={options} />
                    </div>
                </Paper>
                {editOpen && <EditActiveLinksShareDialog {...props} open={editOpen} onClose={onCloseEditModal} linkShare={editLinkShare} />}
            </BaseContent>
        </Base>
    );
};

export default ActiveLinkShareView;
