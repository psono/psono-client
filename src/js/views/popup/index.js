import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import actionCreators from "../../actions/action-creators";
import { useTranslation } from "react-i18next";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { Divider, Grid } from "@material-ui/core";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import ClearIcon from "@material-ui/icons/Clear";
import user from "../../services/user";
import browserClient from "../../services/browser-client";

const useStyles = makeStyles((theme) => ({
    root: {
        color: "#b1b6c1",
    },
    textField: {
        width: "100%",
        "& .MuiInputBase-root": {
            color: "#b1b6c1",
        },
        "& .MuiInputAdornment-root .MuiTypography-colorTextSecondary": {
            color: "#666",
        },
        "& MuiFormControl-root": {
            color: "#b1b6c1",
        },
        "& label": {
            color: "#b1b6c1",
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "green",
        },
        "& .MuiOutlinedInput-root": {
            "& fieldset": {
                borderColor: "#666",
            },
        },
    },
    divider: {
        background: "#666",
        marginTop: "20px",
        marginBottom: "20px",
    },
    button: {
        color: "#b1b6c1",
    },
}));

const PendingsharesView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [search, setSearch] = React.useState("");

    const logout = (event) => {
        user.logout();
    };
    const openDatastore = (event) => {
        browserClient.openTab("index.html");
    };
    const generatePassword = (event) => {
        // TODO generate password
    };
    const bookmark = (event) => {
        // TODO bookmark
    };
    const clear = (event) => {
        setSearch("");
    };

    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12}>
                <TextField
                    className={classes.textField}
                    variant="outlined"
                    margin="dense"
                    id="search"
                    label={t("SEARCH_DATSTORE")}
                    name="search"
                    autoComplete="search"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                    }}
                    InputProps={{
                        endAdornment: search && (
                            <InputAdornment position="end">
                                <IconButton aria-label="clear search" onClick={clear} edge="end">
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Divider classes={{ root: classes.divider }} />
            </Grid>
            {!search && (
                <Grid item xs={12} sm={12} md={12}>
                    <Button onClick={openDatastore} className={classes.button}>
                        {t("OPEN_DATASTORE")}
                    </Button>
                </Grid>
            )}
            {!search && (
                <Grid item xs={12} sm={12} md={12}>
                    <Button onClick={generatePassword} className={classes.button}>
                        {t("GENERATE_PASSWORD")}
                    </Button>
                </Grid>
            )}
            {!search && (
                <Grid item xs={12} sm={12} md={12}>
                    <Button onClick={bookmark} className={classes.button}>
                        {t("BOOKMARK")}
                    </Button>
                </Grid>
            )}
            <Grid item xs={12} sm={12} md={12}>
                <Divider classes={{ root: classes.divider }} />
                <Button variant="contained" color="primary" onClick={logout}>
                    {t("LOGOUT")}
                </Button>
            </Grid>
        </Grid>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(PendingsharesView);
