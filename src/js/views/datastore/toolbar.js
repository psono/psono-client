import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { Badge } from '@mui/material';
import { alpha } from "@mui/material/styles";
import { makeStyles } from '@mui/styles';
import Toolbar from "@mui/material/Toolbar";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import IconButton from "@mui/material/IconButton";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import AddIcon from "@mui/icons-material/Add";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import FilterListIcon from '@mui/icons-material/FilterList';

import Search from "../../components/search";
import DialogTrashBin from "../../components/dialogs/trash-bin";
import DialogVerify from "../../components/dialogs/verify";

const useStyles = makeStyles((theme) => ({
    toolbarTitle: {
        display: "none",
        [theme.breakpoints.up("sm")]: {
            display: "block",
        },
    },
    search: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.25),
        "&:hover": {
            backgroundColor: alpha(theme.palette.common.white, 0.45),
        },
        marginLeft: "auto",
        position: "absolute",
        right: 0,
        [theme.breakpoints.up("sm")]: {
            marginRight: theme.spacing(1),
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
    icon: {
        fontSize: "18px",
    },
    listItemIcon: {
        minWidth: theme.spacing(4),
    },
}));


const DatastoreToolbar = ({onNewFolder, onNewEntry, newSecurityReportRequired, datastore, search, setSearch, onMassDelete, onMassMove, hasMassOperationSelected, toggleShowFilter, filterCount}) => {
    const offlineMode = useSelector((state) => state.client.offlineMode);
    const classes = useStyles();
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const [warnMassDeleteOpen, setWarnMassDeleteOpen] = useState(false);
    const [trashBinOpen, setTrashBinOpen] = useState(false);

    const openMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setAnchorEl(null);
    };

    const openTrashBin = (event) => {
        setTrashBinOpen(true);
    };
    return (
        <Toolbar
            className={classes.toolbarRoot}>
            <span className={classes.toolbarTitle}>{t("DATASTORE")}</span>
            {newSecurityReportRequired && (<div className={classes.search}>
                <Search
                    value={search}
                    onChange={(newValue) => {
                        setSearch(newValue)
                    }}
                />
                <Divider className={classes.divider} orientation="vertical"/>
                {!offlineMode && (
                    <IconButton
                        color="primary"
                        className={classes.iconButton}
                        aria-label="menu"
                        onClick={openMenu}
                        size="large">
                        <MenuOpenIcon/>
                    </IconButton>
                )}
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                    }}
                >
                    <MenuItem onClick={() => {
                        setAnchorEl(null);
                        onNewFolder()
                    }}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <CreateNewFolderIcon className={classes.icon} fontSize="small"/>
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("NEW_FOLDER")}
                        </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                        setAnchorEl(null);
                        onNewEntry()
                    }}>
                        <ListItemIcon className={classes.listItemIcon}>
                            <AddIcon className={classes.icon} fontSize="small"/>
                        </ListItemIcon>
                        <Typography variant="body2" noWrap>
                            {t("NEW_ENTRY")}
                        </Typography>
                    </MenuItem>
                </Menu>
                {!offlineMode && hasMassOperationSelected && (
                    <>
                        <Divider className={classes.divider} orientation="vertical"/>
                        <Tooltip title={t("MOVE_SELECTED_ENTRIES")}>
                            <IconButton
                                className={classes.iconButton}
                                aria-label="delete selected entries"
                                onClick={onMassMove}
                                size="large">
                                <OpenWithIcon/>
                            </IconButton>
                        </Tooltip>
                        <Divider className={classes.divider} orientation="vertical"/>
                        <Tooltip title={t("DELETE_SELECTED_ENTRIES")}>
                            <IconButton
                                className={classes.iconButton}
                                aria-label="delete selected entries"
                                onClick={() => setWarnMassDeleteOpen(true)}
                                size="large">
                                <DeleteIcon/>
                            </IconButton>
                        </Tooltip>
                    </>
                )}
                {!offlineMode && !hasMassOperationSelected && (
                    <>

                        <Divider className={classes.divider} orientation="vertical"/>
                        <Tooltip title={t("OPEN_TRASH_BIN")}>
                            <IconButton
                                className={classes.iconButton}
                                aria-label="trash bin"
                                onClick={openTrashBin}
                                size="large">
                                <DeleteSweepIcon/>
                            </IconButton>
                        </Tooltip>
                    </>
                )}
                {!!toggleShowFilter && (
                    <>
                        <Divider className={classes.divider} orientation="vertical"/>
                        <Tooltip title={t("SHOW_HIDE_FILTER")}>
                            <IconButton
                                aria-label="filter"
                                onClick={toggleShowFilter}
                                size="large"
                            >
                                <Badge
                                    color="primary"
                                    badgeContent={filterCount ? filterCount : 0}
                                    invisible={!filterCount}
                                >
                                    <FilterListIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                    </>
                )}

                {trashBinOpen && (
                    <DialogTrashBin
                        open={trashBinOpen}
                        onClose={() => setTrashBinOpen(false)}
                        datastore={datastore}
                    />
                )}
                {warnMassDeleteOpen && (
                    <DialogVerify
                        title={"CONFIRM_DELETION_OF_SELECTED_ENTRIES"}
                        description={"CONFIRM_DELETION_OF_SELECTED_ENTRIES_DETAILS"}
                        open={warnMassDeleteOpen}
                        onClose={() => setWarnMassDeleteOpen(false)}
                        onConfirm={() => {
                            setWarnMassDeleteOpen(false);
                            onMassDelete();
                        }}
                    />
                )}
            </div>)}
        </Toolbar>
    );
};

export default DatastoreToolbar;
