import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

import Table from "../../components/table";
import apiKey from "../../services/api-keys";
import EditIcon from "@mui/icons-material/Edit";
import EditApiKeysDialog from "./edit-api-keys-dialog";
import DeleteApiKeysDialog from "./delete-api-keys-dialog";
import CreateApiKeysDialog from "./create-api-keys-dialog";

const OtherApiKeysView = (props) => {
    const { t } = useTranslation();
    const [apiKeys, setApiKeys] = React.useState([]);
    const [editApiKeyId, setEditApiKeyId] = React.useState("");
    const [deleteApiKeyId, setDeleteApiKeyId] = React.useState("");
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);

    let isSubscribed = true;
    React.useEffect(() => {
        loadApiKeys();
        return () => (isSubscribed = false);
    }, []);

    const loadApiKeys = () => {
        return apiKey.readApiKeys().then(
            function (data) {
                if (!isSubscribed) {
                    return false;
                }
                setApiKeys(
                    data.api_keys.map((apiKey, index) => {
                        return [
                            apiKey.id,
                            apiKey.title,
                            apiKey.restrict_to_secrets,
                            apiKey.allow_insecure_access,
                            apiKey.read,
                            apiKey.write,
                            apiKey.active,
                        ];
                    })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const closeModal = () => {
        const onSuccess = function () {
            setEditOpen(false);
            setDeleteOpen(false);
            setCreateOpen(false);
        };

        const onError = function (error) {
            console.log(error);
        };

        return loadApiKeys().then(onSuccess, onError);
    };

    const onDelete = (rowData) => {
        setDeleteApiKeyId(rowData[0]);
        setDeleteOpen(true);
    };

    const onCreate = (rowData) => {
        setCreateOpen(true);
    };

    const onEdit = (rowData) => {
        setEditApiKeyId(rowData[0]);
        setEditOpen(true);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("TITLE") },
        {
            name: t("SECRETS_ONLY"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[2] && <CheckIcon />}</span>;
                },
            },
        },
        {
            name: t("INSECURE"),
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
            name: t("READ"),
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
            name: t("WRITE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[5] && <CheckIcon />}</span>;
                },
            },
        },
        {
            name: t("ACTIVE"),
            options: {
                filter: true,
                sort: true,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return <span>{tableMeta.rowData[6] && <CheckIcon />}</span>;
                },
            },
        },
        {
            name: t("EDIT"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onEdit(tableMeta.rowData);
                            }}
                            size="large">
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
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
                            }}
                            size="large">
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
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("API_KEYS")}</h2>
                    <p>{t("HERE_YOU_CAN_MANAGE_ALL_YOUR_API_KEYS")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Table data={apiKeys} columns={columns} options={options} onCreate={onCreate} />
                </Grid>
                {editOpen && (
                    <EditApiKeysDialog {...props} open={editOpen} onClose={closeModal} apiKeyId={editApiKeyId} />
                )}
                {deleteOpen && (
                    <DeleteApiKeysDialog {...props} open={deleteOpen} onClose={closeModal} apiKeyId={deleteApiKeyId} />
                )}
                {createOpen && <CreateApiKeysDialog {...props} open={createOpen} onClose={closeModal} />}
            </Grid>
        </>
    );
};

export default OtherApiKeysView;
