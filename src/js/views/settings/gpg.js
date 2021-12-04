import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from "@material-ui/core/styles";
import { useSelector } from "react-redux";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import { Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import action from "../../actions/bound-action-creators";
import datastoreSettingService from "../../services/datastore-setting";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
    },
}));

const SettingsGpgView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [gpgDefaultKey, setGpgDefaultKey] = useState(settingsDatastore.gpgDefaultKey);
    const [gpgHkpKeyServer, setGpgHkpKeyServer] = useState(settingsDatastore.gpgHkpKeyServer);
    const [gpgHkpSearch, setGpgHkpSearch] = useState(settingsDatastore.gpgHkpSearch);

    const save = (event) => {
        action.setGpgConfig(
            gpgDefaultKey, // TODO replace TextField for gpgDefaultKey with a dropdown that searches the datastore for GPG keys
            gpgHkpKeyServer,
            gpgHkpSearch
        );
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("PASSWORD_GENERATOR")}</h2>
                <p>{t("PASSWORD_GENERATOR_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="gpgDefaultKey"
                    label={t("DEFAULT_KEY")}
                    name="gpgDefaultKey"
                    autoComplete="gpgDefaultKey"
                    value={gpgDefaultKey}
                    onChange={(event) => {
                        setGpgDefaultKey(event.target.value);
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="gpgHkpKeyServer"
                    label={t("HKP_SERVER")}
                    name="gpgHkpKeyServer"
                    autoComplete="gpgHkpKeyServer"
                    value={gpgHkpKeyServer}
                    onChange={(event) => {
                        setGpgHkpKeyServer(event.target.value);
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="gpgHkpSearch"
                    label={t("AUTOSEARCH_HKP")}
                    name="gpgHkpSearch"
                    autoComplete="gpgHkpSearch"
                    value={gpgHkpSearch}
                    onChange={(event) => {
                        setGpgHkpSearch(event.target.value);
                    }}
                />
            </Grid>
            <Grid container style={{ marginBottom: "8px" }}>
                <Grid item xs={12} sm={12} md={12}>
                    <Button variant="contained" color="primary" onClick={save}>
                        {t("SAVE")}
                    </Button>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default SettingsGpgView;
