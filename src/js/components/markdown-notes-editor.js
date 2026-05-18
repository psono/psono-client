import CodeIcon from "@mui/icons-material/Code";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import LinkIcon from "@mui/icons-material/Link";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { makeStyles } from "@mui/styles";
import { EditorContent, useEditor } from "@tiptap/react";
import DOMPurify from "dompurify";
import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";

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
	toolbar: {
		display: "flex",
		flexWrap: "wrap",
		gap: theme.spacing(0.5),
		padding: theme.spacing(0.5),
		borderBottom: `1px solid ${theme.palette.divider}`,
	},
	button: {
		padding: 6,
		borderRadius: theme.shape.borderRadius,
	},
	buttonActive: {
		backgroundColor: theme.palette.action.selected,
		color: theme.palette.primary.main,
	},
	buttonLabel: {
		fontSize: "0.75rem",
		fontWeight: 600,
	},
	content: {
		"& .ProseMirror": {
			minHeight: theme.spacing(16),
			maxHeight: theme.spacing(40),
			overflowY: "auto",
			padding: theme.spacing(1.5),
			outline: "none",
			whiteSpace: "pre-wrap",
			wordBreak: "break-word",
		},
		"& .ProseMirror p:first-child": {
			marginTop: 0,
		},
		"& .ProseMirror p:last-child": {
			marginBottom: 0,
		},
		"& .ProseMirror h1, & .ProseMirror h2, & .ProseMirror h3": {
			fontWeight: 600,
			lineHeight: 1.25,
			margin: `${theme.spacing(2)} 0 ${theme.spacing(1)}`,
		},
		"& .ProseMirror h1": {
			fontSize: "1.5rem",
		},
		"& .ProseMirror h2": {
			fontSize: "1.25rem",
		},
		"& .ProseMirror h3": {
			fontSize: "1.1rem",
		},
		"& .ProseMirror h1:first-child, & .ProseMirror h2:first-child, & .ProseMirror h3:first-child":
			{
				marginTop: 0,
			},
		"& .ProseMirror ul, & .ProseMirror ol": {
			paddingLeft: theme.spacing(3),
		},
		"& .ProseMirror blockquote": {
			borderLeft: `3px solid ${theme.palette.divider}`,
			margin: `${theme.spacing(1)} 0`,
			paddingLeft: theme.spacing(1.5),
			color: theme.palette.text.secondary,
		},
		"& .ProseMirror code": {
			backgroundColor: theme.palette.action.hover,
			borderRadius: theme.shape.borderRadius,
			fontFamily: "'Fira Code', monospace",
			padding: "0 4px",
		},
		"& .ProseMirror pre": {
			backgroundColor: theme.palette.action.hover,
			borderRadius: theme.shape.borderRadius,
			overflowX: "auto",
			padding: theme.spacing(1.5),
		},
		"& .ProseMirror pre code": {
			backgroundColor: "transparent",
			padding: 0,
		},
		"& .ProseMirror a": {
			color: theme.palette.primary.main,
		},
	},
	placeholder: {
		minHeight: theme.spacing(16),
	},
}));

const normalizeUrl = (url) => {
	if (!url) {
		return "";
	}

	if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) {
		return url;
	}

	return `https://${url}`;
};

const MarkdownNotesEditor = ({
	className,
	embedded,
	id,
	name,
	onChange,
	value,
}) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const editor = useEditor({
		editorProps: {
			attributes: {
				id: id,
				name: name,
			},
		},
		shouldRerenderOnTransaction: true,
		extensions: [
			StarterKit,
			Link.configure({
				autolink: true,
				defaultProtocol: "https",
				linkOnPaste: true,
				openOnClick: false,
				HTMLAttributes: {
					rel: "noopener noreferrer nofollow",
					target: "_blank",
				},
			}),
			Markdown.configure({
				breaks: true,
				html: false,
				linkify: true,
				transformCopiedText: true,
				transformPastedText: true,
			}),
		],
		content: value || "",
		onUpdate: ({ editor }) => {
			onChange(editor.storage.markdown.getMarkdown());
		},
	});

	React.useEffect(() => {
		if (!editor) {
			return;
		}

		const currentValue = editor.storage.markdown.getMarkdown();

		if (currentValue !== value) {
			editor.commands.setContent(value || "", { emitUpdate: false });
		}
	}, [editor, value]);

	const onToolbarMouseDown = (event) => {
		event.preventDefault();
	};

	const setLink = () => {
		if (!editor) {
			return;
		}

		const previousUrl = editor.getAttributes("link").href || "";
		const requestedUrl = window.prompt(t("ENTER_LINK_URL"), previousUrl);

		if (requestedUrl === null) {
			return;
		}

		const trimmedUrl = requestedUrl.trim();

		if (!trimmedUrl) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		const normalizedUrl = normalizeUrl(trimmedUrl);

		if (!DOMPurify.isValidAttribute("a", "href", normalizedUrl)) {
			return;
		}

		editor
			.chain()
			.focus()
			.extendMarkRange("link")
			.setLink({ href: normalizedUrl })
			.run();
	};

	const renderToolbarButton = (title, icon, isActive, onClick, disabled) => (
		<IconButton
			className={`${classes.button} ${isActive ? classes.buttonActive : ""}`.trim()}
			disabled={disabled}
			onClick={onClick}
			onMouseDown={onToolbarMouseDown}
			size="small"
			title={title}
			aria-label={title}
		>
			{icon}
		</IconButton>
	);
	const renderLabelButton = (title, label, isActive, onClick, disabled) =>
		renderToolbarButton(
			title,
			<Box component="span" className={classes.buttonLabel}>
				{label}
			</Box>,
			isActive,
			onClick,
			disabled,
		);
	const renderHeadingButton = (level) =>
		renderLabelButton(
			t("HEADING_NUMBER", { number: level }),
			`H${level}`,
			editor ? editor.isActive("heading", { level: level }) : false,
			() => {
				editor?.chain().focus().toggleHeading({ level: level }).run();
			},
			!editor?.can().chain().focus().toggleHeading({ level: level }).run(),
		);

	return (
		<Box className={`${classes.root} ${className || ""}`.trim()}>
			<Box
				className={classes.container}
				style={embedded ? { border: "none", borderRadius: 0 } : undefined}
			>
				<Box className={classes.toolbar}>
					{renderToolbarButton(
						t("BOLD"),
						<FormatBoldIcon fontSize="small" />,
						editor ? editor.isActive("bold") : false,
						() => {
							editor?.chain().focus().toggleBold().run();
						},
						!editor?.can().chain().focus().toggleBold().run(),
					)}
					{renderToolbarButton(
						t("ITALIC"),
						<FormatItalicIcon fontSize="small" />,
						editor ? editor.isActive("italic") : false,
						() => {
							editor?.chain().focus().toggleItalic().run();
						},
						!editor?.can().chain().focus().toggleItalic().run(),
					)}
					{renderToolbarButton(
						t("STRIKETHROUGH"),
						<FormatStrikethroughIcon fontSize="small" />,
						editor ? editor.isActive("strike") : false,
						() => {
							editor?.chain().focus().toggleStrike().run();
						},
						!editor?.can().chain().focus().toggleStrike().run(),
					)}
					{renderToolbarButton(
						t("INLINE_CODE"),
						<CodeIcon fontSize="small" />,
						editor ? editor.isActive("code") : false,
						() => {
							editor?.chain().focus().toggleCode().run();
						},
						!editor?.can().chain().focus().toggleCode().run(),
					)}
					{renderHeadingButton(1)}
					{renderHeadingButton(2)}
					{renderHeadingButton(3)}
					{renderToolbarButton(
						t("BULLET_LIST"),
						<FormatListBulletedIcon fontSize="small" />,
						editor ? editor.isActive("bulletList") : false,
						() => {
							editor?.chain().focus().toggleBulletList().run();
						},
						!editor?.can().chain().focus().toggleBulletList().run(),
					)}
					{renderToolbarButton(
						t("NUMBERED_LIST"),
						<FormatListNumberedIcon fontSize="small" />,
						editor ? editor.isActive("orderedList") : false,
						() => {
							editor?.chain().focus().toggleOrderedList().run();
						},
						!editor?.can().chain().focus().toggleOrderedList().run(),
					)}
					{renderToolbarButton(
						t("QUOTE"),
						<FormatQuoteIcon fontSize="small" />,
						editor ? editor.isActive("blockquote") : false,
						() => {
							editor?.chain().focus().toggleBlockquote().run();
						},
						!editor?.can().chain().focus().toggleBlockquote().run(),
					)}
					{renderLabelButton(
						t("CODE_BLOCK"),
						"Code",
						editor ? editor.isActive("codeBlock") : false,
						() => {
							editor?.chain().focus().toggleCodeBlock().run();
						},
						!editor?.can().chain().focus().toggleCodeBlock().run(),
					)}
					{renderToolbarButton(
						t("LINK"),
						<LinkIcon fontSize="small" />,
						editor ? editor.isActive("link") : false,
						setLink,
						!editor,
					)}
					{renderToolbarButton(
						t("UNDO"),
						<UndoIcon fontSize="small" />,
						false,
						() => {
							editor?.chain().focus().undo().run();
						},
						!editor?.can().chain().focus().undo().run(),
					)}
					{renderToolbarButton(
						t("REDO"),
						<RedoIcon fontSize="small" />,
						false,
						() => {
							editor?.chain().focus().redo().run();
						},
						!editor?.can().chain().focus().redo().run(),
					)}
				</Box>
				<Box className={classes.content}>
					{editor ? (
						<EditorContent editor={editor} />
					) : (
						<Box className={classes.placeholder} />
					)}
				</Box>
			</Box>
		</Box>
	);
};

MarkdownNotesEditor.propTypes = {
	className: PropTypes.string,
	embedded: PropTypes.bool,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	value: PropTypes.string,
};

MarkdownNotesEditor.defaultProps = {
	className: undefined,
	embedded: false,
	value: "",
};

export default MarkdownNotesEditor;
