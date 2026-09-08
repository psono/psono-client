import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

const MarkdownNotesEditor = React.lazy(
	() =>
		import(
			/* webpackChunkName: "markdown-notes-editor" */ "./markdown-notes-editor"
		),
);
const MarkdownNotesRenderer = React.lazy(
	() =>
		import(
			/* webpackChunkName: "markdown-notes-renderer" */ "./markdown-notes-renderer"
		),
);

const useStyles = makeStyles((theme) => ({
	root: {
		width: "100%",
	},
	container: {
		backgroundColor: theme.palette.background.paper,
		border: `1px solid ${theme.palette.divider}`,
		borderRadius: theme.shape.borderRadius,
		overflow: "hidden",
	},
	label: {
		display: "block",
		color: theme.palette.text.secondary,
		fontSize: "0.75rem",
		lineHeight: 1.2,
		marginBottom: theme.spacing(0.5),
	},
	footer: {
		borderTop: `1px solid ${theme.palette.divider}`,
		display: "flex",
		justifyContent: "flex-start",
		padding: theme.spacing(0.5, 1, 0.75),
	},
	toggleGroup: {
		backgroundColor: theme.palette.action.hover,
		borderRadius: 999,
		flexShrink: 0,
		padding: 2,
	},
	toggleButton: {
		border: "0 !important",
		borderRadius: "999px !important",
		color: theme.palette.text.secondary,
		fontSize: "0.65rem",
		fontWeight: 500,
		lineHeight: 1,
		minWidth: theme.spacing(6),
		padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
		textTransform: "none",
		"&.Mui-selected": {
			backgroundColor: theme.palette.background.paper,
			color: theme.palette.text.primary,
		},
		"&.Mui-selected:hover": {
			backgroundColor: theme.palette.action.selected,
		},
	},
	rawInput: {
		width: "100%",
		padding: theme.spacing(1.5),
		verticalAlign: "top",
		"& textarea": {
			maxHeight: theme.spacing(40),
			minHeight: theme.spacing(16),
			overflowY: "auto !important",
			resize: "vertical",
			wordBreak: "break-word",
		},
	},
}));

const MarkdownNotesField = ({
	className,
	id,
	label,
	name,
	onChange,
	readOnly,
	value,
}) => {
	const { t } = useTranslation();
	const classes = useStyles();
	const useMarkdownForNotes = useSelector(
		(state) =>
			![false, "false"].includes(state.settingsDatastore.useMarkdownForNotes),
	);
	const [viewMode, setViewMode] = React.useState(
		useMarkdownForNotes ? "rendered" : "raw",
	);
	const viewModeChanged = React.useRef(false);
	React.useEffect(() => {
		if (!viewModeChanged.current) {
			setViewMode(useMarkdownForNotes ? "rendered" : "raw");
		}
	}, [useMarkdownForNotes]);
	const fallback = (
		<InputBase
			className={classes.rawInput}
			id={id}
			name={name}
			multiline
			minRows={3}
			maxRows={32}
			inputProps={{ "aria-label": label }}
			value={value}
			readOnly={readOnly}
			onChange={
				readOnly || !onChange
					? undefined
					: (event) => {
							onChange(event.target.value);
						}
			}
		/>
	);
	const renderedField = (
		<Suspense fallback={fallback}>
			{readOnly ? (
				<MarkdownNotesRenderer embedded value={value} />
			) : (
				<MarkdownNotesEditor
					embedded
					id={id}
					name={name}
					onChange={onChange}
					value={value}
				/>
			)}
		</Suspense>
	);

	return (
		<Box className={`${classes.root} ${className || ""}`.trim()}>
			<Typography className={classes.label} component="label" htmlFor={id}>
				{label}
			</Typography>
			<Box className={classes.container}>
				<Box>{viewMode === "raw" ? fallback : renderedField}</Box>
				<Box className={classes.footer}>
					<ToggleButtonGroup
						className={classes.toggleGroup}
						exclusive
						size="small"
						value={viewMode}
						onChange={(event, nextViewMode) => {
							if (nextViewMode) {
								viewModeChanged.current = true;
								setViewMode(nextViewMode);
							}
						}}
						aria-label="markdown notes view mode"
					>
						<ToggleButton className={classes.toggleButton} value="rendered">
							{t("RENDERED")}
						</ToggleButton>
						<ToggleButton className={classes.toggleButton} value="raw">
							{t("RAW")}
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>
			</Box>
		</Box>
	);
};

MarkdownNotesField.propTypes = {
	className: PropTypes.string,
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	onChange: PropTypes.func,
	readOnly: PropTypes.bool,
	value: PropTypes.string,
};

MarkdownNotesField.defaultProps = {
	className: undefined,
	onChange: undefined,
	readOnly: false,
	value: "",
};

export default MarkdownNotesField;
