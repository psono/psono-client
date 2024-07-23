import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { makeStyles } from '@mui/styles';

import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';

const useStyles = makeStyles((theme) => ({
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
            width: "10ch",
            "&:focus": {
                width: "20ch",
            },
        },
    },
}));

const Search = (props) => {
    const {value , onChange } = props;
    const { t } = useTranslation();
    const classes = useStyles();
    const [search, setSearch] = useState(value || "");
    const searchTimer = useRef(null);

    const onClear = () => {
        setSearch("");
        onChange("");
    };

    return <>
        <InputBase
            placeholder={t("SEARCH")}
            classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
            }}
            value={search}
            onChange={(event) => {
                setSearch(event.target.value);
                if (searchTimer.current) {
                    clearTimeout(searchTimer.current);
                }
                searchTimer.current = setTimeout(() => {
                    onChange(event.target.value);
                }, 500); // delay search by 500ms
            }}
            inputProps={{ "aria-label": t("SEARCH") }}
            endAdornment={
                <InputAdornment position="end">
                    <IconButton aria-label="clear" onClick={onClear} disabled={!search} size="large">
                        <BackspaceOutlinedIcon fontSize="small"/>
                    </IconButton>
                </InputAdornment>
            }
        />
    </>;
}


Search.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default Search;
