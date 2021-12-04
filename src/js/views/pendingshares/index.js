import React from "react";
import { useTranslation } from "react-i18next";
import { alpha, makeStyles } from "@material-ui/core/styles";
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
    const [pendingRequests, setPendingRequests] = React.useState([]);

    React.useEffect(() => {
        loadShares();
        // cancel subscription to useEffect
        return () => (isSubscribed = false);
    }, []);

    const loadShares = function () {
        var onSuccess = function (data) {
            if (!isSubscribed) {
                return;
            }
            setPendingRequests(
                data.shares
                    .filter((request) => request.share_right_accepted === null)
                    .map((request, index) => {
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
        };
        var onError = function (data) {
            //pass
            console.log(data);
        };
        shareService.readShares().then(onSuccess, onError);
    };

    const accept = (rowData) => {
        console.log(rowData);
        // TODO implement accept

        // var modalInstance = $uibModal.open({
        //     templateUrl: 'view/modal/accept-share.html',
        //     controller: 'ModalAcceptShareCtrl',
        //     resolve: {
        //         title: function () {
        //             return 'Accept Share';
        //         },
        //         item: function () {
        //             return item;
        //         },
        //         user: function () {
        //             return {
        //                 'user_id': item.share_right_create_user_id,
        //                 'user_username': item.share_right_create_user_username
        //             };
        //         },
        //         hide_user: function () {
        //             return false;
        //         }
        //     }
        // });
        //
        // modalInstance.result.then(function (breadcrumbs) {
        //     // User clicked the prime button
        //
        //     var onSuccess = function (datastore) {
        //
        //         var analyzed_breadcrumbs = managerDatastorePassword.analyze_breadcrumbs(breadcrumbs, datastore);
        //
        //         if (item.share_right_grant === false && typeof(analyzed_breadcrumbs['parent_share_id']) !== 'undefined') {
        //             // No grant right, yet the parent is a a share?!?
        //             alert("Wups, this should not happen. Error: 781f3da7-d38b-470e-a3c8-dd5787642230");
        //         }
        //
        //         var onSuccess = function (share) {
        //
        //             if (typeof share.name === "undefined") {
        //                 share.name = item.share_right_title;
        //             }
        //
        //             var shares = [share];
        //
        //             managerDatastorePassword.create_share_links_in_datastore(shares, analyzed_breadcrumbs['target'],
        //                 analyzed_breadcrumbs['parent_path'], analyzed_breadcrumbs['path'],
        //                 analyzed_breadcrumbs['parent_share_id'], analyzed_breadcrumbs['parent_datastore_id'],
        //                 datastore, analyzed_breadcrumbs['parent_share']);
        //
        //             remove_item_from_pending_list(item, pending_shares);
        //         };
        //
        //         var onError = function (data) {
        //             //pass
        //         };
        //
        //         managerShare.accept_share_right(item.share_right_id, item.share_right_key,
        //             item.share_right_key_nonce, breadcrumbs.user.data.user_public_key
        //         ).then(onSuccess, onError);
        //     };
        //     var onError = function (data) {
        //         //pass
        //     };
        //
        //     managerDatastorePassword.get_password_datastore()
        //         .then(onSuccess, onError);
        // }, function () {
        //     // cancel triggered
        // });
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
                </Paper>
            </BaseContent>
        </Base>
    );
};

export default PendingSharesView;
