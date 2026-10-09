import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEditor } from "@tiptap/react";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import MarkdownNotesField from "./markdown-notes-field";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("react-redux", () => ({ useSelector: () => false }));
jest.mock("@tiptap/react", () => {
	const actual =
		jest.requireActual<typeof import("@tiptap/react")>("@tiptap/react");
	return { ...actual, useEditor: jest.fn(actual.useEditor) };
});

describe("Markdown notes view switching", () => {
	let container: HTMLDivElement;
	const onChange = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	async function render(value: string) {
		function Notes() {
			const [content, setContent] = React.useState(value);
			return (
				<MarkdownNotesField
					id="notes"
					name="notes"
					label="Notes"
					value={content}
					onChange={(nextValue) => {
						onChange(nextValue);
						setContent(nextValue);
					}}
				/>
			);
		}

		await act(async () => {
			ReactDOM.render(
				<ThemeProvider theme={createTheme()}>
					<Notes />
				</ThemeProvider>,
				container,
			);
		});
	}

	async function switchView(label: string) {
		const button = Array.from(container.querySelectorAll("button")).find(
			(element) => element.textContent === label,
		);
		if (!button) throw new Error(`Missing view button: ${label}`);
		await act(async () => button.click());
	}

	function editor() {
		const results = jest.mocked(useEditor).mock.results;
		const result = results[results.length - 1].value;
		if (!result) throw new Error("Missing Markdown editor");
		return result as NonNullable<ReturnType<typeof useEditor>>;
	}

	function rawValue() {
		return container.querySelector<HTMLTextAreaElement>("#notes")!.value;
	}

	it("does not change the source when switching views without editing", async () => {
		const value = "First line\nSecond line\n\nAnother paragraph";
		await render(value);
		await switchView("RENDERED");
		await switchView("RAW");
		expect(rawValue()).toBe(value);
		expect(onChange).not.toHaveBeenCalled();
	});

	it.each([
		"First line\nSecond line",
		"First line\\\nSecond line",
		"First line  \nSecond line",
	])("does not add visible backslashes after editing %p", async (value) => {
		await render(value);
		await switchView("RENDERED");
		act(() => {
			editor().commands.insertContentAt(1, "Updated ");
		});
		const document = editor().getJSON();
		await switchView("RAW");
		expect(rawValue()).toBe("Updated First line  \nSecond line");
		await switchView("RENDERED");
		expect(editor().getJSON()).toEqual(document);
		act(() => {
			editor().commands.insertContentAt(1, "Again ");
		});
		await switchView("RAW");
		expect(rawValue()).toBe("Again Updated First line  \nSecond line");
	});

	it("preserves literal backslashes and code when editing", async () => {
		const value =
			"Path: C:\\\\Users\\\\example\nNext line\n\n`C:\\Users\\example`\n\n```\nC:\\Users\\example\n```\n\nEnd";
		await render(value);
		await switchView("RENDERED");
		act(() => {
			editor().commands.insertContentAt(1, "Updated ");
		});
		const document = editor().getJSON();
		await switchView("RAW");
		expect(rawValue()).toContain("C:\\\\Users\\\\example  \nNext line");
		expect(rawValue()).toContain("`C:\\Users\\example`");
		expect(rawValue()).toContain("```\nC:\\Users\\example\n```");
		await switchView("RENDERED");
		expect(editor().getJSON()).toEqual(document);
	});

	it("uses the same line-break syntax for Shift+Enter breaks", async () => {
		await render("FirstSecond");
		await switchView("RENDERED");
		act(() => {
			editor().chain().setTextSelection(6).setHardBreak().run();
		});
		await switchView("RAW");
		expect(rawValue()).toBe("First  \nSecond");
		await switchView("RENDERED");
		expect(container.querySelector(".ProseMirror p")!.innerHTML).toBe(
			"First<br>Second",
		);
	});

	it.each([
		"\\\nFirst",
		"First\\\n\\\nSecond",
	])("preserves leading and consecutive line breaks in %p", async (value) => {
		await render(value);
		await switchView("RENDERED");
		act(() => {
			const currentEditor = editor();
			currentEditor.commands.insertContentAt(
				currentEditor.state.doc.content.size - 1,
				" updated",
			);
		});
		const document = editor().getJSON();
		await switchView("RAW");
		await switchView("RENDERED");
		expect(editor().getJSON()).toEqual(document);
	});

	it.each([
		"First line\nSecond line\n\n> Quote\n> Continued\n\nEnd",
		"First line\nSecond line\n\n- Item\n  Continued\n\nEnd",
	])("preserves line breaks inside block content in %p", async (value) => {
		await render(value);
		await switchView("RENDERED");
		act(() => {
			editor().commands.insertContentAt(1, "Updated ");
		});
		const document = editor().getJSON();
		await switchView("RAW");
		expect(rawValue()).not.toContain("\\\n");
		await switchView("RENDERED");
		expect(editor().getJSON()).toEqual(document);
	});
});
