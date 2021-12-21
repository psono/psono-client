import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import CheckIcon from "@material-ui/icons/Check";
import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import Table from "../../components/table";
import shareService from "../../services/share";
import DialogAcceptShare from "../../components/dialogs/accept-share";

const useStyles = makeStyles((theme) => ({
    root: {
        padding: "15px",
    },
    toolbarRoot: {
        display: "flex",
    },
    button: {
        marginTop: "5px",
        marginBottom: "5px",
    },
}));

const PendingSharesView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    let isSubscribed = true;
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingRequestsDict, setPendingRequestsDict] = useState({});
    const [acceptShareOpen, setAcceptShareOpen] = useState(false);
    const [acceptShareId, setAcceptShareId] = useState("");

    React.useEffect(() => {
        loadShares();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadShares = function () {
        const onSuccess = function (data) {
            if (!isSubscribed) {
                return;
            }
            const newPendingRequestsDict = {};
            setPendingRequests(
                data.shares
                    .filter((request) => request.share_right_accepted === null)
                    .map((request, index) => {
                        newPendingRequestsDict[request.id] = request;
                        return [
                            request.id,
                            request.share_right_create_user_username,
                            request.share_right_title,
                            request.share_right_read,
                            request.share_right_write,
                            request.share_right_grant,
                            request.share_right_id,
                        ];
                    })
            );
            setPendingRequestsDict(newPendingRequestsDict);
        };
        const onError = function (data) {
            //pass
            console.log(data);
        };
        shareService.readShares().then(onSuccess, onError);
    };

    const accept = (rowData) => {
        setAcceptShareId(rowData[0]);
        setAcceptShareOpen(true);
    };

    const decline = (rowData) => {
        shareService.declineShareRight(rowData[6]).then(() => {
            loadShares();
        });
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("USERNAME") },
        { name: t("TITLE") },
        {
            name: t("READ"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[3] && <CheckIcon />}</span>;
                },
            },
        },
        {
            name: t("WRITE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[4] && <CheckIcon />}</span>;
                },
            },
        },
        {
            name: t("ADMIN"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[4] && <CheckIcon />}</span>;
                },
            },
        },
        {
            name: t("ACCEPT"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <Button
                            className={classes.button}
                            onClick={() => {
                                accept(tableMeta.rowData);
                            }}
                        >
                            {t("ACCEPT")}
                        </Button>
                    );
                },
            },
        },
        {
            name: t("DECLINE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <Button
                            className={classes.button}
                            onClick={() => {
                                decline(tableMeta.rowData);
                            }}
                        >
                            {t("DECLINE")}
                        </Button>
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
            <BaseTitle>{t("PENDING_REQUESTS")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar className={classes.toolbarRoot}>{t("PENDING_REQUESTS")}</Toolbar>
                    </AppBar>
                    <div className={classes.root}>
                        <Table data={pendingRequests} columns={columns} options={options} />
                    </div>
                    {acceptShareOpen && (
                        <DialogAcceptShare
                            item={pendingRequestsDict[acceptShareId]}
                            open={acceptShareOpen}
                            onClose={() => {
                                setAcceptShareOpen(false);
                                loadShares();
                            }}
                        />
                    )}
                </Paper>
            </BaseContent>
        </Base>
    );
};

export default PendingSharesView;
