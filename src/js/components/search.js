import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import { alpha } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
	inputRoot: {
		color: "inherit",
		backgroundColor: alpha(theme.palette.background.paper, 0.95),
		border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
		borderRadius: theme.shape.borderRadius,
		"&:hover": {
			borderColor: alpha(theme.palette.text.primary, 0.35),
		},
		"&.Mui-focused": {
			borderColor: alpha(theme.palette.primary.main, 0.55),
		},
	},
	inputInput: {
		padding: theme.spacing(1, 1, 1, 0),
		fontSize: "0.875em",
		// vertical padding + font size from searchIcon
		paddingLeft: "1em",
		transition: theme.transitions.create("width"),
		width: "100%",
		[theme.breakpoints.up("sm")]: {
			width: "14ch",
			"&:focus": {
				width: "24ch",
			},
		},
	},
}));

const Search = (props) => {
	const { value, onChange } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [search, setSearch] = useState(value || "");
	const searchTimer = useRef(null);

	const onClear = () => {
		setSearch("");
		onChange("");
	};

	return (
		<>
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
						<IconButton
							aria-label="clear"
							onClick={onClear}
							disabled={!search}
							size="large"
						>
							<BackspaceOutlinedIcon fontSize="small" />
						</IconButton>
					</InputAdornment>
				}
			/>
		</>
	);
};

Search.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
};

export default Search;
