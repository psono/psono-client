import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import actionCreators from "../../actions/action-creators";
import { useTranslation } from "react-i18next";
import { alpha, makeStyles } from "@material-ui/core/styles";
import Base from "../../containers/base";
import BaseTitle from "../../containers/base-title";
import BaseContent from "../../containers/base-content";
import Paper from "@material-ui/core/Paper";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import DeleteSweepIcon from "@material-ui/icons/DeleteSweep";
import InputBase from "@material-ui/core/InputBase";
import IconButton from "@material-ui/core/IconButton";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import Divider from "@material-ui/core/Divider";
import ClearIcon from "@material-ui/icons/Clear";
import PasswordDatastore from "../../containers/password-datastore";

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    toolbarRoot: {
        display: "flex",
    },
    search: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.25),
        "&:hover": {
            backgroundColor: alpha(theme.palette.common.white, 0.45),
        },
        marginLeft: "auto",
        [theme.breakpoints.up("sm")]: {
            marginRight: theme.spacing(1),
        },
    },
    inputRoot: {
        color: "inherit",
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        fontSize: "0.875em",
        // vertical padding + font size from searchIcon
        paddingLeft: "1em",
        transition: theme.transitions.create("width"),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            width: "12ch",
            "&:focus": {
                width: "20ch",
            },
        },
    },
    iconButton: {
        padding: 10,
        display: "inline-flex",
    },
    divider: {
        height: 28,
        margin: 0,
        marginBottom: -10,
        display: "inline-flex",
    },
}));

const DatastoreView = (props) => {
    const classes = useStyles();
    const { t } = useTranslation();
    const [search, setSearch] = React.useState("");

    const onClear = () => {
        setSearch("");
    };

    return (
        <Base {...props}>
            <BaseTitle>{t("DATASTORE")}</BaseTitle>
            <BaseContent>
                <Paper square>
                    <AppBar elevation={0} position="static" color="default">
                        <Toolbar className={classes.toolbarRoot}>
                            {t("DATASTORE")}
                            <div className={classes.search}>
                                <InputBase
                                    placeholder={t("SEARCH")}
                                    classes={{
                                        root: classes.inputRoot,
                                        input: classes.inputInput,
                                    }}
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                    }}
                                    inputProps={{ "aria-label": t("SEARCH") }}
                                />
                                <IconButton className={classes.iconButton} aria-label="clear" onClick={onClear}>
                                    <ClearIcon />
                                </IconButton>
                                <Divider className={classes.divider} orientation="vertical" />
                                <IconButton color="primary" className={classes.iconButton} aria-label="menu">
                                    <MenuOpenIcon />
                                </IconButton>
                                <Divider className={classes.divider} orientation="vertical" />
                                <IconButton className={classes.iconButton} aria-label="trash bin">
                                    <DeleteSweepIcon />
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <PasswordDatastore search={search} />
                </Paper>
            </BaseContent>
        </Base>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(DatastoreView);
