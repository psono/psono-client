import Box from "@mui/material/Box";
import { makeStyles } from "@mui/styles";
import DOMPurify from "dompurify";
import { marked } from "marked";
import PropTypes from "prop-types";
import React from "react";

const useStyles = makeStyles((theme) => ({
	root: {
		width: "100%",
	},
	container: {
		backgroundColor: theme.palette.background.paper,
		border: `1px solid ${theme.palette.divider}`,
		borderRadius: theme.shape.borderRadius,
		minHeight: theme.spacing(16),
		padding: theme.spacing(1.5),
		wordBreak: "break-word",
	},
	markdown: {
		"& > *:first-child": {
			marginTop: 0,
		},
		"& > *:last-child": {
			marginBottom: 0,
		},
		"& h1, & h2, & h3": {
			fontWeight: 600,
			lineHeight: 1.25,
			margin: `${theme.spacing(2)} 0 ${theme.spacing(1)}`,
		},
		"& h1": {
			fontSize: "1.5rem",
		},
		"& h2": {
			fontSize: "1.25rem",
		},
		"& h3": {
			fontSize: "1.1rem",
		},
		"& ul, & ol": {
			paddingLeft: theme.spacing(3),
		},
		"& blockquote": {
			borderLeft: `3px solid ${theme.palette.divider}`,
			margin: `${theme.spacing(1)} 0`,
			paddingLeft: theme.spacing(1.5),
			color: theme.palette.text.secondary,
		},
		"& code": {
			backgroundColor: theme.palette.action.hover,
			borderRadius: theme.shape.borderRadius,
			fontFamily: "'Fira Code', monospace",
			padding: "0 4px",
		},
		"& pre": {
			backgroundColor: theme.palette.action.hover,
			borderRadius: theme.shape.borderRadius,
			overflowX: "auto",
			padding: theme.spacing(1.5),
		},
		"& pre code": {
			backgroundColor: "transparent",
			padding: 0,
		},
		"& a": {
			color: theme.palette.primary.main,
		},
	},
}));

const renderDomNode = (node, key) => {
	if (node.nodeType === 3) {
		return node.textContent;
	}

	if (node.nodeType !== 1) {
		return null;
	}

	const tagName = node.tagName.toLowerCase();
	const props = { key: key };

	if (tagName === "a") {
		const href = node.getAttribute("href");

		if (href && DOMPurify.isValidAttribute("a", "href", href)) {
			props.href = href;
			props.rel = "noopener noreferrer nofollow";
			props.target = "_blank";
		}
	}

	const children = Array.from(node.childNodes)
		.map((childNode, index) => renderDomNode(childNode, `${key}-${index}`))
		.filter((childNode) => childNode !== null);

	return React.createElement(tagName, props, ...children);
};

const MarkdownNotesRenderer = ({ embedded, value }) => {
	const classes = useStyles();
	const renderedHtml = marked.parse(value || "", {
		breaks: true,
		gfm: true,
	});
	const sanitizedHtml = DOMPurify.sanitize(renderedHtml || "");
	const parsedDocument = new DOMParser().parseFromString(
		`<div>${sanitizedHtml || "&nbsp;"}</div>`,
		"text/html",
	);
	const renderedMarkdown = Array.from(parsedDocument.body.firstChild.childNodes)
		.map((node, index) => renderDomNode(node, `markdown-${index}`))
		.filter((node) => node !== null);

	return (
		<Box className={classes.root}>
			<Box
				className={classes.container}
				style={embedded ? { border: "none", borderRadius: 0 } : undefined}
			>
				<Box className={classes.markdown}>{renderedMarkdown}</Box>
			</Box>
		</Box>
	);
};

MarkdownNotesRenderer.propTypes = {
	embedded: PropTypes.bool,
	value: PropTypes.string,
};

MarkdownNotesRenderer.defaultProps = {
	embedded: false,
	value: "",
};

export default MarkdownNotesRenderer;
