import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@mui/material/Divider";
import { Grid } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

import Table from "../../components/table";
import user from "../../services/user";
import format from "../../services/date";

const OtherSessionsView = (props) => {
    const { t } = useTranslation();
    const [sessions, setSessions] = React.useState([]);

    React.useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        user.getSessions().then(
            function (data) {
                setSessions(
                    data.map((key, index) => {
                        return [key.id, key.device_description, format(new Date(key.create_date)), key.current_session];
                    })
                );
            },
            function (error) {
                console.log(error);
            }
        );
    };

    const onDelete = (rowData) => {
        const onSuccess = function (successful) {
            loadSessions();
        };

        const onError = function (error) {
            console.log(error);
        };

        return user.deleteSession(rowData[0]).then(onSuccess, onError);
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("DEVICE") },
        { name: t("CREATED") },
        {
            name: t("CURRENT_SESSION"),
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
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: false,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            disabled={tableMeta.rowData[3]}
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
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("SESSIONS")}</h2>
                <p>{t("SESSIONS_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Table data={sessions} columns={columns} options={options} />
            </Grid>
        </Grid>
    );
};

export default OtherSessionsView;
