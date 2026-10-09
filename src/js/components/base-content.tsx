import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React from "react";

const useStyles = makeStyles(() => ({
	root: {
		flexGrow: 1,
		width: "100%",
		marginLeft: "15px",
		overflowX: "visible",
		maxWidth: `calc(100% - 30px)`,
	},
}));

export interface BaseContentProps {
	children: React.ReactNode;
}

const BaseContent = (props: BaseContentProps) => {
	const classes = useStyles();
	const { children } = props;

	return <div className={classes.root}>{children}</div>;
};

BaseContent.propTypes = {
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node,
	]).isRequired,
};

export default BaseContent;
