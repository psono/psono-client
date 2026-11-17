import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import type {
	TableDataParams,
	TableDataResult,
	TableProps,
} from "../../types/table";
import Table from "./table";

jest.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

type Row = [string];

function deferred() {
	let resolve!: (data: TableDataResult<Row>) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<TableDataResult<Row>>(
		(resolvePromise, rejectPromise) => {
			resolve = resolvePromise;
			reject = rejectPromise;
		},
	);
	return { promise, resolve, reject };
}

const theme = createTheme();

describe("table loading state", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		act(() => {
			ReactDOM.unmountComponentAtNode(container);
		});
		container.remove();
		jest.restoreAllMocks();
	});

	const renderTable = (props: Partial<TableProps<Row>> = {}) => {
		act(() => {
			ReactDOM.render(
				<ThemeProvider theme={theme}>
					<Table<Row>
						columns={[{ name: "Name" }]}
						options={{ searchOpen: true }}
						{...props}
					/>
				</ThemeProvider>,
				container,
			);
		});
	};

	it("distinguishes externally loaded data from a completed empty result", () => {
		renderTable({ data: [], loading: true });
		expect(container.textContent).toContain("TABLE_BODY_LOADING");
		expect(container.textContent).not.toContain("TABLE_BODY_NO_MATCH");

		renderTable({ data: [], loading: false });
		expect(container.textContent).toContain("TABLE_BODY_NO_MATCH");
		expect(container.textContent).not.toContain("TABLE_BODY_LOADING");

		renderTable({ data: [["Loaded row"]] });
		expect(container.textContent).toContain("Loaded row");
		expect(container.textContent).not.toContain("TABLE_BODY_LOADING");
	});

	it("shows waiting for an initial request, then shows its rows", async () => {
		const request = deferred();
		const dataFunction = jest
			.fn<Promise<TableDataResult<Row>>, [TableDataParams]>()
			.mockReturnValue(request.promise);
		renderTable({ dataFunction });
		expect(container.textContent).toContain("TABLE_BODY_LOADING");
		expect(container.textContent).not.toContain("TABLE_BODY_NO_MATCH");
		expect(dataFunction).toHaveBeenCalledWith({ page: 0, page_size: 10 });

		await act(async () => {
			request.resolve({ count: 1, results: [["Loaded row"]] });
		});
		expect(container.textContent).toContain("Loaded row");
		expect(container.textContent).not.toContain("TABLE_BODY_LOADING");
	});

	it("ends waiting when a request fails", async () => {
		const request = deferred();
		jest.spyOn(console, "log").mockImplementation(() => {});
		renderTable({ dataFunction: () => request.promise });

		await act(async () => {
			request.reject(new Error("offline"));
		});
		expect(container.textContent).toContain("TABLE_BODY_NO_MATCH");
		expect(container.textContent).not.toContain("TABLE_BODY_LOADING");
	});

	it("keeps waiting for the latest search when requests overlap", async () => {
		const initial = deferred();
		const firstSearch = deferred();
		const latestSearch = deferred();
		const dataFunction = jest
			.fn<Promise<TableDataResult<Row>>, [TableDataParams]>()
			.mockReturnValueOnce(initial.promise)
			.mockReturnValueOnce(firstSearch.promise)
			.mockReturnValueOnce(latestSearch.promise);
		renderTable({ dataFunction });
		await act(async () => {
			initial.resolve({ count: 0, results: [] });
		});
		expect(container.textContent).toContain("TABLE_BODY_NO_MATCH");

		const search = container.querySelector<HTMLInputElement>("input")!;
		act(() => {
			search.value = "first";
			Simulate.change(search);
		});
		act(() => {
			search.value = "latest";
			Simulate.change(search);
		});
		expect(dataFunction).toHaveBeenCalledTimes(3);
		expect(container.textContent).toContain("TABLE_BODY_LOADING");

		await act(async () => {
			firstSearch.resolve({ count: 1, results: [["Stale row"]] });
		});
		expect(container.textContent).toContain("TABLE_BODY_LOADING");
		expect(container.textContent).not.toContain("Stale row");

		await act(async () => {
			latestSearch.resolve({ count: 0, results: [] });
		});
		expect(container.textContent).toContain("TABLE_BODY_NO_MATCH");
		expect(container.textContent).not.toContain("TABLE_BODY_LOADING");
	});
});
