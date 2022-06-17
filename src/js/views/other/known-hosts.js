import React from "react";
import { useTranslation } from "react-i18next";
import Divider from "@material-ui/core/Divider";
import { Grid } from "@material-ui/core";
import CheckIcon from "@material-ui/icons/Check";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";

import Table from "../../components/table";
import host from "../../services/host";

const OtherKnownHostsView = (props) => {
    const { t } = useTranslation();
    const [knownHosts, setKnownHosts] = React.useState([]);

    React.useEffect(() => {
        loadKnownHosts();
    }, []);

    const loadKnownHosts = () => {
        const knownHosts = host.getKnownHosts();
        const currentHostUrl = host.getCurrentHostUrl();
        setKnownHosts(
            knownHosts.map((knownHost, index) => {
                return [
                    knownHost.verify_key,
                    knownHost.url,
                    knownHost.verify_key.length <= 15
                        ? knownHost.verify_key
                        : knownHost.verify_key.substring(0, 20) + "...",
                    currentHostUrl === knownHost.url,
                ];
            })
        );
    };

    const onDelete = (rowData) => {
        host.deleteKnownHost(rowData[0]);
        loadKnownHosts();
    };

    const columns = [
        { name: t("ID"), options: { display: false } },
        { name: t("HOST") },
        { name: t("FINGERPRINT") },
        {
            name: t("CURRENT_HOST"),
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
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
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
        <>
            <Grid container>
                <Grid item xs={12} sm={12} md={12}>
                    <h2>{t("KNOWN_HOSTS")}</h2>
                    <p>{t("KNOWN_HOSTS_DESCRIPTION")}</p>
                    <Divider style={{ marginBottom: "20px" }} />
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                    <Table data={knownHosts} columns={columns} options={options} />
                </Grid>
            </Grid>
        </>
    );
};

export default OtherKnownHostsView;
