import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';
import { useSelector } from "react-redux";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import { Checkbox, Grid } from "@mui/material";
import { Check } from "@mui/icons-material";
import Button from "@mui/material/Button";
import action from "../../actions/bound-action-creators";
import SelectFieldGpgKey from "../../components/select-field/gpg-key";

const useStyles = makeStyles((theme) => ({
    textField: {
        width: "100%",
        [theme.breakpoints.up("md")]: {
            width: "440px",
        },
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
}));

const SettingsGpgView = (props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const settingsDatastore = useSelector((state) => state.settingsDatastore);
    const [gpgDefaultKey, setGpgDefaultKey] = useState(settingsDatastore.gpgDefaultKey);
    const [gpgHkpKeyServer, setGpgHkpKeyServer] = useState(settingsDatastore.gpgHkpKeyServer);
    const [gpgHkpSearch, setGpgHkpSearch] = useState(settingsDatastore.gpgHkpSearch);

    const save = (event) => {
        let newGpgDefaultKey = null;
        if (gpgDefaultKey) {
            newGpgDefaultKey = {
                id: gpgDefaultKey.id,
                label: gpgDefaultKey.label,
            };
        }
        action().setGpgConfig(newGpgDefaultKey, gpgHkpKeyServer, gpgHkpSearch);
    };
    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <h2>{t("GPG")}</h2>
                <p>{t("GPG_DESCRIPTION")}</p>
                <Divider style={{ marginBottom: "20px" }} />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <SelectFieldGpgKey
                    className={classes.textField}
                    variant="outlined"
                    margin="dense" size="small"
                    id="gpgDefaultKey"
                    label={"DEFAULT_KEY"}
                    value={gpgDefaultKey}
                    onChange={(value) => {
                        setGpgDefaultKey(value);
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense" size="small"
                    id="gpgHkpKeyServer"
                    label={t("HKP_SERVER")}
                    name="gpgHkpKeyServer"
                    autoComplete="off"
                    value={gpgHkpKeyServer}
                    onChange={(event) => {
                        setGpgHkpKeyServer(event.target.value);
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
                <Checkbox
                    checked={gpgHkpSearch}
                    onChange={(event) => {
                        setGpgHkpSearch(event.target.value);
                    }}
                    checkedIcon={<Check className={classes.checkedIcon} />}
                    icon={<Check className={classes.uncheckedIcon} />}
                    classes={{
                        checked: classes.checked,
                    }}
                />{" "}
                {t("AUTOSEARCH_HKP")}
            </Grid>
            <Grid item xs={12} sm={12} md={12} style={{ marginBottom: "8px", marginTop: "8px" }}>
                <Button variant="contained" color="primary" onClick={save}>
                    {t("SAVE")}
                </Button>
            </Grid>
        </Grid>
    );
};

export default SettingsGpgView;
