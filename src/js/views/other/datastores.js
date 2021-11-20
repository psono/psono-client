import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Grid } from "@material-ui/core";
import CheckIcon from "@material-ui/icons/Check";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

import actionCreators from "../../actions/action-creators";
import Table from "../../components/table";
import datastore from "../../services/datastore";
import EditIcon from "@material-ui/icons/Edit";
import EditDatastoresDialog from "./edit-datastores-dialog";
import DeleteDatastoresDialog from "./delete-datastores-dialog";
import CreateDatastoresDialog from "./create-datastores-dialog";

const OtherDatastoresView = (props) => {
    const { t } = useTranslation();
    const [datastores, setDatastores] = React.useState([]);
    const [editDatastoreId, setEditDatastoreId] = React.useState("");
    const [editDatastoreDescription, setEditDatastoreDescription] = React.useState("");
    const [editDatastoreIsDefault, setEditDatastoreIsDefault] = React.useState(false);
    const [deleteDatastoreId, setDeleteDatastoreId] = React.useState("");
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);

    React.useEffect(() => {
        loadDatastores();
    }, []);

    const loadDatastores = () => {
        return datastore.getDatastoreOverview(true).then(
            function (overview) {
                setDatastores(
                    overview.data.datastores
                        .filter((datastore) => datastore["type"] === "password")
                        .map((datastore, index) => {
                            return [datastore.id, datastore.description, datastore.is_default];
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

        return loadDatastores().then(onSuccess, onError);
    };

    const onDelete = (rowData) => {
        setDeleteDatastoreId(rowData[0]);
        setDeleteOpen(true);
    };

    const onCreate = (rowData) => {
        setCreateOpen(true);
    };

    const onEdit = (rowData) => {
        setEditDatastoreId(rowData[0]);
        setEditDatastoreDescription(rowData[1]);
        setEditDatastoreIsDefault(rowData[2]);
        setEditOpen(true);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("DESCRIPTION") },
        {
            name: t("DEFAULT"),
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
            name: t("EDIT"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onEdit(tableMeta.rowData);
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
                                onDelete(tableMeta.rowData);
                            }}
                            disabled={tableMeta.rowData[2]}
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
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("DATASTORES")}</h2>
                    <p>{t("HERE_YOU_CAN_MANAGE_ALL_YOUR_PASSWORD_DATASTORES")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Table data={datastores} columns={columns} options={options} onCreate={onCreate} />
                </Grid>
                {editOpen && (
                    <EditDatastoresDialog
                        {...props}
                        open={editOpen}
                        onClose={closeModal}
                        datastoreId={editDatastoreId}
                        description={editDatastoreDescription}
                        isDefault={editDatastoreIsDefault}
                    />
                )}
                {deleteOpen && <DeleteDatastoresDialog {...props} open={deleteOpen} onClose={closeModal} datastoreId={deleteDatastoreId} />}
                {createOpen && <CreateDatastoresDialog {...props} open={createOpen} onClose={closeModal} />}
            </Grid>
        </>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(OtherDatastoresView);
