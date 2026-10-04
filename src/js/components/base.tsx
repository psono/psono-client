import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React from "react";
import deviceService from "../services/device";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

const useStyles = makeStyles((theme) => ({
	root: {
		display: "flex",
		height: "100vh",
	},
	// necessary for content to be below app bar
	toolbar: {
		minHeight: deviceService.hasTitlebar() ? "82px" : "50px",
		flexShrink: 0,
	},
	fullContent: {
		flexGrow: 1,
		minWidth: 0,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
	},
	content: {
		flexGrow: 1,
		minHeight: 0,
		width: "100%",
		overflow: "auto",
		backgroundColor: theme.palette.baseBackground.main,
		position: "relative",
		boxSizing: "border-box",
		paddingBottom: "30px",
	},
	contentWithoutBottomPadding: {
		paddingBottom: 0,
	},
}));

export interface BaseProps {
	children: React.ReactNode;
	/** Viewport-sized panes already account for their own trailing space. */
	disableBottomPadding?: boolean;
}

const Base = (props: BaseProps) => {
	const classes = useStyles();
	const { children, disableBottomPadding = false, ...navigationProps } = props;
	const [mobileOpen, setMobileOpen] = React.useState(false);

	return (
		<div className={classes.root}>
			<Topbar
				{...navigationProps}
				mobileOpen={mobileOpen}
				setMobileOpen={setMobileOpen}
			/>
			<Sidebar
				{...navigationProps}
				mobileOpen={mobileOpen}
				setMobileOpen={setMobileOpen}
			/>
			<div className={classes.fullContent}>
				<div className={classes.toolbar} />
				<div
					className={`${classes.content} ${disableBottomPadding ? classes.contentWithoutBottomPadding : ""}`}
				>
					{children}
				</div>
			</div>
		</div>
	);
};

Base.propTypes = {
	disableBottomPadding: PropTypes.bool,
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node,
	]).isRequired,
};

export default Base;
