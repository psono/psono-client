import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Grid } from "@material-ui/core";
import CheckIcon from "@material-ui/icons/Check";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import Button from "@material-ui/core/Button";

import Table from "../../components/table";
import fileRepositoryService from "../../services/file-repository";
import EditFileRepositoriesDialog from "./edit-file-repositories-dialog";
import DeleteFileRepositoriesDialog from "./delete-file-repositories-dialog";
import CreateFileRepositoriesDialog from "./create-file-repositories-dialog";
import DialogVerify from "../../components/dialogs/verify";

const OtherFileRepositoriesView = (props) => {
    const { t } = useTranslation();
    const [fileRepositories, setFileRepositories] = React.useState([]);
    const [editFileRepositoryId, setEditFileRepositoryId] = React.useState("");
    const [deleteFileRepositoryId, setDeleteFileRepositoryId] = React.useState("");
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [declineFileRepository, setDeclineFileRepository] = React.useState(null);

    React.useEffect(() => {
        loadFileRepositories();
    }, []);

    const loadFileRepositories = () => {
        return fileRepositoryService.readFileRepositories().then(
            setFileRepositories,
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

        return loadFileRepositories().then(onSuccess, onError);
    };

    const onDelete = (rowData) => {
        setDeleteFileRepositoryId(rowData[0]);
        setDeleteOpen(true);
    };

    const onCreate = (rowData) => {
        setCreateOpen(true);
    };

    const onEdit = (rowData) => {
        setEditFileRepositoryId(rowData[0]);
        setEditOpen(true);
    };

    const accept = (rowData) => {
        const fileRepository = fileRepositories.find((fileRepository) => fileRepository.id === rowData[0]);

        const onSuccess = function(){
            loadFileRepositories();
        };

        const onError = function() {
            //pass
        };

        fileRepositoryService.accept(fileRepository.file_repository_right_id)
            .then(onSuccess, onError);
    };

    const decline = () => {
        const localDeclineFileRepository = declineFileRepository
        setDeclineFileRepository(null)

        const onSuccess = function(){
            loadFileRepositories();
        };

        const onError = function() {
            //pass
        };

        fileRepositoryService.decline(localDeclineFileRepository.file_repository_right_id)
            .then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("TITLE") },
        { name: t("TYPE") },
        {
            name: t("ACTIVE"),
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
                            disabled={!tableMeta.rowData[4]}
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
                            disabled={!tableMeta.rowData[4]}
                        >
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        },
        {
            name: "",
            options: {
                filter: true,
                sort: false,
                empty: false,
                customBodyRender: (value, tableMeta, updateValue) => {
                    if (tableMeta.rowData[4]) {
                        return (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setDeclineFileRepository(fileRepositories.find((fileRepository) => fileRepository.id === tableMeta.rowData[0]));
                                }}
                            >
                                {t("DECLINE")}
                            </Button>
                        );
                    } else {
                        return (
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    accept(tableMeta.rowData);
                                }}
                            >
                                {t("ACCEPT")}
                            </Button>
                        );
                    }
                },
            },
        },
    ];

    const options = {
        filterType: "checkbox",
    };

    const data = fileRepositories.map((fileRepository, index) => {
            return [
                fileRepository.id,
                fileRepository.title,
                fileRepository.type,
                fileRepository.active,
                fileRepository.accepted,
            ];
        })

    return (
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("FILE_REPOSITORIES")}</h2>
                    <p>{t("HERE_YOU_CAN_MANAGE_ALL_YOUR_FILE_REPOSITORIES")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Table data={data} columns={columns} options={options} onCreate={onCreate} />
                </Grid>
                {editOpen && (
                    <EditFileRepositoriesDialog
                        {...props}
                        open={editOpen}
                        onClose={closeModal}
                        fileRepositoryId={editFileRepositoryId}
                    />
                )}
                {deleteOpen && (
                    <DeleteFileRepositoriesDialog
                        {...props}
                        open={deleteOpen}
                        onClose={closeModal}
                        fileRepositoryId={deleteFileRepositoryId}
                    />
                )}
                {createOpen && <CreateFileRepositoriesDialog {...props} open={createOpen} onClose={closeModal} />}
                {Boolean(declineFileRepository) && (
                    <DialogVerify
                        title={"DELETE_FILE_REPOSITORY_RIGHT"}
                        description={"DELETE_FILE_REPOSITORY_RIGHT_WARNING"}
                        open={Boolean(declineFileRepository)}
                        entries={[declineFileRepository.title]}
                        affectedEntriesText={"AFFECTED_FILE_REPOSITORIES"}
                        onClose={() => setDeclineFileRepository(null)}
                        onConfirm={decline}
                    />
                )}
            </Grid>
        </>
    );
};

export default OtherFileRepositoriesView;
