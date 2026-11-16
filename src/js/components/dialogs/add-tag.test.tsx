import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import DialogAddTag from "./add-tag";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe("Tag autocomplete", () => {
	let container: HTMLDivElement;
	const onClose = jest.fn();

	beforeEach(() => {
		onClose.mockClear();
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
	});

	function render() {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={createTheme()}>
					<DialogAddTag
						open
						onClose={onClose}
						availableTags={["work", "Production", "work", "personal"]}
						selectedTags={["personal"]}
					/>
				</ThemeProvider>,
				container,
			);
		});
		return document.querySelector<HTMLInputElement>("#tag")!;
	}

	function type(input: HTMLInputElement, value: string) {
		act(() => {
			input.value = value;
			Simulate.change(input);
		});
	}

	function saveButton() {
		return Array.from(document.querySelectorAll("button")).find(
			(button) => button.textContent === "SAVE",
		)!;
	}

	it("lists unique existing tags on focus, excluding selected tags", () => {
		const input = render();
		act(() => Simulate.focus(input));
		expect(
			Array.from(document.querySelectorAll('[role="option"]')).map(
				(option) => option.textContent,
			),
		).toEqual(["Production", "work"]);
	});

	it("filters case-insensitively and selects an existing tag with the keyboard", () => {
		const input = render();
		act(() => Simulate.focus(input));
		type(input, "prod");
		expect(document.querySelector('[role="option"]')?.textContent).toBe(
			"Production",
		);
		act(() => Simulate.keyDown(input, { key: "ArrowDown" }));
		act(() => Simulate.keyDown(input, { key: "Enter" }));
		expect(input.value).toBe("Production");
		act(() => Simulate.click(saveButton()));
		expect(onClose).toHaveBeenCalledWith("Production");
	});

	it("allows new tags, trims input and prevents empty or duplicate tags", () => {
		const input = render();
		for (const value of ["", "   ", " personal "]) {
			type(input, value);
			expect(saveButton().disabled).toBe(true);
		}
		type(input, " new tag ");
		expect(saveButton().disabled).toBe(false);
		act(() => Simulate.click(saveButton()));
		expect(onClose).toHaveBeenCalledWith("new tag");
	});
});
